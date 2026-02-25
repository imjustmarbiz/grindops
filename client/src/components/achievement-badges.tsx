const S = 64;

function BadgeShell({ children, glow, id }: { children: React.ReactNode; glow: string; id: string }) {
  return (
    <div
      className="relative group cursor-default transition-transform duration-200 hover:scale-110"
      style={{ width: S, height: S, filter: `drop-shadow(0 0 6px ${glow})` }}
      data-testid={`badge-emblem-${id}`}
    >
      <svg viewBox="0 0 64 64" width={S} height={S} xmlns="http://www.w3.org/2000/svg">
        {children}
      </svg>
    </div>
  );
}

export function EliteBadge() {
  return (
    <BadgeShell glow="rgba(6,182,212,0.5)" id="elite">
      <defs>
        <linearGradient id="elite-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#0e7490" />
        </linearGradient>
        <linearGradient id="elite-inner" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#cffafe" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
      <polygon points="32,2 40,14 54,8 48,22 62,26 50,34 56,48 42,44 38,58 32,46 26,58 22,44 8,48 14,34 2,26 16,22 10,8 24,14" fill="url(#elite-g)" stroke="#a5f3fc" strokeWidth="1" />
      <circle cx="32" cy="30" r="12" fill="url(#elite-inner)" opacity="0.9" />
      <polygon points="32,21 34.5,27 41,27 36,31 38,37 32,33 26,37 28,31 23,27 29.5,27" fill="#0e7490" />
      <path d="M20,50 L32,56 L44,50" fill="none" stroke="#67e8f9" strokeWidth="1.5" strokeLinecap="round" />
    </BadgeShell>
  );
}

export function VeteranBadge() {
  return (
    <BadgeShell glow="rgba(245,158,11,0.5)" id="veteran">
      <defs>
        <linearGradient id="vet-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        <linearGradient id="vet-cross" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>
      <path d="M32,4 L38,18 L28,18 Z" fill="url(#vet-g)" />
      <path d="M32,60 L38,46 L28,46 Z" fill="url(#vet-g)" />
      <path d="M4,32 L18,26 L18,38 Z" fill="url(#vet-g)" />
      <path d="M60,32 L46,26 L46,38 Z" fill="url(#vet-g)" />
      <rect x="18" y="18" width="28" height="28" rx="3" fill="url(#vet-cross)" stroke="#92400e" strokeWidth="1" />
      <circle cx="32" cy="32" r="10" fill="#92400e" />
      <polygon points="32,24 34,29 39,29 35,33 37,38 32,35 27,38 29,33 25,29 30,29" fill="#fbbf24" />
      <path d="M12,12 L20,18" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M52,12 L44,18" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12,52 L20,46" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M52,52 L44,46" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
    </BadgeShell>
  );
}

export function FirstBloodBadge() {
  return (
    <BadgeShell glow="rgba(239,68,68,0.5)" id="first-order">
      <defs>
        <linearGradient id="fb-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="50%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
        <radialGradient id="fb-center" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#fef2f2" />
          <stop offset="100%" stopColor="#dc2626" />
        </radialGradient>
      </defs>
      <path d="M32,4 L26,24 L6,24 L22,36 L16,56 L32,44 L48,56 L42,36 L58,24 L38,24 Z" fill="url(#fb-g)" stroke="#fca5a5" strokeWidth="0.8" />
      <circle cx="32" cy="32" r="9" fill="url(#fb-center)" />
      <path d="M28,32 L32,24 L36,32 L32,28 Z" fill="#7f1d1d" />
      <path d="M32,36 L28,32 L36,32 Z" fill="#991b1b" />
    </BadgeShell>
  );
}

export function OnARollBadge() {
  return (
    <BadgeShell glow="rgba(249,115,22,0.5)" id="grind-5">
      <defs>
        <linearGradient id="roll-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#9a3412" />
        </linearGradient>
        <radialGradient id="roll-fire" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="60%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#9a3412" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="none" stroke="url(#roll-g)" strokeWidth="3" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="#9a3412" strokeWidth="1" />
      <path d="M32,50 C32,50 18,40 18,28 C18,20 24,16 28,18 C30,19 32,22 32,22 C32,22 34,19 36,18 C40,16 46,20 46,28 C46,40 32,50 32,50 Z" fill="url(#roll-fire)" />
      <path d="M32,46 C32,46 24,38 24,30 C24,26 27,24 29,25 C30,26 32,28 32,28 C32,28 34,26 35,25 C37,24 40,26 40,30 C40,38 32,46 32,46 Z" fill="#fef3c7" opacity="0.6" />
      <circle cx="32" cy="32" r="4" fill="#fef3c7" opacity="0.8" />
    </BadgeShell>
  );
}

export function GrindMachineBadge() {
  return (
    <BadgeShell glow="rgba(139,92,246,0.5)" id="grind-10">
      <defs>
        <linearGradient id="gm-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id="gm-inner" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ede9fe" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <polygon points="32,2 38,20 58,20 42,32 48,50 32,40 16,50 22,32 6,20 26,20" fill="url(#gm-g)" stroke="#c4b5fd" strokeWidth="0.8" />
      <circle cx="32" cy="28" r="11" fill="url(#gm-inner)" stroke="#4c1d95" strokeWidth="1" />
      <path d="M27,28 L30,22 L32,26 L34,22 L37,28" fill="none" stroke="#4c1d95" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M29,32 L35,32" stroke="#4c1d95" strokeWidth="1" strokeLinecap="round" />
      <path d="M20,52 L32,58 L44,52" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" />
      <circle cx="20" cy="52" r="2" fill="#c4b5fd" />
      <circle cx="44" cy="52" r="2" fill="#c4b5fd" />
      <circle cx="32" cy="58" r="2" fill="#c4b5fd" />
    </BadgeShell>
  );
}

export function LegendBadge() {
  return (
    <BadgeShell glow="rgba(234,179,8,0.6)" id="grind-50">
      <defs>
        <linearGradient id="leg-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="30%" stopColor="#eab308" />
          <stop offset="70%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#713f12" />
        </linearGradient>
        <linearGradient id="leg-wing" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>
      <path d="M2,30 Q8,10 24,18 L32,6 L40,18 Q56,10 62,30 L52,26 L48,42 L32,52 L16,42 L12,26 Z" fill="url(#leg-g)" stroke="#fef9c3" strokeWidth="0.8" />
      <path d="M2,30 Q8,18 20,22 L12,26 Z" fill="url(#leg-wing)" opacity="0.7" />
      <path d="M62,30 Q56,18 44,22 L52,26 Z" fill="url(#leg-wing)" opacity="0.7" />
      <circle cx="32" cy="30" r="10" fill="#713f12" stroke="#eab308" strokeWidth="1.5" />
      <path d="M32,22 L34,27 L39,27 L35,30.5 L37,35.5 L32,32 L27,35.5 L29,30.5 L25,27 L30,27 Z" fill="#eab308" />
      <path d="M22,48 L32,56 L42,48" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" />
      <path d="M18,52 L32,60 L46,52" fill="none" stroke="#713f12" strokeWidth="1.5" strokeLinecap="round" />
    </BadgeShell>
  );
}

export function PerfectionistBadge() {
  return (
    <BadgeShell glow="rgba(234,179,8,0.4)" id="quality">
      <defs>
        <linearGradient id="perf-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="50%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#854d0e" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="none" stroke="url(#perf-g)" strokeWidth="3" />
      <circle cx="32" cy="32" r="24" fill="none" stroke="#854d0e" strokeWidth="1.5" strokeDasharray="4 3" />
      <circle cx="32" cy="32" r="16" fill="#854d0e" stroke="#facc15" strokeWidth="1" />
      <polygon points="32,18 35,27 44,27 37,33 39,42 32,37 25,42 27,33 20,27 29,27" fill="#facc15" />
      <circle cx="32" cy="32" r="4" fill="#fef9c3" />
    </BadgeShell>
  );
}

export function SharpshooterBadge() {
  return (
    <BadgeShell glow="rgba(52,211,153,0.5)" id="sharp">
      <defs>
        <linearGradient id="ss-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
      </defs>
      <polygon points="32,2 42,22 62,22 46,36 52,56 32,44 12,56 18,36 2,22 22,22" fill="url(#ss-g)" stroke="#a7f3d0" strokeWidth="0.8" />
      <circle cx="32" cy="30" r="14" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
      <circle cx="32" cy="30" r="10" fill="none" stroke="#34d399" strokeWidth="1" />
      <circle cx="32" cy="30" r="6" fill="none" stroke="#34d399" strokeWidth="1" />
      <circle cx="32" cy="30" r="2.5" fill="#a7f3d0" />
      <line x1="32" y1="18" x2="32" y2="22" stroke="#34d399" strokeWidth="1" />
      <line x1="32" y1="38" x2="32" y2="42" stroke="#34d399" strokeWidth="1" />
      <line x1="20" y1="30" x2="24" y2="30" stroke="#34d399" strokeWidth="1" />
      <line x1="40" y1="30" x2="44" y2="30" stroke="#34d399" strokeWidth="1" />
    </BadgeShell>
  );
}

export function AlwaysOnTimeBadge() {
  return (
    <BadgeShell glow="rgba(59,130,246,0.5)" id="punctual">
      <defs>
        <linearGradient id="aot-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e3a5f" />
        </linearGradient>
        <linearGradient id="aot-face" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#dbeafe" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>
      </defs>
      <polygon points="32,4 44,12 52,4 50,18 62,24 50,30 54,44 42,40 32,52 22,40 10,44 14,30 2,24 14,18 12,4 20,12" fill="url(#aot-g)" stroke="#93c5fd" strokeWidth="0.8" />
      <circle cx="32" cy="28" r="13" fill="url(#aot-face)" stroke="#1e3a5f" strokeWidth="1.5" />
      <circle cx="32" cy="28" r="1.5" fill="#1e3a5f" />
      <line x1="32" y1="28" x2="32" y2="19" stroke="#1e3a5f" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="28" x2="39" y2="28" stroke="#1e3a5f" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M22,50 L32,58 L42,50" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
    </BadgeShell>
  );
}

export function IroncladBadge() {
  return (
    <BadgeShell glow="rgba(16,185,129,0.5)" id="reliable">
      <defs>
        <linearGradient id="ic-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6ee7b7" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
        <linearGradient id="ic-shield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d1fae5" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <path d="M32,4 L54,16 L54,36 Q54,52 32,60 Q10,52 10,36 L10,16 Z" fill="url(#ic-g)" stroke="#6ee7b7" strokeWidth="1" />
      <path d="M32,10 L48,20 L48,34 Q48,48 32,54 Q16,48 16,34 L16,20 Z" fill="url(#ic-shield)" stroke="#064e3b" strokeWidth="0.8" />
      <path d="M24,32 L30,38 L42,24" fill="none" stroke="#064e3b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </BadgeShell>
  );
}

export function CleanRecordBadge() {
  return (
    <BadgeShell glow="rgba(34,197,94,0.5)" id="clean">
      <defs>
        <linearGradient id="cr-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bbf7d0" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>
      </defs>
      <polygon points="32,2 38,12 50,6 46,18 60,20 50,28 58,40 46,38 42,50 32,42 22,50 18,38 6,40 14,28 4,20 18,18 14,6 26,12" fill="url(#cr-g)" stroke="#bbf7d0" strokeWidth="0.8" />
      <circle cx="32" cy="26" r="11" fill="#14532d" stroke="#22c55e" strokeWidth="1" />
      <path d="M26,26 L30,30 L38,22" fill="none" stroke="#bbf7d0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20,48 L32,56 L44,48" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
    </BadgeShell>
  );
}

export function MoneyMakerBadge() {
  return (
    <BadgeShell glow="rgba(16,185,129,0.4)" id="earn-500">
      <defs>
        <linearGradient id="mm-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="48" height="48" rx="6" fill="url(#mm-g)" stroke="#a7f3d0" strokeWidth="1" />
      <rect x="14" y="14" width="36" height="36" rx="3" fill="#064e3b" stroke="#10b981" strokeWidth="0.8" />
      <text x="32" y="38" textAnchor="middle" fill="#a7f3d0" fontSize="20" fontWeight="bold" fontFamily="serif">$</text>
      <path d="M14,8 L8,14" stroke="#6ee7b7" strokeWidth="1" />
      <path d="M50,8 L56,14" stroke="#6ee7b7" strokeWidth="1" />
      <path d="M14,56 L8,50" stroke="#6ee7b7" strokeWidth="1" />
      <path d="M50,56 L56,50" stroke="#6ee7b7" strokeWidth="1" />
    </BadgeShell>
  );
}

export function BigEarnerBadge() {
  return (
    <BadgeShell glow="rgba(168,85,247,0.5)" id="earn-2k">
      <defs>
        <linearGradient id="be-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="40%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#581c87" />
        </linearGradient>
        <linearGradient id="be-gem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5f3ff" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <polygon points="32,2 44,14 58,14 54,28 62,40 50,44 46,58 32,52 18,58 14,44 2,40 10,28 6,14 20,14" fill="url(#be-g)" stroke="#e9d5ff" strokeWidth="0.8" />
      <polygon points="32,14 40,24 40,36 32,44 24,36 24,24" fill="url(#be-gem)" stroke="#581c87" strokeWidth="1" />
      <line x1="32" y1="14" x2="32" y2="44" stroke="#581c87" strokeWidth="0.5" opacity="0.5" />
      <line x1="24" y1="24" x2="40" y2="24" stroke="#581c87" strokeWidth="0.5" opacity="0.5" />
      <line x1="24" y1="36" x2="40" y2="36" stroke="#581c87" strokeWidth="0.5" opacity="0.5" />
    </BadgeShell>
  );
}

export function FreshRecruitBadge() {
  return (
    <BadgeShell glow="rgba(56,189,248,0.4)" id="newbie">
      <defs>
        <linearGradient id="fr-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bae6fd" />
          <stop offset="50%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0c4a6e" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="26" fill="url(#fr-g)" stroke="#bae6fd" strokeWidth="1" />
      <circle cx="32" cy="32" r="20" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="1" />
      <polygon points="32,16 34,28 46,28 36,34 40,46 32,38 24,46 28,34 18,28 30,28" fill="#38bdf8" />
      <circle cx="32" cy="32" r="3" fill="#bae6fd" />
    </BadgeShell>
  );
}

export function LoyalBadge() {
  return (
    <BadgeShell glow="rgba(236,72,153,0.5)" id="loyal">
      <defs>
        <linearGradient id="loy-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#831843" />
        </linearGradient>
        <radialGradient id="loy-heart" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#fce7f3" />
          <stop offset="100%" stopColor="#db2777" />
        </radialGradient>
      </defs>
      <polygon points="32,2 42,10 52,4 50,16 62,20 54,30 58,42 46,42 40,54 32,46 24,54 18,42 6,42 10,30 2,20 14,16 12,4 22,10" fill="url(#loy-g)" stroke="#fbcfe8" strokeWidth="0.8" />
      <path d="M32,44 C32,44 16,34 16,24 C16,18 20,14 25,16 C28,17 32,22 32,22 C32,22 36,17 39,16 C44,14 48,18 48,24 C48,34 32,44 32,44 Z" fill="url(#loy-heart)" stroke="#831843" strokeWidth="0.8" />
    </BadgeShell>
  );
}

export function StreamerBadge() {
  return (
    <BadgeShell glow="rgba(147,51,234,0.5)" id="streamer">
      <defs>
        <linearGradient id="str-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d8b4fe" />
          <stop offset="50%" stopColor="#9333ea" />
          <stop offset="100%" stopColor="#581c87" />
        </linearGradient>
      </defs>
      <rect x="6" y="10" width="52" height="36" rx="4" fill="url(#str-g)" stroke="#d8b4fe" strokeWidth="1" />
      <rect x="12" y="16" width="40" height="24" rx="2" fill="#581c87" stroke="#9333ea" strokeWidth="0.8" />
      <polygon points="28,22 28,34 40,28" fill="#d8b4fe" />
      <path d="M20,50 L26,46 L38,46 L44,50" fill="none" stroke="#9333ea" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="32" cy="50" r="2" fill="#d8b4fe" />
    </BadgeShell>
  );
}

export type BadgeId =
  | "elite" | "veteran" | "first-order" | "grind-5" | "grind-10" | "grind-50"
  | "quality" | "sharp" | "punctual" | "reliable" | "clean"
  | "earn-500" | "earn-2k" | "newbie" | "loyal" | "streamer";

export const BADGE_COMPONENTS: Record<BadgeId, () => JSX.Element> = {
  "elite": EliteBadge,
  "veteran": VeteranBadge,
  "first-order": FirstBloodBadge,
  "grind-5": OnARollBadge,
  "grind-10": GrindMachineBadge,
  "grind-50": LegendBadge,
  "quality": PerfectionistBadge,
  "sharp": SharpshooterBadge,
  "punctual": AlwaysOnTimeBadge,
  "reliable": IroncladBadge,
  "clean": CleanRecordBadge,
  "earn-500": MoneyMakerBadge,
  "earn-2k": BigEarnerBadge,
  "newbie": FreshRecruitBadge,
  "loyal": LoyalBadge,
  "streamer": StreamerBadge,
};

export const BADGE_META: Record<BadgeId, { label: string; tooltip: string }> = {
  "elite": { label: "Elite", tooltip: "Elite Grinder status achieved" },
  "veteran": { label: "Veteran", tooltip: "20+ orders completed" },
  "first-order": { label: "First Blood", tooltip: "Completed your first order" },
  "grind-5": { label: "On a Roll", tooltip: "5+ orders completed" },
  "grind-10": { label: "Grind Machine", tooltip: "10+ orders completed" },
  "grind-50": { label: "Legend", tooltip: "50+ orders completed" },
  "quality": { label: "Perfectionist", tooltip: "95%+ quality score" },
  "sharp": { label: "Sharpshooter", tooltip: "80%+ bid win rate" },
  "punctual": { label: "Always On Time", tooltip: "100% on-time delivery" },
  "reliable": { label: "Ironclad", tooltip: "100% completion rate" },
  "clean": { label: "Clean Record", tooltip: "Zero strikes with 5+ orders" },
  "earn-500": { label: "Money Maker", tooltip: "$500+ total earnings" },
  "earn-2k": { label: "Big Earner", tooltip: "$2,000+ total earnings" },
  "newbie": { label: "Fresh Recruit", tooltip: "Joined within the last 7 days" },
  "loyal": { label: "Loyal", tooltip: "Active for 90+ days" },
  "streamer": { label: "Streamer", tooltip: "Twitch account linked" },
};
