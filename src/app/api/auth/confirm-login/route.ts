import { createClient, type User } from "@supabase/supabase-js";
import { z } from "zod";
import {
  checkPublicWriteRateLimit,
  getPublicClientFingerprint,
  getPublicRequestErrorStatus,
  readJsonWithLimit,
} from "@/lib/public-request";
import { getRuntimeEnv } from "@/lib/runtime-env";
import { getSupabaseAuthAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const CONFIRM_LOGIN_RATE_LIMIT_PER_HOUR = 12;

const schema = z.object({
  email: z.string().trim().email().max(320),
  password: z.string().min(6).max(128),
});

export async function POST(request: Request) {
  try {
    const submitterIp = getPublicClientFingerprint(request);
    checkPublicWriteRateLimit({
      scope: "auth-confirm-login",
      key: submitterIp,
      limit: CONFIRM_LOGIN_RATE_LIMIT_PER_HOUR,
    });

    const payload = schema.parse(await readJsonWithLimit(request));
    const email = payload.email.toLowerCase();
    const url = getRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL");
    const anonKey = getRuntimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    const supabase = getSupabaseAuthAdminClient();
    if (!url || !anonKey || !supabase) {
      return Response.json({ ok: false, message: "登录服务尚未配置。" }, { status: 503 });
    }

    const authClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    const signInResult = await authClient.auth.signInWithPassword({
      email,
      password: payload.password,
    });

    if (signInResult.data.session) {
      return Response.json({ ok: true, alreadyConfirmed: true });
    }
    if (!isEmailNotConfirmedError(signInResult.error)) {
      return Response.json({ ok: false, message: "邮箱或密码不正确。" }, { status: 401 });
    }

    const user = await findUserByEmail(supabase, email);
    if (!user) {
      return Response.json({ ok: false, message: "账号不存在，请重新注册。" }, { status: 404 });
    }

    const { error } = await supabase.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    });
    if (error) throw error;

    return Response.json({ ok: true, confirmed: true });
  } catch (error) {
    const message = getErrorMessage(error);
    return Response.json({ ok: false, message }, { status: getErrorStatus(error, message) });
  }
}

async function findUserByEmail(supabase: ReturnType<typeof getSupabaseAuthAdminClient>, email: string): Promise<User | null> {
  if (!supabase) return null;

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const user = (data.users || []).find((currentUser) => (currentUser.email || "").toLowerCase() === email);
    if (user) return user;
    if ((data.users || []).length < 1000) return null;
  }

  return null;
}

function isEmailNotConfirmedError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { code?: unknown; message?: unknown };
  return record.code === "email_not_confirmed" || /email not confirmed/i.test(String(record.message || ""));
}

function getErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) return "邮箱或密码格式不正确。";
  if (error instanceof Error) return error.message;
  return "登录失败，请稍后重试。";
}

function getErrorStatus(error: unknown, message: string): number {
  const publicRequestStatus = getPublicRequestErrorStatus(error);
  if (publicRequestStatus) return publicRequestStatus;
  if (error instanceof z.ZodError) return 400;
  if (message.includes("过于频繁")) return 429;
  return 500;
}
