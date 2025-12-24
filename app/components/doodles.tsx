export const DoodleCurly = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20,80 C0,80 0,40 30,40 C60,40 60,80 40,80 C20,80 20,20 50,20 C80,20 80,60 60,60" />
  </svg>
);

export const DoodleArrow = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10,50 Q50,20 90,50" />
    <path d="M60,45 L90,50 L80,70" />
  </svg>
);

export const DoodleStar = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M50,10 L60,40 L90,50 L60,60 L50,90 L40,60 L10,50 L40,40 Z" />
  </svg>
);

export const DoodleSquiggle = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 200 50"
    fill="none"
    stroke="currentColor"
    strokeWidth="8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M10,25 Q30,5 50,25 T90,25 T130,25 T170,25" />
  </svg>
);

export const DoodleLoop = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    fill="none"
    stroke="currentColor"
    strokeWidth="6"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M20,80 C-10,40 40,-10 80,20 C100,40 60,70 40,50 C20,30 50,10 70,30" />
  </svg>
);
