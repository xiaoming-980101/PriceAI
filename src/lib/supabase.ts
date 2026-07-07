import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { getRuntimeEnv } from "@/lib/runtime-env";

const SUPABASE_DB_TIMEOUT_MS = 8_000;
const SUPABASE_CIRCUIT_BREAKER_COOLDOWN_MS = 60_000;
const SUPABASE_AUTH_TIMEOUT_MS = 12_000;

let serverClient: SupabaseClient | null = null;
let authAdminClient: SupabaseClient | null = null;
let supabaseUnavailableUntil = 0;

export function getSupabaseServerClient(): SupabaseClient | null {
  const url = getRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = getRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) return null;

  if (!serverClient) {
    serverClient = createClient(url, key, {
      db: {
        timeout: SUPABASE_DB_TIMEOUT_MS,
      },
      global: {
        fetch: supabaseFetchWithCircuitBreaker,
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return serverClient;
}

export function getSupabaseAuthAdminClient(): SupabaseClient | null {
  const url = getRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = getRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !key) return null;

  if (!authAdminClient) {
    authAdminClient = createClient(url, key, {
      global: {
        fetch: supabaseFetchWithTimeout,
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return authAdminClient;
}

async function supabaseFetchWithCircuitBreaker(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const now = Date.now();
  if (supabaseUnavailableUntil > now) {
    throw abortLikeError("Supabase temporarily unavailable; circuit breaker is open.");
  }

  try {
    const response = await fetch(input, init);
    if (response.status === 520 || response.status === 522 || response.status === 524) {
      openSupabaseCircuitBreaker();
    }
    return response;
  } catch (error) {
    if (isAbortLikeError(error)) openSupabaseCircuitBreaker();
    throw error;
  }
}

async function supabaseFetchWithTimeout(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (init?.signal) return fetch(input, init);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), SUPABASE_AUTH_TIMEOUT_MS);

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error) {
    if (isAbortLikeError(error)) {
      throw new Error("Supabase 连接超时，请稍后再试。");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function openSupabaseCircuitBreaker(): void {
  supabaseUnavailableUntil = Date.now() + SUPABASE_CIRCUIT_BREAKER_COOLDOWN_MS;
}

function isAbortLikeError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const record = error as { name?: unknown; code?: unknown };
  return record.name === "AbortError" || record.name === "TimeoutError" || record.code === "ABORT_ERR";
}

function abortLikeError(message: string): Error {
  const error = new Error(message);
  error.name = "AbortError";
  return error;
}
