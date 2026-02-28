const S = 64;

function SBadgeShell({ children, glow, id }: { children: React.ReactNode; glow: string; id: string }) {
  return (
    <div
      className="relative group cursor-default transition-transform duration-200 hover:scale-110"
      style={{ width: S, height: S, filter: `drop-shadow(0 0 6px ${glow})` }}
      data-testid={`staff-badge-emblem-${id}`}
    >
      <svg viewBox="0 0 64 64" width={S} height={S} xmlns="http://www.w3.org/2000/svg">
        {children}
      </svg>
    </div>
  );
}

function ShieldBadge({ id, c1, c2, c3, icon }: { id: string; c1: string; c2: string; c3: string; icon: React.ReactNode }) {
  return (
    <SBadgeShell glow={c1} id={id}>
      <defs>
        <linearGradient id={`sb-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="50%" stopColor={c2} />
          <stop offset="100%" stopColor={c3} />
        </linearGradient>
      </defs>
      <path d="M32,4 L54,16 L54,36 Q54,52 32,60 Q10,52 10,36 L10,16 Z" fill={`url(#sb-${id})`} stroke={c1} strokeWidth="1" />
      <path d="M32,12 L46,20 L46,34 Q46,46 32,52 Q18,46 18,34 L18,20 Z" fill={c3} stroke={c2} strokeWidth="0.8" />
      {icon}
    </SBadgeShell>
  );
}

function StarBadge({ id, c1, c2, c3, icon }: { id: string; c1: string; c2: string; c3: string; icon: React.ReactNode }) {
  return (
    <SBadgeShell glow={c1} id={id}>
      <defs>
        <linearGradient id={`st-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="50%" stopColor={c2} />
          <stop offset="100%" stopColor={c3} />
        </linearGradient>
      </defs>
      <polygon points="32,2 40,14 54,8 48,22 62,26 50,34 56,48 42,44 38,58 32,46 26,58 22,44 8,48 14,34 2,26 16,22 10,8 24,14" fill={`url(#st-${id})`} stroke={c1} strokeWidth="1" />
      <circle cx="32" cy="30" r="13" fill={c3} stroke={c2} strokeWidth="1" />
      {icon}
    </SBadgeShell>
  );
}

function MedalBadge({ id, c1, c2, c3, icon }: { id: string; c1: string; c2: string; c3: string; icon: React.ReactNode }) {
  return (
    <SBadgeShell glow={c1} id={id}>
      <defs>
        <linearGradient id={`md-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <path d="M22,4 L20,22 L12,18" stroke={c2} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M42,4 L44,22 L52,18" stroke={c2} strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="38" r="22" fill={`url(#md-${id})`} stroke={c1} strokeWidth="1.5" />
      <circle cx="32" cy="38" r="16" fill={c3} stroke={c2} strokeWidth="1" />
      {icon}
    </SBadgeShell>
  );
}

function HexBadge({ id, c1, c2, c3, icon }: { id: string; c1: string; c2: string; c3: string; icon: React.ReactNode }) {
  return (
    <SBadgeShell glow={c1} id={id}>
      <defs>
        <linearGradient id={`hx-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="50%" stopColor={c2} />
          <stop offset="100%" stopColor={c3} />
        </linearGradient>
      </defs>
      <polygon points="32,2 58,16 58,48 32,62 6,48 6,16" fill={`url(#hx-${id})`} stroke={c1} strokeWidth="1" />
      <polygon points="32,10 50,20 50,44 32,54 14,44 14,20" fill={c3} stroke={c2} strokeWidth="0.8" />
      {icon}
    </SBadgeShell>
  );
}

function DiamondBadge({ id, c1, c2, c3, icon }: { id: string; c1: string; c2: string; c3: string; icon: React.ReactNode }) {
  return (
    <SBadgeShell glow={c1} id={id}>
      <defs>
        <linearGradient id={`dm-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="50%" stopColor={c2} />
          <stop offset="100%" stopColor={c3} />
        </linearGradient>
      </defs>
      <polygon points="32,2 62,32 32,62 2,32" fill={`url(#dm-${id})`} stroke={c1} strokeWidth="1" />
      <polygon points="32,10 54,32 32,54 10,32" fill={c3} stroke={c2} strokeWidth="0.8" />
      {icon}
    </SBadgeShell>
  );
}

function CircleBadge({ id, c1, c2, c3, icon }: { id: string; c1: string; c2: string; c3: string; icon: React.ReactNode }) {
  return (
    <SBadgeShell glow={c1} id={id}>
      <defs>
        <linearGradient id={`cr-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="50%" stopColor={c2} />
          <stop offset="100%" stopColor={c3} />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill={`url(#cr-${id})`} stroke={c1} strokeWidth="1.5" />
      <circle cx="32" cy="32" r="20" fill={c3} stroke={c2} strokeWidth="1" />
      {icon}
    </SBadgeShell>
  );
}

function CrownBadge({ id, c1, c2, c3, icon }: { id: string; c1: string; c2: string; c3: string; icon: React.ReactNode }) {
  return (
    <SBadgeShell glow={c1} id={id}>
      <defs>
        <linearGradient id={`cw-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="50%" stopColor={c2} />
          <stop offset="100%" stopColor={c3} />
        </linearGradient>
      </defs>
      <path d="M6,42 L6,20 L18,30 L32,8 L46,30 L58,20 L58,42 Z" fill={`url(#cw-${id})`} stroke={c1} strokeWidth="1" />
      <rect x="6" y="42" width="52" height="14" rx="3" fill={c3} stroke={c2} strokeWidth="1" />
      <circle cx="18" cy="20" r="3" fill={c1} />
      <circle cx="32" cy="8" r="3" fill={c1} />
      <circle cx="46" cy="20" r="3" fill={c1} />
      {icon}
    </SBadgeShell>
  );
}

export function StaffFirstAction() { return <ShieldBadge id="staff-first-action" c1="#93c5fd" c2="#3b82f6" c3="#1e3a5f" icon={<text x="32" y="38" textAnchor="middle" fill="#93c5fd" fontSize="18" fontWeight="bold">!</text>} />; }
export function StaffOrder5() { return <HexBadge id="staff-order-5" c1="#86efac" c2="#22c55e" c3="#14532d" icon={<text x="32" y="36" textAnchor="middle" fill="#86efac" fontSize="14" fontWeight="bold">5</text>} />; }
export function StaffBidReview10() { return <CircleBadge id="staff-bid-10" c1="#c4b5fd" c2="#8b5cf6" c3="#4c1d95" icon={<text x="32" y="37" textAnchor="middle" fill="#c4b5fd" fontSize="12" fontWeight="bold">10</text>} />; }
export function StaffPayout1() { return <MedalBadge id="staff-payout-1" c1="#fde68a" c2="#eab308" c3="#713f12" icon={<text x="32" y="43" textAnchor="middle" fill="#fde68a" fontSize="14" fontWeight="bold">$</text>} />; }
export function StaffAssign5() { return <ShieldBadge id="staff-assign-5" c1="#6ee7b7" c2="#059669" c3="#064e3b" icon={<text x="32" y="38" textAnchor="middle" fill="#6ee7b7" fontSize="14" fontWeight="bold">5</text>} />; }
export function StaffAlert1() { return <DiamondBadge id="staff-alert-1" c1="#fca5a5" c2="#ef4444" c3="#7f1d1d" icon={<text x="32" y="37" textAnchor="middle" fill="#fca5a5" fontSize="16" fontWeight="bold">!</text>} />; }
export function StaffStrike1() { return <HexBadge id="staff-strike-1" c1="#fdba74" c2="#f97316" c3="#9a3412" icon={<path d="M28,24 L36,24 L34,34 L30,34 Z M30,38 L34,38 L34,42 L30,42 Z" fill="#fdba74" />} />; }
export function StaffReview5() { return <CircleBadge id="staff-review-5" c1="#67e8f9" c2="#06b6d4" c3="#0e7490" icon={<path d="M26,32 L30,36 L38,28" fill="none" stroke="#67e8f9" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />} />; }
export function Staff7d() { return <MedalBadge id="staff-7d" c1="#a5b4fc" c2="#6366f1" c3="#312e81" icon={<text x="32" y="43" textAnchor="middle" fill="#a5b4fc" fontSize="11" fontWeight="bold">7d</text>} />; }
export function StaffEvent1() { return <ShieldBadge id="staff-event-1" c1="#f0abfc" c2="#d946ef" c3="#701a75" icon={<path d="M26,28 L32,24 L38,28 L38,38 L26,38 Z" fill="#f0abfc" opacity="0.8" />} />; }

export function StaffOrder25() { return <StarBadge id="staff-order-25" c1="#86efac" c2="#22c55e" c3="#14532d" icon={<text x="32" y="35" textAnchor="middle" fill="#86efac" fontSize="12" fontWeight="bold">25</text>} />; }
export function StaffOrder50() { return <ShieldBadge id="staff-order-50" c1="#4ade80" c2="#16a34a" c3="#052e16" icon={<text x="32" y="38" textAnchor="middle" fill="#4ade80" fontSize="14" fontWeight="bold">50</text>} />; }
export function StaffAssign25() { return <HexBadge id="staff-assign-25" c1="#34d399" c2="#059669" c3="#064e3b" icon={<text x="32" y="36" textAnchor="middle" fill="#34d399" fontSize="12" fontWeight="bold">25</text>} />; }
export function StaffBidReview50() { return <StarBadge id="staff-bid-50" c1="#a78bfa" c2="#7c3aed" c3="#4c1d95" icon={<text x="32" y="35" textAnchor="middle" fill="#a78bfa" fontSize="12" fontWeight="bold">50</text>} />; }
export function StaffPayout10() { return <DiamondBadge id="staff-payout-10" c1="#fbbf24" c2="#d97706" c3="#78350f" icon={<text x="32" y="37" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="bold">$10</text>} />; }
export function StaffRevenue5k() { return <MedalBadge id="staff-rev-5k" c1="#a7f3d0" c2="#10b981" c3="#064e3b" icon={<text x="32" y="43" textAnchor="middle" fill="#a7f3d0" fontSize="10" fontWeight="bold">$5K</text>} />; }
export function StaffRevenue10k() { return <CrownBadge id="staff-rev-10k" c1="#fde68a" c2="#ca8a04" c3="#713f12" icon={<text x="32" y="54" textAnchor="middle" fill="#fde68a" fontSize="9" fontWeight="bold">$10K</text>} />; }
export function Staff30d() { return <ShieldBadge id="staff-30d" c1="#93c5fd" c2="#2563eb" c3="#1e3a5f" icon={<text x="32" y="38" textAnchor="middle" fill="#93c5fd" fontSize="10" fontWeight="bold">30d</text>} />; }
export function Staff90d() { return <HexBadge id="staff-90d" c1="#818cf8" c2="#4f46e5" c3="#312e81" icon={<text x="32" y="36" textAnchor="middle" fill="#818cf8" fontSize="10" fontWeight="bold">90d</text>} />; }
export function StaffGrinderMgr() { return <CircleBadge id="staff-grinder-mgr" c1="#f9a8d4" c2="#ec4899" c3="#831843" icon={<text x="32" y="37" textAnchor="middle" fill="#f9a8d4" fontSize="10" fontWeight="bold">10+</text>} />; }

export function StaffOrder100() { return <StarBadge id="staff-order-100" c1="#fbbf24" c2="#d97706" c3="#78350f" icon={<text x="32" y="35" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="bold">100</text>} />; }
export function StaffOrder250() { return <CrownBadge id="staff-order-250" c1="#f97316" c2="#ea580c" c3="#7c2d12" icon={<text x="32" y="54" textAnchor="middle" fill="#fed7aa" fontSize="9" fontWeight="bold">250</text>} />; }
export function StaffOrder500() {
  return (
    <SBadgeShell glow="rgba(220,38,38,0.6)" id="staff-order-500">
      <defs>
        <linearGradient id="so500" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fecaca" />
          <stop offset="50%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#450a0a" />
        </linearGradient>
      </defs>
      <polygon points="32,1 40,12 52,4 50,18 63,22 54,32 60,46 46,44 40,58 32,48 24,58 18,44 4,46 10,32 1,22 14,18 12,4 24,12" fill="url(#so500)" stroke="#fecaca" strokeWidth="1" />
      <circle cx="32" cy="30" r="14" fill="#450a0a" stroke="#dc2626" strokeWidth="1.5" />
      <text x="32" y="35" textAnchor="middle" fill="#fecaca" fontSize="11" fontWeight="bold">500</text>
      <path d="M18,54 L32,62 L46,54" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
    </SBadgeShell>
  );
}
export function StaffOrder1000() {
  return (
    <SBadgeShell glow="rgba(234,179,8,0.8)" id="staff-order-1000">
      <defs>
        <linearGradient id="so1k" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="30%" stopColor="#eab308" />
          <stop offset="70%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#713f12" />
        </linearGradient>
      </defs>
      <path d="M2,30 Q8,10 24,18 L32,6 L40,18 Q56,10 62,30 L52,26 L48,42 L32,52 L16,42 L12,26 Z" fill="url(#so1k)" stroke="#fef9c3" strokeWidth="0.8" />
      <circle cx="32" cy="30" r="12" fill="#713f12" stroke="#eab308" strokeWidth="1.5" />
      <text x="32" y="35" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">1K</text>
      <path d="M20,48 L32,56 L44,48" fill="none" stroke="#ca8a04" strokeWidth="2" strokeLinecap="round" />
    </SBadgeShell>
  );
}
export function StaffRevenue25k() { return <StarBadge id="staff-rev-25k" c1="#fde68a" c2="#eab308" c3="#713f12" icon={<text x="32" y="35" textAnchor="middle" fill="#fde68a" fontSize="9" fontWeight="bold">$25K</text>} />; }
export function StaffRevenue50k() {
  return (
    <SBadgeShell glow="rgba(217,119,6,0.6)" id="staff-rev-50k">
      <defs>
        <linearGradient id="sr50k" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill="url(#sr50k)" stroke="#fef3c7" strokeWidth="1" />
      <circle cx="32" cy="32" r="20" fill="#78350f" stroke="#d97706" strokeWidth="1.5" />
      <text x="32" y="37" textAnchor="middle" fill="#fbbf24" fontSize="11" fontWeight="bold">$50K</text>
    </SBadgeShell>
  );
}
export function StaffRevenue100k() {
  return (
    <SBadgeShell glow="rgba(220,38,38,0.7)" id="staff-rev-100k">
      <defs>
        <linearGradient id="sr100k" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fecaca" />
          <stop offset="40%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#450a0a" />
        </linearGradient>
      </defs>
      <polygon points="32,1 40,12 52,4 50,18 63,22 54,32 60,46 46,44 40,58 32,48 24,58 18,44 4,46 10,32 1,22 14,18 12,4 24,12" fill="url(#sr100k)" stroke="#fecaca" strokeWidth="1.2" />
      <polygon points="32,12 42,22 42,36 32,46 22,36 22,22" fill="#fecaca" stroke="#450a0a" strokeWidth="1" opacity="0.7" />
      <text x="32" y="33" textAnchor="middle" fill="#450a0a" fontSize="8" fontWeight="bold">$100K</text>
    </SBadgeShell>
  );
}
export function Staff180d() { return <ShieldBadge id="staff-180d" c1="#a78bfa" c2="#7c3aed" c3="#4c1d95" icon={<text x="32" y="38" textAnchor="middle" fill="#a78bfa" fontSize="9" fontWeight="bold">6mo</text>} />; }
export function Staff365d() { return <CrownBadge id="staff-365d" c1="#f9a8d4" c2="#ec4899" c3="#831843" icon={<text x="32" y="54" textAnchor="middle" fill="#f9a8d4" fontSize="9" fontWeight="bold">1yr</text>} />; }
export function Staff730d() {
  return (
    <SBadgeShell glow="rgba(234,179,8,0.7)" id="staff-730d">
      <defs>
        <linearGradient id="s730" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="40%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#713f12" />
        </linearGradient>
      </defs>
      <polygon points="32,2 40,14 54,8 48,22 62,26 50,34 56,48 42,44 38,58 32,46 26,58 22,44 8,48 14,34 2,26 16,22 10,8 24,14" fill="url(#s730)" stroke="#fef9c3" strokeWidth="1" />
      <circle cx="32" cy="30" r="13" fill="#713f12" stroke="#eab308" strokeWidth="1.5" />
      <text x="32" y="35" textAnchor="middle" fill="#fbbf24" fontSize="10" fontWeight="bold">2yr</text>
    </SBadgeShell>
  );
}

export function StaffLeadership() { return <CrownBadge id="staff-leadership" c1="#fbbf24" c2="#d97706" c3="#78350f" icon={<polygon points="28,49 32,45 36,49" fill="#fbbf24" />} />; }
export function StaffInnovation() { return <DiamondBadge id="staff-innovation" c1="#a78bfa" c2="#7c3aed" c3="#4c1d95" icon={<circle cx="32" cy="32" r="6" fill="#a78bfa" />} />; }
export function StaffCrisis() { return <ShieldBadge id="staff-crisis" c1="#f87171" c2="#dc2626" c3="#7f1d1d" icon={<path d="M28,28 L36,28 L34,36 L30,36 Z M30,38 L34,38 L34,42 L30,42 Z" fill="#fca5a5" />} />; }
export function StaffMentor() { return <HexBadge id="staff-mentor" c1="#67e8f9" c2="#06b6d4" c3="#0e7490" icon={<path d="M26,30 L32,24 L38,30 M32,24 L32,40" fill="none" stroke="#67e8f9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />} />; }
export function StaffAboveBeyond() {
  return (
    <SBadgeShell glow="rgba(234,179,8,0.6)" id="staff-above-beyond">
      <defs>
        <linearGradient id="sab" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#713f12" />
        </linearGradient>
      </defs>
      <polygon points="32,2 38,20 58,20 42,32 48,50 32,40 16,50 22,32 6,20 26,20" fill="url(#sab)" stroke="#fef9c3" strokeWidth="0.8" />
      <circle cx="32" cy="28" r="10" fill="#713f12" stroke="#eab308" strokeWidth="1" />
      <polygon points="32,20 34,26 40,26 35,30 37,36 32,32 27,36 29,30 24,26 30,26" fill="#eab308" />
    </SBadgeShell>
  );
}
export function StaffCustomerChampion() { return <MedalBadge id="staff-customer-champ" c1="#f9a8d4" c2="#ec4899" c3="#831843" icon={<path d="M26,38 L32,32 L38,38 M26,34 L32,28 L38,34" fill="none" stroke="#f9a8d4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />} />; }
export function StaffEfficiency() { return <HexBadge id="staff-efficiency" c1="#34d399" c2="#059669" c3="#064e3b" icon={<path d="M24,36 L32,24 L40,36" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />} />; }
export function StaffStrategic() { return <DiamondBadge id="staff-strategic" c1="#818cf8" c2="#4f46e5" c3="#312e81" icon={<path d="M26,28 L32,22 L38,28 L32,34 Z" fill="#818cf8" stroke="#312e81" strokeWidth="0.5" />} />; }
export function StaffMVP() {
  return (
    <SBadgeShell glow="rgba(234,179,8,0.7)" id="staff-mvp">
      <defs>
        <linearGradient id="smvp" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="30%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#713f12" />
        </linearGradient>
      </defs>
      <path d="M32,4 L54,16 L54,36 Q54,52 32,60 Q10,52 10,36 L10,16 Z" fill="url(#smvp)" stroke="#fef9c3" strokeWidth="1" />
      <path d="M32,12 L46,20 L46,34 Q46,46 32,52 Q18,46 18,34 L18,20 Z" fill="#713f12" stroke="#eab308" strokeWidth="0.8" />
      <text x="32" y="40" textAnchor="middle" fill="#fbbf24" fontSize="12" fontWeight="bold">MVP</text>
    </SBadgeShell>
  );
}
export function StaffProblemSolver() { return <CircleBadge id="staff-problem-solver" c1="#86efac" c2="#22c55e" c3="#14532d" icon={<path d="M26,32 L30,36 L38,28" fill="none" stroke="#86efac" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />} />; }
export function StaffCommunicator() { return <MedalBadge id="staff-communicator" c1="#93c5fd" c2="#3b82f6" c3="#1e3a5f" icon={<path d="M24,34 L32,34 L40,34 M24,38 L32,38 L40,38 M24,42 L36,42" fill="none" stroke="#93c5fd" strokeWidth="1.5" strokeLinecap="round" />} />; }
export function StaffReliability() { return <ShieldBadge id="staff-reliability" c1="#6ee7b7" c2="#059669" c3="#064e3b" icon={<path d="M26,34 L30,38 L38,28" fill="none" stroke="#6ee7b7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />} />; }
export function StaffGrowth() { return <HexBadge id="staff-growth" c1="#fbbf24" c2="#d97706" c3="#78350f" icon={<path d="M22,40 L30,30 L38,34 L44,24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />} />; }
export function StaffFounding() {
  return (
    <SBadgeShell glow="rgba(234,179,8,0.8)" id="staff-founding">
      <defs>
        <linearGradient id="sfnd" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fef9c3" />
          <stop offset="30%" stopColor="#eab308" />
          <stop offset="70%" stopColor="#ca8a04" />
          <stop offset="100%" stopColor="#713f12" />
        </linearGradient>
      </defs>
      <path d="M2,30 Q8,10 24,18 L32,6 L40,18 Q56,10 62,30 L52,26 L48,42 L32,52 L16,42 L12,26 Z" fill="url(#sfnd)" stroke="#fef9c3" strokeWidth="0.8" />
      <circle cx="32" cy="30" r="12" fill="#713f12" stroke="#eab308" strokeWidth="1.5" />
      <polygon points="32,22 34,27 39,27 35,30.5 37,35.5 32,32 27,35.5 29,30.5 25,27 30,27" fill="#eab308" />
    </SBadgeShell>
  );
}
export function StaffIronWill() { return <ShieldBadge id="staff-iron-will" c1="#94a3b8" c2="#64748b" c3="#1e293b" icon={<path d="M28,28 L32,22 L36,28 L36,40 L28,40 Z" fill="#94a3b8" opacity="0.8" />} />; }
export function StaffProfitMaster() { return <StarBadge id="staff-profit-master" c1="#a7f3d0" c2="#10b981" c3="#064e3b" icon={<text x="32" y="35" textAnchor="middle" fill="#a7f3d0" fontSize="14" fontWeight="bold">$</text>} />; }
export function StaffNightOps() { return <CircleBadge id="staff-night-ops" c1="#818cf8" c2="#4f46e5" c3="#1e1b4b" icon={<path d="M36,24 Q28,24 28,32 Q28,40 36,40 Q30,38 30,32 Q30,26 36,24 Z" fill="#c7d2fe" />} />; }
export function StaffPeacekeeper() { return <ShieldBadge id="staff-peacekeeper" c1="#67e8f9" c2="#0891b2" c3="#083344" icon={<path d="M26,30 Q32,20 38,30 Q32,40 26,30 Z" fill="#67e8f9" opacity="0.7" />} />; }
export function StaffArchitect() { return <HexBadge id="staff-architect" c1="#c084fc" c2="#9333ea" c3="#581c87" icon={<path d="M24,40 L32,24 L40,40 M27,34 L37,34" fill="none" stroke="#c084fc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />} />; }
export function StaffPerfectionist() { return <MedalBadge id="staff-perfectionist" c1="#fde68a" c2="#facc15" c3="#854d0e" icon={<polygon points="32,30 35,37 42,37 36,42 38,49 32,45 26,49 28,42 22,37 29,37" fill="#facc15" />} />; }

export type StaffBadgeTier = "short" | "mid" | "long";
export type StaffBadgeCategory = "auto" | "manual";

export type StaffBadgeId =
  | "staff-first-action" | "staff-order-5" | "staff-bid-10" | "staff-payout-1" | "staff-assign-5"
  | "staff-alert-1" | "staff-strike-1" | "staff-review-5" | "staff-7d" | "staff-event-1"
  | "staff-order-25" | "staff-order-50" | "staff-assign-25" | "staff-bid-50" | "staff-payout-10"
  | "staff-rev-5k" | "staff-rev-10k" | "staff-30d" | "staff-90d" | "staff-grinder-mgr"
  | "staff-order-100" | "staff-order-250" | "staff-order-500" | "staff-order-1000"
  | "staff-rev-25k" | "staff-rev-50k" | "staff-rev-100k" | "staff-180d" | "staff-365d" | "staff-730d"
  | "staff-leadership" | "staff-innovation" | "staff-crisis" | "staff-mentor" | "staff-above-beyond"
  | "staff-customer-champ" | "staff-efficiency" | "staff-strategic" | "staff-mvp" | "staff-problem-solver"
  | "staff-communicator" | "staff-reliability" | "staff-growth" | "staff-founding"
  | "staff-iron-will" | "staff-profit-master" | "staff-night-ops" | "staff-peacekeeper"
  | "staff-architect" | "staff-perfectionist";

export const STAFF_BADGE_COMPONENTS: Record<StaffBadgeId, () => JSX.Element> = {
  "staff-first-action": StaffFirstAction,
  "staff-order-5": StaffOrder5,
  "staff-bid-10": StaffBidReview10,
  "staff-payout-1": StaffPayout1,
  "staff-assign-5": StaffAssign5,
  "staff-alert-1": StaffAlert1,
  "staff-strike-1": StaffStrike1,
  "staff-review-5": StaffReview5,
  "staff-7d": Staff7d,
  "staff-event-1": StaffEvent1,
  "staff-order-25": StaffOrder25,
  "staff-order-50": StaffOrder50,
  "staff-assign-25": StaffAssign25,
  "staff-bid-50": StaffBidReview50,
  "staff-payout-10": StaffPayout10,
  "staff-rev-5k": StaffRevenue5k,
  "staff-rev-10k": StaffRevenue10k,
  "staff-30d": Staff30d,
  "staff-90d": Staff90d,
  "staff-grinder-mgr": StaffGrinderMgr,
  "staff-order-100": StaffOrder100,
  "staff-order-250": StaffOrder250,
  "staff-order-500": StaffOrder500,
  "staff-order-1000": StaffOrder1000,
  "staff-rev-25k": StaffRevenue25k,
  "staff-rev-50k": StaffRevenue50k,
  "staff-rev-100k": StaffRevenue100k,
  "staff-180d": Staff180d,
  "staff-365d": Staff365d,
  "staff-730d": Staff730d,
  "staff-leadership": StaffLeadership,
  "staff-innovation": StaffInnovation,
  "staff-crisis": StaffCrisis,
  "staff-mentor": StaffMentor,
  "staff-above-beyond": StaffAboveBeyond,
  "staff-customer-champ": StaffCustomerChampion,
  "staff-efficiency": StaffEfficiency,
  "staff-strategic": StaffStrategic,
  "staff-mvp": StaffMVP,
  "staff-problem-solver": StaffProblemSolver,
  "staff-communicator": StaffCommunicator,
  "staff-reliability": StaffReliability,
  "staff-growth": StaffGrowth,
  "staff-founding": StaffFounding,
  "staff-iron-will": StaffIronWill,
  "staff-profit-master": StaffProfitMaster,
  "staff-night-ops": StaffNightOps,
  "staff-peacekeeper": StaffPeacekeeper,
  "staff-architect": StaffArchitect,
  "staff-perfectionist": StaffPerfectionist,
};

export const STAFF_BADGE_META: Record<StaffBadgeId, { label: string; tooltip: string; category: StaffBadgeCategory; tier: StaffBadgeTier }> = {
  "staff-first-action": { label: "First Steps", tooltip: "Performed your first staff action", category: "auto", tier: "short" },
  "staff-order-5": { label: "Order Handler", tooltip: "Created or managed 5 orders", category: "auto", tier: "short" },
  "staff-bid-10": { label: "Bid Reviewer", tooltip: "Reviewed 10 bids (approved or denied)", category: "auto", tier: "short" },
  "staff-payout-1": { label: "First Payout", tooltip: "Processed your first payout request", category: "auto", tier: "short" },
  "staff-assign-5": { label: "Assignment Rookie", tooltip: "Made 5 grinder assignments", category: "auto", tier: "short" },
  "staff-alert-1": { label: "Alert Sender", tooltip: "Sent your first team alert", category: "auto", tier: "short" },
  "staff-strike-1": { label: "Enforcer", tooltip: "Issued your first strike", category: "auto", tier: "short" },
  "staff-review-5": { label: "Quality Checker", tooltip: "Completed 5 order quality reviews", category: "auto", tier: "short" },
  "staff-7d": { label: "Week One", tooltip: "Staff member for 7+ days", category: "auto", tier: "short" },
  "staff-event-1": { label: "Event Starter", tooltip: "Created your first event", category: "auto", tier: "short" },

  "staff-order-25": { label: "Operations Pro", tooltip: "Managed 25+ orders", category: "auto", tier: "mid" },
  "staff-order-50": { label: "Operations Expert", tooltip: "Managed 50+ orders", category: "auto", tier: "mid" },
  "staff-assign-25": { label: "Assignment Expert", tooltip: "Made 25+ grinder assignments", category: "auto", tier: "mid" },
  "staff-bid-50": { label: "Bid Master", tooltip: "Reviewed 50+ bids", category: "auto", tier: "mid" },
  "staff-payout-10": { label: "Payout Pro", tooltip: "Processed 10+ payout requests", category: "auto", tier: "mid" },
  "staff-rev-5k": { label: "Revenue Driver", tooltip: "$5K+ total revenue processed", category: "auto", tier: "mid" },
  "staff-rev-10k": { label: "Revenue Machine", tooltip: "$10K+ total revenue processed", category: "auto", tier: "mid" },
  "staff-30d": { label: "Month Strong", tooltip: "Staff member for 30+ days", category: "auto", tier: "mid" },
  "staff-90d": { label: "Quarter Veteran", tooltip: "Staff member for 90+ days", category: "auto", tier: "mid" },
  "staff-grinder-mgr": { label: "Team Manager", tooltip: "Managed 10+ active grinders", category: "auto", tier: "mid" },

  "staff-order-100": { label: "Century Ops", tooltip: "Managed 100+ orders", category: "auto", tier: "long" },
  "staff-order-250": { label: "Ops Legend", tooltip: "Managed 250+ orders — legendary operator", category: "auto", tier: "long" },
  "staff-order-500": { label: "Ops Titan", tooltip: "Managed 500+ orders — unstoppable force", category: "auto", tier: "long" },
  "staff-order-1000": { label: "Ops God", tooltip: "Managed 1,000+ orders — transcendent", category: "auto", tier: "long" },
  "staff-rev-25k": { label: "Revenue King", tooltip: "$25K+ total revenue processed", category: "auto", tier: "long" },
  "staff-rev-50k": { label: "Revenue Emperor", tooltip: "$50K+ total revenue processed", category: "auto", tier: "long" },
  "staff-rev-100k": { label: "Revenue Mogul", tooltip: "$100K+ total revenue processed", category: "auto", tier: "long" },
  "staff-180d": { label: "Half Year", tooltip: "Staff member for 6+ months", category: "auto", tier: "long" },
  "staff-365d": { label: "Staff Veteran", tooltip: "Staff member for 1+ year", category: "auto", tier: "long" },
  "staff-730d": { label: "Staff Legend", tooltip: "Staff member for 2+ years — true legend", category: "auto", tier: "long" },

  "staff-leadership": { label: "Leadership", tooltip: "Demonstrated exceptional leadership and decision-making", category: "manual", tier: "long" },
  "staff-innovation": { label: "Innovation", tooltip: "Brought creative ideas or improvements to operations", category: "manual", tier: "mid" },
  "staff-crisis": { label: "Crisis Handler", tooltip: "Successfully managed a major operational crisis", category: "manual", tier: "mid" },
  "staff-mentor": { label: "Staff Mentor", tooltip: "Helped train or guide newer staff members", category: "manual", tier: "mid" },
  "staff-above-beyond": { label: "Above & Beyond", tooltip: "Exceeded expectations in a significant way", category: "manual", tier: "long" },
  "staff-customer-champ": { label: "Customer Champion", tooltip: "Went above and beyond for customer satisfaction", category: "manual", tier: "mid" },
  "staff-efficiency": { label: "Efficiency Expert", tooltip: "Streamlined processes and improved operational speed", category: "manual", tier: "mid" },
  "staff-strategic": { label: "Strategic Thinker", tooltip: "Made impactful strategic decisions for the business", category: "manual", tier: "long" },
  "staff-mvp": { label: "Team MVP", tooltip: "Most valuable player — outstanding overall contribution", category: "manual", tier: "long" },
  "staff-problem-solver": { label: "Problem Solver", tooltip: "Resolved complex operational issues creatively", category: "manual", tier: "short" },
  "staff-communicator": { label: "Communication Star", tooltip: "Consistently clear and effective communication", category: "manual", tier: "short" },
  "staff-reliability": { label: "Reliability Award", tooltip: "Consistently dependable and available when needed", category: "manual", tier: "mid" },
  "staff-growth": { label: "Growth Driver", tooltip: "Directly contributed to business growth and expansion", category: "manual", tier: "long" },
  "staff-founding": { label: "Founding Member", tooltip: "Original founding staff member of the operation", category: "manual", tier: "long" },
  "staff-iron-will": { label: "Iron Will", tooltip: "Persevered through difficult periods without giving up", category: "manual", tier: "mid" },
  "staff-profit-master": { label: "Profit Master", tooltip: "Consistently maintained high profit margins on orders", category: "manual", tier: "mid" },
  "staff-night-ops": { label: "Night Ops", tooltip: "Reliable late-night operations management", category: "manual", tier: "short" },
  "staff-peacekeeper": { label: "Peacekeeper", tooltip: "Resolved team conflicts and maintained harmony", category: "manual", tier: "short" },
  "staff-architect": { label: "System Architect", tooltip: "Designed or improved key operational systems", category: "manual", tier: "long" },
  "staff-perfectionist": { label: "Perfectionist", tooltip: "Consistently delivers flawless work with attention to detail", category: "manual", tier: "mid" },
};

export const ALL_STAFF_BADGE_IDS = Object.keys(STAFF_BADGE_META) as StaffBadgeId[];
export const AUTO_STAFF_BADGE_IDS = ALL_STAFF_BADGE_IDS.filter(id => STAFF_BADGE_META[id].category === "auto");
export const MANUAL_STAFF_BADGE_IDS = ALL_STAFF_BADGE_IDS.filter(id => STAFF_BADGE_META[id].category === "manual");

export const STAFF_TIER_LABELS: Record<StaffBadgeTier, string> = {
  short: "Short-Term",
  mid: "Mid-Term",
  long: "Long-Term",
};

export const STAFF_TIER_COLORS: Record<StaffBadgeTier, string> = {
  short: "text-green-400",
  mid: "text-amber-400",
  long: "text-red-400",
};
