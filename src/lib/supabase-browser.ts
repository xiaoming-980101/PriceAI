"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;

type PriceAiPublicEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
};

declare global {
  interface Window {
    __PRICEAI_PUBLIC_ENV__?: PriceAiPublicEnv;
  }
}

export function getSupabaseBrowserClient(): SupabaseClient | null {
  const runtimeEnv = typeof window === "undefined" ? undefined : window.__PRICEAI_PUBLIC_ENV__;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || runtimeEnv?.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || runtimeEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  if (!browserClient) {
    browserClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return browserClient;
}
