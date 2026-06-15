"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Search } from "lucide-react";
import { CategoryTabBar, type CategoryTabItem } from "@/components/CategoryTabBar";
import { TransitModelIcon } from "@/components/TransitModelIcon";
import type { TransitModelFamily, TransitStation } from "@/data/api-transit/types";
import {
  TRANSIT_ACCOUNT_POOL_LABELS,
  TRANSIT_MODEL_FAMILY_LABELS,
  TRANSIT_RISK_LABELS,
  TRANSIT_USAGE_ADVICE_LABELS,
} from "@/data/api-transit/types";
import {
  formatPercent,
  formatRate,
  getRateBadgeClass,
  getTransitModelFamilyOptions,
  getTransitModelSummaries,
  getUsageAdviceBadgeClass,
  type TransitModelPriceEntry,
  type TransitModelSummary,
} from "@/lib/api-transit";

type FamilyFilter = "all" | TransitModelFamily;

function coerceFamily(value: string | null): FamilyFilter {
  return value === "claude" || value === "gpt" ? value : "all";
}

interface Props {
  stations: TransitStation[];
}

export default function TransitModelExplorer({ stations }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [urlReady, setUrlReady] = useState(false);
  const [family, setFamily] = useState<FamilyFilter>(coerceFamily(searchParams.get("family")));
  const [query, setQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    const timeout = window.setTimeout(() => setUrlReady(true), 60);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!urlReady) return;

    const params = new URLSearchParams();
    if (family !== "all") params.set("family", family);
    if (query) params.set("q", query);
    const qs = params.toString();

    router.replace(qs ? `/api-transit/models?${qs}` : "/api-transit/models", { scroll: false });
  }, [family, query, router, urlReady]);

  const familyOptions = useMemo(() => getTransitModelFamilyOptions(stations), [stations]);
  const familyTabs = useMemo<CategoryTabItem[]>(() => {
    const tabs: CategoryTabItem[] = [
      {
        id: "all",
        label: "全部",
        icon: <TransitModelIcon family="all" className="h-[18px] w-[18px]" />,
      },
    ];

    familyOptions.forEach((option) => {
      tabs.push({
        id: option.id,
        label: option.label,
        icon: <TransitModelIcon family={option.id} className="h-[18px] w-[18px]" />,
      });
    });

    return tabs;
  }, [familyOptions]);

  const modelSummaries = useMemo(() => {
    const summaries = getTransitModelSummaries(stations, family);
    if (!query) return summaries;

    const q = query.trim().toLowerCase();
    return summaries.filter(
      (summary) =>
        summary.standardModel.toLowerCase().includes(q) ||
        summary.familyLabel.toLowerCase().includes(q)
    );
  }, [family, query, stations]);

  const allSummaries = useMemo(() => getTransitModelSummaries(stations, "all"), [stations]);
  const bestRate =
    modelSummaries
      .map((summary) => summary.bestCombinedRate)
      .filter((rate): rate is number => rate !== null)
      .sort((a, b) => a - b)[0] ?? null;
  const sampleCount = modelSummaries.reduce((total, summary) => total + summary.sampleCount, 0);

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="已收录站点" value={String(stations.length)} helper="站点维度仍是主入口" />
        <MetricCard label="覆盖标准模型" value={String(allSummaries.length)} helper="仅 Claude / GPT" />
        <MetricCard
          label="当前模型族"
          value={family === "all" ? "全部" : TRANSIT_MODEL_FAMILY_LABELS[family]}
          helper={`${modelSummaries.length} 个模型卡片`}
        />
        <MetricCard label="最低综合倍率" value={formatRate(bestRate)} helper={`当前筛选样本 ${sampleCount}`} />
      </div>

      <div className="sticky top-[66px] z-20 mb-5 rounded-lg border border-[#dfe4e5] bg-white/95 shadow-[0_20px_55px_rgba(45,52,53,0.045)] backdrop-blur-sm">
        <div className="flex items-center gap-2 p-3">
          <div className="relative min-w-[200px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8182]" />
            <input
              className="h-[38px] w-full rounded-full border border-[#dfe4e5] bg-[#fbfcfc] pl-9 pr-3 text-sm text-[#2d3435] outline-none placeholder:text-[#7f8889] focus:border-[#45bf78]/65 focus:shadow-[0_0_0_3px_rgba(69,191,120,0.16)]"
              placeholder="搜索标准模型名..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
      </div>

      <CategoryTabBar
        items={familyTabs}
        value={family}
        onChange={(value) => setFamily(value as FamilyFilter)}
        className="mb-5"
      />

      {modelSummaries.length === 0 ? (
        <div className="py-16 text-center text-[#5a6061]">
          <p className="mb-2 text-lg font-semibold">没有匹配的模型</p>
          <p className="text-sm">尝试调整模型族或搜索关键词。</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {modelSummaries.map((summary) => (
            <ModelCard key={`${summary.family}-${summary.standardModel}`} summary={summary} />
          ))}
        </div>
      )}
    </div>
  );
}

function ModelCard({ summary }: { summary: TransitModelSummary }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="overflow-hidden rounded-lg border border-[#dfe4e5] bg-white shadow-[0_20px_55px_rgba(45,52,53,0.045)]">
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-[#fbfcfc]"
      >
        <div className="flex min-w-0 items-center gap-3">
          <TransitModelIcon family={summary.family} className="h-8 w-8" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-extrabold text-[#202829]">{summary.standardModel}</span>
              <span className="rounded-full bg-[#f2f4f4] px-2 py-0.5 text-xs font-semibold text-[#5a6061]">
                {summary.familyLabel}
              </span>
            </div>
            <div className="mt-0.5 text-xs text-[#7a8182]">
              {summary.stationCount} 个站点 · 最优 {formatRate(summary.bestCombinedRate)}
              {summary.worstCombinedRate !== null && summary.worstCombinedRate !== summary.bestCombinedRate ? (
                <span> · 最高 {formatRate(summary.worstCombinedRate)}</span>
              ) : null}
              <span> · 稳定性 {formatPercent(summary.averageAvailability)}</span>
            </div>
          </div>
        </div>
        <div className="ml-2 shrink-0 text-xs font-semibold text-[#5a6061]">
          {expanded ? "收起" : "展开"}
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-[#dfe4e5]">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[760px] border-collapse" role="table">
              <thead>
                <tr className="bg-[#f2f4f4]" role="row">
                  <TableHead>站点</TableHead>
                  <TableHead>号池</TableHead>
                  <TableHead>充值系数</TableHead>
                  <TableHead>模型倍率</TableHead>
                  <TableHead>综合倍率</TableHead>
                  <TableHead>稳定性</TableHead>
                  <TableHead>风险</TableHead>
                  <TableHead>操作</TableHead>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {summary.prices.map((entry) => (
                  <PriceRow key={`${entry.station.id}-${entry.price.standardModel}-${entry.price.groupName}`} entry={entry} />
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 gap-2 p-3 md:hidden">
            {summary.prices.map((entry) => (
              <PriceCard key={`${entry.station.id}-${entry.price.standardModel}-${entry.price.groupName}`} entry={entry} />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PriceRow({ entry }: { entry: TransitModelPriceEntry }) {
  return (
    <tr className="border-t border-[#eef1f1] hover:bg-[#fbfcfc]" role="row">
      <td className="px-3 py-2.5">
        <div className="flex flex-col">
          <span className="text-sm font-bold text-[#2d3435]">{entry.station.name}</span>
          <span className="text-[10px] text-[#7f8889]">{entry.station.slug}</span>
        </div>
      </td>
      <td className="px-3 py-2.5">
        <span className="rounded-full bg-[#eef3f8] px-2 py-0.5 text-[10px] font-bold text-[#47657a]">
          {TRANSIT_ACCOUNT_POOL_LABELS[entry.price.accountPool]}
        </span>
      </td>
      <td className="px-3 py-2.5 text-xs text-[#2d3435]">{formatRate(entry.rechargeCoefficient)}</td>
      <td className="px-3 py-2.5 text-xs text-[#2d3435]">
        {entry.price.modelMultiplier !== null ? `${entry.price.modelMultiplier.toFixed(2)}x` : "—"}
      </td>
      <td className="px-3 py-2.5">
        <span className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${getRateBadgeClass(entry.combinedRate)}`}>
          {formatRate(entry.combinedRate)}
        </span>
      </td>
      <td className="px-3 py-2.5 text-xs text-[#2d3435]">
        {formatPercent(entry.price.availability.sevenDayRate)}
        <span className="ml-1 text-[#7f8889]">样本 {entry.price.availability.sevenDaySamples}</span>
      </td>
      <td className="px-3 py-2.5">
        <RiskPills station={entry.station} />
      </td>
      <td className="px-3 py-2.5">
        <Link
          href={`/api-transit/${entry.station.slug}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-[#2d3435] transition-colors hover:text-[#45bf78]"
        >
          查看
          <ExternalLink className="h-3 w-3" />
        </Link>
      </td>
    </tr>
  );
}

function PriceCard({ entry }: { entry: TransitModelPriceEntry }) {
  return (
    <div className="rounded-lg border border-[#dfe4e5] bg-[#fbfcfc] p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-sm font-bold text-[#2d3435]">{entry.station.name}</span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-extrabold ${getRateBadgeClass(entry.combinedRate)}`}>
          {formatRate(entry.combinedRate)}
        </span>
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2 text-xs text-[#5a6061]">
        <div>
          充值系数 <span className="font-semibold text-[#2d3435]">{formatRate(entry.rechargeCoefficient)}</span>
        </div>
        <div>
          模型倍率{" "}
          <span className="font-semibold text-[#2d3435]">
            {entry.price.modelMultiplier !== null ? `${entry.price.modelMultiplier.toFixed(2)}x` : "—"}
          </span>
        </div>
        <div className="col-span-2">
          稳定性{" "}
          <span className="font-semibold text-[#2d3435]">
            {formatPercent(entry.price.availability.sevenDayRate)}
          </span>
          <span className="ml-1 text-[#7f8889]">样本 {entry.price.availability.sevenDaySamples}</span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <RiskPills station={entry.station} />
        <Link
          href={`/api-transit/${entry.station.slug}`}
          className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold text-[#2d3435] hover:text-[#45bf78]"
        >
          查看 <ExternalLink className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}

function RiskPills({ station }: { station: TransitStation }) {
  return (
    <div className="flex flex-wrap gap-1">
      {station.riskLabels.slice(0, 1).map((risk) => (
        <span key={risk} className="rounded-full bg-[#fff7e8] px-2 py-0.5 text-[10px] font-bold text-[#7a541b]">
          {TRANSIT_RISK_LABELS[risk]}
        </span>
      ))}
      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${getUsageAdviceBadgeClass(station.usageAdvice)}`}>
        {TRANSIT_USAGE_ADVICE_LABELS[station.usageAdvice]}
      </span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-lg border border-[#dfe4e5] bg-white p-4">
      <div className="text-xs font-bold text-[#5a6061]">{label}</div>
      <div className="mt-1.5 text-[22px] font-extrabold leading-tight text-[#202829]">{value}</div>
      <div className="mt-1 text-xs text-[#7a8182]">{helper}</div>
    </div>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-3 py-2.5 text-left text-xs font-bold text-[#5a6061]" scope="col">
      {children}
    </th>
  );
}
