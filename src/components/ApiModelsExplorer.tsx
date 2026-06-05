"use client";

import {
  ArrowUpDown,
  ChevronRight,
  Database,
  ExternalLink,
  Info,
  Layers3,
  PackageCheck,
  Search,
  SlidersHorizontal,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import {
  apiCompatibilityOptions,
  apiModelFxSummary,
  apiModelOffers,
  apiModelUpdatedAt,
  apiProviderTypeLabels,
  formatApiPrice,
  formatUsdAmount,
  getApiModelFamilyOptions,
  getApiModelOffers,
  getApiModelSummaries,
  type ApiCurrency,
  type ApiModelOffer,
  type ApiModelScope,
  type ApiModelSummary,
  type ApiProviderType,
} from "@/lib/api-models";

const typeFilters = ["all", "official", "router", "free", "subscription"] as const;
type TypeFilter = (typeof typeFilters)[number];
type CompatibilityFilter = (typeof apiCompatibilityOptions)[number];
type ScopeMode = "products" | "offers";
type FamilyFilter = "all" | string;

const typeFilterLabels: Record<TypeFilter, string> = {
  all: "全部类型",
  official: apiProviderTypeLabels.official,
  router: apiProviderTypeLabels.router,
  free: apiProviderTypeLabels.free,
  subscription: apiProviderTypeLabels.subscription,
};

export function ApiModelsExplorer() {
  const [family, setFamily] = useState<FamilyFilter>("all");
  const [scopeMode, setScopeMode] = useState<ScopeMode>("products");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [compatibilityFilter, setCompatibilityFilter] = useState<CompatibilityFilter>("全部");
  const [currency, setCurrency] = useState<ApiCurrency>("CNY");

  const normalizedQuery = query.trim().toLowerCase();
  const summaries = useMemo(
    () =>
      getApiModelSummaries(family)
        .filter((summary) => matchesSummary(summary, normalizedQuery))
        .filter((summary) => matchesSummaryType(summary, typeFilter))
        .filter((summary) => matchesSummaryCompatibility(summary, compatibilityFilter)),
    [compatibilityFilter, family, normalizedQuery, typeFilter],
  );
  const rows = useMemo(
    () =>
      getApiModelOffers(family)
        .filter((offer) => matchesOffer(offer, normalizedQuery))
        .filter((offer) => typeFilter === "all" || offer.providerType === typeFilter)
        .filter((offer) => compatibilityFilter === "全部" || offer.compatibility.includes(compatibilityFilter)),
    [compatibilityFilter, family, normalizedQuery, typeFilter],
  );

  const providerCount = new Set(apiModelOffers.map((offer) => offer.providerName)).size;
  const freeCount = apiModelOffers.filter((offer) => offer.providerType === "free" || offer.compatibility.includes("免费/测试")).length;
  const resultCount = scopeMode === "products" ? summaries.length : rows.length;

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8 md:py-10 lg:py-12">
      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-semibold tracking-normal text-[#202829] md:text-4xl">
            {buildTitle(family, scopeMode)}
          </h1>
          <p className="mt-3 max-w-[75ch] text-sm leading-7 text-[#5a6061]">
            整理官方 API、公开模型路由、免费测试入口和订阅型 API 套餐。外层先按标准模型族汇总，点进详情再看官方、路由、免费和套餐入口，方便判断某个模型能从哪里调用、限制是什么。
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.72rem] font-medium text-[#5a6061]">
            <span>人工维护样本：{apiModelUpdatedAt}</span>
            <span className="h-1 w-1 rounded-full bg-[#adb3b4]" />
            <span>当前显示：{resultCount} {scopeMode === "products" ? "个标准模型" : "条渠道报价"}</span>
            <span className="hidden h-1 w-1 rounded-full bg-[#adb3b4] md:inline-block" />
            <span className="hidden md:inline">汇率日期：{apiModelFxSummary.date}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <Metric label="标准模型" value={`${getApiModelSummaries("all").length}`} />
            <Metric label="渠道报价" value={`${apiModelOffers.length}`} />
            <Metric label="来源渠道" value={`${providerCount}`} />
            <Metric label="免费" value={`${freeCount}`} />
          </div>
          <div className="rounded-lg bg-[#eef3f8] p-4 text-sm leading-6 text-[#47657a] ring-1 ring-[#cfdae4]">
            <div className="flex items-start gap-2">
              <Info size={17} className="mt-0.5 shrink-0" />
              <p>
                P0 只收官方或公开文档可验证渠道。不收灰色中转。免费入口必须同时看限流、排队、模型上下线和用途边界。
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-6 space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterPill
            active={family === "all"}
            icon={<Layers3 size={17} />}
            label="全部"
            onClick={() => setFamily("all")}
          />
          {getApiModelFamilyOptions().map((option) => (
            <FilterPill
              key={option.id}
              active={family === option.id}
              icon={<Terminal size={17} />}
              label={option.label}
              onClick={() => setFamily(option.id)}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-center">
          <label className="flex h-11 min-w-0 items-center gap-2 rounded-full bg-white px-4 shadow-[0_16px_45px_rgba(45,52,53,0.05)] ring-1 ring-[#adb3b4]/15 md:w-[430px]">
            <Search size={16} className="shrink-0 text-[#5a6061]" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={scopeMode === "products" ? "搜索 DeepSeek、Qwen、Kimi、GLM" : "搜索模型、渠道、工具或限制"}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9aa2a3]"
            />
          </label>
          <div className="inline-flex h-11 shrink-0 items-center rounded-full bg-[#e4e9ea] p-1">
            <ViewToggleButton
              active={scopeMode === "products"}
              icon={<PackageCheck size={16} />}
              label="标准模型"
              onClick={() => setScopeMode("products")}
            />
            <ViewToggleButton
              active={scopeMode === "offers"}
              icon={<Database size={16} />}
              label="全部报价"
              onClick={() => setScopeMode("offers")}
            />
          </div>
          <div className="inline-flex h-11 shrink-0 items-center rounded-full bg-[#e4e9ea] p-1">
            {(["CNY", "USD"] as ApiCurrency[]).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCurrency(item)}
                className={`h-9 rounded-full px-3.5 text-sm font-semibold transition ${
                  currency === item ? "bg-white text-[#202829] shadow-[0_8px_24px_rgba(45,52,53,0.08)]" : "text-[#5a6061] hover:text-[#202829]"
                }`}
              >
                {item === "CNY" ? "人民币" : "美元"}
              </button>
            ))}
          </div>
          <div className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-[#e4e9ea] px-4 text-sm font-semibold text-[#2d3435]">
            <ArrowUpDown size={17} />
            {scopeMode === "products" ? "模型族优先" : "官方渠道优先"}
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {typeFilters.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTypeFilter(item)}
              aria-label={`类型筛选：${typeFilterLabels[item]}`}
              className={`inline-flex h-9 shrink-0 items-center rounded-full px-3.5 text-xs font-semibold transition ${
                typeFilter === item
                  ? "bg-[#2d3435] text-[#f8f8f8] shadow-[0_10px_30px_rgba(45,52,53,0.10)]"
                  : "bg-white text-[#5a6061] ring-1 ring-[#adb3b4]/15 hover:bg-[#f7f9f9] hover:text-[#202829]"
              }`}
            >
              {typeFilterLabels[item]}
            </button>
          ))}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {apiCompatibilityOptions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setCompatibilityFilter(item)}
              aria-label={`兼容性筛选：${item}`}
              className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition ${
                compatibilityFilter === item
                  ? "bg-[#dde4e5] text-[#202829]"
                  : "bg-white text-[#5a6061] ring-1 ring-[#adb3b4]/15 hover:bg-[#f7f9f9] hover:text-[#202829]"
              }`}
            >
              <SlidersHorizontal size={13} />
              {item}
            </button>
          ))}
        </div>
      </section>

      {scopeMode === "products" ? (
        summaries.length ? (
          <ApiModelSummaryTable summaries={summaries} currency={currency} />
        ) : (
          <EmptyState text="没有符合条件的标准模型" />
        )
      ) : rows.length ? (
        <ApiOfferTable rows={rows} currency={currency} />
      ) : (
        <EmptyState text="没有符合条件的 API 渠道报价" />
      )}

      <section className="mt-6 rounded-lg bg-[#fff7e8] p-5 text-sm leading-7 text-[#7a541b] ring-1 ring-[#efdfbd]">
        <p className="font-semibold text-[#7a541b]">套餐折算提示</p>
        <p className="mt-1">
          例如 OpenCode Go 在规划文档中记录为首月 {formatUsdAmount(5, currency)}，后续 {formatUsdAmount(10, currency)}
          /月。订阅套餐不能只看月费，还要看短周期限制、可用模型和额度消耗规则。
        </p>
      </section>

      <p className="mt-8 text-xs leading-6 text-[#5a6061]">
        免责声明：PriceAI 只整理公开文档和公开页面中的 API 渠道信息，不售卖 API，不承诺可用性，不替任何渠道提供 SLA。免费和低价渠道可能存在限流、排队、模型下线、地区限制或条款变化。
      </p>
    </main>
  );
}

function ApiModelSummaryTable({ summaries, currency }: { summaries: ApiModelSummary[]; currency: ApiCurrency }) {
  return (
    <section className="overflow-hidden rounded-lg bg-white shadow-[0_20px_55px_rgba(45,52,53,0.045)] ring-1 ring-[#adb3b4]/15">
      <div className="overflow-x-auto">
        <table className="min-w-[1140px] w-full border-collapse text-left text-sm">
          <thead className="bg-[#f2f4f4] text-[0.68rem] font-semibold text-[#5a6061]">
            <tr>
              <TableHead>标准模型</TableHead>
              <TableHead>参考入口</TableHead>
              <TableHead>渠道</TableHead>
              <TableHead>官方</TableHead>
              <TableHead>免费/测试</TableHead>
              <TableHead>兼容性</TableHead>
              <TableHead>最近更新</TableHead>
              <TableHead>操作</TableHead>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf0f1]">
            {summaries.map((summary) => {
              const href = `/api-models/${summary.id}`;
              const primaryOffer = summary.primaryOffer;

              return (
                <tr key={summary.id} className="transition hover:bg-[#f7f9f9]">
                  <td className="max-w-[330px] px-5 py-4">
                    <Link href={href} className="group flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f2f4f4] text-[#5a6061]">
                        <Terminal size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-[#202829] group-hover:text-[#5e5e5e]">{summary.displayName}</span>
                        <span className="mt-1 block truncate text-xs text-[#5a6061]">{summary.representativeModels.join(" / ")}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="max-w-[260px] px-5 py-4">
                    <span className="block truncate font-semibold text-[#202829]">{primaryOffer?.providerName || "待确认"}</span>
                    <span className="mt-1 block truncate text-xs text-[#5a6061]">
                      {primaryOffer ? `${formatApiPrice(primaryOffer.inputPrice, currency)} · ${primaryOffer.billingMode}` : "暂无参考入口"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-[#2d3435]">{summary.offerCount}</td>
                  <td className="px-5 py-4">
                    <CountBadge tone="good">官方 {summary.officialCount}</CountBadge>
                  </td>
                  <td className="px-5 py-4">
                    <CountBadge tone="warn">免费 {summary.freeCount}</CountBadge>
                  </td>
                  <td className="max-w-[260px] px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      {summary.compatibility.map((item) => (
                        <span key={item} className="rounded-full bg-[#edf0f1] px-2.5 py-1 text-[0.68rem] font-semibold text-[#5a6061]">
                          {item}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#5a6061]">{summary.latestUpdatedAt}</td>
                  <td className="px-5 py-4">
                    <Link
                      href={href}
                      className="inline-flex h-9 items-center justify-center gap-1.5 rounded-full bg-[#2d3435] px-3 text-xs font-semibold text-[#f8f8f8] transition hover:bg-[#1f2526]"
                    >
                      查看
                      <ChevronRight size={14} />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ApiOfferTable({ rows, currency }: { rows: ApiModelOffer[]; currency: ApiCurrency }) {
  return (
    <section className="overflow-hidden rounded-lg bg-white shadow-[0_20px_55px_rgba(45,52,53,0.045)] ring-1 ring-[#adb3b4]/15">
      <div className="overflow-x-auto">
        <table className="min-w-[1520px] w-full border-collapse text-left text-sm">
          <thead className="bg-[#f2f4f4] text-[0.68rem] font-semibold text-[#5a6061]">
            <tr>
              <TableHead>模型</TableHead>
              <TableHead>渠道</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>输入价</TableHead>
              <TableHead>输出价</TableHead>
              <TableHead>缓存价/说明</TableHead>
              <TableHead>免费/套餐额度</TableHead>
              <TableHead>限制</TableHead>
              <TableHead>兼容性</TableHead>
              <TableHead>适合工具</TableHead>
              <TableHead>来源</TableHead>
              <TableHead>更新时间</TableHead>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf0f1]">
            {rows.map((offer) => (
              <ApiOfferRow key={offer.id} offer={offer} currency={currency} />
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ApiOfferRow({ offer, currency }: { offer: ApiModelOffer; currency: ApiCurrency }) {
  const sourceHref = offer.pricingUrl ?? offer.providerUrl;

  return (
    <tr className="align-top transition hover:bg-[#f7f9f9]">
      <td className="px-5 py-4">
        <Link href={`/api-models/${familyIdForHref(offer.modelFamily)}`} className="block max-w-[220px] font-semibold leading-6 text-[#202829] hover:text-[#2f7a4b]">
          {offer.modelName}
        </Link>
        <p className="mt-1 text-xs font-medium text-[#5a6061]">{offer.modelFamily}</p>
      </td>
      <td className="px-5 py-4">
        <a
          href={offer.providerUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex max-w-[190px] items-center gap-1.5 font-semibold leading-6 text-[#202829] transition hover:text-[#2f7a4b]"
        >
          {offer.providerName}
          <ExternalLink size={13} className="shrink-0" />
        </a>
        <p className="mt-1 text-xs text-[#5a6061]">{offer.billingMode}</p>
      </td>
      <td className="px-5 py-4">
        <TypeChip type={offer.providerType} />
      </td>
      <td className="px-5 py-4">
        <PriceText value={formatApiPrice(offer.inputPrice, currency)} />
      </td>
      <td className="px-5 py-4">
        <PriceText value={formatApiPrice(offer.outputPrice, currency)} />
      </td>
      <td className="px-5 py-4">
        <p className="max-w-[190px] text-sm font-semibold leading-6 text-[#202829]">
          {offer.cachePrice ? formatApiPrice(offer.cachePrice, currency) : "待确认"}
        </p>
      </td>
      <td className="px-5 py-4">
        <p className="max-w-[230px] text-sm leading-6 text-[#2d3435]">{offer.freeOrPlan}</p>
        {offer.notes ? <p className="mt-1 max-w-[230px] text-xs leading-5 text-[#5a6061]">{offer.notes}</p> : null}
      </td>
      <td className="px-5 py-4">
        <p className="max-w-[250px] text-sm leading-6 text-[#5a6061]">{offer.limitations}</p>
      </td>
      <td className="px-5 py-4">
        <div className="flex max-w-[230px] flex-wrap gap-1.5">
          {offer.compatibility.map((item) => (
            <span key={item} className="rounded-full bg-[#edf0f1] px-2.5 py-1 text-[0.68rem] font-semibold text-[#5a6061]">
              {item}
            </span>
          ))}
        </div>
      </td>
      <td className="px-5 py-4">
        <p className="max-w-[190px] text-sm leading-6 text-[#5a6061]">{offer.suitableTools.join("、")}</p>
      </td>
      <td className="px-5 py-4">
        <a
          href={sourceHref}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full bg-[#e4e9ea] px-3 text-xs font-semibold text-[#2d3435] transition hover:bg-[#dde4e5]"
        >
          {offer.sourceLabel}
          <ExternalLink size={13} />
        </a>
      </td>
      <td className="px-5 py-4 text-xs font-medium text-[#5a6061]">{offer.updatedAt}</td>
    </tr>
  );
}

function FilterPill({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 text-sm transition ${
        active
          ? "bg-[#dde4e5] font-semibold text-[#2d3435]"
          : "bg-transparent text-[#5a6061] hover:bg-[#ebeeef] hover:text-[#2d3435]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ViewToggleButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-semibold transition ${
        active
          ? "bg-white text-[#202829] shadow-[0_8px_24px_rgba(45,52,53,0.08)]"
          : "text-[#5a6061] hover:text-[#202829]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-white px-3 py-3 shadow-[0_12px_35px_rgba(45,52,53,0.035)] ring-1 ring-[#adb3b4]/15">
      <p className="truncate text-[0.68rem] font-medium uppercase tracking-[0.14em] text-[#5a6061]">{label}</p>
      <p className="mt-1 truncate text-xl font-bold text-[#202829]">{value}</p>
    </div>
  );
}

function TypeChip({ type }: { type: ApiProviderType }) {
  const classNameByType: Record<ApiProviderType, string> = {
    official: "bg-[#e8f3ec] text-[#2f7a4b]",
    router: "bg-[#eef3f8] text-[#47657a]",
    free: "bg-[#fff7e8] text-[#7a541b]",
    subscription: "bg-[#e4e9ea] text-[#2d3435]",
  };

  return (
    <span className={`inline-flex h-8 items-center whitespace-nowrap rounded-full px-3 text-xs font-semibold ${classNameByType[type]}`}>
      {apiProviderTypeLabels[type]}
    </span>
  );
}

function CountBadge({ children, tone }: { children: ReactNode; tone: "good" | "warn" }) {
  const className = tone === "good" ? "bg-[#e8f3ec] text-[#2f7a4b]" : "bg-[#fff7e8] text-[#7a541b]";

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}

function PriceText({ value }: { value: string }) {
  return <p className="max-w-[190px] font-semibold leading-6 text-[#202829]">{value}</p>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg bg-white px-6 py-16 text-center shadow-[0_20px_60px_rgba(45,52,53,0.05)] ring-1 ring-[#adb3b4]/15">
      <p className="font-serif text-2xl font-semibold text-[#202829]">{text}</p>
      <p className="mt-3 text-sm text-[#5a6061]">可以切换模型族，或清空搜索条件后再查看。</p>
    </div>
  );
}

function TableHead({ children }: { children: ReactNode }) {
  return <th className="px-5 py-3 font-semibold">{children}</th>;
}

function buildTitle(family: ApiModelScope, scopeMode: ScopeMode) {
  const label = family === "all" ? "全模型" : getApiModelFamilyOptions().find((option) => option.id === family)?.label ?? family;
  return `${label} ${scopeMode === "products" ? "标准模型" : "API 渠道报价"}`;
}

function matchesSummary(summary: ApiModelSummary, query: string) {
  if (!query) return true;

  return [
    summary.displayName,
    summary.modelFamily,
    ...summary.representativeModels,
    ...summary.compatibility,
    ...summary.suitableTools,
    summary.primaryOffer?.providerName,
    summary.primaryOffer?.freeOrPlan,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function matchesSummaryType(summary: ApiModelSummary, typeFilter: TypeFilter) {
  if (typeFilter === "all") return true;

  return {
    official: summary.officialCount,
    router: summary.routerCount,
    free: summary.freeCount,
    subscription: summary.subscriptionCount,
  }[typeFilter] > 0;
}

function matchesSummaryCompatibility(summary: ApiModelSummary, compatibilityFilter: CompatibilityFilter) {
  if (compatibilityFilter === "全部") return true;
  return summary.compatibility.includes(compatibilityFilter);
}

function matchesOffer(offer: ApiModelOffer, query: string) {
  if (!query) return true;

  return [
    offer.modelName,
    offer.modelFamily,
    offer.providerName,
    offer.billingMode,
    offer.freeOrPlan,
    offer.limitations,
    ...offer.compatibility,
    ...offer.suitableTools,
  ]
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function familyIdForHref(family: string) {
  return getApiModelFamilyOptions().find((option) => option.label === family)?.id ?? family.toLowerCase();
}
