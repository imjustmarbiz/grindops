/**
 * GrindOps wordmark: GRIND⚡OPS — single unified logo, transparent SVG.
 * Use className to control size (e.g. h-24 w-auto).
 */
import { useId } from "react";

export function GrindOpsLogo({ className = "h-12 w-auto" }: { className?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 165 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="GrindOps"
    >
      <defs>
        <linearGradient id={`grindops-bolt-${id}`} x1="86" y1="4" x2="98" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#EAB308" />
          <stop offset="1" stopColor="#FACC15" />
        </linearGradient>
      </defs>
      {/* GRIND ⚡ OPS — equal ~5px gap between elements */}
      <text
        x="0"
        y="32"
        fill="currentColor"
        fontFamily="var(--font-display), 'Outfit', sans-serif"
        fontSize="26"
        fontWeight="700"
        fontStyle="italic"
        letterSpacing="-0.02em"
      >
        GRIND
      </text>
      {/* Lightning bolt */}
      <path
        d="M100 4L88 22L96 22L92 36L104 18L98 18L100 4z"
        fill={`url(#grindops-bolt-${id})`}
        stroke={`url(#grindops-bolt-${id})`}
        strokeWidth="0.4"
        strokeLinejoin="round"
      />
      <text
        x="106"
        y="32"
        fill="currentColor"
        fontFamily="var(--font-display), 'Outfit', sans-serif"
        fontSize="26"
        fontWeight="700"
        fontStyle="italic"
        letterSpacing="-0.02em"
      >
        OPS
      </text>
    </svg>
  );
}
