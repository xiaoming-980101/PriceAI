import type { Metadata } from "next";
import { ArrowLeft, Clock3, ExternalLink, Terminal } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import {
  apiModelFxSummary,
  apiProviderTypeLabels,
  formatApiPrice,
  getApiModelOffers,
  getApiModelSummary,
  type ApiCurrency,
  type ApiModelOffer,
  type ApiProviderType,
} from "@/lib/api-models";

export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const summary = getApiModelSummary(id);

  if (!summary) {
    return {
      title: "API 模型详情",
    };
  }

  return {
    title: `${summary.displayName} API 渠道`,
    description: `查看 ${summary.displayName} 的官方 API、模型路由、免费测试和订阅套餐入口。`,
    alternates: {
      canonical: `/api-models/${id}`,
    },
    openGraph: {
      title: `${summary.displayName} API 渠道`,
      description: `对比 ${summary.displayName} 的公开 API 渠道和限制。`,
      url: `https://priceai.cc/api-models/${id}`,
    },
  };
}

export default async function ApiModelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const summary = getApiModelSummary(id);
  const rows = getApiModelOffers(id);
  const currency: ApiCurrency = "CNY";

  if (!summary) notFound();

  return (
    <main className="min-h-screen bg-[#f9f9f9] text-[#2d3435]">
      <div className="sticky top-0 z-40 border-b border-[#dfe4e5] bg-[#f9f9f9]/95 shadow-[0_10px_24px_rgba(45,52,53,0.035)] backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1300px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
          <Link href="/api-models" className="inline-flex h-10 shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-2 text-sm font-semibold text-[#5a6061] hover:bg-[#edf0f1] hover:text-[#2d3435] sm:px-3">
            <ArrowLeft size={17} />
            返回 API 模型
          </Link>
        </div>
        <SiteHeader maxWidthClassName="max-w-[1300px]" logoCompact />
      </div>

      <div className="mx-auto max-w-[1300px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="rounded-lg bg-[#f2f4f4] p-6 shadow-[0_20px_60px_rgba(45,52,53,0.04)] lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(420px,520px)] lg:items-end">
            <div className="min-w-0 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>
                  <Terminal size={15} />
                  {summary.modelFamily}
                </Badge>
                {summary.compatibility.slice(0, 3).map((item) => (
                  <Badge key={item}>{item}</Badge>
                ))}
              </div>
              <h1 className="mt-5 font-serif text-3xl font-bold tracking-normal text-[#202829] sm:text-4xl md:text-5xl">
                {summary.displayName}
              </h1>
              <p className="mt-4 text-sm leading-7 text-[#5a6061]">
                这里展示同一个标准模型族下的官方 API、公开模型路由、免费测试入口和订阅型 API 套餐。价格以来源页面为准，免费入口需要同时关注限流、排队、模型上下线和用途边界。
              </p>
            </div>

            <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="渠道报价" value={`${summary.offerCount}`} />
              <Metric label="来源渠道" value={`${summary.providerCount}`} />
              <Metric label="官方 API" value={`${summary.officialCount}`} />
              <Metric label="免费/测试" value={`${summary.freeCount}`} />
            </div>
          </div>
        </section>

        <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-serif text-3xl font-semibold tracking-normal text-[#202829]">API 渠道报价表</h2>
            <p className="mt-2 text-sm text-[#5a6061]">
              {rows.length} 条公开渠道信息 · 人民币展示，汇率日期 {apiModelFxSummary.date}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 whitespace-nowrap text-sm text-[#5a6061]">
            <Clock3 size={16} />
            最近记录 {summary.latestUpdatedAt}
          </div>
        </div>

        <section className="mt-5 overflow-hidden rounded-lg bg-white shadow-[0_20px_55px_rgba(45,52,53,0.045)] ring-1 ring-[#adb3b4]/15">
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

        <p className="mt-8 text-xs leading-6 text-[#5a6061]">
          免责声明：PriceAI 只整理公开文档和公开页面中的 API 渠道信息，不售卖 API，不承诺可用性，不替任何渠道提供 SLA。免费和低价渠道可能存在限流、排队、模型下线、地区限制或条款变化。
        </p>
      </div>
    </main>
  );
}

function ApiOfferRow({ offer, currency }: { offer: ApiModelOffer; currency: ApiCurrency }) {
  const sourceHref = offer.pricingUrl ?? offer.providerUrl;

  return (
    <tr className="align-top transition hover:bg-[#f7f9f9]">
      <td className="px-5 py-4">
        <p className="max-w-[220px] font-semibold leading-6 text-[#202829]">{offer.modelName}</p>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-lg bg-white px-4 py-3 shadow-[0_12px_35px_rgba(45,52,53,0.035)] ring-1 ring-[#adb3b4]/15">
      <p className="text-[0.68rem] font-medium uppercase tracking-[0.14em] text-[#5a6061]">{label}</p>
      <p className="mt-1 truncate text-xl font-bold text-[#202829]">{value}</p>
    </div>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#5a6061] ring-1 ring-[#adb3b4]/15">
      {children}
    </span>
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

function PriceText({ value }: { value: string }) {
  return <p className="max-w-[190px] font-semibold leading-6 text-[#202829]">{value}</p>;
}

function TableHead({ children }: { children: React.ReactNode }) {
  return <th className="px-5 py-3 font-semibold">{children}</th>;
}
