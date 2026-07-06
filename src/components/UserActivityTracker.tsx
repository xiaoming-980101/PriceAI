"use client";

import { useEffect, useRef } from "react";
import { useAuth, type UserTargetSnapshot, type UserTargetType } from "@/components/AuthProvider";

export function UserActivityTracker({
  targetType,
  targetId,
  snapshot,
}: {
  targetType: UserTargetType;
  targetId: string;
  snapshot: UserTargetSnapshot;
}) {
  const { user, recordView } = useAuth();
  const recordedKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const key = `${user.id}:${targetType}:${targetId}`;
    if (recordedKeyRef.current === key) return;
    recordedKeyRef.current = key;
    void recordView(targetType, targetId, snapshot);
  }, [recordView, snapshot, targetId, targetType, user]);

  return null;
}
