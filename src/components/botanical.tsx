type SprigProps = {
  variant?: "grass" | "fern";
  className?: string;
};

/** Quiet hand-drawn northern greenery. Decorative only, never interactive. */
export function BotanicalSprig({ variant = "grass", className = "" }: SprigProps) {
  return (
    <svg
      viewBox="0 0 180 320"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {variant === "fern" ? (
        <g>
          <path d="M35 306C62 257 83 197 94 126C101 82 105 44 101 15" />
          <path d="M86 169C57 159 38 141 30 115C55 120 76 137 89 158" />
          <path d="M91 143C119 132 138 111 144 85C119 92 102 109 93 132" />
          <path d="M77 207C48 201 25 185 13 160C41 162 63 177 80 196" />
          <path d="M83 188C111 181 133 163 145 139C118 141 96 156 85 177" />
          <path d="M65 245C40 243 18 231 5 211C30 209 52 220 69 235" />
          <path d="M70 229C96 224 117 211 132 190C106 189 85 201 73 218" />
          <path d="M96 111C75 99 62 82 58 61C78 68 91 82 97 100" />
          <path d="M99 85C119 74 131 59 135 40C116 46 104 60 100 75" />
          <path d="M101 55C87 45 80 33 79 20C92 25 100 35 102 46" />
          <path d="M46 279C27 278 13 271 3 258C21 256 37 262 51 271" />
          <path d="M51 267C70 263 86 254 97 239C78 239 63 247 54 258" />
        </g>
      ) : (
        <g>
          <path d="M83 315C80 245 69 174 42 96C32 67 24 39 25 13" />
          <path d="M88 315C93 239 109 174 139 113C151 88 158 60 155 35" />
          <path d="M85 315C86 240 84 166 88 91C90 57 88 31 82 8" />
          <path d="M77 274C57 247 42 218 35 185" />
          <path d="M94 250C116 228 132 202 141 173" />
          <path d="M70 213C54 194 43 172 38 149" />
          <path d="M101 198C116 183 127 165 133 145" />
          <path d="M25 14C17 24 17 37 26 47C34 35 34 23 25 14Z" />
          <path d="M25 47C16 56 17 69 29 78C36 65 34 54 25 47Z" />
          <path d="M82 8C73 17 73 30 83 39C91 28 91 17 82 8Z" />
          <path d="M84 40C75 50 77 62 87 70C94 58 92 47 84 40Z" />
          <path d="M155 35C144 40 140 51 145 63C157 58 162 47 155 35Z" />
          <path d="M148 65C137 69 133 81 139 92C150 87 155 76 148 65Z" />
          <path d="M42 96C29 91 19 94 13 105C26 111 37 107 42 96Z" />
          <path d="M139 113C151 103 163 103 172 111C162 123 149 123 139 113Z" />
          <path d="M88 91C75 84 64 87 57 98C69 106 81 103 88 91Z" />
        </g>
      )}
    </svg>
  );
}

export function BotanicalDivider({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-5 text-moss/70 ${className}`} aria-hidden="true">
      <span className="h-px flex-1 bg-border" />
      <svg viewBox="0 0 100 44" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" className="h-10 w-24">
        <path d="M50 39V8M50 29C39 27 32 21 29 12C40 13 47 19 50 27M50 23C61 21 68 15 71 6C60 7 53 13 50 21" />
        <path d="M39 39C37 31 32 25 24 21M61 39C64 31 70 26 78 23" />
        <path d="M50 8L46 3M50 8L54 3" />
      </svg>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function BotanicalBackdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <BotanicalSprig variant="fern" className="absolute -left-16 top-32 h-[27rem] w-44 -rotate-12 text-moss opacity-[0.14] sm:-left-8 sm:h-[32rem] sm:w-52" />
      <BotanicalSprig variant="grass" className="absolute -bottom-12 -right-12 h-[31rem] w-60 rotate-6 text-moss opacity-[0.18] sm:-right-4 sm:h-[38rem] sm:w-72" />
      <BotanicalSprig variant="grass" className="absolute -left-20 bottom-[8%] hidden h-80 w-40 -rotate-12 text-amber opacity-[0.08] lg:block" />
    </div>
  );
}
