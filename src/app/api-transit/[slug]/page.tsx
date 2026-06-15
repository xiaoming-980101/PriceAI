import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getStations, getStationBySlug, ALLOWED_RETURN_KEYS } from "@/lib/api-transit";
import { sanitizeListReturnHref } from "@/lib/list-return";
import { SiteHeader } from "@/components/SiteHeader";
import TransitStationDetail from "@/components/TransitStationDetail";
import { JsonLd } from "@/components/JsonLd";

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams() {
  const stations = await getStations();
  return stations.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const station = await getStationBySlug(slug);
  if (!station) return { title: "未找到" };

  return {
    title: `${station.name} — API 中转站详情`,
    description: station.summary.slice(0, 160),
    alternates: { canonical: `/api-transit/${slug}` },
    openGraph: {
      title: `${station.name} — API 中转站详情 | PriceAI`,
      description: station.summary.slice(0, 160),
    },
  };
}

export default async function ApiTransitDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ back?: string }>;
}) {
  const { slug } = await params;
  const { back } = await searchParams;
  const station = await getStationBySlug(slug);

  if (!station) notFound();

  const backHref = sanitizeListReturnHref(
    "/api-transit",
    back,
    ALLOWED_RETURN_KEYS as unknown as readonly string[]
  );

  return (
    <div className="min-h-screen bg-[#f9f9f9] text-[#2d3435]">
      <JsonLd
        data={[
          {
            "@context": "https://schema.org",
            "@type": "WebPage",
            name: `${station.name} — API 中转站详情`,
            description: station.summary.slice(0, 160),
            url: `https://priceai.cc/api-transit/${slug}`,
            isPartOf: {
              "@type": "WebSite",
              name: "PriceAI",
              url: "https://priceai.cc",
            },
          },
        ]}
      />

      <div className="sticky top-0 z-40 border-b border-[#dfe4e5] bg-[#f9f9f9]/95 backdrop-blur-[18px]">
        <SiteHeader activeSection="transit" />
      </div>

      <main className="mx-auto max-w-[1500px] px-5 py-7 pb-20">
        <TransitStationDetail station={station} backHref={backHref} />
      </main>
    </div>
  );
}
