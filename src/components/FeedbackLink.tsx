import { ExternalLink, MessageCircle } from "lucide-react";

const feedbackUrl = "https://github.com/physics-dimension/PriceAI/issues/new/choose";

export function FeedbackLink({ compact = false }: { compact?: boolean }) {
  return (
    <a
      href={feedbackUrl}
      target="_blank"
      rel="noreferrer"
      className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-3 py-2 text-sm font-semibold text-[#2d3435] shadow-[0_10px_30px_rgba(45,52,53,0.06)] ring-1 ring-[#adb3b4]/25 transition hover:-translate-y-0.5 hover:bg-[#f5f7f7] hover:text-[#202829]"
      aria-label="前往 GitHub 提交反馈"
    >
      <MessageCircle size={16} />
      <span className={compact ? "hidden sm:inline" : undefined}>反馈</span>
      <ExternalLink size={14} className="hidden sm:block" />
    </a>
  );
}
