"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AppLogo } from "@/components/AppLogo";

export function ProductDetailHeader() {
  const [returnHref, setReturnHref] = useState("/");

  useEffect(() => {
    window.queueMicrotask(() => {
      setReturnHref(buildReturnHref(new URLSearchParams(window.location.search).get("back") || undefined));
    });
  }, []);

  return (
    <header className="sticky top-0 z-30 bg-[#f9f9f9]/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1300px] items-center justify-between px-5 py-4 sm:px-8">
        <Link href={returnHref} className="inline-flex items-center gap-2 text-sm font-semibold text-[#5a6061] hover:text-[#2d3435]">
          <ArrowLeft size={17} />
          返回首页
        </Link>
        <Link href={returnHref} aria-label="PriceAI 首页" className="shrink-0">
          <AppLogo compact />
        </Link>
      </div>
    </header>
  );
}

function buildReturnHref(back: string | undefined): string {
  if (!back) return "/";

  const source = new URLSearchParams(back.replace(/^\?/, ""));
  const safe = new URLSearchParams();
  const allowedKeys = ["q", "platform", "type", "stock", "sort", "min", "max", "view", "scope"];

  allowedKeys.forEach((key) => {
    const value = source.get(key);
    if (value) safe.set(key, value);
  });

  const query = safe.toString();
  return query ? `/?${query}` : "/";
}
