import Image from "next/image";
import { Boxes } from "lucide-react";

const iconByFamily: Record<string, string> = {
  claude: "/brand-icons/claude.svg",
  gpt: "/brand-icons/chatgpt.svg",
};

export function TransitModelIcon({
  family,
  className = "h-6 w-6",
}: {
  family: string;
  className?: string;
}) {
  const src = iconByFamily[family.toLowerCase()];

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
