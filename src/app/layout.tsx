import type { Metadata } from "next";
import Script from "next/script";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import { SiteNoticePrompt } from "@/components/SiteNoticePrompt";
import { UmamiAnalytics } from "@/components/UmamiAnalytics";
import "./globals.css";

const themeInitScript = `
(function() {
  try {
    var root = document.documentElement;
    var isAdmin = window.location.pathname.indexOf('/admin') === 0;
    if (isAdmin) {
      root.dataset.theme = 'light';
      root.style.colorScheme = 'light';
      return;
    }
    var stored = window.localStorage.getItem('priceai-theme');
    var prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored === 'dark' || (!stored && prefersDark) ? 'dark' : 'light';
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  } catch (error) {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.style.colorScheme = 'light';
  }
})();
`;

export const metadata: Metadata = {
  metadataBase: new URL("https://priceai.cc"),
  title: {
    default: "PriceAI | AI 订阅卡网与模型 API 比价雷达",
    template: "%s | PriceAI",
  },
  description: "聚合 ChatGPT、Claude、Gemini、Grok、邮箱、API/CDK 和模型 API 等渠道报价，查看有货最低价、原始来源和更新时间。",
  applicationName: "PriceAI",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "PriceAI | AI 订阅卡网与模型 API 比价雷达",
    description: "把分散的 AI 订阅卡网、官方地区价和模型 API 渠道整理成可搜索、可比较、可核验的比价雷达。",
    url: "https://priceai.cc",
    siteName: "PriceAI",
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "PriceAI | AI 订阅卡网与模型 API 比价雷达",
    description: "查看 AI 订阅卡网和模型 API 渠道的有货最低价、原始来源和更新时间。",
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col">
        <Script id="priceai-theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        {children}
        <SiteNoticePrompt />
        <GoogleAnalytics />
        <UmamiAnalytics />
      </body>
    </html>
  );
}
