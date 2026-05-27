type LogoProps = {
  className?: string
  alt?: string
}

export default function Logo({ className = '', alt = 'CompressIQ logo' }: LogoProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      role="img"
      aria-label={alt}
      className={`w-full h-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="104" height="104" rx="24" fill="url(#grad)" opacity="0.95" />
      <path d="M22 32 H98 a10 10 0 0 1 10 10 v36 a10 10 0 0 1 -10 10 H22 a10 10 0 0 1 -10 -10 V42 a10 10 0 0 1 10 -10 Z" fill="rgba(255,255,255,0.08)" />
      <rect x="28" y="40" width="64" height="16" rx="6" fill="white" opacity="0.95" />
      <rect x="28" y="60" width="64" height="16" rx="6" fill="white" opacity="0.95" />
      <rect x="28" y="80" width="64" height="16" rx="6" fill="white" opacity="0.95" />
      <path d="M36 30 H84" stroke="white" strokeWidth="6" strokeLinecap="round" />
      <path d="M36 28 V22 H84 V28" stroke="white" strokeWidth="6" strokeLinecap="round" />
      <circle cx="60" cy="60" r="10" fill="#2563eb" stroke="white" strokeWidth="4" />
      <g stroke="white" strokeWidth="4" strokeLinecap="round" opacity="0.8">
        <line x1="16" y1="42" x2="28" y2="42" />
        <line x1="16" y1="60" x2="28" y2="60" />
        <line x1="16" y1="78" x2="28" y2="78" />
        <line x1="104" y1="42" x2="108" y2="42" />
        <line x1="104" y1="60" x2="108" y2="60" />
        <line x1="104" y1="78" x2="108" y2="78" />
      </g>
    </svg>
  )
}
