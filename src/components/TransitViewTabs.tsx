"use client";

import Link from "next/link";
import { Building2, Boxes } from "lucide-react";

export function TransitViewTabs({ active, className = "" }: { active: "stations" | "models"; className?: string }) {
  return (
    <nav className={`inline-flex items-center gap-1 rounded-full border border-[#dfe4e5] bg-white p-1 ${className}`} aria-label="中转 API 视图切换">
      <Link
        href="/api-transit"
        className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-bold transition-colors ${
          active === "stations"
            ? "bg-[#2d3435] text-[#f8f8f8]"
            : "text-[#5a6061] hover:bg-[#f2f4f4]"
        }`}
        aria-current={active === "stations" ? "page" : undefined}
      >
        <Building2 className="h-4 w-4" />
        站点
      </Link>
      <Link
        href="/api-transit/models"
        className={`inline-flex items-center gap-1.5 h-9 px-4 rounded-full text-sm font-bold transition-colors ${
          active === "models"
            ? "bg-[#2d3435] text-[#f8f8f8]"
            : "text-[#5a6061] hover:bg-[#f2f4f4]"
        }`}
        aria-current={active === "models" ? "page" : undefined}
      >
        <Boxes className="h-4 w-4" />
        模型
      </Link>
    </nav>
  );
}
