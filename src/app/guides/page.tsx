import type { Metadata } from "next";
import { ArrowRight, BookOpenText } from "lucide-react";
import Link from "next/link";
import { GuideDocsLayout } from "@/components/GuideDocsLayout";
import { GuidesDirectory } from "@/components/GuidesDirectory";
import { JsonLd } from "@/components/JsonLd";
import {
  getGuideCategory,
  getGuidePathStepEntry,
  guideEntries,
  guideReadingPaths,
} from "@/lib/guides";

export const revalidate = 86400;

const pageUrl = "https://priceai.cc/guides";

export const metadata: Metadata = {
  title: "AI 订阅指南目录：价格、官方订阅、支付方式和渠道判断",
  description:
    "PriceAI 指南总目录，集中收录 AI 订阅价格分层、官方自助订阅、Apple ID、Google Play、支付卡、礼品卡、地区价风险和卡网渠道判断。",
  alternates: {
    canonical: "/guides",
  },
  openGraph: {
    title: "AI 订阅指南目录：价格、官方订阅、支付方式和渠道判断 | PriceAI",
    description: "集中检索 PriceAI 的所有 AI 订阅指南文档，按主题、标签和关键词快速找到需要的内容。",
    url: pageUrl,
  },
};

export default function GuidesIndexPage() {
  return (
    <>
      <JsonLd data={buildGuidesJsonLd()} />
      <GuideDocsLayout currentHref="/guides">
        <article className="pb-14 text-[#2d3435]">
          <section className="border-b border-[#dfe4e5] pb-8">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#2f7a4b]">
              <BookOpenText size={15} />
              指南总目录
            </div>
            <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight tracking-normal text-[#202829] sm:text-5xl">
              AI 订阅指南
            </h1>
            <p className="mt-5 max-w-[72ch] text-base leading-8 text-[#5a6061]">
              从价格差异、官方订阅、支付方式到第三方渠道判断，这里集中收录 PriceAI 的所有指南。你可以先按阅读路径进入，也可以直接在下方检索全部文章。
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="#reading-paths"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#2d3435] px-4 text-sm font-semibold text-[#f8f8f8] transition hover:bg-[#202829]"
              >
                查看阅读路径
                <ArrowRight size={15} />
              </a>
              <a
                href="#all-guides"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#edf0f1] px-4 text-sm font-semibold text-[#2d3435] transition hover:bg-[#dde4e5]"
              >
                浏览全部目录
                <ArrowRight size={15} />
              </a>
              <Link
                href="/?stock=available"
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md text-sm font-semibold text-[#2d3435] transition hover:bg-[#edf0f1]"
              >
                回到比价工具
                <ArrowRight size={15} />
              </Link>
            </div>
          </section>

          <section id="reading-paths" className="mt-10 border-b border-[#dfe4e5] pb-10">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-semibold text-[#7a8182]">按问题阅读</p>
                <h2 className="mt-3 font-serif text-3xl font-semibold tracking-normal text-[#202829]">推荐阅读路径</h2>
                <p className="mt-2 max-w-[72ch] text-sm leading-7 text-[#5a6061]">
                  如果你还不确定该读哪篇，可以先按当前问题走一条短路径。
                </p>
              </div>
              <a
                href="#all-guides"
                className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-[#edf0f1] px-4 text-sm font-semibold text-[#2d3435] transition hover:bg-[#dde4e5]"
              >
                直接看全部目录
                <ArrowRight size={15} />
              </a>
            </div>

            <div className="mt-6 divide-y divide-[#dfe4e5] border-y border-[#dfe4e5]">
              {guideReadingPaths.map((path) => (
                <div key={path.id} className="grid gap-4 py-5 lg:grid-cols-[220px_minmax(0,1fr)]">
                  <div>
                    <p className="text-xs font-semibold text-[#2f7a4b]">{path.audience}</p>
                    <h3 className="mt-2 font-semibold text-[#202829]">{path.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#5a6061]">{path.description}</p>
                  </div>
                  <ol className="space-y-2">
                    {path.steps.map((step, index) => {
                      const guide = getGuidePathStepEntry(step);

                      return (
                        <li key={step.href}>
                          <Link
                            href={step.href}
                            className="group grid gap-3 rounded-md px-2 py-2 transition hover:bg-[#edf0f1] sm:grid-cols-[28px_minmax(0,1fr)]"
                          >
                            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#edf0f1] text-xs font-bold text-[#5a6061] group-hover:bg-[#dde4e5]">
                              {index + 1}
                            </span>
                            <span className="min-w-0">
                              <span className="block text-sm font-semibold text-[#202829]">{guide?.title ?? step.label}</span>
                              <span className="mt-1 block text-xs leading-5 text-[#5a6061]">{step.description}</span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              ))}
            </div>
          </section>

          <GuidesDirectory />
        </article>
      </GuideDocsLayout>
    </>
  );
}

function buildGuidesJsonLd() {
  return [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: "AI 订阅指南目录",
      inLanguage: "zh-CN",
      url: pageUrl,
      description: "PriceAI 指南总目录，集中收录 AI 订阅价格、官方订阅、支付方式和渠道判断相关内容。",
      isPartOf: {
        "@type": "WebSite",
        name: "PriceAI",
        url: "https://priceai.cc",
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "PriceAI", item: "https://priceai.cc" },
        { "@type": "ListItem", position: 2, name: "指南目录", item: pageUrl },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "PriceAI 指南列表",
      itemListElement: guideEntries.map((guide, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: guide.title,
        description: `${getGuideCategory(guide.categoryId)?.label ?? "指南"}：${guide.description}`,
        url: `https://priceai.cc${guide.href}`,
      })),
    },
  ];
}
