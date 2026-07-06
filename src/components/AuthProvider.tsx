"use client";

import { createContext, type FormEvent, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { LogIn, X } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

export type UserTargetType = "product" | "offer";
export type UserTargetSnapshot = Record<string, unknown>;

type UserFavoriteRow = {
  target_type: UserTargetType;
  target_id: string;
  snapshot: UserTargetSnapshot;
  created_at: string;
};

type AuthContextValue = {
  configured: boolean;
  loading: boolean;
  user: User | null;
  session: Session | null;
  favoriteKeys: Set<string>;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signOut: () => Promise<void>;
  authHeaders: () => HeadersInit | null;
  refreshFavorites: () => Promise<void>;
  isFavorite: (targetType: UserTargetType, targetId: string) => boolean;
  toggleFavorite: (targetType: UserTargetType, targetId: string, snapshot: UserTargetSnapshot) => Promise<boolean>;
  recordView: (targetType: UserTargetType, targetId: string, snapshot: UserTargetSnapshot) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [authOpen, setAuthOpen] = useState(false);
  const [favoriteKeys, setFavoriteKeys] = useState<Set<string>>(new Set());

  const authHeaders = useCallback((): HeadersInit | null => {
    if (!session?.access_token) return null;
    return { Authorization: `Bearer ${session.access_token}` };
  }, [session?.access_token]);

  const refreshFavorites = useCallback(async () => {
    const headers = authHeaders();
    if (!headers) {
      setFavoriteKeys(new Set());
      return;
    }

    const response = await fetch("/api/user/favorites", { headers });
    if (!response.ok) return;
    const payload = await response.json() as { rows?: UserFavoriteRow[] };
    setFavoriteKeys(new Set((payload.rows || []).map((row) => favoriteKey(row.target_type, row.target_id))));
  }, [authHeaders]);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }

    let active = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
      if (nextSession) setAuthOpen(false);
      if (!nextSession) setFavoriteKeys(new Set());
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  useEffect(() => {
    if (!session) return;
    void refreshFavorites();
  }, [refreshFavorites, session]);

  const value = useMemo<AuthContextValue>(() => ({
    configured: Boolean(supabase),
    loading,
    user: session?.user || null,
    session,
    favoriteKeys,
    openAuthModal: () => setAuthOpen(true),
    closeAuthModal: () => setAuthOpen(false),
    signOut: async () => {
      await supabase?.auth.signOut();
      setSession(null);
      setFavoriteKeys(new Set());
    },
    authHeaders,
    refreshFavorites,
    isFavorite: (targetType, targetId) => favoriteKeys.has(favoriteKey(targetType, targetId)),
    toggleFavorite: async (targetType, targetId, snapshot) => {
      const headers = authHeaders();
      if (!headers) {
        setAuthOpen(true);
        return false;
      }

      const key = favoriteKey(targetType, targetId);
      const active = favoriteKeys.has(key);
      setFavoriteKeys((current) => {
        const next = new Set(current);
        if (active) next.delete(key);
        else next.add(key);
        return next;
      });

      const response = await fetch(active
        ? `/api/user/favorites?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`
        : "/api/user/favorites", {
        method: active ? "DELETE" : "POST",
        headers: active
          ? headers
          : {
              ...headers,
              "content-type": "application/json",
            },
        body: active ? undefined : JSON.stringify({ targetType, targetId, snapshot }),
      });

      if (!response.ok) {
        setFavoriteKeys((current) => {
          const next = new Set(current);
          if (active) next.add(key);
          else next.delete(key);
          return next;
        });
        return active;
      }

      return !active;
    },
    recordView: async (targetType, targetId, snapshot) => {
      const headers = authHeaders();
      if (!headers) return;
      await fetch("/api/user/history", {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/json",
        },
        body: JSON.stringify({ targetType, targetId, snapshot }),
      }).catch(() => undefined);
    },
  }), [authHeaders, favoriteKeys, loading, refreshFavorites, session, supabase]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {authOpen ? <AuthDialog onClose={() => setAuthOpen(false)} /> : null}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}

function AuthDialog({ onClose }: { onClose: () => void }) {
  const supabase = getSupabaseBrowserClient();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const titleId = "auth-dialog-title";

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setError("Supabase Auth 尚未配置。");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const payload = { email: email.trim(), password };
      const result = mode === "login"
        ? await supabase.auth.signInWithPassword(payload)
        : await supabase.auth.signUp(payload);
      if (result.error) throw result.error;
      if (mode === "register" && !result.data.session) {
        setMessage("注册已提交，请检查邮箱确认链接后再登录。");
      } else {
        onClose();
      }
    } catch (currentError) {
      setError(currentError instanceof Error ? currentError.message : "登录失败，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-[#202829]/40 px-4 py-4 sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-[420px] rounded-lg bg-white p-5 shadow-[0_24px_80px_rgba(32,40,41,0.24)]"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#eef3f8] text-[#47657a]">
              <LogIn size={20} />
            </div>
            <h2 id={titleId} className="text-xl font-semibold text-[#202829]">
              {mode === "login" ? "登录 PriceAI" : "注册 PriceAI"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="关闭登录窗口"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#adb3b4]/25 text-[#5a6061] transition hover:bg-[#f2f4f4]"
          >
            <X size={17} />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 rounded-full bg-[#edf0f1] p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`h-9 rounded-full transition ${mode === "login" ? "bg-white text-[#202829] shadow-[0_8px_20px_rgba(45,52,53,0.08)]" : "text-[#5a6061]"}`}
          >
            登录
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={`h-9 rounded-full transition ${mode === "register" ? "bg-white text-[#202829] shadow-[0_8px_20px_rgba(45,52,53,0.08)]" : "text-[#5a6061]"}`}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#5a6061]">邮箱</span>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              autoComplete="email"
              required
              className="h-11 w-full rounded-lg border border-[#dbe2e3] px-3 text-sm text-[#202829] outline-none focus:border-[#8a9293]"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold text-[#5a6061]">密码</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              minLength={6}
              required
              className="h-11 w-full rounded-lg border border-[#dbe2e3] px-3 text-sm text-[#202829] outline-none focus:border-[#8a9293]"
            />
          </label>
          {error ? <p className="rounded-lg bg-[#fff0ed] px-3 py-2 text-sm text-[#9b3328]">{error}</p> : null}
          {message ? <p className="rounded-lg bg-[#eef8f1] px-3 py-2 text-sm text-[#2f7a4b]">{message}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-[#2d3435] px-4 text-sm font-semibold text-white transition hover:bg-[#202829] disabled:opacity-60"
          >
            {submitting ? "处理中..." : mode === "login" ? "登录" : "注册"}
          </button>
        </form>
      </div>
    </div>
  );
}

function favoriteKey(targetType: UserTargetType, targetId: string): string {
  return `${targetType}:${targetId}`;
}
