import { getSupabaseServerClient } from "@/lib/supabase";
import { stableId } from "@/lib/utils";

export type OfficialPriceJobMode = "weekly_full" | "fx_only";

export async function enqueueOfficialPriceCollectionJob(
  request: Request,
  officialMode: OfficialPriceJobMode,
) {
  const authError = authorizeCronRequest(request);
  if (authError) return authError;

  const startedAt = new Date().toISOString();
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return Response.json(
      { ok: false, startedAt, message: "Supabase 尚未配置，无法创建官方地区价采集任务。" },
      { status: 500 },
    );
  }

  try {
    const row = {
      id: stableId("collection-job", "official_prices", officialMode, startedAt),
      job_type: "official_prices",
      source_id: null,
      source_name: officialMode === "fx_only" ? "官方地区价汇率刷新" : "官方地区价周全量",
      status: "pending",
      priority: officialMode === "fx_only" ? 15 : 25,
      attempts: 0,
      max_attempts: 2,
      requested_by: "cron",
      result: { officialMode },
      created_at: startedAt,
      updated_at: startedAt,
    };

    const { data, error } = await supabase
      .from("collection_jobs")
      .insert(row)
      .select("*")
      .single();

    if (error) throw error;

    return Response.json({
      ok: true,
      mode: officialMode,
      startedAt,
      finishedAt: new Date().toISOString(),
      job: data || row,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        startedAt,
        finishedAt: new Date().toISOString(),
        message: error instanceof Error ? error.message : "创建官方地区价采集任务失败。",
      },
      { status: 500 },
    );
  }
}

export function officialModeFromRequest(request: Request): OfficialPriceJobMode {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") || searchParams.get("officialMode");
  return mode === "weekly_full" ? "weekly_full" : "fx_only";
}

function authorizeCronRequest(request: Request) {
  const secret = process.env.CRON_SECRET;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!secret && process.env.NODE_ENV === "production") {
    return Response.json(
      { ok: false, message: "CRON_SECRET 未配置，已拒绝创建官方地区价采集任务。" },
      { status: 500 },
    );
  }

  const authorization = request.headers.get("authorization");
  if (secret && authorization === `Bearer ${secret}`) return null;

  const adminHeader = request.headers.get("x-admin-password");
  if (adminPassword && adminHeader === adminPassword) return null;

  return Response.json({ ok: false, message: "无权创建官方地区价采集任务。" }, { status: 401 });
}
