"use client";

import { Star } from "lucide-react";
import { type MouseEvent, useState } from "react";
import { useAuth, type UserTargetSnapshot, type UserTargetType } from "@/components/AuthProvider";

export function FavoriteButton({
  targetType,
  targetId,
  snapshot,
  label,
  compact = false,
}: {
  targetType: UserTargetType;
  targetId: string;
  snapshot: UserTargetSnapshot;
  label?: string;
  compact?: boolean;
}) {
  const auth = useAuth();
  const [pending, setPending] = useState(false);
  const active = auth.isFavorite(targetType, targetId);

  async function handleClick(event: MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (pending) return;
    setPending(true);
    try {
      await auth.toggleFavorite(targetType, targetId, snapshot);
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={active}
      title={active ? "取消收藏" : "收藏"}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition disabled:opacity-60 ${
        compact ? "h-9 w-9 px-0" : "h-10 px-3"
      } ${
        active
          ? "bg-[#fff7df] text-[#8a5a10] ring-1 ring-[#efd38a]"
          : "bg-[#eef1f1] text-[#4d5657] hover:bg-[#e3e9e9] hover:text-[#202829]"
      }`}
    >
      <Star size={compact ? 15 : 16} fill={active ? "currentColor" : "none"} />
      {!compact && label ? <span>{label}</span> : null}
    </button>
  );
}
