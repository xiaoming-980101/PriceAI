export function AppLogo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-3 text-[#202829]" aria-label="PriceAI AI 比价雷达">
      <span className={`grid shrink-0 place-items-center ${compact ? "h-9 w-9" : "h-11 w-11"}`}>
        <svg
          viewBox="0 0 64 64"
          aria-hidden="true"
          className={compact ? "h-8 w-8" : "h-10 w-10"}
        >
          <circle cx="28" cy="28" r="20" fill="#f8fbf9" stroke="#202829" strokeWidth="5" />
          <path
            d="M15 33L23 25L30 30L41 19"
            fill="none"
            stroke="#45bf78"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="5"
          />
          <circle cx="41" cy="19" r="3.6" fill="#45bf78" />
          <path d="M43 43L56 56" stroke="#202829" strokeLinecap="round" strokeWidth="7" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className={`font-sans font-extrabold tracking-[-0.01em] text-[#202829] ${compact ? "text-2xl" : "text-3xl"}`}>
          PriceAI
        </span>
        {!compact ? (
          <span className="mt-1.5 hidden text-[0.62rem] font-semibold tracking-[0.22em] text-[#6b7374] sm:block">
            AI 比价雷达
          </span>
        ) : null}
      </span>
    </span>
  );
}
