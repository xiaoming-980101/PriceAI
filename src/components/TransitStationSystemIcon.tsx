"use client";

import Image from "next/image";
import type { TransitStation } from "@/data/api-transit/types";
import {
  getTransitStationSystem,
  getTransitStationSystemLabel,
} from "@/lib/api-transit";

export function TransitStationSystemIcon({
  station,
  size = "md",
}: {
  station: TransitStation;
  size?: "md" | "lg";
}) {
  const system = getTransitStationSystem(station);
  const label = getTransitStationSystemLabel(station);
  const shellClassName = size === "lg" ? "h-14 w-14 rounded-xl" : "h-10 w-10 rounded-full";
  const imageClassName = size === "lg" ? "h-10 w-10" : "h-7 w-7";

  if (system === "new_api") {
    return (
      <span
        className={`grid shrink-0 place-items-center bg-white ring-1 ring-[#adb3b4]/20 ${shellClassName}`}
        title={label}
      >
        <Image
          src="/brand-icons/new-api.png"
          alt=""
          aria-hidden="true"
          width={40}
          height={40}
          className={`${imageClassName} object-contain`}
        />
      </span>
    );
  }

  if (system === "sub_to_api") {
    return (
      <span
        className={`grid shrink-0 place-items-center bg-[#eef3f8] text-[10px] font-black text-[#47657a] ring-1 ring-[#adb3b4]/20 ${shellClassName}`}
        title={label}
      >
        S2A
      </span>
    );
  }

  const initial = station.name.trim().charAt(0) || "?";

  return (
    <span
      className={`grid shrink-0 place-items-center bg-[#f2f4f4] text-sm font-bold text-[#202829] ring-1 ring-[#adb3b4]/15 ${shellClassName}`}
      title={label}
    >
      {initial}
    </span>
  );
}
