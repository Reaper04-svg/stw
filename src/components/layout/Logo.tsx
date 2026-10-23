export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M24 2.75 42.5 13.4v21.2L24 45.25 5.5 34.6V13.4L24 2.75Z"
        fill="#0b0e13"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M24 7.6 38.2 15.8v16.4L24 40.4 9.8 32.2V15.8L24 7.6Z"
        fill="currentColor"
        fillOpacity="0.08"
        stroke="currentColor"
        strokeOpacity="0.45"
        strokeWidth="0.9"
      />
      <path
        d="m16.2 29.3 7.8-15.1 7.8 15.1"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M20 24.2h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
      <circle cx="24" cy="18.3" r="1.55" fill="currentColor" />
      <path d="M9.8 12.6v-2h2M38.2 12.6v-2h-2M9.8 35.4v2h2M38.2 35.4v2h-2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
    </svg>
  )
}
