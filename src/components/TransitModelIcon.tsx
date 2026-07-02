import Image from "next/image";
import { Boxes } from "lucide-react";
import { BrandIcon } from "@/components/BrandIcon";

const iconByFamily: Record<string, string> = {
  claude: "/brand-icons/claude.svg",
  gemini: "/brand-icons/gemini.svg",
  glm: "/brand-icons/glm.png",
  deepseek: "/brand-icons/deepseek.png",
};

const modelBrandIconByPrefix: { prefix: string; icon: "openai" | "gemini" | "volcengine" }[] = [
  { prefix: "gpt image", icon: "openai" },
  { prefix: "sora", icon: "openai" },
  { prefix: "nano banana", icon: "gemini" },
  { prefix: "veo", icon: "gemini" },
  { prefix: "gemini omni", icon: "gemini" },
  { prefix: "seedance", icon: "volcengine" },
];

export function TransitModelIcon({
  family,
  standardModel,
  className = "h-6 w-6",
}: {
  family: string;
  standardModel?: string;
  className?: string;
}) {
  const normalizedFamily = family.toLowerCase();
  const normalizedStandardModel = standardModel?.toLowerCase() ?? "";
  const modelBrand = modelBrandIconByPrefix.find((item) =>
    normalizedStandardModel.startsWith(item.prefix)
  )?.icon;

  if (modelBrand === "openai") {
    return <BrandIcon platform="ChatGPT" className={className} />;
  }

  if (modelBrand === "gemini") {
    return (
      <Image
        src="/brand-icons/gemini.svg"
        alt=""
        aria-hidden="true"
        width={32}
        height={32}
        className={`${className} shrink-0 object-contain`}
      />
    );
  }

  if (modelBrand === "volcengine") {
    return (
      <Image
        src="/brand-icons/volcengine.png"
        alt=""
        aria-hidden="true"
        width={32}
        height={32}
        className={`${className} shrink-0 object-contain`}
      />
    );
  }

  if (normalizedFamily === "gpt") {
    return <BrandIcon platform="ChatGPT" className={className} />;
  }
  if (normalizedFamily === "image") {
    return <GeneratedMediaIcon kind="image" className={className} />;
  }
  if (normalizedFamily === "video") {
    return <GeneratedMediaIcon kind="video" className={className} />;
  }

  const src = iconByFamily[normalizedFamily];

  if (src) {
    return (
      <Image
        src={src}
        alt=""
        aria-hidden="true"
        width={32}
        height={32}
        className={`${className} shrink-0 object-contain`}
      />
    );
  }

  return <Boxes className={`${className} shrink-0 text-[#5a6061]`} />;
}

function GeneratedMediaIcon({
  kind,
  className,
}: {
  kind: "image" | "video";
  className: string;
}) {
  if (kind === "video") {
    return (
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={`${className} shrink-0 text-[#5a6061]`}
        fill="none"
      >
        <rect x="3.5" y="5.25" width="17" height="13.5" rx="2.75" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9.75 9.25v5.5l4.8-2.75-4.8-2.75Z" fill="#45bf78" />
        <path d="M7 5.5v13M17 5.5v13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
        <path d="M17.6 4.1l.35 1.05 1.05.35-1.05.35-.35 1.05-.35-1.05-1.05-.35 1.05-.35.35-1.05Z" fill="#45bf78" />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={`${className} shrink-0 text-[#5a6061]`}
      fill="none"
    >
      <rect x="4" y="5" width="16" height="14" rx="3" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.25 15.75 10.3 12.7a1 1 0 0 1 1.42 0l1.23 1.23 1.87-1.87a1 1 0 0 1 1.41 0l2.52 2.52" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="9.5" r="1.2" fill="#45bf78" />
      <path d="M17.6 3.9l.36 1.08 1.08.36-1.08.36-.36 1.08-.36-1.08-1.08-.36 1.08-.36.36-1.08Z" fill="#45bf78" />
    </svg>
  );
}
