"use client";

import { Link2 } from "lucide-react";
import { useSyncExternalStore } from "react";
import type { TransitCommercialOffer, TransitStation } from "@/data/api-transit/types";

const AFF_STORAGE_KEY = "priceai-api-transit-aff-enabled";
const AFF_CHANGE_EVENT = "priceai-api-transit-aff-change";

function readAffPreference(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(AFF_STORAGE_KEY) !== "disabled";
  } catch {
    return true;
  }
}

function getServerAffPreference(): boolean {
  return true;
}

function subscribeToAffPreference(onStoreChange: () => void) {
  window.addEventListener(AFF_CHANGE_EVENT, onStoreChange);
  window.addEventListener("storage", onStoreChange);

  return () => {
    window.removeEventListener(AFF_CHANGE_EVENT, onStoreChange);
    window.removeEventListener("storage", onStoreChange);
  };
}

function setAffPreference(enabled: boolean): void {
  try {
    window.localStorage.setItem(AFF_STORAGE_KEY, enabled ? "enabled" : "disabled");
  } catch {
    // Preference persistence is best-effort; the current tab can still update immediately.
  }
  window.dispatchEvent(new Event(AFF_CHANGE_EVENT));
}

export function useTransitAffPreference(): [boolean, (enabled: boolean) => void] {
  const enabled = useSyncExternalStore(
    subscribeToAffPreference,
    readAffPreference,
    getServerAffPreference
  );
  return [enabled, setAffPreference];
}

export function getTransitStationOutboundUrl(
  station: TransitStation,
  offer: TransitCommercialOffer | null | undefined,
  affEnabled: boolean
): string {
  return affEnabled && offer?.url ? offer.url : station.websiteUrl;
}

export function TransitAffPreferenceToggle({ className = "" }: { className?: string }) {
  const [enabled, setEnabled] = useTransitAffPreference();

  return (
    <button
      type="button"
      aria-pressed={enabled}
      title={enabled ? "关闭后仅访问原站官网链接" : "开启后优先使用 PriceAI 优惠 / AFF 链接"}
      onClick={() => setEnabled(!enabled)}
      className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-full px-3.5 text-sm font-semibold transition-colors ${
        enabled
          ? "bg-[#e8f3ec] text-[#2f7a4b] ring-1 ring-[#d7eadb]"
          : "bg-white text-[#5a6061] ring-1 ring-[#adb3b4]/15 hover:bg-[#fbfcfc]"
      } ${className}`}
    >
      <Link2 className="h-3.5 w-3.5 shrink-0" />
      <span>{enabled ? "AFF 已开启" : "AFF 已关闭"}</span>
      <span
        aria-hidden="true"
        className={`flex h-5 w-9 items-center rounded-full p-0.5 transition-colors ${
          enabled ? "bg-[#45bf78]" : "bg-[#dfe4e5]"
        }`}
      >
        <span
          className={`h-4 w-4 rounded-full bg-white shadow-[0_1px_4px_rgba(45,52,53,0.18)] transition-transform ${
            enabled ? "translate-x-4" : "translate-x-0"
          }`}
        />
      </span>
    </button>
  );
}
