import { requireUserContext, userApiErrorResponse } from "@/lib/user-auth";

type HistoryTargetType = "product" | "offer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireUserContext(request);
    const url = new URL(request.url);
    const targetType = parseTargetType(url.searchParams.get("targetType"), true);

    let query = supabase
      .from("user_view_history")
      .select("target_type,target_id,snapshot,first_viewed_at,last_viewed_at,view_count")
      .eq("user_id", user.id)
      .order("last_viewed_at", { ascending: false })
      .limit(300);

    if (targetType) query = query.eq("target_type", targetType);

    const { data, error } = await query;
    if (error) throw error;

    return Response.json({ ok: true, rows: data || [] });
  } catch (error) {
    return userApiErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const { supabase, user } = await requireUserContext(request);
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const targetType = parseTargetType(body.targetType);
    const targetId = normalizeTargetId(body.targetId);
    if (!targetId) return Response.json({ ok: false, message: "浏览目标无效。" }, { status: 400 });

    const existing = await supabase
      .from("user_view_history")
      .select("view_count")
      .eq("user_id", user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .maybeSingle();
    if (existing.error) throw existing.error;

    const { data, error } = await supabase
      .from("user_view_history")
      .upsert({
        user_id: user.id,
        target_type: targetType,
        target_id: targetId,
        snapshot: normalizeSnapshot(body.snapshot),
        last_viewed_at: new Date().toISOString(),
        view_count: Math.max(1, Number(existing.data?.view_count || 0) + 1),
      }, { onConflict: "user_id,target_type,target_id" })
      .select("target_type,target_id,snapshot,first_viewed_at,last_viewed_at,view_count")
      .single();
    if (error) throw error;

    return Response.json({ ok: true, row: data });
  } catch (error) {
    return userApiErrorResponse(error);
  }
}

function parseTargetType(value: unknown, optional: true): HistoryTargetType | null;
function parseTargetType(value: unknown, optional?: false): HistoryTargetType;
function parseTargetType(value: unknown, optional = false): HistoryTargetType | null {
  if (value === "product" || value === "offer") return value;
  if (optional) return null;
  throw new Error("浏览类型无效。");
}

function normalizeTargetId(value: unknown): string {
  return String(value || "").trim().slice(0, 220);
}

function normalizeSnapshot(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
