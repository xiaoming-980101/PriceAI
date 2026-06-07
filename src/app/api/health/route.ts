import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type HealthStatus = "ok" | "degraded" | "not_configured";

export async function GET() {
  const generatedAt = new Date().toISOString();
  const supabaseConfigured = isSupabaseConfigured();
  const supabase = getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.json(
      {
        ok: false,
        status: "not_configured" satisfies HealthStatus,
        generatedAt,
        supabaseConfigured,
        supabaseReachable: false,
        latestSuccessfulCrawlAt: null,
        latestCrawlAt: null,
        latestCrawlStatus: null,
        message: "Supabase 尚未配置。",
      },
      { status: 503 },
    );
  }

  try {
    const [latestSuccessResult, latestRunResult] = await Promise.all([
      supabase
        .from("crawl_runs")
        .select("finished_at,started_at")
        .eq("status", "success")
        .order("finished_at", { ascending: false, nullsFirst: false })
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("crawl_runs")
        .select("status,finished_at,started_at")
        .order("started_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (latestSuccessResult.error) throw latestSuccessResult.error;
    if (latestRunResult.error) throw latestRunResult.error;

    const latestSuccessfulCrawlAt =
      latestSuccessResult.data?.finished_at ||
      latestSuccessResult.data?.started_at ||
      null;
    const latestCrawlAt =
      latestRunResult.data?.finished_at ||
      latestRunResult.data?.started_at ||
      null;

    return NextResponse.json({
      ok: true,
      status: "ok" satisfies HealthStatus,
      generatedAt,
      supabaseConfigured,
      supabaseReachable: true,
      latestSuccessfulCrawlAt,
      latestCrawlAt,
      latestCrawlStatus: latestRunResult.data?.status || null,
      message: null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        status: "degraded" satisfies HealthStatus,
        generatedAt,
        supabaseConfigured,
        supabaseReachable: false,
        latestSuccessfulCrawlAt: null,
        latestCrawlAt: null,
        latestCrawlStatus: null,
        message: error instanceof Error ? error.message : "健康检查失败。",
      },
      { status: 503 },
    );
  }
}
