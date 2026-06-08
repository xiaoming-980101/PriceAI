import type { ReactNode } from "react";
import { ArrowRight, BookOpenText } from "lucide-react";
import Link from "next/link";
import { GuidePageToc } from "@/components/GuidePageToc";
import { SiteHeader } from "@/components/SiteHeader";
import { getGuideCategory, guideCategories, guideEntries } from "@/lib/guides";

export function GuideDocsLayout({
  currentHref = "/guides",
  children,
}: {
  currentHref?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-[#f9f9f9] text-[#2d3435]">
      <div className="sticky top-0 z-40 bg-[#f9f9f9]/95 shadow-[0_10px_24px_rgba(45,52,53,0.035)] backdrop-blur-xl">
        <SiteHeader activeSection="guides" />
      </div>

      <div className="mx-auto max-w-[1500px] px-5 pb-14 pt-4 sm:px-8 lg:pt-6">
        <div className="mb-5 lg:hidden">
          <MobileGuideNav currentHref={currentHref} />
        </div>

        <div className="grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,940px)_240px]">
          <aside className="hidden lg:block">
            <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1">
              <GuideSidebar currentHref={currentHref} />
            </div>
          </aside>

          <div className="min-w-0" data-guide-content>
            {children}
          </div>

          <aside className="hidden xl:block">
            <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto">
              <GuidePageToc />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function GuideSidebar({ currentHref }: { currentHref: string }) {
  return (
    <nav aria-label="指南目录" className="rounded-lg bg-white p-4 shadow-[0_16px_42px_rgba(45,52,53,0.035)] ring-1 ring-[#adb3b4]/15">
      <Link
        href="/guides"
        className={`flex items-center gap-2 rounded-lg px-3 py-3 text-sm font-bold transition ${
          currentHref === "/guides" ? "bg-[#2d3435] text-[#f8f8f8]" : "bg-[#f2f4f4] text-[#202829] hover:bg-[#dde4e5]"
        }`}
        aria-current={currentHref === "/guides" ? "page" : undefined}
      >
        <BookOpenText size={16} />
        指南总览
      </Link>

      <div className="mt-5 space-y-5">
        {guideCategories.map((category) => {
          const entries = guideEntries.filter((guide) => guide.categoryId === category.id);

          return (
            <section key={category.id}>
              <div className="px-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5a6061]">{category.label}</p>
                <p className="mt-1 text-xs leading-5 text-[#7a8182]">{category.description}</p>
              </div>
              <div className="mt-2 space-y-1">
                {entries.map((guide) => {
                  const active = guide.href === currentHref;

                  return (
                    <Link
                      key={guide.href}
                      href={guide.href}
                      className={`block rounded-lg px-3 py-2.5 text-sm leading-5 transition ${
                        active
                          ? "bg-[#e8f3ec] font-semibold text-[#2f7a4b] ring-1 ring-[#45bf78]/20"
                          : "text-[#5a6061] hover:bg-[#f2f4f4] hover:text-[#202829]"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      {guide.title}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </nav>
  );
}

function MobileGuideNav({ currentHref }: { currentHref: string }) {
  const currentGuide = guideEntries.find((guide) => guide.href === currentHref);
  const currentCategory = currentGuide ? getGuideCategory(currentGuide.categoryId) : undefined;

  return (
    <nav aria-label="移动端指南目录" className="rounded-lg bg-white p-3 shadow-[0_16px_42px_rgba(45,52,53,0.035)] ring-1 ring-[#adb3b4]/15">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5a6061]">指南</p>
          <p className="mt-1 truncate text-sm font-bold text-[#202829]">
            {currentGuide?.title ?? currentCategory?.label ?? "指南总览"}
          </p>
        </div>
        <Link href="/guides" className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-[#f2f4f4] px-3 text-sm font-semibold text-[#2d3435]">
          总览
          <ArrowRight size={14} />
        </Link>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {guideEntries.map((guide) => {
          const active = guide.href === currentHref;

          return (
            <Link
              key={guide.href}
              href={guide.href}
              className={`inline-flex h-9 shrink-0 items-center rounded-full px-3 text-sm font-semibold transition ${
                active ? "bg-[#2d3435] text-[#f8f8f8]" : "bg-[#f2f4f4] text-[#5a6061] hover:bg-[#dde4e5] hover:text-[#202829]"
              }`}
              aria-current={active ? "page" : undefined}
            >
              {guide.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
