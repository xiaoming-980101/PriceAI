import type { Metadata } from "next";
import { AccountDashboard } from "@/components/AccountDashboard";

export const metadata: Metadata = {
  title: "我的账号",
  description: "查看 PriceAI 浏览记录和收藏。",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AccountPage() {
  return <AccountDashboard />;
}
