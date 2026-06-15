"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink, Info, Menu, MessageCircle, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AppLogo } from "@/components/AppLogo";
import { FeedbackDialog, FeedbackLink, GitHubLink, TelegramLink } from "@/components/FeedbackLink";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  { key: "channels", href: "/", label: "卡网渠道", mobileLabel: "卡网", match: (pathname: string) => pathname === "/" || pathname.startsWith("/products") },
  { key: "official", href: "/official-prices", label: "官方订阅", mobileLabel: "订阅", match: (pathname: string) => pathname.startsWith("/official-prices") },
  { key: "api", href: "/api-models", label: "模型 API", mobileLabel: "API", match: (pathname: string) => pathname.startsWith("/api-models") },
  { key: "transit", href: "/api-transit", label: "中转 API", mobileLabel: "中转", match: (pathname: string) => pathname.startsWith("/api-transit") },
  { key: "guides", href: "/guides", label: "指南", mobileLabel: "指南", match: (pathname: string) => pathname.startsWith("/guides") },
];

type SiteHeaderSection = (typeof navItems)[number]["key"];
const githubUrl = "https://github.com/physics-dimension/PriceAI";
const telegramUrl = "https://t.me/priceaicc";

export function SiteHeader({
  maxWidthClassName = "max-w-[1500px]",
  logoCompact = false,
  activeSection,
  compactActionLabelFrom = "never",
}: {
  maxWidthClassName?: string;
  logoCompact?: boolean;
  activeSection?: SiteHeaderSection;
  compactActionLabelFrom?: "sm" | "2xl" | "never";
}) {
  const pathname = usePathname();
  const aboutActive = pathname.startsWith("/about");
  const desktopCenterNavClassName = "hidden items-center rounded-full bg-[#e4e9ea] p-1 text-sm font-semibold text-[#5a6061] min-[720px]:flex";
  const aboutButtonSizeClassName =
    compactActionLabelFrom === "never"
      ? "h-10 w-10 gap-0 px-0"
      : compactActionLabelFrom === "2xl"
      ? "h-9 w-9 gap-0 px-0 2xl:h-10 2xl:w-auto 2xl:gap-2 2xl:px-3.5"
      : "h-9 w-9 gap-0 px-0 sm:h-10 sm:w-auto sm:gap-2 sm:px-3.5";
  const aboutLabelClassName =
    compactActionLabelFrom === "never" ? "hidden" : compactActionLabelFrom === "2xl" ? "hidden 2xl:inline" : "hidden sm:inline";
  const actionGroupGapClassName =
    compactActionLabelFrom === "never" ? "gap-1.5" : compactActionLabelFrom === "2xl" ? "gap-1.5 2xl:gap-3" : "gap-1.5 sm:gap-3";
  const activeNavItem = navItems.find((item) => (activeSection ? item.key === activeSection : item.match(pathname))) || navItems[0];
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <header>
      <div className={`relative mx-auto grid ${maxWidthClassName} grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 sm:gap-4 sm:px-8 min-[720px]:grid-cols-[auto_minmax(0,1fr)_auto]`}>
        <div className="relative z-10 flex min-w-0 items-center gap-2 justify-self-start">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[#2d3435] shadow-[0_10px_30px_rgba(45,52,53,0.06)] ring-1 ring-[#adb3b4]/25 transition hover:bg-[#f5f7f7] hover:text-[#202829] min-[720px]:hidden"
            aria-label="打开模块导航"
            aria-haspopup="dialog"
          >
            <Menu size={18} />
          </button>
          <Link href="/" aria-label="PriceAI 首页" className="min-w-0 shrink-0">
            <AppLogo compact={logoCompact} />
          </Link>
        </div>

        <nav className={`${desktopCenterNavClassName} max-w-full justify-self-center overflow-x-auto`}>
          {navItems.map((item) => {
            const active = activeSection ? item.key === activeSection : item.match(pathname);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex h-9 items-center whitespace-nowrap rounded-full px-4 transition ${
                  active
                    ? "bg-[#2d3435] text-[#f8f8f8] shadow-[0_10px_30px_rgba(45,52,53,0.10)]"
                    : "hover:bg-[#edf0f1] hover:text-[#202829]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="relative z-10 flex min-w-0 items-center justify-end justify-self-end gap-1.5 min-[720px]:hidden">
          <ThemeToggle compact labelFrom="never" />
        </div>

        <div className={`relative z-10 hidden min-w-0 items-center justify-end justify-self-end min-[720px]:flex ${actionGroupGapClassName}`}>
          <Link
            href="/about"
            className={`inline-flex shrink-0 items-center justify-center rounded-full text-sm font-semibold shadow-[0_10px_30px_rgba(45,52,53,0.06)] ring-1 ring-[#adb3b4]/25 transition hover:-translate-y-0.5 ${aboutButtonSizeClassName} ${
              aboutActive
                ? "bg-[#2d3435] text-[#f8f8f8]"
                : "bg-white text-[#2d3435] hover:bg-[#f5f7f7] hover:text-[#202829]"
            }`}
            aria-current={aboutActive ? "page" : undefined}
          >
            <Info size={16} />
            <span className={aboutLabelClassName}>关于</span>
          </Link>
          <ThemeToggle compact labelFrom={compactActionLabelFrom} />
          <FeedbackLink compact labelFrom={compactActionLabelFrom} />
          <TelegramLink compact labelFrom={compactActionLabelFrom} />
          <GitHubLink compact labelFrom={compactActionLabelFrom} />
        </div>
      </div>

      {mobileDrawerOpen ? (
        <MobileModuleDrawer
          activeKey={activeNavItem.key}
          aboutActive={aboutActive}
          onClose={() => setMobileDrawerOpen(false)}
          onFeedback={() => {
            setMobileDrawerOpen(false);
            setFeedbackOpen(true);
          }}
        />
      ) : null}
      {feedbackOpen ? <FeedbackDialog onClose={() => setFeedbackOpen(false)} /> : null}
    </header>
  );
}

function MobileModuleDrawer({
  activeKey,
  aboutActive,
  onClose,
  onFeedback,
}: {
  activeKey: SiteHeaderSection;
  aboutActive: boolean;
  onClose: () => void;
  onFeedback: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[90] bg-[var(--color-overlay)] backdrop-blur-sm min-[720px]:hidden"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className="flex h-full w-[min(80vw,312px)] flex-col bg-[var(--color-panel)] px-3 py-4 shadow-[var(--shadow-floating)] ring-1 ring-[var(--color-border-soft)]"
        role="dialog"
        aria-modal="true"
        aria-label="模块导航"
      >
        <div className="mb-4 flex items-center justify-between gap-3 px-1">
          <Link href="/" aria-label="PriceAI 首页" className="min-w-0 shrink-0" onClick={onClose}>
            <AppLogo compact />
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] text-[var(--color-text-muted)] transition hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-primary)]"
            aria-label="关闭模块导航"
          >
            <X size={17} />
          </button>
        </div>

        <nav className="space-y-1" aria-label="移动端模块导航">
          {navItems.map((item) => {
            const active = item.key === activeKey;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex h-11 items-center justify-between rounded-lg px-3 text-sm font-semibold transition ${
                  active
                    ? "bg-[var(--color-surface-selected)] text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-body)] hover:bg-[var(--color-surface-hover)]"
                }`}
                aria-current={active ? "page" : undefined}
              >
                <span>{item.label}</span>
                {active ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]" aria-hidden="true" /> : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-4 border-t border-[var(--color-border-soft)] pt-3">
          <div className="space-y-1">
            <Link
              href="/about"
              onClick={onClose}
              className={`flex h-11 items-center justify-between rounded-lg px-3 text-sm font-semibold transition ${
                aboutActive
                  ? "bg-[var(--color-surface-selected)] text-[var(--color-text-primary)]"
                  : "text-[var(--color-text-body)] hover:bg-[var(--color-surface-hover)]"
              }`}
              aria-current={aboutActive ? "page" : undefined}
            >
              <span className="inline-flex items-center gap-3">
                <Info size={17} />
                关于 PriceAI
              </span>
              {aboutActive ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand)]" aria-hidden="true" /> : null}
            </Link>
            <button
              type="button"
              onClick={onFeedback}
              className="flex h-11 w-full items-center justify-between rounded-lg px-3 text-left text-sm font-semibold text-[var(--color-text-body)] transition hover:bg-[var(--color-surface-hover)]"
            >
              <span className="inline-flex items-center gap-3">
                <MessageCircle size={17} />
                意见反馈
              </span>
            </button>
            <a
              href={telegramUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 items-center justify-between rounded-lg px-3 text-sm font-semibold text-[var(--color-text-body)] transition hover:bg-[var(--color-surface-hover)]"
              onClick={onClose}
            >
              <span className="inline-flex items-center gap-3">
                <Image src="/brand-icons/telegram.svg" alt="" aria-hidden="true" width={18} height={18} className="h-[18px] w-[18px] shrink-0 object-contain" />
                Telegram 交流群
              </span>
              <ExternalLink size={14} className="text-[var(--color-text-soft)]" />
            </a>
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="flex h-11 items-center justify-between rounded-lg px-3 text-sm font-semibold text-[var(--color-text-body)] transition hover:bg-[var(--color-surface-hover)]"
              onClick={onClose}
            >
              <span className="inline-flex items-center gap-3">
                <Image src="/brand-icons/github.svg" alt="" aria-hidden="true" width={18} height={18} className="h-[18px] w-[18px] shrink-0 object-contain" />
                GitHub 开源
              </span>
              <ExternalLink size={14} className="text-[var(--color-text-soft)]" />
            </a>
          </div>
        </div>
      </aside>
    </div>,
    document.body,
  );
}
