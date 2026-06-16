import type { Metadata } from "next";
import { ArrowRight, BadgeCheck, Clock3, FileWarning, KeyRound, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { JsonLd } from "@/components/JsonLd";
import { SiteHeader } from "@/components/SiteHeader";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "中转 API",
  description:
    "PriceAI 中转 API 模块入口，后续用于整理 API 中转站、模型中转、倍率、额度充值、可用性和商业关系披露。",
  alternates: {
    canonical: "/api-transit",
  },
  openGraph: {
    title: "PriceAI 中转 API",
    description: "中转 API 模块正在并入主线，后续将比较价格倍率、可用性、披露和适用场景。",
    url: "https://priceai.cc/api-transit",
  },
};

const roadmapItems = [
  {
    title: "价格与倍率",
    description: "比较中转 API 的倍率、充值门槛、计费方式和可核验价格来源。",
    icon: KeyRound,
  },
  {
    title: "可用性与风险",
    description: "整理稳定性、限制、服务边界、模型可用范围和用户需要自行核验的信息。",
    icon: ShieldCheck,
  },
  {
    title: "商业关系披露",
    description: "入驻、赞助、返佣和广告关系必须明确标识，不伪装成自然推荐。",
    icon: BadgeCheck,
  },
];

export default function ApiTransitPage() {
  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#2d3435]">
      <JsonLd data={buildApiTransitJsonLd()} />
      <div className="sticky top-0 z-40 bg-[#f9f9f9]/95 shadow-[0_10px_24px_rgba(45,52,53,0.035)] backdrop-blur-xl">
        <SiteHeader activeSection="transit" />
      </div>

      <main className="mx-auto max-w-[1120px] px-5 py-10 sm:px-8 md:py-14">
        <section className="rounded-lg bg-white p-6 shadow-[0_20px_55px_rgba(45,52,53,0.045)] ring-1 ring-[#adb3b4]/15 md:p-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-[#fff7e8] px-3 py-1.5 text-xs font-semibold text-[#7a541b]">
            <Clock3 size={14} />
            模块正在接入
          </div>
          <h1 className="mt-5 font-serif text-3xl font-semibold leading-tight tracking-normal text-[#202829] md:text-5xl">
            中转 API 模块已预留入口。
          </h1>
          <p className="mt-5 max-w-[76ch] text-sm leading-7 text-[#5a6061] md:text-base md:leading-8">
            PriceAI 已将中转 API 作为主模块规划。当前分支先提供正式入口，等中转 API 主分支合并后，这里会承接中转站列表、倍率、可用性、风险边界和商业关系披露。
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/api-models"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#2d3435] px-5 text-sm font-semibold text-[#f8f8f8] transition hover:bg-[#202829]"
            >
              先看官方 API
              <ArrowRight size={16} />
            </Link>
            <Link
              href="/channels"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[#dde4e5] px-5 text-sm font-semibold text-[#2d3435] transition hover:bg-[#d3dcdd]"
            >
              返回卡网订阅
            </Link>
          </div>
        </section>

        <section className="mt-6 grid gap-3 md:grid-cols-3">
          {roadmapItems.map((item) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="rounded-lg bg-[#f2f4f4] p-5 ring-1 ring-[#adb3b4]/15">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#2d3435] ring-1 ring-[#adb3b4]/15">
                  <Icon size={18} />
                </span>
                <h2 className="mt-4 text-base font-semibold text-[#202829]">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[#5a6061]">{item.description}</p>
              </div>
            );
          })}
        </section>

        <section className="mt-6 rounded-lg bg-[#fff7e8] p-5 ring-1 ring-[#efdfbd]">
          <div className="flex gap-3">
            <FileWarning size={18} className="mt-0.5 shrink-0 text-[#7a541b]" />
            <p className="text-sm leading-7 text-[#6a4b16]">
              PriceAI 不要求 API Key、账号密码或敏感密钥。后续中转 API 信息只作为购买前参考，最终服务可用性、余额、模型响应和售后规则仍需在原平台核验。
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function buildApiTransitJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "PriceAI 中转 API",
      url: "https://priceai.cc/api-transit",
      inLanguage: "zh-CN",
      description:
        "PriceAI 中转 API 模块用于规划 API 中转站、模型中转、倍率、额度充值、可用性和商业关系披露。",
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "中转 API 模块现在可以使用吗？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "当前入口已预留，完整中转 API 数据和详情会在对应分支合并后接入。",
          },
        },
        {
          "@type": "Question",
          name: "PriceAI 会担保中转 API 服务吗？",
          acceptedAnswer: {
            "@type": "Answer",
            text: "不会。PriceAI 只整理价格、来源、限制和披露信息，不承诺任何中转服务的稳定性、余额或售后。",
          },
        },
      ],
    },
  ];
}
