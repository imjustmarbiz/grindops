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

export function CenturionBadge() {
  return (
    <BadgeShell glow="rgba(168,85,247,0.6)" id="grind-50">
      <defs>
        <linearGradient id="cent-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="40%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#581c87" />
        </linearGradient>
        <linearGradient id="cent-inner" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5f3ff" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <path d="M32,2 L54,16 L54,36 Q54,52 32,60 Q10,52 10,36 L10,16 Z" fill="url(#cent-g)" stroke="#e9d5ff" strokeWidth="1" />
      <path d="M32,10 L46,20 L46,34 Q46,46 32,52 Q18,46 18,34 L18,20 Z" fill="#581c87" stroke="#a855f7" strokeWidth="0.8" />
      <text x="32" y="36" textAnchor="middle" fill="#e9d5ff" fontSize="16" fontWeight="bold" fontFamily="sans-serif">50</text>
      <polygon points="28,14 32,8 36,14" fill="#c084fc" stroke="#581c87" strokeWidth="0.5" />
    </BadgeShell>
  );
}

export function GrindMasterBadge() {
  return (
    <BadgeShell glow="rgba(234,88,12,0.6)" id="grind-100">
      <defs>
        <linearGradient id="gm100-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="40%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>
        <radialGradient id="gm100-center" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#fff7ed" />
          <stop offset="100%" stopColor="#f97316" />
        </radialGradient>
      </defs>
      <polygon points="32,2 40,14 54,8 48,22 62,26 50,34 56,48 42,44 38,58 32,46 26,58 22,44 8,48 14,34 2,26 16,22 10,8 24,14" fill="url(#gm100-g)" stroke="#fed7aa" strokeWidth="1" />
      <circle cx="32" cy="30" r="13" fill="url(#gm100-center)" stroke="#7c2d12" strokeWidth="1.5" />
      <text x="32" y="35" textAnchor="middle" fill="#7c2d12" fontSize="14" fontWeight="bold" fontFamily="sans-serif">100</text>
    </BadgeShell>
  );
}

export function LegendBadge() {
  return (
    <BadgeShell glow="rgba(234,179,8,0.6)" id="grind-250">
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

export function TitanBadge() {
  return (
    <BadgeShell glow="rgba(220,38,38,0.7)" id="grind-500">
      <defs>
        <linearGradient id="titan-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fecaca" />
          <stop offset="30%" stopColor="#dc2626" />
          <stop offset="70%" stopColor="#991b1b" />
          <stop offset="100%" stopColor="#450a0a" />
        </linearGradient>
        <radialGradient id="titan-core" cx="50%" cy="45%">
          <stop offset="0%" stopColor="#fef2f2" />
          <stop offset="50%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#dc2626" />
        </radialGradient>
      </defs>
      <polygon points="32,1 40,12 52,4 50,18 63,22 54,32 60,46 46,44 40,58 32,48 24,58 18,44 4,46 10,32 1,22 14,18 12,4 24,12" fill="url(#titan-g)" stroke="#fecaca" strokeWidth="1" />
      <circle cx="32" cy="30" r="14" fill="url(#titan-core)" stroke="#450a0a" strokeWidth="1.5" />
      <polygon points="32,18 35,26 43,26 37,31 39,39 32,34 25,39 27,31 21,26 29,26" fill="#450a0a" />
      <polygon points="32,22 34,27 38,27 35,30 36,34 32,32 28,34 29,30 26,27 30,27" fill="#fecaca" />
      <path d="M18,54 L32,62 L46,54" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
      <path d="M14,52 L32,60 L50,52" fill="none" stroke="#991b1b" strokeWidth="1" strokeLinecap="round" />
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

export function CashKingBadge() {
  return (
    <BadgeShell glow="rgba(234,179,8,0.5)" id="earn-5k">
      <defs>
        <linearGradient id="ck5-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#713f12" />
        </linearGradient>
      </defs>
      <polygon points="32,2 42,10 52,4 50,16 62,20 54,30 58,42 46,42 40,54 32,46 24,54 18,42 6,42 10,30 2,20 14,16 12,4 22,10" fill="url(#ck5-g)" stroke="#fef9c3" strokeWidth="0.8" />
      <circle cx="32" cy="28" r="12" fill="#713f12" stroke="#eab308" strokeWidth="1.5" />
      <text x="32" y="33" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="bold" fontFamily="sans-serif">$5K</text>
      <polygon points="28,8 32,2 36,8" fill="#fbbf24" stroke="#713f12" strokeWidth="0.5" />
    </BadgeShell>
  );
}

export function FortuneBuilderBadge() {
  return (
    <BadgeShell glow="rgba(217,119,6,0.5)" id="earn-10k">
      <defs>
        <linearGradient id="fb10-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="30%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id="fb10-bar" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>
      <path d="M32,4 L54,16 L54,36 Q54,52 32,60 Q10,52 10,36 L10,16 Z" fill="url(#fb10-g)" stroke="#fef3c7" strokeWidth="1" />
      <path d="M32,12 L46,20 L46,34 Q46,46 32,52 Q18,46 18,34 L18,20 Z" fill="#78350f" stroke="#d97706" strokeWidth="0.8" />
      <rect x="22" y="26" width="6" height="16" rx="1" fill="url(#fb10-bar)" opacity="0.6" />
      <rect x="29" y="22" width="6" height="20" rx="1" fill="url(#fb10-bar)" opacity="0.8" />
      <rect x="36" y="18" width="6" height="24" rx="1" fill="url(#fb10-bar)" />
      <text x="32" y="16" textAnchor="middle" fill="#fef9c3" fontSize="8" fontWeight="bold">$10K</text>
    </BadgeShell>
  );
}

export function EmpireBadge() {
  return (
    <BadgeShell glow="rgba(234,179,8,0.7)" id="earn-25k">
      <defs>
        <linearGradient id="emp-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="30%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#713f12" />
        </linearGradient>
        <linearGradient id="emp-inner" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
      <polygon points="32,1 40,12 52,4 50,18 63,22 54,32 60,46 46,44 40,58 32,48 24,58 18,44 4,46 10,32 1,22 14,18 12,4 24,12" fill="url(#emp-g)" stroke="#fef9c3" strokeWidth="1" />
      <rect x="22" y="24" width="20" height="20" rx="2" fill="url(#emp-inner)" stroke="#713f12" strokeWidth="1" />
      <polygon points="28,22 32,16 36,22" fill="#713f12" />
      <text x="32" y="38" textAnchor="middle" fill="#713f12" fontSize="10" fontWeight="bold" fontFamily="sans-serif">$25K</text>
    </BadgeShell>
  );
}

export function HighRollerBadge() {
  return (
    <BadgeShell glow="rgba(217,119,6,0.6)" id="earn-50k">
      <defs>
        <linearGradient id="hr-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="30%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#hr-g)" stroke="#fef3c7" strokeWidth="1" />
      <circle cx="32" cy="32" r="22" fill="#78350f" stroke="#d97706" strokeWidth="1.5" />
      <text x="32" y="37" textAnchor="middle" fill="#fbbf24" fontSize="14" fontWeight="bold" fontFamily="sans-serif">$50K</text>
    </BadgeShell>
  );
}

export function MogulBadge() {
  return (
    <BadgeShell glow="rgba(220,38,38,0.6)" id="earn-100k">
      <defs>
        <linearGradient id="mog-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fecaca" />
          <stop offset="30%" stopColor="#dc2626" />
          <stop offset="60%" stopColor="#991b1b" />
          <stop offset="100%" stopColor="#450a0a" />
        </linearGradient>
        <radialGradient id="mog-gem" cx="50%" cy="45%">
          <stop offset="0%" stopColor="#fef2f2" />
          <stop offset="100%" stopColor="#f87171" />
        </radialGradient>
      </defs>
      <polygon points="32,1 40,12 52,4 50,18 63,22 54,32 60,46 46,44 40,58 32,48 24,58 18,44 4,46 10,32 1,22 14,18 12,4 24,12" fill="url(#mog-g)" stroke="#fecaca" strokeWidth="1.2" />
      <polygon points="32,12 42,22 42,36 32,46 22,36 22,22" fill="url(#mog-gem)" stroke="#450a0a" strokeWidth="1.2" />
      <line x1="32" y1="12" x2="32" y2="46" stroke="#450a0a" strokeWidth="0.5" opacity="0.4" />
      <line x1="22" y1="22" x2="42" y2="22" stroke="#450a0a" strokeWidth="0.5" opacity="0.4" />
      <line x1="22" y1="36" x2="42" y2="36" stroke="#450a0a" strokeWidth="0.5" opacity="0.4" />
      <text x="32" y="32" textAnchor="middle" fill="#450a0a" fontSize="8" fontWeight="bold">$100K</text>
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

export function SeasonedBadge() {
  return (
    <BadgeShell glow="rgba(217,119,6,0.4)" id="loyal-6m">
      <defs>
        <linearGradient id="sea-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="50%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#sea-g)" stroke="#fed7aa" strokeWidth="1" />
      <circle cx="32" cy="32" r="22" fill="#7c2d12" stroke="#ea580c" strokeWidth="1" />
      <circle cx="32" cy="32" r="1.5" fill="#fed7aa" />
      <line x1="32" y1="32" x2="32" y2="16" stroke="#fed7aa" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="32" x2="44" y2="38" stroke="#fed7aa" strokeWidth="1.5" strokeLinecap="round" />
      <text x="32" y="50" textAnchor="middle" fill="#fed7aa" fontSize="8" fontWeight="bold">6M</text>
    </BadgeShell>
  );
}

export function DedicatedBadge() {
  return (
    <BadgeShell glow="rgba(139,92,246,0.5)" id="loyal-1y">
      <defs>
        <linearGradient id="ded-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id="ded-shield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ede9fe" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <path d="M32,4 L54,16 L54,36 Q54,52 32,60 Q10,52 10,36 L10,16 Z" fill="url(#ded-g)" stroke="#c4b5fd" strokeWidth="1" />
      <path d="M32,12 L46,20 L46,34 Q46,46 32,52 Q18,46 18,34 L18,20 Z" fill="url(#ded-shield)" stroke="#4c1d95" strokeWidth="0.8" />
      <text x="32" y="36" textAnchor="middle" fill="#4c1d95" fontSize="14" fontWeight="bold" fontFamily="sans-serif">1Y</text>
    </BadgeShell>
  );
}

export function LiferBadge() {
  return (
    <BadgeShell glow="rgba(234,179,8,0.6)" id="loyal-2y">
      <defs>
        <linearGradient id="lif-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="30%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#713f12" />
        </linearGradient>
      </defs>
      <polygon points="32,2 42,10 52,4 50,16 62,20 54,30 58,42 46,42 40,54 32,46 24,54 18,42 6,42 10,30 2,20 14,16 12,4 22,10" fill="url(#lif-g)" stroke="#fef9c3" strokeWidth="0.8" />
      <circle cx="32" cy="28" r="12" fill="#713f12" stroke="#eab308" strokeWidth="1.5" />
      <text x="32" y="33" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="bold" fontFamily="sans-serif">2Y</text>
      <path d="M20,48 L32,56 L44,48" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" />
    </BadgeShell>
  );
}

export function EternalBadge() {
  return (
    <BadgeShell glow="rgba(220,38,38,0.7)" id="loyal-5y">
      <defs>
        <linearGradient id="ete-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fecaca" />
          <stop offset="20%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#450a0a" />
        </linearGradient>
        <radialGradient id="ete-core" cx="50%" cy="45%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="100%" stopColor="#eab308" />
        </radialGradient>
      </defs>
      <polygon points="32,1 40,12 52,4 50,18 63,22 54,32 60,46 46,44 40,58 32,48 24,58 18,44 4,46 10,32 1,22 14,18 12,4 24,12" fill="url(#ete-g)" stroke="#fef9c3" strokeWidth="1.2" />
      <circle cx="32" cy="30" r="14" fill="url(#ete-core)" stroke="#450a0a" strokeWidth="1.5" />
      <text x="32" y="35" textAnchor="middle" fill="#450a0a" fontSize="14" fontWeight="bold" fontFamily="sans-serif">5Y</text>
      <path d="M18,54 L32,62 L46,54" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
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

export function RushHeroBadge() {
  return (
    <BadgeShell glow="rgba(239,68,68,0.6)" id="rush-hero">
      <defs>
        <linearGradient id="rh-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="50%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
      </defs>
      <path d="M32,4 L54,16 L54,36 Q54,52 32,60 Q10,52 10,36 L10,16 Z" fill="url(#rh-g)" stroke="#fca5a5" strokeWidth="1" />
      <path d="M32,12 L46,20 L46,34 Q46,46 32,52 Q18,46 18,34 L18,20 Z" fill="#7f1d1d" stroke="#ef4444" strokeWidth="0.8" />
      <polygon points="32,18 28,28 20,28 26,34 24,44 32,38 40,44 38,34 44,28 36,28" fill="#fca5a5" />
      <path d="M26,22 L22,16" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M38,22 L42,16" stroke="#fca5a5" strokeWidth="1.5" strokeLinecap="round" />
    </BadgeShell>
  );
}

export function ClutchPlayerBadge() {
  return (
    <BadgeShell glow="rgba(251,191,36,0.5)" id="clutch">
      <defs>
        <linearGradient id="cl-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#cl-g)" stroke="#fef3c7" strokeWidth="1" />
      <circle cx="32" cy="32" r="22" fill="#78350f" stroke="#fbbf24" strokeWidth="1.5" />
      <path d="M22,38 L28,24 L32,32 L36,20 L42,38" fill="none" stroke="#fbbf24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="32" cy="32" r="3" fill="#fef3c7" />
    </BadgeShell>
  );
}

export function MultiTaskerBadge() {
  return (
    <BadgeShell glow="rgba(99,102,241,0.5)" id="multi-tasker">
      <defs>
        <linearGradient id="mt-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c7d2fe" />
          <stop offset="50%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#312e81" />
        </linearGradient>
      </defs>
      <polygon points="32,2 44,10 56,6 52,20 62,30 52,38 56,52 44,48 32,58 20,48 8,52 12,38 2,30 12,20 8,6 20,10" fill="url(#mt-g)" stroke="#c7d2fe" strokeWidth="0.8" />
      <rect x="20" y="20" width="10" height="10" rx="2" fill="#c7d2fe" stroke="#312e81" strokeWidth="0.8" />
      <rect x="34" y="20" width="10" height="10" rx="2" fill="#c7d2fe" stroke="#312e81" strokeWidth="0.8" />
      <rect x="27" y="34" width="10" height="10" rx="2" fill="#c7d2fe" stroke="#312e81" strokeWidth="0.8" />
      <path d="M25,25 L28,28" stroke="#312e81" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M39,25 L42,28" stroke="#312e81" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M32,39 L35,42" stroke="#312e81" strokeWidth="1.5" strokeLinecap="round" />
    </BadgeShell>
  );
}

export function CommunicatorBadge() {
  return (
    <BadgeShell glow="rgba(34,211,238,0.4)" id="communicator">
      <defs>
        <linearGradient id="comm-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="50%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#164e63" />
        </linearGradient>
      </defs>
      <rect x="6" y="10" width="52" height="38" rx="8" fill="url(#comm-g)" stroke="#a5f3fc" strokeWidth="1" />
      <rect x="12" y="16" width="40" height="26" rx="4" fill="#164e63" stroke="#22d3ee" strokeWidth="0.8" />
      <path d="M18,24 L46,24" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" />
      <path d="M18,30 L38,30" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" />
      <path d="M18,36 L30,36" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" />
      <polygon points="20,48 28,48 24,56" fill="url(#comm-g)" />
    </BadgeShell>
  );
}

export function TeamPlayerBadge() {
  return (
    <BadgeShell glow="rgba(59,130,246,0.5)" id="team-player">
      <defs>
        <linearGradient id="tp-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e3a5f" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#tp-g)" stroke="#93c5fd" strokeWidth="1" />
      <circle cx="32" cy="32" r="22" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="1" />
      <circle cx="24" cy="26" r="5" fill="#93c5fd" />
      <circle cx="40" cy="26" r="5" fill="#93c5fd" />
      <circle cx="32" cy="38" r="5" fill="#93c5fd" />
      <line x1="24" y1="26" x2="40" y2="26" stroke="#60a5fa" strokeWidth="1.5" />
      <line x1="24" y1="26" x2="32" y2="38" stroke="#60a5fa" strokeWidth="1.5" />
      <line x1="40" y1="26" x2="32" y2="38" stroke="#60a5fa" strokeWidth="1.5" />
    </BadgeShell>
  );
}

export function NightOwlBadge() {
  return (
    <BadgeShell glow="rgba(99,102,241,0.4)" id="night-owl">
      <defs>
        <linearGradient id="no-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#1e1b4b" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#no-g)" stroke="#818cf8" strokeWidth="1" />
      <circle cx="32" cy="32" r="22" fill="#1e1b4b" stroke="#4f46e5" strokeWidth="1" />
      <path d="M36,18 Q44,22 44,32 Q44,42 36,46 Q28,42 28,32 Q28,22 36,18 Z" fill="#818cf8" opacity="0.8" />
      <circle cx="18" cy="20" r="1.5" fill="#c7d2fe" />
      <circle cx="22" cy="14" r="1" fill="#c7d2fe" />
      <circle cx="48" cy="22" r="1.5" fill="#c7d2fe" />
      <circle cx="14" cy="40" r="1" fill="#c7d2fe" />
      <circle cx="50" cy="42" r="1" fill="#c7d2fe" />
    </BadgeShell>
  );
}

export function SpeedDemonBadge() {
  return (
    <BadgeShell glow="rgba(249,115,22,0.5)" id="speed-demon">
      <defs>
        <linearGradient id="sd-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fdba74" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>
      </defs>
      <polygon points="32,2 44,14 58,18 50,30 56,46 42,42 32,58 22,42 8,46 14,30 6,18 20,14" fill="url(#sd-g)" stroke="#fdba74" strokeWidth="0.8" />
      <polygon points="26,18 36,18 28,34 38,34 22,52 30,36 20,36" fill="#fef3c7" stroke="#7c2d12" strokeWidth="0.8" />
    </BadgeShell>
  );
}

export function CustomerFavBadge() {
  return (
    <BadgeShell glow="rgba(251,191,36,0.5)" id="customer-fav">
      <defs>
        <linearGradient id="cf-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
      </defs>
      <polygon points="32,4 38,22 58,22 42,34 48,52 32,42 16,52 22,34 6,22 26,22" fill="url(#cf-g)" stroke="#fef3c7" strokeWidth="0.8" />
      <circle cx="32" cy="28" r="8" fill="#92400e" stroke="#fbbf24" strokeWidth="1" />
      <path d="M32,22 C32,22 28,24 28,28 C28,32 32,34 32,34 C32,34 36,32 36,28 C36,24 32,22 32,22 Z" fill="#fbbf24" />
      <path d="M20,48 L32,56 L44,48" fill="none" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
    </BadgeShell>
  );
}

export function MentorBadge() {
  return (
    <BadgeShell glow="rgba(20,184,166,0.5)" id="mentor">
      <defs>
        <linearGradient id="men-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#99f6e4" />
          <stop offset="50%" stopColor="#14b8a6" />
          <stop offset="100%" stopColor="#134e4a" />
        </linearGradient>
      </defs>
      <path d="M32,4 L54,16 L54,36 Q54,52 32,60 Q10,52 10,36 L10,16 Z" fill="url(#men-g)" stroke="#99f6e4" strokeWidth="1" />
      <path d="M32,12 L46,20 L46,34 Q46,46 32,52 Q18,46 18,34 L18,20 Z" fill="#134e4a" stroke="#14b8a6" strokeWidth="0.8" />
      <circle cx="32" cy="26" r="6" fill="#99f6e4" />
      <path d="M26,36 L32,42 L38,36" fill="none" stroke="#99f6e4" strokeWidth="2" strokeLinecap="round" />
      <path d="M24,28 L18,24" stroke="#5eead4" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M40,28 L46,24" stroke="#5eead4" strokeWidth="1.5" strokeLinecap="round" />
    </BadgeShell>
  );
}

export function DiamondHandsBadge() {
  return (
    <BadgeShell glow="rgba(56,189,248,0.6)" id="diamond-hands">
      <defs>
        <linearGradient id="dh-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e0f2fe" />
          <stop offset="30%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#0c4a6e" />
        </linearGradient>
        <linearGradient id="dh-gem" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f0f9ff" />
          <stop offset="100%" stopColor="#7dd3fc" />
        </linearGradient>
      </defs>
      <polygon points="32,2 44,14 58,14 54,28 62,40 50,44 46,58 32,52 18,58 14,44 2,40 10,28 6,14 20,14" fill="url(#dh-g)" stroke="#bae6fd" strokeWidth="0.8" />
      <polygon points="32,12 42,22 42,36 32,46 22,36 22,22" fill="url(#dh-gem)" stroke="#0c4a6e" strokeWidth="1.2" />
      <line x1="32" y1="12" x2="32" y2="46" stroke="#0369a1" strokeWidth="0.6" opacity="0.4" />
      <line x1="22" y1="22" x2="42" y2="22" stroke="#0369a1" strokeWidth="0.6" opacity="0.4" />
      <line x1="22" y1="36" x2="42" y2="36" stroke="#0369a1" strokeWidth="0.6" opacity="0.4" />
      <line x1="22" y1="22" x2="32" y2="46" stroke="#0369a1" strokeWidth="0.4" opacity="0.3" />
      <line x1="42" y1="22" x2="32" y2="46" stroke="#0369a1" strokeWidth="0.4" opacity="0.3" />
    </BadgeShell>
  );
}

export function ConsoleKingBadge() {
  return (
    <BadgeShell glow="rgba(34,197,94,0.5)" id="console-king">
      <defs>
        <linearGradient id="ck-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bbf7d0" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>
      </defs>
      <rect x="8" y="12" width="48" height="32" rx="4" fill="url(#ck-g)" stroke="#bbf7d0" strokeWidth="1" />
      <rect x="14" y="18" width="36" height="20" rx="2" fill="#14532d" stroke="#22c55e" strokeWidth="0.8" />
      <circle cx="24" cy="28" r="4" fill="none" stroke="#4ade80" strokeWidth="1.5" />
      <line x1="24" y1="24" x2="24" y2="32" stroke="#4ade80" strokeWidth="1" />
      <line x1="20" y1="28" x2="28" y2="28" stroke="#4ade80" strokeWidth="1" />
      <circle cx="40" cy="26" r="2" fill="#4ade80" />
      <circle cx="44" cy="30" r="2" fill="#4ade80" />
      <path d="M24,48 L32,52 L40,48" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" />
      <polygon points="28,8 32,2 36,8" fill="#fbbf24" stroke="#92400e" strokeWidth="0.5" />
    </BadgeShell>
  );
}

export function ZeroComplaintsBadge() {
  return (
    <BadgeShell glow="rgba(16,185,129,0.4)" id="zero-complaints">
      <defs>
        <linearGradient id="zc-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d1fae5" />
          <stop offset="50%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#064e3b" />
        </linearGradient>
      </defs>
      <polygon points="32,4 44,10 52,4 50,18 62,22 52,32 56,46 44,42 32,54 20,42 8,46 12,32 2,22 14,18 12,4 20,10" fill="url(#zc-g)" stroke="#d1fae5" strokeWidth="0.8" />
      <circle cx="32" cy="28" r="12" fill="#064e3b" stroke="#10b981" strokeWidth="1" />
      <path d="M26,28 L30,32 L38,24" fill="none" stroke="#6ee7b7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <text x="32" y="48" textAnchor="middle" fill="#a7f3d0" fontSize="8" fontWeight="bold">0</text>
    </BadgeShell>
  );
}

export function VCGrinderBadge() {
  return (
    <BadgeShell glow="rgba(234,179,8,0.5)" id="vc-grinder">
      <defs>
        <linearGradient id="vcg-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="40%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#713f12" />
        </linearGradient>
        <radialGradient id="vcg-coin" cx="50%" cy="50%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="100%" stopColor="#ca8a04" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#vcg-g)" stroke="#fef9c3" strokeWidth="1" />
      <circle cx="32" cy="32" r="20" fill="url(#vcg-coin)" stroke="#713f12" strokeWidth="1.5" />
      <circle cx="32" cy="32" r="16" fill="none" stroke="#713f12" strokeWidth="0.8" strokeDasharray="3 2" />
      <text x="32" y="38" textAnchor="middle" fill="#713f12" fontSize="18" fontWeight="bold" fontFamily="serif">V</text>
      <path d="M18,50 L32,58 L46,50" fill="none" stroke="#ca8a04" strokeWidth="1.5" strokeLinecap="round" />
    </BadgeShell>
  );
}

export function EventGrinderBadge() {
  return (
    <BadgeShell glow="rgba(59,130,246,0.5)" id="event-grinder">
      <defs>
        <linearGradient id="evg-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="50%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1e3a5f" />
        </linearGradient>
      </defs>
      <path d="M32,4 L54,16 L54,36 Q54,52 32,60 Q10,52 10,36 L10,16 Z" fill="url(#evg-g)" stroke="#93c5fd" strokeWidth="1" />
      <path d="M32,12 L46,20 L46,34 Q46,46 32,52 Q18,46 18,34 L18,20 Z" fill="#1e3a5f" stroke="#3b82f6" strokeWidth="0.8" />
      <rect x="24" y="20" width="16" height="18" rx="2" fill="none" stroke="#93c5fd" strokeWidth="1.5" />
      <line x1="24" y1="26" x2="40" y2="26" stroke="#93c5fd" strokeWidth="1" />
      <line x1="30" y1="20" x2="30" y2="24" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="34" y1="20" x2="34" y2="24" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />
      <polygon points="29,30 32,28 35,30 34,34 30,34" fill="#60a5fa" />
    </BadgeShell>
  );
}

export function InternationalGrinderBadge() {
  return (
    <BadgeShell glow="rgba(236,72,153,0.5)" id="international-grinder">
      <defs>
        <linearGradient id="intg-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="50%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#831843" />
        </linearGradient>
        <linearGradient id="intg-globe" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fce7f3" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
      </defs>
      <polygon points="32,2 42,10 52,4 50,16 62,20 54,30 58,42 46,42 40,54 32,46 24,54 18,42 6,42 10,30 2,20 14,16 12,4 22,10" fill="url(#intg-g)" stroke="#fbcfe8" strokeWidth="0.8" />
      <circle cx="32" cy="28" r="14" fill="url(#intg-globe)" stroke="#831843" strokeWidth="1" />
      <ellipse cx="32" cy="28" rx="6" ry="14" fill="none" stroke="#831843" strokeWidth="0.8" />
      <line x1="18" y1="28" x2="46" y2="28" stroke="#831843" strokeWidth="0.8" />
      <line x1="20" y1="22" x2="44" y2="22" stroke="#831843" strokeWidth="0.5" />
      <line x1="20" y1="34" x2="44" y2="34" stroke="#831843" strokeWidth="0.5" />
      <path d="M22,48 L32,56 L42,48" fill="none" stroke="#ec4899" strokeWidth="1.5" strokeLinecap="round" />
    </BadgeShell>
  );
}

export function XboxGrinderBadge() {
  return (
    <BadgeShell glow="rgba(34,197,94,0.5)" id="xbox-grinder">
      <defs>
        <linearGradient id="xbg-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bbf7d0" />
          <stop offset="50%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>
        <radialGradient id="xbg-btn" cx="50%" cy="45%">
          <stop offset="0%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#16a34a" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#xbg-g)" stroke="#bbf7d0" strokeWidth="1" />
      <circle cx="32" cy="30" r="18" fill="url(#xbg-btn)" stroke="#14532d" strokeWidth="2" />
      <circle cx="32" cy="30" r="15" fill="none" stroke="#dcfce7" strokeWidth="0.8" opacity="0.4" />
      <text x="32" y="37" textAnchor="middle" fill="#dcfce7" fontSize="22" fontWeight="bold" fontFamily="sans-serif">A</text>
      <path d="M18,54 L32,60 L46,54" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" />
    </BadgeShell>
  );
}

export function PS5GrinderBadge() {
  return (
    <BadgeShell glow="rgba(59,130,246,0.6)" id="ps5-grinder">
      <defs>
        <linearGradient id="psg-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#bfdbfe" />
          <stop offset="40%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e3a5f" />
        </linearGradient>
        <radialGradient id="psg-btn" cx="50%" cy="45%">
          <stop offset="0%" stopColor="#60a5fa" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#psg-g)" stroke="#93c5fd" strokeWidth="1" />
      <circle cx="32" cy="30" r="18" fill="url(#psg-btn)" stroke="#1e3a5f" strokeWidth="2" />
      <circle cx="32" cy="30" r="15" fill="none" stroke="#dbeafe" strokeWidth="0.8" opacity="0.4" />
      <path d="M24,22 L40,38" stroke="#dbeafe" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M40,22 L24,38" stroke="#dbeafe" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M18,54 L32,60 L46,54" fill="none" stroke="#2563eb" strokeWidth="1.5" strokeLinecap="round" />
    </BadgeShell>
  );
}

export function VersatileBadge() {
  return (
    <BadgeShell glow="rgba(244,114,182,0.5)" id="versatile">
      <defs>
        <linearGradient id="vers-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fbcfe8" />
          <stop offset="40%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#831843" />
        </linearGradient>
      </defs>
      <polygon points="32,2 44,10 56,6 52,20 62,30 52,38 56,52 44,48 32,58 20,48 8,52 12,38 2,30 12,20 8,6 20,10" fill="url(#vers-g)" stroke="#fbcfe8" strokeWidth="0.8" />
      <circle cx="22" cy="24" r="6" fill="#831843" stroke="#f9a8d4" strokeWidth="1" />
      <circle cx="42" cy="24" r="6" fill="#831843" stroke="#f9a8d4" strokeWidth="1" />
      <circle cx="32" cy="38" r="6" fill="#831843" stroke="#f9a8d4" strokeWidth="1" />
      <path d="M22,24 L42,24" stroke="#f472b6" strokeWidth="1" strokeDasharray="2 1" />
      <path d="M22,24 L32,38" stroke="#f472b6" strokeWidth="1" strokeDasharray="2 1" />
      <path d="M42,24 L32,38" stroke="#f472b6" strokeWidth="1" strokeDasharray="2 1" />
      <polygon points="22,20 24,18 26,20 24,22" fill="#f9a8d4" />
      <polygon points="42,20 44,18 46,20 44,22" fill="#f9a8d4" />
      <polygon points="32,34 34,32 36,34 34,36" fill="#f9a8d4" />
    </BadgeShell>
  );
}

export function TopTierBadge() {
  return (
    <BadgeShell glow="rgba(251,191,36,0.6)" id="top-tier">
      <defs>
        <linearGradient id="tt-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="30%" stopColor="#fbbf24" />
          <stop offset="70%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <linearGradient id="tt-crown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="100%" stopColor="#eab308" />
        </linearGradient>
      </defs>
      <path d="M32,4 L54,16 L54,36 Q54,52 32,60 Q10,52 10,36 L10,16 Z" fill="url(#tt-g)" stroke="#fef3c7" strokeWidth="1" />
      <path d="M32,12 L46,20 L46,34 Q46,46 32,52 Q18,46 18,34 L18,20 Z" fill="#78350f" stroke="#d97706" strokeWidth="0.8" />
      <path d="M22,26 L18,18 L26,24 L32,16 L38,24 L46,18 L42,26 Z" fill="url(#tt-crown)" />
      <circle cx="18" cy="18" r="2" fill="#fef9c3" />
      <circle cx="32" cy="16" r="2" fill="#fef9c3" />
      <circle cx="46" cy="18" r="2" fill="#fef9c3" />
      <polygon points="28,32 32,28 36,32 34,38 30,38" fill="#fbbf24" stroke="#78350f" strokeWidth="0.5" />
    </BadgeShell>
  );
}

export function ProblemSolverBadge() {
  return (
    <BadgeShell glow="rgba(34,211,238,0.5)" id="problem-solver">
      <defs>
        <linearGradient id="ps-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a5f3fc" />
          <stop offset="50%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#164e63" />
        </linearGradient>
        <radialGradient id="ps-bulb" cx="50%" cy="40%">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="100%" stopColor="#fbbf24" />
        </radialGradient>
      </defs>
      <polygon points="32,2 42,10 52,4 50,16 62,20 54,30 58,42 46,42 40,54 32,46 24,54 18,42 6,42 10,30 2,20 14,16 12,4 22,10" fill="url(#ps-g)" stroke="#a5f3fc" strokeWidth="0.8" />
      <path d="M26,34 Q26,16 32,16 Q38,16 38,34" fill="url(#ps-bulb)" stroke="#164e63" strokeWidth="1" />
      <rect x="27" y="34" width="10" height="4" rx="1" fill="#164e63" />
      <rect x="28" y="38" width="8" height="2" rx="1" fill="#164e63" />
      <path d="M32,10 L32,6" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M42,14 L44,10" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round" />
      <path d="M22,14 L20,10" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round" />
      <path d="M46,22 L50,20" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round" />
      <path d="M18,22 L14,20" stroke="#fbbf24" strokeWidth="1" strokeLinecap="round" />
    </BadgeShell>
  );
}

export function AboveBeyondBadge() {
  return (
    <BadgeShell glow="rgba(168,85,247,0.6)" id="above-beyond">
      <defs>
        <linearGradient id="ab-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e9d5ff" />
          <stop offset="30%" stopColor="#a855f7" />
          <stop offset="70%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#4c1d95" />
        </linearGradient>
        <linearGradient id="ab-rocket" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f5f3ff" />
          <stop offset="100%" stopColor="#c084fc" />
        </linearGradient>
      </defs>
      <polygon points="32,1 40,12 52,4 50,18 63,22 54,32 60,46 46,44 40,58 32,48 24,58 18,44 4,46 10,32 1,22 14,18 12,4 24,12" fill="url(#ab-g)" stroke="#e9d5ff" strokeWidth="1" />
      <path d="M32,14 L28,30 L24,30 L32,42 L40,30 L36,30 Z" fill="url(#ab-rocket)" stroke="#4c1d95" strokeWidth="0.8" />
      <circle cx="32" cy="20" r="3" fill="#4c1d95" />
      <circle cx="32" cy="20" r="1.5" fill="#e9d5ff" />
      <path d="M28,36 L26,42" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M32,38 L32,44" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M36,36 L38,42" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
    </BadgeShell>
  );
}

export function ComebackKingBadge() {
  return (
    <BadgeShell glow="rgba(249,115,22,0.6)" id="comeback-king">
      <defs>
        <linearGradient id="cbk-g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="30%" stopColor="#f97316" />
          <stop offset="70%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#7c2d12" />
        </linearGradient>
        <linearGradient id="cbk-phoenix" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="50%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#cbk-g)" stroke="#fed7aa" strokeWidth="1" />
      <circle cx="32" cy="32" r="22" fill="#7c2d12" stroke="#ea580c" strokeWidth="1" />
      <path d="M32,16 Q20,20 20,30 Q20,40 32,48 Q44,40 44,30 Q44,20 32,16 Z" fill="url(#cbk-phoenix)" opacity="0.8" />
      <path d="M24,36 Q28,26 32,22 Q36,26 40,36" fill="none" stroke="#fef3c7" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M28,40 Q30,34 32,30 Q34,34 36,40" fill="none" stroke="#fef3c7" strokeWidth="1" strokeLinecap="round" />
      <path d="M20,24 L16,18" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M44,24 L48,18" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M32,16 L32,10" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
    </BadgeShell>
  );
}

export type BadgeTier = "short" | "mid" | "long";

export type BadgeId =
  | "elite" | "veteran" | "first-order" | "grind-5" | "grind-10" | "grind-50" | "grind-100" | "grind-250" | "grind-500"
  | "quality" | "sharp" | "punctual" | "reliable" | "clean"
  | "earn-500" | "earn-2k" | "earn-5k" | "earn-10k" | "earn-25k" | "earn-50k" | "earn-100k"
  | "newbie" | "loyal" | "loyal-6m" | "loyal-1y" | "loyal-2y" | "loyal-5y"
  | "streamer" | "versatile" | "top-tier"
  | "vc-grinder" | "event-grinder" | "international-grinder" | "xbox-grinder" | "ps5-grinder"
  | "rush-hero" | "clutch" | "multi-tasker" | "communicator" | "team-player"
  | "night-owl" | "speed-demon" | "customer-fav" | "mentor" | "diamond-hands"
  | "console-king" | "zero-complaints" | "problem-solver" | "above-beyond" | "comeback-king";

export const BADGE_COMPONENTS: Record<BadgeId, () => JSX.Element> = {
  "elite": EliteBadge,
  "veteran": VeteranBadge,
  "first-order": FirstBloodBadge,
  "grind-5": OnARollBadge,
  "grind-10": GrindMachineBadge,
  "grind-50": CenturionBadge,
  "grind-100": GrindMasterBadge,
  "grind-250": LegendBadge,
  "grind-500": TitanBadge,
  "quality": PerfectionistBadge,
  "sharp": SharpshooterBadge,
  "punctual": AlwaysOnTimeBadge,
  "reliable": IroncladBadge,
  "clean": CleanRecordBadge,
  "earn-500": MoneyMakerBadge,
  "earn-2k": BigEarnerBadge,
  "earn-5k": CashKingBadge,
  "earn-10k": FortuneBuilderBadge,
  "earn-25k": EmpireBadge,
  "earn-50k": HighRollerBadge,
  "earn-100k": MogulBadge,
  "newbie": FreshRecruitBadge,
  "loyal": LoyalBadge,
  "loyal-6m": SeasonedBadge,
  "loyal-1y": DedicatedBadge,
  "loyal-2y": LiferBadge,
  "loyal-5y": EternalBadge,
  "streamer": StreamerBadge,
  "vc-grinder": VCGrinderBadge,
  "event-grinder": EventGrinderBadge,
  "international-grinder": InternationalGrinderBadge,
  "xbox-grinder": XboxGrinderBadge,
  "ps5-grinder": PS5GrinderBadge,
  "versatile": VersatileBadge,
  "top-tier": TopTierBadge,
  "rush-hero": RushHeroBadge,
  "clutch": ClutchPlayerBadge,
  "multi-tasker": MultiTaskerBadge,
  "communicator": CommunicatorBadge,
  "team-player": TeamPlayerBadge,
  "night-owl": NightOwlBadge,
  "speed-demon": SpeedDemonBadge,
  "customer-fav": CustomerFavBadge,
  "mentor": MentorBadge,
  "diamond-hands": DiamondHandsBadge,
  "console-king": ConsoleKingBadge,
  "zero-complaints": ZeroComplaintsBadge,
  "problem-solver": ProblemSolverBadge,
  "above-beyond": AboveBeyondBadge,
  "comeback-king": ComebackKingBadge,
};

export type BadgeCategory = "auto" | "manual" | "both";

export const BADGE_META: Record<BadgeId, { label: string; tooltip: string; category: BadgeCategory; tier: BadgeTier }> = {
  "elite": { label: "Elite", tooltip: "Elite Grinder status achieved", category: "auto", tier: "mid" },
  "first-order": { label: "First Blood", tooltip: "Completed your first order", category: "auto", tier: "short" },
  "grind-5": { label: "On a Roll", tooltip: "5+ orders completed", category: "auto", tier: "short" },
  "grind-10": { label: "Grind Machine", tooltip: "10+ orders completed", category: "auto", tier: "short" },
  "veteran": { label: "Veteran", tooltip: "25+ orders completed", category: "auto", tier: "mid" },
  "grind-50": { label: "Centurion", tooltip: "50+ orders completed", category: "auto", tier: "mid" },
  "grind-100": { label: "Grind Master", tooltip: "100+ orders completed", category: "auto", tier: "long" },
  "grind-250": { label: "Legend", tooltip: "250+ orders completed — legendary status", category: "auto", tier: "long" },
  "grind-500": { label: "Titan", tooltip: "500+ orders completed — unstoppable force", category: "auto", tier: "long" },
  "quality": { label: "Perfectionist", tooltip: "95%+ quality score with 3+ orders", category: "auto", tier: "short" },
  "sharp": { label: "Sharpshooter", tooltip: "80%+ bid win rate with 5+ bids", category: "auto", tier: "short" },
  "punctual": { label: "Always On Time", tooltip: "100% on-time delivery with 5+ orders", category: "auto", tier: "short" },
  "reliable": { label: "Ironclad", tooltip: "100% completion rate with 5+ orders", category: "auto", tier: "short" },
  "clean": { label: "Clean Record", tooltip: "Zero strikes with 5+ orders", category: "auto", tier: "short" },
  "earn-500": { label: "Money Maker", tooltip: "$500+ total earnings", category: "auto", tier: "short" },
  "earn-2k": { label: "Big Earner", tooltip: "$2,000+ total earnings", category: "auto", tier: "short" },
  "earn-5k": { label: "Cash King", tooltip: "$5,000+ total earnings", category: "auto", tier: "mid" },
  "earn-10k": { label: "Fortune Builder", tooltip: "$10,000+ total earnings", category: "auto", tier: "mid" },
  "earn-25k": { label: "Empire", tooltip: "$25,000+ total earnings", category: "auto", tier: "long" },
  "earn-50k": { label: "High Roller", tooltip: "$50,000+ total earnings", category: "auto", tier: "long" },
  "earn-100k": { label: "Mogul", tooltip: "$100,000+ total earnings — business mogul", category: "auto", tier: "long" },
  "newbie": { label: "Fresh Recruit", tooltip: "Joined within the last 7 days", category: "auto", tier: "short" },
  "loyal": { label: "Loyal", tooltip: "Active for 90+ days", category: "auto", tier: "short" },
  "loyal-6m": { label: "Seasoned", tooltip: "Active for 6+ months", category: "auto", tier: "mid" },
  "loyal-1y": { label: "Dedicated", tooltip: "Active for 1+ year", category: "auto", tier: "mid" },
  "loyal-2y": { label: "Lifer", tooltip: "Active for 2+ years", category: "auto", tier: "long" },
  "loyal-5y": { label: "Eternal", tooltip: "Active for 5+ years — true legend", category: "auto", tier: "long" },
  "streamer": { label: "Streamer", tooltip: "Twitch account linked", category: "auto", tier: "short" },
  "vc-grinder": { label: "VC Grinder", tooltip: "Certified VC Grinder — virtual currency specialist", category: "auto", tier: "short" },
  "event-grinder": { label: "Event Grinder", tooltip: "Certified Event Grinder — event specialist", category: "auto", tier: "short" },
  "international-grinder": { label: "International", tooltip: "International Grinder — global operations specialist", category: "auto", tier: "short" },
  "xbox-grinder": { label: "Xbox Grinder", tooltip: "Certified Xbox Grinder — Xbox platform specialist", category: "auto", tier: "short" },
  "ps5-grinder": { label: "PS5 Grinder", tooltip: "Certified PS5 Grinder — PlayStation platform specialist", category: "auto", tier: "short" },
  "versatile": { label: "Versatile", tooltip: "Multi-role specialist — 3+ roles assigned", category: "auto", tier: "mid" },
  "top-tier": { label: "Top Tier", tooltip: "Reached Diamond or Elite tier level", category: "auto", tier: "long" },
  "rush-hero": { label: "Rush Hero", tooltip: "Completed a rush/emergency order with no issues", category: "manual", tier: "short" },
  "clutch": { label: "Clutch Player", tooltip: "Saved a difficult order from failing", category: "manual", tier: "mid" },
  "multi-tasker": { label: "Multi-Tasker", tooltip: "Successfully handled 3+ active orders at once", category: "manual", tier: "mid" },
  "communicator": { label: "Great Comms", tooltip: "Outstanding daily updates and communication", category: "manual", tier: "short" },
  "team-player": { label: "Team Player", tooltip: "Helped another grinder or stepped up for the team", category: "manual", tier: "short" },
  "night-owl": { label: "Night Owl", tooltip: "Reliable late-night grinder who delivers after hours", category: "manual", tier: "short" },
  "speed-demon": { label: "Speed Demon", tooltip: "Completed an order well before the deadline", category: "manual", tier: "short" },
  "customer-fav": { label: "Customer Fav", tooltip: "Received exceptional customer review or praise", category: "manual", tier: "mid" },
  "mentor": { label: "Mentor", tooltip: "Helped train or guide newer grinders", category: "manual", tier: "mid" },
  "diamond-hands": { label: "Diamond Hands", tooltip: "Stuck with a tough order and delivered quality", category: "manual", tier: "mid" },
  "console-king": { label: "Console King", tooltip: "Multi-platform specialist — handles any console", category: "manual", tier: "long" },
  "zero-complaints": { label: "Zero Complaints", tooltip: "Spotless track record — no disputes or issues", category: "manual", tier: "long" },
  "problem-solver": { label: "Problem Solver", tooltip: "Resolved a complex order issue creatively", category: "manual", tier: "mid" },
  "above-beyond": { label: "Above & Beyond", tooltip: "Exceeded order requirements or expectations", category: "manual", tier: "long" },
  "comeback-king": { label: "Comeback King", tooltip: "Recovered from a rough patch and improved significantly", category: "manual", tier: "long" },
};

export const ALL_BADGE_IDS = Object.keys(BADGE_META) as BadgeId[];
export const AUTO_BADGE_IDS = ALL_BADGE_IDS.filter(id => BADGE_META[id].category === "auto");
export const MANUAL_BADGE_IDS = ALL_BADGE_IDS.filter(id => BADGE_META[id].category === "manual");

export const TIER_LABELS: Record<BadgeTier, string> = {
  short: "Short-Term",
  mid: "Mid-Term",
  long: "Long-Term",
};

export const TIER_COLORS: Record<BadgeTier, string> = {
  short: "text-green-400",
  mid: "text-amber-400",
  long: "text-red-400",
};
