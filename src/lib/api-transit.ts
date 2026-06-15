import type {
  TransitModelFamily,
  TransitModelPrice,
  TransitStation,
} from "@/data/api-transit/types";
import {
  TRANSIT_MODEL_FAMILY_LABELS,
  TRANSIT_COMMERCIAL_LABELS,
} from "@/data/api-transit/types";
import { seedStations } from "@/data/api-transit/stations";

let cached: TransitStation[] | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000;
const USD_TO_CNY_RATE = 7.2;

export type TransitSortKey = "overall" | "rate" | "stability";

export const ALLOWED_RETURN_KEYS = [
  "q",
  "model",
  "channel",
  "pool",
  "risk",
  "sort",
] as const;

export async function getStations(): Promise<TransitStation[]> {
  const now = Date.now();
  if (cached && now - cachedAt < CACHE_TTL_MS) return cached;

  cached = seedStations;
  cachedAt = now;
  return cached;
}

export async function getStationBySlug(
  slug: string
): Promise<TransitStation | undefined> {
  const stations = await getStations();
  return stations.find((station) => station.slug === slug);
}

export function parseRechargeRatio(text: string | null): number | null {
  if (!text) return null;

  const match = text.match(/(\d+(?:\.\d+)?)\s*:\s*(\d+(?:\.\d+)?)/);
  if (!match) return null;

  const base = Number(match[1]);
  const quota = Number(match[2]);
  if (!Number.isFinite(base) || !Number.isFinite(quota) || base <= 0) return null;

  return quota / base;
}

export function getRechargeCoefficientFromRatio(text: string | null): number | null {
  const ratio = parseRechargeRatio(text);
  if (ratio === null) return null;
  return ratio / USD_TO_CNY_RATE;
}

export function getStationRechargeCoefficient(station: TransitStation): number | null {
  return getRechargeCoefficientFromRatio(station.prices[0]?.rechargeRatio ?? null);
}

export function getCombinedRateForPrice(
  station: TransitStation,
  price: TransitModelPrice
): number | null {
  const coefficient =
    getRechargeCoefficientFromRatio(price.rechargeRatio) ??
    getStationRechargeCoefficient(station);
  if (coefficient === null || price.modelMultiplier === null) return null;

  return coefficient * price.modelMultiplier;
}

export function getFamilyPrices(
  station: TransitStation,
  family: TransitModelFamily
): TransitModelPrice[] {
  return station.prices.filter((price) => price.family === family);
}

export type TransitFamilyRateSummary = {
  family: TransitModelFamily;
  familyLabel: string;
  priceCount: number;
  modelMultiplierMin: number | null;
  modelMultiplierMax: number | null;
  combinedRateMin: number | null;
  combinedRateMax: number | null;
  sevenDayRate: number | null;
  sevenDaySamples: number;
  lastCheckedAt: string | null;
};

export function getFamilyRateSummary(
  station: TransitStation,
  family: TransitModelFamily
): TransitFamilyRateSummary {
  const prices = getFamilyPrices(station, family);
  const multipliers = prices
    .map((price) => price.modelMultiplier)
    .filter((value): value is number => value !== null && Number.isFinite(value));
  const combinedRates = prices
    .map((price) => getCombinedRateForPrice(station, price))
    .filter((value): value is number => value !== null && Number.isFinite(value));
  const availabilitySamples = prices.reduce(
    (total, price) => total + price.availability.sevenDaySamples,
    0
  );
  const weightedAvailability =
    availabilitySamples > 0
      ? prices.reduce((total, price) => {
          const rate = price.availability.sevenDayRate ?? 0;
          return total + rate * price.availability.sevenDaySamples;
        }, 0) / availabilitySamples
      : null;
  const lastCheckedAt =
    prices
      .map((price) => price.availability.lastCheckedAt)
      .filter((value): value is string => Boolean(value))
      .sort()
      .at(-1) ?? null;

  return {
    family,
    familyLabel: TRANSIT_MODEL_FAMILY_LABELS[family],
    priceCount: prices.length,
    modelMultiplierMin: multipliers.length ? Math.min(...multipliers) : null,
    modelMultiplierMax: multipliers.length ? Math.max(...multipliers) : null,
    combinedRateMin: combinedRates.length ? Math.min(...combinedRates) : null,
    combinedRateMax: combinedRates.length ? Math.max(...combinedRates) : null,
    sevenDayRate: weightedAvailability,
    sevenDaySamples: availabilitySamples,
    lastCheckedAt,
  };
}

export type TransitStationComparisonSummary = {
  station: TransitStation;
  claude: TransitFamilyRateSummary;
  gpt: TransitFamilyRateSummary;
  bestCombinedRate: number | null;
  stabilityRate: number | null;
  stabilitySamples: number;
  sourceCompleteness: number;
  overallScore: number;
};

export function getStationComparisonSummary(
  station: TransitStation
): TransitStationComparisonSummary {
  const claude = getFamilyRateSummary(station, "claude");
  const gpt = getFamilyRateSummary(station, "gpt");
  const combinedRates = [claude.combinedRateMin, gpt.combinedRateMin].filter(
    (value): value is number => value !== null
  );
  const bestCombinedRate = combinedRates.length ? Math.min(...combinedRates) : null;
  const stabilityRate = station.availability.sevenDayRate;
  const stabilitySamples = station.availability.sevenDaySamples;
  const sourceCompleteness = [
    station.minimumTopUp,
    station.balanceExpiry,
    station.refundPolicy,
    station.supportChannels.length ? "support" : null,
    station.channelTypes.length ? "channels" : null,
    station.accountPools.length ? "pools" : null,
  ].filter(Boolean).length;

  const rateScore = bestCombinedRate === null ? 0 : Math.max(0, 40 - bestCombinedRate * 900);
  const stabilityScore = (stabilityRate ?? 0) * 35;
  const sampleScore = Math.min(stabilitySamples / 12, 12);
  const completenessScore = Math.min(sourceCompleteness * 1.5, 9);
  const commercialScore =
    station.commercialRelation === "partner" || station.commercialRelation === "listed"
      ? 2
      : 0;
  const riskPenalty = station.riskLabels.reduce((total, risk) => {
    if (risk === "sample_data") return total + 1;
    if (risk === "insufficient_samples") return total + 3;
    if (risk === "mixed_pool") return total + 2;
    if (risk === "reseller") return total + 3;
    if (risk === "undisclosed_upstream") return total + 5;
    return total + 2;
  }, 0);

  return {
    station,
    claude,
    gpt,
    bestCombinedRate,
    stabilityRate,
    stabilitySamples,
    sourceCompleteness,
    overallScore:
      rateScore + stabilityScore + sampleScore + completenessScore + commercialScore - riskPenalty,
  };
}

export function compareStations(
  stations: TransitStation[],
  sortBy: TransitSortKey
): TransitStation[] {
  return [...stations].sort((left, right) => {
    const a = getStationComparisonSummary(left);
    const b = getStationComparisonSummary(right);

    if (sortBy === "rate") {
      return compareNullableNumber(a.bestCombinedRate, b.bestCombinedRate, "asc");
    }

    if (sortBy === "stability") {
      return (
        compareNullableNumber(a.stabilityRate, b.stabilityRate, "desc") ||
        b.stabilitySamples - a.stabilitySamples ||
        new Date(right.lastUpdatedAt).getTime() - new Date(left.lastUpdatedAt).getTime()
      );
    }

    return (
      b.overallScore - a.overallScore ||
      compareNullableNumber(a.bestCombinedRate, b.bestCombinedRate, "asc") ||
      new Date(right.lastUpdatedAt).getTime() - new Date(left.lastUpdatedAt).getTime()
    );
  });
}

function compareNullableNumber(
  left: number | null,
  right: number | null,
  direction: "asc" | "desc"
) {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return direction === "asc" ? left - right : right - left;
}

export type TransitModelPriceEntry = {
  station: TransitStation;
  price: TransitModelPrice;
  rechargeCoefficient: number | null;
  combinedRate: number | null;
};

export type TransitModelSummary = {
  standardModel: TransitModelPrice["standardModel"];
  family: TransitModelFamily;
  familyLabel: string;
  stationCount: number;
  bestCombinedRate: number | null;
  worstCombinedRate: number | null;
  averageAvailability: number | null;
  sampleCount: number;
  prices: TransitModelPriceEntry[];
};

export function getTransitModelFamilyOptions(
  stations: TransitStation[]
): { id: TransitModelFamily; label: string }[] {
  const seen = new Set<TransitModelFamily>();
  stations.forEach((station) => station.prices.forEach((price) => seen.add(price.family)));

  return (["claude", "gpt"] as const)
    .filter((family) => seen.has(family))
    .map((family) => ({ id: family, label: TRANSIT_MODEL_FAMILY_LABELS[family] }));
}

export function getTransitModelSummaries(
  stations: TransitStation[],
  family: "all" | TransitModelFamily = "all"
): TransitModelSummary[] {
  const byModel = new Map<TransitModelPrice["standardModel"], TransitModelPriceEntry[]>();

  stations.forEach((station) => {
    station.prices.forEach((price) => {
      if (family !== "all" && price.family !== family) return;

      const entry: TransitModelPriceEntry = {
        station,
        price,
        rechargeCoefficient:
          getRechargeCoefficientFromRatio(price.rechargeRatio) ??
          getStationRechargeCoefficient(station),
        combinedRate: getCombinedRateForPrice(station, price),
      };

      const existing = byModel.get(price.standardModel);
      if (existing) {
        existing.push(entry);
      } else {
        byModel.set(price.standardModel, [entry]);
      }
    });
  });

  return Array.from(byModel.entries())
    .map(([standardModel, prices]) => {
      const finiteRates = prices
        .map((entry) => entry.combinedRate)
        .filter((rate): rate is number => rate !== null && Number.isFinite(rate))
        .sort((a, b) => a - b);
      const sampleCount = prices.reduce(
        (total, entry) => total + entry.price.availability.sevenDaySamples,
        0
      );
      const averageAvailability =
        sampleCount > 0
          ? prices.reduce((total, entry) => {
              const rate = entry.price.availability.sevenDayRate ?? 0;
              return total + rate * entry.price.availability.sevenDaySamples;
            }, 0) / sampleCount
          : null;
      const modelFamily = prices[0].price.family;

      return {
        standardModel,
        family: modelFamily,
        familyLabel: TRANSIT_MODEL_FAMILY_LABELS[modelFamily],
        stationCount: prices.length,
        bestCombinedRate: finiteRates[0] ?? null,
        worstCombinedRate: finiteRates[finiteRates.length - 1] ?? null,
        averageAvailability,
        sampleCount,
        prices: prices.sort((a, b) =>
          compareNullableNumber(a.combinedRate, b.combinedRate, "asc")
        ),
      };
    })
    .sort((a, b) => {
      const familyOrder = a.family.localeCompare(b.family, "zh-CN");
      if (familyOrder !== 0) return familyOrder;
      return compareNullableNumber(a.bestCombinedRate, b.bestCombinedRate, "asc");
    });
}

export function getSummaryStats(stations: TransitStation[]) {
  const summaries = stations.map(getStationComparisonSummary);
  const bestClaude = summaries
    .map((summary) => summary.claude.combinedRateMin)
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b)[0] ?? null;
  const bestGpt = summaries
    .map((summary) => summary.gpt.combinedRateMin)
    .filter((value): value is number => value !== null)
    .sort((a, b) => a - b)[0] ?? null;
  const sevenDaySamples = stations.reduce(
    (total, station) => total + station.availability.sevenDaySamples,
    0
  );

  return {
    total: stations.length,
    bestClaude,
    bestGpt,
    sevenDaySamples,
    withRisk: stations.filter((station) => station.riskLabels.length > 0).length,
  };
}

export function formatRate(rate: number | null): string {
  if (rate === null || !Number.isFinite(rate)) return "—";
  if (rate < 0.01) return `${rate.toFixed(4)}x`;
  if (rate < 0.1) return `${rate.toFixed(3)}x`;
  return `${rate.toFixed(2)}x`;
}

export function formatMultiplierRange(summary: TransitFamilyRateSummary): string {
  if (summary.modelMultiplierMin === null) return "—";
  if (summary.modelMultiplierMax === null || summary.modelMultiplierMax === summary.modelMultiplierMin) {
    return `${summary.modelMultiplierMin.toFixed(2)}x`;
  }
  return `${summary.modelMultiplierMin.toFixed(2)}-${summary.modelMultiplierMax.toFixed(2)}x`;
}

export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return "样本不足";
  return `${(value * 100).toFixed(1)}%`;
}

export function formatAvailability(
  availability: Pick<TransitStation["availability"], "sevenDayRate" | "sevenDaySamples">
): string {
  if (availability.sevenDaySamples <= 0 || availability.sevenDayRate === null) return "样本不足";
  return `${formatPercent(availability.sevenDayRate)} · 样本 ${availability.sevenDaySamples}`;
}

export function getRateBadgeClass(rate: number | null): string {
  if (rate === null) return "bg-[#f2f4f4] text-[#5a6061]";
  if (rate <= 0.025) return "bg-[#e8f3ec] text-[#2f7a4b]";
  if (rate <= 0.06) return "bg-[#fff7e8] text-[#7a541b]";
  return "bg-[#f2f4f4] text-[#5a6061]";
}

export function getUsageAdviceBadgeClass(advice: TransitStation["usageAdvice"]): string {
  switch (advice) {
    case "try_small":
      return "bg-[#e8f3ec] text-[#2f7a4b]";
    case "cautious":
      return "bg-[#fff7e8] text-[#7a541b]";
    case "not_recommended":
      return "bg-[#fbe9e7] text-[#9b3328]";
    default:
      return "bg-[#f2f4f4] text-[#5a6061]";
  }
}

export { TRANSIT_COMMERCIAL_LABELS };
