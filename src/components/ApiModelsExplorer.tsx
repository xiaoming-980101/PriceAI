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
  apiProviders,
  formatApiPrice,
  formatPlanPrice,
  getApiModelFamilyOptions,
  getApiModelOffers,
  getApiModelSummaries,
  getApiProviderSummaries,
  type ApiCurrency,
  type ApiModelOfferWithRelations,
  type ApiModelScope,
  type ApiModelSummary,
  type ApiProviderSummary,
  type ApiProviderType,
} from "@/lib/api-models";

const typeFilters = ["all", "official", "subscription", "router", "free"] as const;
type TypeFilter = (typeof typeFilters)[number];
type CompatibilityFilter = (typeof apiCompatibilityOptions)[number];
type ScopeMode = "models" | "providers";
type FamilyFilter = "all" | string;

const typeFilterLabels: Record<TypeFilter, string> = {
  all: "全部类型",
  official: apiProviderTypeLabels.official,
  subscription: apiProviderTypeLabels.subscription,
  router: apiProviderTypeLabels.router,
  free: apiProviderTypeLabels.free,
};

export function ApiModelsExplorer() {
  const [family, setFamily] = useState<FamilyFilter>("all");
  const [scopeMode, setScopeMode] = useState<ScopeMode>("models");
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [compatibilityFilter, setCompatibilityFilter] = useState<CompatibilityFilter>("全部");
  const [currency, setCurrency] = useState<ApiCurrency>("CNY");

  const normalizedQuery = query.trim().toLowerCase();
  const modelSummaries = useMemo(
    () =>
      getApiModelSummaries(family)
        .filter((summary) => matchesModelSummary(summary, normalizedQuery))
        .filter((summary) => matchesModelSummaryType(summary, typeFilter))
        .filter((summary) => matchesModelSummaryCompatibility(summary, compatibilityFilter)),
    [compatibilityFilter, family, normalizedQuery, typeFilter],
  );
  const providerSummaries = useMemo(
    () =>
      getApiProviderSummaries(family)
        .filter((summary) => matchesProviderSummary(summary, normalizedQuery))
        .filter((summary) => typeFilter === "all" || summary.provider.type === typeFilter)
        .filter((summary) => compatibilityFilter === "全部" || summary.compatibility.includes(compatibilityFilter)),
    [compatibilityFilter, family, normalizedQuery, typeFilter],
  );
  const offerRows = useMemo(
    () =>
      getApiModelOffers(family)
        .filter((offer) => matchesOffer(offer, normalizedQuery))
        .filter((offer) => typeFilter === "all" || offer.provider.type === typeFilter)
        .filter((offer) => compatibilityFilter === "全部" || offer.compatibility.includes(compatibilityFilter)),
    [compatibilityFilter, family, normalizedQuery, typeFilter],
  );

  const freeCount = apiModelOffers.filter((offer) => offer.providerId === "nvidia-nim" || offer.compatibility.includes("免费/测试")).length;
  const resultCount = scopeMode === "models" ? modelSummaries.length : providerSummaries.length;

  return (
    <main className="mx-auto max-w-[1500px] px-5 py-6 sm:px-8 md:py-10 lg:py-12">
      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_420px] lg:items-start">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-semibold tracking-normal text-[#202829] md:text-4xl">
            {buildTitle(family, scopeMode)}
          </h1>
          <p className="mt-3 max-w-[75ch] text-sm leading-7 text-[#5a6061]">
            按具体模型和正规公开渠道重新组织 API 信息。你可以先查某个模型有哪些官方 API、套餐或免费入口，也可以反过来查某个渠道或套餐覆盖哪些模型。
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[0.72rem] font-medium text-[#5a6061]">
            <span>人工维护样本：{apiModelUpdatedAt}</span>
            <span className="h-1 w-1 rounded-full bg-[#adb3b4]" />
            <span>当前显示：{resultCount} {scopeMode === "models" ? "个标准模型" : "个渠道/套餐"}</span>
            <span className="hidden h-1 w-1 rounded-full bg-[#adb3b4] md:inline-block" />
            <span className="hidden md:inline">汇率日期：{apiModelFxSummary.date}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="grid grid-cols-4 gap-2">
            <Metric label="标准模型" value={`${getApiModelSummaries("all").length}`} />
            <Metric label="渠道报价" value={`${apiModelOffers.length}`} />
            <Metric label="来源渠道" value={`${apiProviders.length}`} />
            <Metric label="免费" value={`${freeCount}`} />
          </div>
          <div className="rounded-lg bg-[#eef3f8] p-4 text-sm leading-6 text-[#47657a] ring-1 ring-[#cfdae4]">
            <div className="flex items-start gap-2">
              <Info size={17} className="mt-0.5 shrink-0" />
              <p>
                P0 只收官方或公开文档可验证渠道，不收灰色中转。套餐会展示额度、窗口期和限制，不把月费粗暴折成一个“最低价”。
              </p>
            </div>
          </div>
        </div>
      </div>

      <section className="mb-6 space-y-3">
        <div className="flex gap-2 overflow-x-auto pb-1">
          <FilterPill active={family === "all"} icon={<Layers3 size={17} />} label="全部" onClick={() => setFamily("all")} />
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
              placeholder={scopeMode === "models" ? "搜索 DeepSeek V4、Qwen3.7、Kimi K2.6" : "搜索 OpenCode Go、OpenRouter、官方 API"}
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-[#9aa2a3]"
            />
          </label>
          <div className="inline-flex h-11 shrink-0 items-center rounded-full bg-[#e4e9ea] p-1">
            <ViewToggleButton
              active={scopeMode === "models"}
              icon={<PackageCheck size={16} />}
              label="按模型查"
              onClick={() => setScopeMode("models")}
            />
            <ViewToggleButton
              active={scopeMode === "providers"}
              icon={<Database size={16} />}
              label="按渠道查"
              onClick={() => setScopeMode("providers")}
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
            {scopeMode === "models" ? "模型家族优先" : "官方/套餐优先"}
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

      {scopeMode === "models" ? (
        modelSummaries.length ? (
          <ApiModelSummaryTable summaries={modelSummaries} currency={currency} />
        ) : (
          <EmptyState text="没有符合条件的标准模型" />
        )
      ) : providerSummaries.length ? (
        <ApiProviderSummaryTable summaries={providerSummaries} currency={currency} />
      ) : (
        <EmptyState text="没有符合条件的渠道或套餐" />
      )}

      {scopeMode === "models" && offerRows.length ? (
        <section className="mt-8">
          <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-serif text-2xl font-semibold tracking-normal text-[#202829]">全部渠道明细</h2>
              <p className="mt-1 text-sm text-[#5a6061]">用于横向核对模型、渠道、价格、套餐说明和来源链接。</p>
            </div>
            <span className="text-xs font-medium text-[#5a6061]">{offerRows.length} 条报价明细</span>
          </div>
          <ApiOfferTable rows={offerRows} currency={currency} />
        </section>
      ) : null}

      <section className="mt-6 rounded-lg bg-[#fff7e8] p-5 text-sm leading-7 text-[#7a541b] ring-1 ring-[#efdfbd]">
        <p className="font-semibold text-[#7a541b]">套餐折算提示</p>
        <p className="mt-1">
          订阅型 API 套餐需要同时看月费、模型覆盖、请求窗口、额度刷新和用途限制。比如 OpenCode Go 有低月费和多模型覆盖，但仍然有 5 小时、每周、每月的额度窗口。
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
        <table className="min-w-[1260px] w-full border-collapse text-left text-sm">
          <thead className="bg-[#f2f4f4] text-[0.68rem] font-semibold text-[#5a6061]">
            <tr>
              <TableHead>标准模型</TableHead>
              <TableHead>官方/参考入口</TableHead>
              <TableHead>渠道覆盖</TableHead>
              <TableHead>套餐</TableHead>
              <TableHead>兼容性</TableHead>
              <TableHead>适合工具</TableHead>
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
                        <span className="block truncate font-semibold text-[#202829] group-hover:text-[#2f7a4b]">{summary.displayName}</span>
                        <span className="mt-1 block truncate text-xs text-[#5a6061]">
                          {summary.model.modelId}
                          {summary.model.contextWindow ? ` · ${summary.model.contextWindow}` : ""}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="max-w-[270px] px-5 py-4">
                    <span className="block truncate font-semibold text-[#202829]">{primaryOffer?.provider.name || summary.model.sourceLabel}</span>
                    <span className="mt-1 block truncate text-xs text-[#5a6061]">
                      {primaryOffer ? `${formatApiPrice(primaryOffer.inputPrice, currency)} · ${primaryOffer.billingMode}` : "暂无价格，保留来源"}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      <CountBadge tone="neutral">渠道 {summary.providerCount}</CountBadge>
                      <CountBadge tone="good">官方 {summary.officialCount}</CountBadge>
                      <CountBadge tone="warn">免费 {summary.freeCount}</CountBadge>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#2d3435]">{summary.planCount}</td>
                  <td className="max-w-[260px] px-5 py-4">
                    <InlineChips values={summary.compatibility} />
                  </td>
                  <td className="max-w-[240px] px-5 py-4 text-sm leading-6 text-[#5a6061]">{summary.suitableTools.join("、")}</td>
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

function ApiProviderSummaryTable({ summaries, currency }: { summaries: ApiProviderSummary[]; currency: ApiCurrency }) {
  return (
    <section className="overflow-hidden rounded-lg bg-white shadow-[0_20px_55px_rgba(45,52,53,0.045)] ring-1 ring-[#adb3b4]/15">
      <div className="overflow-x-auto">
        <table className="min-w-[1260px] w-full border-collapse text-left text-sm">
          <thead className="bg-[#f2f4f4] text-[0.68rem] font-semibold text-[#5a6061]">
            <tr>
              <TableHead>渠道/套餐</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>模型覆盖</TableHead>
              <TableHead>套餐/额度</TableHead>
              <TableHead>兼容性</TableHead>
              <TableHead>限制</TableHead>
              <TableHead>最近更新</TableHead>
              <TableHead>操作</TableHead>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#edf0f1]">
            {summaries.map((summary) => {
              const href = `/api-models/providers/${summary.id}`;
              const provider = summary.provider;

              return (
                <tr key={summary.id} className="align-top transition hover:bg-[#f7f9f9]">
                  <td className="max-w-[330px] px-5 py-4">
                    <Link href={href} className="group flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f2f4f4] text-[#5a6061]">
                        <Database size={18} />
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-[#202829] group-hover:text-[#2f7a4b]">{provider.name}</span>
                        <span className="mt-1 block truncate text-xs text-[#5a6061]">{provider.description}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-4">
                    <TypeChip type={provider.type} />
                  </td>
                  <td className="max-w-[260px] px-5 py-4">
                    <p className="font-semibold text-[#202829]">{summary.modelCount || summary.offerCount} 个模型</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#5a6061]">{summary.modelNames.join("、") || summary.primaryPlan?.coverageLabel || "动态模型列表"}</p>
                  </td>
                  <td className="max-w-[270px] px-5 py-4">
                    {summary.primaryPlan ? (
                      <>
                        <p className="font-semibold leading-6 text-[#202829]">{formatPlanPrice(summary.primaryPlan, currency)}</p>
                        <p className="mt-1 text-xs leading-5 text-[#5a6061]">{summary.primaryPlan.quotaSummary}</p>
                      </>
                    ) : (
                      <p className="text-sm leading-6 text-[#5a6061]">{provider.billingMode}</p>
                    )}
                  </td>
                  <td className="max-w-[260px] px-5 py-4">
                    <InlineChips values={summary.compatibility} />
                  </td>
                  <td className="max-w-[270px] px-5 py-4 text-sm leading-6 text-[#5a6061]">{provider.limitations}</td>
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

function ApiOfferTable({ rows, currency }: { rows: ApiModelOfferWithRelations[]; currency: ApiCurrency }) {
  return (
    <section className="overflow-hidden rounded-lg bg-white shadow-[0_20px_55px_rgba(45,52,53,0.045)] ring-1 ring-[#adb3b4]/15">
      <div className="overflow-x-auto">
        <table className="min-w-[1640px] w-full border-collapse text-left text-sm">
          <thead className="bg-[#f2f4f4] text-[0.68rem] font-semibold text-[#5a6061]">
            <tr>
              <TableHead>模型</TableHead>
              <TableHead>渠道</TableHead>
              <TableHead>类型</TableHead>
              <TableHead>输入价</TableHead>
              <TableHead>输出价</TableHead>
              <TableHead>缓存读/写</TableHead>
              <TableHead>免费/套餐额度</TableHead>
              <TableHead>限制</TableHead>
              <TableHead>兼容性</TableHead>
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

function ApiOfferRow({ offer, currency }: { offer: ApiModelOfferWithRelations; currency: ApiCurrency }) {
  const sourceHref = offer.pricingUrl ?? offer.provider.pricingUrl ?? offer.provider.url;

  return (
    <tr className="align-top transition hover:bg-[#f7f9f9]">
      <td className="px-5 py-4">
        <Link href={`/api-models/${offer.modelId}`} className="block max-w-[230px] font-semibold leading-6 text-[#202829] hover:text-[#2f7a4b]">
          {offer.model.displayName}
        </Link>
        <p className="mt-1 text-xs font-medium text-[#5a6061]">{offer.routeModelId ?? offer.model.modelId}</p>
      </td>
      <td className="px-5 py-4">
        <Link
          href={`/api-models/providers/${offer.providerId}`}
          className="inline-flex max-w-[210px] items-center gap-1.5 font-semibold leading-6 text-[#202829] transition hover:text-[#2f7a4b]"
        >
          {offer.provider.name}
          <ChevronRight size={13} className="shrink-0" />
        </Link>
        <p className="mt-1 text-xs text-[#5a6061]">{offer.billingMode}</p>
      </td>
      <td className="px-5 py-4">
        <TypeChip type={offer.provider.type} />
      </td>
      <td className="px-5 py-4">
        <PriceText value={formatApiPrice(offer.inputPrice, currency)} />
      </td>
      <td className="px-5 py-4">
        <PriceText value={formatApiPrice(offer.outputPrice, currency)} />
      </td>
      <td className="px-5 py-4">
        <p className="max-w-[210px] text-sm font-semibold leading-6 text-[#202829]">
          {offer.cacheReadPrice ? formatApiPrice(offer.cacheReadPrice, currency) : "待确认"}
        </p>
        {offer.cacheWritePrice ? <p className="mt-1 max-w-[210px] text-xs leading-5 text-[#5a6061]">写入：{formatApiPrice(offer.cacheWritePrice, currency)}</p> : null}
      </td>
      <td className="px-5 py-4">
        <p className="max-w-[250px] text-sm leading-6 text-[#2d3435]">{offer.freeOrPlan}</p>
        {offer.notes ? <p className="mt-1 max-w-[250px] text-xs leading-5 text-[#5a6061]">{offer.notes}</p> : null}
      </td>
      <td className="px-5 py-4">
        <p className="max-w-[270px] text-sm leading-6 text-[#5a6061]">{offer.limitations}</p>
      </td>
      <td className="px-5 py-4">
        <InlineChips values={offer.compatibility} maxWidthClassName="max-w-[250px]" />
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
    subscription: "bg-[#e4e9ea] text-[#2d3435]",
    router: "bg-[#eef3f8] text-[#47657a]",
    free: "bg-[#fff7e8] text-[#7a541b]",
  };

  return (
    <span className={`inline-flex h-8 items-center whitespace-nowrap rounded-full px-3 text-xs font-semibold ${classNameByType[type]}`}>
      {apiProviderTypeLabels[type]}
    </span>
  );
}

function CountBadge({ children, tone }: { children: ReactNode; tone: "good" | "warn" | "neutral" }) {
  const className = {
    good: "bg-[#e8f3ec] text-[#2f7a4b]",
    warn: "bg-[#fff7e8] text-[#7a541b]",
    neutral: "bg-[#e4e9ea] text-[#2d3435]",
  }[tone];

  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}

function InlineChips({ values, maxWidthClassName = "max-w-[260px]" }: { values: string[]; maxWidthClassName?: string }) {
  if (!values.length) return <span className="text-xs text-[#5a6061]">待确认</span>;

  return (
    <div className={`flex flex-wrap gap-1.5 ${maxWidthClassName}`}>
      {values.map((item) => (
        <span key={item} className="rounded-full bg-[#edf0f1] px-2.5 py-1 text-[0.68rem] font-semibold text-[#5a6061]">
          {item}
        </span>
      ))}
    </div>
  );
}

function PriceText({ value }: { value: string }) {
  return <p className="max-w-[190px] font-semibold leading-6 text-[#202829]">{value}</p>;
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg bg-white px-6 py-16 text-center shadow-[0_20px_60px_rgba(45,52,53,0.05)] ring-1 ring-[#adb3b4]/15">
      <p className="font-serif text-2xl font-semibold text-[#202829]">{text}</p>
      <p className="mt-3 text-sm text-[#5a6061]">可以切换模型家族，或清空搜索条件后再查看。</p>
    </div>
  );
}

function TableHead({ children }: { children: ReactNode }) {
  return <th className="px-5 py-3 font-semibold">{children}</th>;
}

function buildTitle(family: ApiModelScope, scopeMode: ScopeMode) {
  const label = family === "all" ? "全模型" : getApiModelFamilyOptions().find((option) => option.id === family)?.label ?? family;
  return `${label} ${scopeMode === "models" ? "按模型查" : "按渠道查"}`;
}

function matchesModelSummary(summary: ApiModelSummary, query: string) {
  if (!query) return true;

  return [
    summary.displayName,
    summary.family,
    summary.model.modelId,
    summary.model.description,
    summary.model.contextWindow,
    ...summary.providerNames,
    ...summary.compatibility,
    ...summary.suitableTools,
    summary.primaryOffer?.provider.name,
    summary.primaryOffer?.freeOrPlan,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function matchesModelSummaryType(summary: ApiModelSummary, typeFilter: TypeFilter) {
  if (typeFilter === "all") return true;

  return {
    official: summary.officialCount,
    subscription: summary.subscriptionCount,
    router: summary.routerCount,
    free: summary.freeCount,
  }[typeFilter] > 0;
}

function matchesModelSummaryCompatibility(summary: ApiModelSummary, compatibilityFilter: CompatibilityFilter) {
  if (compatibilityFilter === "全部") return true;
  return summary.compatibility.includes(compatibilityFilter);
}

function matchesProviderSummary(summary: ApiProviderSummary, query: string) {
  if (!query) return true;

  return [
    summary.provider.name,
    summary.provider.description,
    summary.provider.limitations,
    summary.primaryPlan?.name,
    summary.primaryPlan?.quotaSummary,
    summary.primaryPlan?.limitations,
    ...summary.families,
    ...summary.modelNames,
    ...summary.compatibility,
    ...summary.suitableTools,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function matchesOffer(offer: ApiModelOfferWithRelations, query: string) {
  if (!query) return true;

  return [
    offer.model.displayName,
    offer.model.modelId,
    offer.model.family,
    offer.provider.name,
    offer.provider.description,
    offer.routeModelId,
    offer.billingMode,
    offer.freeOrPlan,
    offer.limitations,
    ...offer.compatibility,
    ...offer.suitableTools,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .includes(query);
}
