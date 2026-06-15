"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ExternalLink, Filter, Search } from "lucide-react";
import type {
  TransitAccountPool,
  TransitChannelType,
  TransitModelFamily,
  TransitRiskLabel,
  TransitStation,
} from "@/data/api-transit/types";
import {
  TRANSIT_ACCOUNT_POOL_LABELS,
  TRANSIT_CHANNEL_TYPE_LABELS,
  TRANSIT_DATA_STATUS_LABELS,
  TRANSIT_MODEL_FAMILY_OPTIONS,
  TRANSIT_RISK_LABELS,
  TRANSIT_USAGE_ADVICE_LABELS,
} from "@/data/api-transit/types";
import {
  compareStations,
  formatAvailability,
  formatMultiplierRange,
  formatRate,
  getRateBadgeClass,
  getStationComparisonSummary,
  getStationRechargeCoefficient,
  getSummaryStats,
  getUsageAdviceBadgeClass,
  parseRechargeRatio,
  type TransitSortKey,
} from "@/lib/api-transit";

const CHANNEL_OPTIONS: { value: TransitChannelType | "all"; label: string }[] = [
  { value: "all", label: "全部渠道" },
  ...Object.entries(TRANSIT_CHANNEL_TYPE_LABELS).map(([value, label]) => ({
    value: value as TransitChannelType,
    label,
  })),
];

const POOL_OPTIONS: { value: TransitAccountPool | "all"; label: string }[] = [
  { value: "all", label: "全部号池" },
  ...Object.entries(TRANSIT_ACCOUNT_POOL_LABELS).map(([value, label]) => ({
    value: value as TransitAccountPool,
    label,
  })),
];

const RISK_OPTIONS: { value: TransitRiskLabel | "all"; label: string }[] = [
  { value: "all", label: "全部风险" },
  ...Object.entries(TRANSIT_RISK_LABELS).map(([value, label]) => ({
    value: value as TransitRiskLabel,
    label,
  })),
];

const SORT_OPTIONS: { value: TransitSortKey; label: string }[] = [
  { value: "overall", label: "综合排序" },
  { value: "rate", label: "按倍率" },
  { value: "stability", label: "按稳定性" },
];

function coerceParam<T extends string>(
  value: string | null,
  allowed: readonly T[],
  fallback: T
): T {
  return value && allowed.includes(value as T) ? (value as T) : fallback;
}

interface Props {
  stations: TransitStation[];
}

export default function TransitStationExplorer({ stations }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [urlReady, setUrlReady] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [modelFilter, setModelFilter] = useState<TransitModelFamily | "all">(
    coerceParam(searchParams.get("model"), ["all", "claude", "gpt"] as const, "all")
  );
  const [channelFilter, setChannelFilter] = useState<TransitChannelType | "all">(
    coerceParam(searchParams.get("channel"), CHANNEL_OPTIONS.map((item) => item.value), "all")
  );
  const [poolFilter, setPoolFilter] = useState<TransitAccountPool | "all">(
    coerceParam(searchParams.get("pool"), POOL_OPTIONS.map((item) => item.value), "all")
  );
  const [riskFilter, setRiskFilter] = useState<TransitRiskLabel | "all">(
    coerceParam(searchParams.get("risk"), RISK_OPTIONS.map((item) => item.value), "all")
  );
  const [sortBy, setSortBy] = useState<TransitSortKey>(
    coerceParam(searchParams.get("sort"), ["overall", "rate", "stability"] as const, "overall")
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => setUrlReady(true), 60);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!urlReady) return;

    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (modelFilter !== "all") params.set("model", modelFilter);
    if (channelFilter !== "all") params.set("channel", channelFilter);
    if (poolFilter !== "all") params.set("pool", poolFilter);
    if (riskFilter !== "all") params.set("risk", riskFilter);
    if (sortBy !== "overall") params.set("sort", sortBy);

    const query = params.toString();
    router.replace(query ? `/api-transit?${query}` : "/api-transit", { scroll: false });
  }, [channelFilter, modelFilter, poolFilter, riskFilter, router, search, sortBy, urlReady]);

  const filtered = useMemo(() => {
    let result = [...stations];

    if (search) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (station) =>
          station.name.toLowerCase().includes(q) ||
          station.slug.toLowerCase().includes(q) ||
          station.summary.toLowerCase().includes(q)
      );
    }

    if (modelFilter !== "all") {
      result = result.filter((station) =>
        station.prices.some((price) => price.family === modelFilter)
      );
    }

    if (channelFilter !== "all") {
      result = result.filter((station) => station.channelTypes.includes(channelFilter));
    }

    if (poolFilter !== "all") {
      result = result.filter((station) => station.accountPools.includes(poolFilter));
    }

    if (riskFilter !== "all") {
      result = result.filter((station) => station.riskLabels.includes(riskFilter));
    }

    return compareStations(result, sortBy);
  }, [channelFilter, modelFilter, poolFilter, riskFilter, search, sortBy, stations]);

  const stats = useMemo(() => getSummaryStats(stations), [stations]);
  const activeFilterCount =
    [modelFilter, channelFilter, poolFilter, riskFilter].filter((value) => value !== "all").length +
    (search ? 1 : 0) +
    (sortBy !== "overall" ? 1 : 0);

  const navigateToStation = useCallback(
    (slug: string) => {
      const params = new URLSearchParams();
      if (search) params.set("q", search);
      if (modelFilter !== "all") params.set("model", modelFilter);
      if (channelFilter !== "all") params.set("channel", channelFilter);
      if (poolFilter !== "all") params.set("pool", poolFilter);
      if (riskFilter !== "all") params.set("risk", riskFilter);
      if (sortBy !== "overall") params.set("sort", sortBy);
      const query = params.toString();

      router.push(`/api-transit/${slug}${query ? `?back=${encodeURIComponent(query)}` : ""}`);
    },
    [channelFilter, modelFilter, poolFilter, riskFilter, router, search, sortBy]
  );

  return (
    <div>
      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="已收录站点" value={String(stats.total)} helper="静态样例数据，持续核验" />
        <MetricCard label="Claude 最低综合倍率" value={formatRate(stats.bestClaude)} helper="充值系数 x 模型倍率" />
        <MetricCard label="GPT 最低综合倍率" value={formatRate(stats.bestGpt)} helper="按 GPT 样例报价计算" />
        <MetricCard label="近 7 日样本" value={String(stats.sevenDaySamples)} helper={`${stats.withRisk} 个站点有风险提示`} />
      </div>

      <div className="sticky top-[66px] z-20 mb-5 rounded-lg border border-[#dfe4e5] bg-white/95 shadow-[0_20px_55px_rgba(45,52,53,0.045)] backdrop-blur-sm">
        <div className="flex items-center gap-2 overflow-x-auto p-3 scrollbar-none">
          <div className="relative min-w-[210px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7a8182]" />
            <input
              className="h-[38px] w-full rounded-full border border-[#dfe4e5] bg-[#fbfcfc] pl-9 pr-3 text-sm text-[#2d3435] outline-none placeholder:text-[#7f8889] focus:border-[#45bf78]/65 focus:shadow-[0_0_0_3px_rgba(69,191,120,0.16)]"
              placeholder="搜索站点名称、描述..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => setShowFilters((value) => !value)}
            className={`flex h-[38px] items-center gap-1.5 rounded-full border px-3 text-sm font-bold transition-colors ${
              showFilters || activeFilterCount > 0
                ? "border-[#2d3435] bg-[#2d3435] text-[#f8f8f8]"
                : "border-[#dfe4e5] bg-[#f2f4f4] text-[#5a6061] hover:bg-[#dde4e5]"
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            筛选{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
          <select
            className="h-[38px] rounded-full border border-[#dfe4e5] bg-[#fbfcfc] px-3 text-sm text-[#2d3435] outline-none"
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as TransitSortKey)}
            aria-label="排序方式"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {showFilters ? (
          <div className="grid grid-cols-2 gap-3 border-t border-[#dfe4e5] p-3 pt-0 sm:grid-cols-4">
            <FilterSelect
              label="模型"
              value={modelFilter}
              onChange={(value) => setModelFilter(value as TransitModelFamily | "all")}
              options={[
                { value: "all", label: "全部模型" },
                ...TRANSIT_MODEL_FAMILY_OPTIONS.map((item) => ({ value: item.id, label: item.label })),
              ]}
            />
            <FilterSelect
              label="渠道类型"
              value={channelFilter}
              onChange={(value) => setChannelFilter(value as TransitChannelType | "all")}
              options={CHANNEL_OPTIONS}
            />
            <FilterSelect
              label="号池"
              value={poolFilter}
              onChange={(value) => setPoolFilter(value as TransitAccountPool | "all")}
              options={POOL_OPTIONS}
            />
            <FilterSelect
              label="风险"
              value={riskFilter}
              onChange={(value) => setRiskFilter(value as TransitRiskLabel | "all")}
              options={RISK_OPTIONS}
            />
          </div>
        ) : null}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-[#5a6061]">
          <p className="mb-2 text-lg font-semibold">没有匹配的中转站</p>
          <p className="text-sm">尝试调整模型、渠道或风险筛选。</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-hidden rounded-lg border border-[#dfe4e5] bg-white shadow-[0_20px_55px_rgba(45,52,53,0.045)] md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1040px] border-collapse" role="table">
                <thead>
                  <tr className="bg-[#f2f4f4]" role="row">
                    <TableHead>站点</TableHead>
                    <TableHead>号池来源</TableHead>
                    <TableHead>充值系数</TableHead>
                    <TableHead>Claude</TableHead>
                    <TableHead>GPT</TableHead>
                    <TableHead>近 7 日稳定性</TableHead>
                    <TableHead>风险提示</TableHead>
                    <TableHead>更新时间</TableHead>
                  </tr>
                </thead>
                <tbody role="rowgroup">
                  {filtered.map((station) => (
                    <StationRow
                      key={station.id}
                      station={station}
                      onClick={() => navigateToStation(station.slug)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filtered.map((station) => (
              <StationCard
                key={station.id}
                station={station}
                onClick={() => navigateToStation(station.slug)}
              />
            ))}
          </div>

          <div className="mt-4 text-center text-xs text-[#5a6061]">
            共 {filtered.length} 个站点
            {filtered.length !== stations.length ? `（总收录 ${stations.length} 个）` : ""}
          </div>
        </>
      )}
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

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-1.5 block text-[11px] font-bold text-[#5a6061]">{label}</span>
      <select
        className="h-[38px] w-full truncate rounded-full border border-[#dfe4e5] bg-[#fbfcfc] px-3 text-sm text-[#2d3435] outline-none"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TableHead({ children }: { children: React.ReactNode }) {
  return (
    <th
      className="whitespace-nowrap px-3 py-3 text-left text-xs font-bold text-[#5a6061]"
      scope="col"
    >
      {children}
    </th>
  );
}

function RechargeRatioDisplay({ station }: { station: TransitStation }) {
  const ratioText = station.prices[0]?.rechargeRatio ?? null;
  const coefficient = getStationRechargeCoefficient(station);

  if (!ratioText || coefficient === null) {
    return <span className="text-xs text-[#7f8889]">未公开</span>;
  }

  return (
    <span
      className="inline-flex flex-col"
      title={`原始比例：${ratioText}，1 元约等于 ${(parseRechargeRatio(ratioText) ?? 0).toFixed(2)} 站内美元额度`}
    >
      <span className="text-xs font-extrabold text-[#2d3435]">{formatRate(coefficient)}</span>
      <span className="text-[10px] text-[#7f8889]">{ratioText}</span>
    </span>
  );
}

function FamilySummaryCell({
  station,
  family,
}: {
  station: TransitStation;
  family: TransitModelFamily;
}) {
  const summary = getStationComparisonSummary(station)[family];

  if (summary.priceCount === 0) {
    return <span className="text-xs text-[#7f8889]">未收录</span>;
  }

  return (
    <div className="min-w-[120px]">
      <div className="text-xs font-semibold text-[#202829]">{formatMultiplierRange(summary)}</div>
      <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold ${getRateBadgeClass(summary.combinedRateMin)}`}>
        {formatRate(summary.combinedRateMin)}
      </span>
    </div>
  );
}

function StationRow({
  station,
  onClick,
}: {
  station: TransitStation;
  onClick: () => void;
}) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLTableRowElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <tr
      className="cursor-pointer border-b border-[#dfe4e5] transition-colors hover:bg-[#fbfcfc] focus-visible:bg-[#fbfcfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#45bf78]/40"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="row"
      aria-label={`查看 ${station.name} 详情`}
    >
      <td className="px-3 py-3">
        <div className="flex min-w-[160px] items-center gap-2.5">
          <div className="grid h-[38px] w-[38px] flex-shrink-0 place-items-center rounded-lg bg-[#f2f4f4] text-sm font-black text-[#202829]">
            {station.name[0]}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-extrabold text-[#202829]">{station.name}</div>
            <div className="truncate text-[11px] text-[#5a6061]">
              {station.websiteUrl.replace(/^https?:\/\//, "")}
            </div>
          </div>
        </div>
      </td>
      <td className="min-w-[170px] px-3 py-3">
        <PillList
          items={[
            ...station.accountPools.map((pool) => ({
              id: `pool-${pool}`,
              label: TRANSIT_ACCOUNT_POOL_LABELS[pool],
            })),
            ...station.channelTypes.map((type) => ({
              id: `channel-${type}`,
              label: TRANSIT_CHANNEL_TYPE_LABELS[type],
            })),
          ]}
        />
      </td>
      <td className="px-3 py-3">
        <RechargeRatioDisplay station={station} />
      </td>
      <td className="px-3 py-3">
        <FamilySummaryCell station={station} family="claude" />
      </td>
      <td className="px-3 py-3">
        <FamilySummaryCell station={station} family="gpt" />
      </td>
      <td className="px-3 py-3">
        <div className="text-xs font-semibold text-[#202829]">{formatAvailability(station.availability)}</div>
        <div className="mt-0.5 text-[10px] text-[#7f8889]">
          {station.availability.lastCheckedAt ?? "暂无检查时间"}
        </div>
      </td>
      <td className="min-w-[160px] px-3 py-3">
        <RiskBlock station={station} />
      </td>
      <td className="px-3 py-3">
        <div className="text-xs text-[#5a6061]">{station.lastUpdatedAt}</div>
        <div className="mt-1 text-[10px] font-bold text-[#7f8889]">
          {TRANSIT_DATA_STATUS_LABELS[station.dataStatus]}
        </div>
      </td>
    </tr>
  );
}

function StationCard({
  station,
  onClick,
}: {
  station: TransitStation;
  onClick: () => void;
}) {
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onClick();
    }
  };

  return (
    <div
      className="cursor-pointer rounded-lg border border-[#dfe4e5] bg-white p-4 shadow-[0_20px_55px_rgba(45,52,53,0.045)] transition-colors hover:bg-[#fbfcfc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#45bf78]/40"
      onClick={onClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`查看 ${station.name} 详情`}
    >
      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded-lg bg-[#f2f4f4] text-sm font-black text-[#202829]">
          {station.name[0]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-extrabold text-[#202829]">{station.name}</div>
          <div className="flex items-center gap-1 text-xs text-[#5a6061]">
            <ExternalLink className="h-3 w-3" />
            {station.websiteUrl.replace(/^https?:\/\//, "")}
          </div>
        </div>
      </div>

      <div className="mb-3 flex flex-wrap gap-1">
        {station.accountPools.map((pool) => (
          <span key={`pool-${pool}`} className="rounded-full bg-[#eef3f8] px-2 py-0.5 text-[11px] font-bold text-[#47657a]">
            {TRANSIT_ACCOUNT_POOL_LABELS[pool]}
          </span>
        ))}
        {station.channelTypes.map((type) => (
          <span key={`channel-${type}`} className="rounded-full bg-[#f2f4f4] px-2 py-0.5 text-[10px] font-bold text-[#2d3435]">
            {TRANSIT_CHANNEL_TYPE_LABELS[type]}
          </span>
        ))}
      </div>

      <div className="mb-3 grid grid-cols-3 gap-2 text-xs">
        <InfoTile label="充值" value={<RechargeRatioDisplay station={station} />} />
        <InfoTile label="Claude" value={<FamilySummaryCell station={station} family="claude" />} />
        <InfoTile label="GPT" value={<FamilySummaryCell station={station} family="gpt" />} />
      </div>

      <div className="mb-3 text-xs text-[#5a6061]">
        稳定性 <span className="font-semibold text-[#202829]">{formatAvailability(station.availability)}</span>
      </div>
      <RiskBlock station={station} />
      <div className="mt-3 text-xs text-[#5a6061]">
        更新于 {station.lastUpdatedAt} · {TRANSIT_DATA_STATUS_LABELS[station.dataStatus]}
      </div>
    </div>
  );
}

function PillList({ items }: { items: { id: string; label: string }[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span
          key={item.id}
          className="rounded-full bg-[#f2f4f4] px-2 py-0.5 text-[10px] font-bold text-[#2d3435]"
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}

function RiskBlock({ station }: { station: TransitStation }) {
  const visibleRisks = station.riskLabels.slice(0, 3);

  return (
    <div className="flex flex-wrap gap-1">
      {visibleRisks.map((risk) => (
        <span key={risk} className="rounded-full bg-[#fff7e8] px-2 py-0.5 text-[11px] font-bold text-[#7a541b]">
          {TRANSIT_RISK_LABELS[risk]}
        </span>
      ))}
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${getUsageAdviceBadgeClass(station.usageAdvice)}`}>
        {TRANSIT_USAGE_ADVICE_LABELS[station.usageAdvice]}
      </span>
    </div>
  );
}

function InfoTile({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-lg bg-[#f2f4f4] p-2">
      <div className="mb-1 text-[10px] font-bold text-[#5a6061]">{label}</div>
      {value}
    </div>
  );
}
