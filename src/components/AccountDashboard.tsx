"use client";

import Link from "next/link";
import { Clock3, ExternalLink, Heart, LogOut, Star, UserRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { useAuth, type UserTargetType } from "@/components/AuthProvider";
import { formatDateMinute } from "@/lib/utils";

type UserRow = {
  target_type: UserTargetType;
  target_id: string;
  snapshot: Record<string, unknown>;
  created_at?: string;
  first_viewed_at?: string;
  last_viewed_at?: string;
  view_count?: number;
};

export function AccountDashboard() {
  const auth = useAuth();
  const [tab, setTab] = useState<"history" | "favorites">("history");
  const [favorites, setFavorites] = useState<UserRow[]>([]);
  const [history, setHistory] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const headers = auth.authHeaders();
    if (!headers) {
      setFavorites([]);
      setHistory([]);
      return;
    }

    let active = true;
    setLoading(true);
    Promise.all([
      fetch("/api/user/favorites", { headers }).then((response) => response.ok ? response.json() : { rows: [] }),
      fetch("/api/user/history", { headers }).then((response) => response.ok ? response.json() : { rows: [] }),
    ]).then(([favoritePayload, historyPayload]) => {
      if (!active) return;
      setFavorites(favoritePayload.rows || []);
      setHistory(historyPayload.rows || []);
    }).finally(() => {
      if (active) setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [auth, auth.session]);

  const rows = tab === "history" ? history : favorites;
  const title = tab === "history" ? "浏览记录" : "收藏";
  const icon = tab === "history" ? <Clock3 size={17} /> : <Star size={17} />;

  return (
    <main className="min-h-screen bg-[#f9f9f9] text-[#2d3435]">
      <SiteHeader />
      <div className="mx-auto max-w-[1120px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <section className="rounded-lg bg-[#f2f4f4] p-5 shadow-[0_20px_60px_rgba(45,52,53,0.04)] lg:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#47657a] ring-1 ring-[#adb3b4]/15">
                <UserRound size={20} />
              </div>
              <h1 className="font-serif text-3xl font-semibold tracking-normal text-[#202829]">我的 PriceAI</h1>
              <p className="mt-2 text-sm text-[#5a6061]">
                {auth.user?.email || "登录后可跨设备查看浏览记录和收藏。"}
              </p>
            </div>
            {auth.user ? (
              <button
                type="button"
                onClick={() => void auth.signOut()}
                className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold text-[#5a6061] ring-1 ring-[#adb3b4]/20 transition hover:bg-[#edf0f1] hover:text-[#202829]"
              >
                <LogOut size={16} />
                退出
              </button>
            ) : null}
          </div>
        </section>

        {!auth.user && !auth.loading ? (
          <section className="mt-6 rounded-lg bg-white p-8 text-center shadow-[0_18px_45px_rgba(45,52,53,0.035)] ring-1 ring-[#adb3b4]/15">
            <p className="font-serif text-2xl font-semibold text-[#202829]">登录后查看账号数据</p>
            <button
              type="button"
              onClick={auth.openAuthModal}
              className="mt-5 inline-flex h-11 items-center justify-center rounded-full bg-[#2d3435] px-5 text-sm font-semibold text-white transition hover:bg-[#202829]"
            >
              登录 / 注册
            </button>
          </section>
        ) : (
          <>
            <div className="mt-6 inline-flex rounded-full bg-[#e4e9ea] p-1 text-sm font-semibold">
              <TabButton active={tab === "history"} onClick={() => setTab("history")} icon={<Clock3 size={16} />} label={`浏览记录 ${history.length}`} />
              <TabButton active={tab === "favorites"} onClick={() => setTab("favorites")} icon={<Heart size={16} />} label={`收藏 ${favorites.length}`} />
            </div>

            <section className="mt-4 rounded-lg bg-white shadow-[0_20px_55px_rgba(45,52,53,0.045)] ring-1 ring-[#adb3b4]/15">
              <div className="flex items-center gap-2 border-b border-[#edf0f1] px-5 py-4 text-sm font-semibold text-[#202829]">
                {icon}
                {title}
              </div>
              {loading ? (
                <div className="px-5 py-10 text-center text-sm text-[#5a6061]">正在加载</div>
              ) : rows.length ? (
                <div className="divide-y divide-[#edf0f1]">
                  {rows.map((row) => (
                    <AccountRow key={`${row.target_type}:${row.target_id}`} row={row} />
                  ))}
                </div>
              ) : (
                <div className="px-5 py-12 text-center">
                  <p className="font-serif text-xl font-semibold text-[#202829]">暂无{title}</p>
                  <Link
                    href="/channels"
                    className="mt-4 inline-flex h-10 items-center justify-center rounded-full bg-[#2d3435] px-4 text-sm font-semibold text-white transition hover:bg-[#202829]"
                  >
                    去看报价
                  </Link>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}

function TabButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex h-9 items-center gap-1.5 rounded-full px-4 transition ${
        active ? "bg-white text-[#202829] shadow-[0_8px_24px_rgba(45,52,53,0.08)]" : "text-[#5a6061] hover:text-[#202829]"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function AccountRow({ row }: { row: UserRow }) {
  const snapshot = row.snapshot || {};
  const title = stringValue(snapshot.displayName) || stringValue(snapshot.sourceTitle) || row.target_id;
  const subtitle = [
    stringValue(snapshot.platform),
    stringValue(snapshot.productType),
    stringValue(snapshot.sourceName),
    stringValue(snapshot.sourceStoreName),
  ].filter(Boolean).slice(0, 2).join(" · ");
  const href = accountRowHref(row);
  const external = row.target_type === "offer" && href.startsWith("http");
  const timestamp = row.last_viewed_at || row.created_at || row.first_viewed_at || "";
  const meta = useMemo(() => {
    const parts = [row.target_type === "product" ? "商品" : "报价"];
    if (row.view_count) parts.push(`${row.view_count} 次`);
    if (timestamp) parts.push(formatDateMinute(timestamp));
    return parts.join(" · ");
  }, [row.target_type, row.view_count, timestamp]);

  return (
    <Link
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="flex items-center justify-between gap-4 px-5 py-4 transition hover:bg-[#f7f9f9]"
    >
      <span className="min-w-0">
        <span className="block truncate font-semibold text-[#202829]">{title}</span>
        <span className="mt-1 block truncate text-sm text-[#5a6061]">{subtitle || meta}</span>
        {subtitle ? <span className="mt-1 block text-xs text-[#7a8587]">{meta}</span> : null}
      </span>
      <ExternalLink size={16} className="shrink-0 text-[#8a9293]" />
    </Link>
  );
}

function accountRowHref(row: UserRow): string {
  const snapshot = row.snapshot || {};
  if (row.target_type === "product") {
    const slug = stringValue(snapshot.slug) || row.target_id;
    return `/products/${encodeURIComponent(slug)}`;
  }

  return stringValue(snapshot.url) || `/channels?q=${encodeURIComponent(stringValue(snapshot.sourceTitle) || row.target_id)}`;
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}
