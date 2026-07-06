import "server-only";

import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { getRuntimeEnv } from "@/lib/runtime-env";

export type AuthenticatedUserContext = {
  supabase: SupabaseClient;
  user: User;
};

export async function requireUserContext(request: Request): Promise<AuthenticatedUserContext> {
  const token = bearerTokenFromRequest(request);
  if (!token) throw unauthorizedError();

  const url = getRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getRuntimeEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!url || !anonKey) throw new Error("Supabase Auth 尚未配置。");

  const authClient = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data.user) throw unauthorizedError();

  const supabase = createClient(url, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return { supabase, user: data.user };
}

function bearerTokenFromRequest(request: Request): string | null {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return null;
  const token = authorization.slice("Bearer ".length).trim();
  return token || null;
}

function unauthorizedError(): Error {
  const error = new Error("请先登录。");
  error.name = "UnauthorizedError";
  return error;
}

export function userApiErrorResponse(error: unknown): Response {
  if (error instanceof Error && error.name === "UnauthorizedError") {
    return Response.json({ ok: false, message: error.message }, { status: 401 });
  }

  const message = error instanceof Error ? error.message : "用户数据操作失败。";
  return Response.json({ ok: false, message }, { status: 500 });
}
