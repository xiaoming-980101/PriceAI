"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useState, useSyncExternalStore } from "react";
import { QQGroupDialog } from "@/components/FeedbackLink";

const qqGroupHashes = new Set(["#qq-group", "#qqgroup"]);

function wantsQQGroupFromQuery(queryString: string) {
  const params = new URLSearchParams(queryString);
  const qqGroup = params.get("qqGroup");
  if (qqGroup === "1" || qqGroup === "true" || qqGroup === "open") return true;
  return params.get("community") === "qq";
}

function subscribeToHashChange(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  window.addEventListener("hashchange", onStoreChange);
  return () => window.removeEventListener("hashchange", onStoreChange);
}

function subscribeToClientReady(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const frame = window.requestAnimationFrame(onStoreChange);
  return () => window.cancelAnimationFrame(frame);
}

function getHashSnapshot() {
  return typeof window === "undefined" ? "" : window.location.hash.toLowerCase();
}

export function QQGroupAutoPrompt() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const queryString = searchParams.toString();
  const clientReady = useSyncExternalStore(subscribeToClientReady, () => true, () => false);
  const hash = useSyncExternalStore(subscribeToHashChange, getHashSnapshot, () => "");
  const [dismissedPromptKey, setDismissedPromptKey] = useState<string | null>(null);
  const promptKey = wantsQQGroupFromQuery(queryString) || qqGroupHashes.has(hash)
    ? `${pathname}?${queryString}${hash}`
    : null;

  return clientReady && promptKey && dismissedPromptKey !== promptKey
    ? <QQGroupDialog onClose={() => setDismissedPromptKey(promptKey)} />
    : null;
}
