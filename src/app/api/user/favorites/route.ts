import { requireUserContext, userApiErrorResponse } from "@/lib/user-auth";

type FavoriteTargetType = "product" | "offer";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { supabase, user } = await requireUserContext(request);
    const url = new URL(request.url);
    const targetType = parseTargetType(url.searchParams.get("targetType"), true);
    const targetId = normalizeTargetId(url.searchParams.get("targetId") || "");

    let query = supabase
      .from("user_favorites")
      .select("target_type,target_id,snapshot,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(300);

    if (targetType) query = query.eq("target_type", targetType);
    if (targetId) query = query.eq("target_id", targetId);

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
    if (!targetId) return Response.json({ ok: false, message: "收藏目标无效。" }, { status: 400 });

    const { data, error } = await supabase
      .from("user_favorites")
      .upsert({
        user_id: user.id,
        target_type: targetType,
        target_id: targetId,
        snapshot: normalizeSnapshot(body.snapshot),
      }, { onConflict: "user_id,target_type,target_id" })
      .select("target_type,target_id,snapshot,created_at")
      .single();
    if (error) throw error;

    return Response.json({ ok: true, row: data });
  } catch (error) {
    return userApiErrorResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const { supabase, user } = await requireUserContext(request);
    const url = new URL(request.url);
    const targetType = parseTargetType(url.searchParams.get("targetType"));
    const targetId = normalizeTargetId(url.searchParams.get("targetId") || "");
    if (!targetId) return Response.json({ ok: false, message: "收藏目标无效。" }, { status: 400 });

    const { error } = await supabase
      .from("user_favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId);
    if (error) throw error;

    return Response.json({ ok: true });
  } catch (error) {
    return userApiErrorResponse(error);
  }
}

function parseTargetType(value: unknown, optional: true): FavoriteTargetType | null;
function parseTargetType(value: unknown, optional?: false): FavoriteTargetType;
function parseTargetType(value: unknown, optional = false): FavoriteTargetType | null {
  if (value === "product" || value === "offer") return value;
  if (optional) return null;
  throw new Error("收藏类型无效。");
}

function normalizeTargetId(value: unknown): string {
  return String(value || "").trim().slice(0, 220);
}

function normalizeSnapshot(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
