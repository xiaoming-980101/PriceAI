import Image from "next/image";
import { Boxes } from "lucide-react";
import { BrandIcon } from "@/components/BrandIcon";

const iconByFamily: Record<string, string> = {
  claude: "/brand-icons/claude.svg",
};

export function TransitModelIcon({
  family,
  className = "h-6 w-6",
}: {
  family: string;
  className?: string;
}) {
  const normalizedFamily = family.toLowerCase();

  if (normalizedFamily === "gpt") {
    return <BrandIcon platform="ChatGPT" className={className} />;
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
