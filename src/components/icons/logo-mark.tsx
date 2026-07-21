export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
      <path
        d="M9 3h6.17a1 1 0 0 1 .7.3l3.83 3.83a1 1 0 0 1 .3.7V19a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z"
        fill="currentColor"
      />
      <path
        d="M6.5 5.5H12a1 1 0 0 1 .7.3l3.8 3.8a1 1 0 0 1 .3.7V19a2 2 0 0 1-2 2H6.5a2 2 0 0 1-2-2V7.5a2 2 0 0 1 2-2Z"
        fill="currentColor"
        stroke="var(--background)"
        strokeWidth="1"
      />
      <rect x="7.3" y="11.5" width="6.4" height="1.2" rx="0.6" fill="var(--background)" />
      <rect x="7.3" y="14.3" width="6.4" height="1.2" rx="0.6" fill="var(--background)" />
      <rect x="7.3" y="17.1" width="4" height="1.2" rx="0.6" fill="var(--background)" />
    </svg>
  );
}
