import { z } from "zod";
import { getSupabaseAuthAdminClient } from "@/lib/supabase";
import {
  checkPublicWriteRateLimit,
  getPublicClientFingerprint,
  getPublicRequestErrorStatus,
  readJsonWithLimit,
} from "@/lib/public-request";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const REGISTER_RATE_LIMIT_PER_HOUR = 12;

const schema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(6).max(128),
});

export async function POST(request: Request) {
  try {
    const submitterIp = getPublicClientFingerprint(request);
    checkPublicWriteRateLimit({
      scope: "auth-register",
      key: submitterIp,
      limit: REGISTER_RATE_LIMIT_PER_HOUR,
    });

    const payload = schema.parse(await readJsonWithLimit(request));
    const supabase = getSupabaseAuthAdminClient();
    if (!supabase) {
      return Response.json({ ok: false, message: "注册服务尚未配置。" }, { status: 503 });
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: payload.email.toLowerCase(),
      password: payload.password,
      email_confirm: true,
      user_metadata: {
        source: "priceai_public_register",
      },
    });

    if (error) {
      const message = normalizeAuthErrorMessage(error.message);
      return Response.json({ ok: false, message }, { status: getAuthErrorStatus(message) });
    }

    return Response.json({ ok: true, userId: data.user?.id || null });
  } catch (error) {
    const message = getErrorMessage(error);
    return Response.json({ ok: false, message }, { status: getErrorStatus(error, message) });
  }
}

function normalizeAuthErrorMessage(message: string): string {
  const lower = message.toLowerCase();
  if (
    lower.includes("already registered") ||
    lower.includes("already exists") ||
    lower.includes("user with this email")
  ) {
    return "这个邮箱已经注册，请直接登录。";
  }
  if (lower.includes("password")) return "密码不符合要求，请换一个更安全的密码。";
  if (lower.includes("email")) return "邮箱格式不正确，请检查后重试。";
  return message || "注册失败，请稍后重试。";
}

function getAuthErrorStatus(message: string): number {
  if (message.includes("已经注册")) return 409;
  if (message.includes("密码") || message.includes("邮箱")) return 400;
  return 500;
}

function getErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) return "邮箱或密码格式不正确。";
  if (error instanceof Error) return error.message;
  return "注册失败，请稍后重试。";
}

function getErrorStatus(error: unknown, message: string): number {
  const publicRequestStatus = getPublicRequestErrorStatus(error);
  if (publicRequestStatus) return publicRequestStatus;
  if (error instanceof z.ZodError) return 400;
  if (message.includes("过于频繁")) return 429;
  return 500;
}
