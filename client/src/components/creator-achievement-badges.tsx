import React from "react";
import type { CreatorBadgeId } from "../../shared/creator-badges";
import { ALL_CREATOR_BADGE_IDS, CREATOR_AUTO_BADGE_IDS, CREATOR_MANUAL_BADGE_IDS } from "../../shared/creator-badges";

const S = 64;

function CBadgeShell({ children, glow, id }: { children: React.ReactNode; glow: string; id: string }) {
  return (
    <div
      className="relative group cursor-default transition-transform duration-200 hover:scale-110"
      style={{ width: S, height: S, filter: `drop-shadow(0 0 6px ${glow})` }}
      data-testid={`creator-badge-emblem-${id}`}
    >
      <svg viewBox="0 0 64 64" width={S} height={S} xmlns="http://www.w3.org/2000/svg">
        {children}
      </svg>
    </div>
  );
}

function CreatorShield({ id, c1, c2, c3, icon }: { id: string; c1: string; c2: string; c3: string; icon: React.ReactNode }) {
  return (
    <CBadgeShell glow={c1} id={id}>
      <defs>
        <linearGradient id={`cr-s-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="50%" stopColor={c2} />
          <stop offset="100%" stopColor={c3} />
        </linearGradient>
      </defs>
      <path d="M32,4 L54,16 L54,36 Q54,52 32,60 Q10,52 10,36 L10,16 Z" fill={`url(#cr-s-${id})`} stroke={c1} strokeWidth="1" />
      <path d="M32,12 L46,20 L46,34 Q46,46 32,52 Q18,46 18,34 L18,20 Z" fill={c3} stroke={c2} strokeWidth="0.8" />
      {icon}
    </CBadgeShell>
  );
}

function CreatorStarShell({ id, c1, c2, c3, icon }: { id: string; c1: string; c2: string; c3: string; icon: React.ReactNode }) {
  return (
    <CBadgeShell glow={c1} id={id}>
      <defs>
        <linearGradient id={`cr-st-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="50%" stopColor={c2} />
          <stop offset="100%" stopColor={c3} />
        </linearGradient>
      </defs>
      <polygon points="32,2 40,14 54,8 48,22 62,26 50,34 56,48 42,44 38,58 32,46 26,58 22,44 8,48 14,34 2,26 16,22 10,8 24,14" fill={`url(#cr-st-${id})`} stroke={c1} strokeWidth="1" />
      <circle cx="32" cy="30" r="13" fill={c3} stroke={c2} strokeWidth="1" />
      {icon}
    </CBadgeShell>
  );
}

function CreatorMedal({ id, c1, c2, c3, icon }: { id: string; c1: string; c2: string; c3: string; icon: React.ReactNode }) {
  return (
    <CBadgeShell glow={c1} id={id}>
      <defs>
        <linearGradient id={`cr-m-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="100%" stopColor={c2} />
        </linearGradient>
      </defs>
      <path d="M22,4 L20,22 L12,18" stroke={c2} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M42,4 L44,22 L52,18" stroke={c2} strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="32" cy="38" r="22" fill={`url(#cr-m-${id})`} stroke={c1} strokeWidth="1.5" />
      <circle cx="32" cy="38" r="16" fill={c3} stroke={c2} strokeWidth="1" />
      {icon}
    </CBadgeShell>
  );
}

function CreatorHex({ id, c1, c2, c3, icon }: { id: string; c1: string; c2: string; c3: string; icon: React.ReactNode }) {
  return (
    <CBadgeShell glow={c1} id={id}>
      <defs>
        <linearGradient id={`cr-h-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="50%" stopColor={c2} />
          <stop offset="100%" stopColor={c3} />
        </linearGradient>
      </defs>
      <polygon points="32,2 58,16 58,48 32,62 6,48 6,16" fill={`url(#cr-h-${id})`} stroke={c1} strokeWidth="1" />
      <polygon points="32,10 50,20 50,44 32,54 14,44 14,20" fill={c3} stroke={c2} strokeWidth="0.8" />
      {icon}
    </CBadgeShell>
  );
}

function CreatorCircle({ id, c1, c2, c3, icon }: { id: string; c1: string; c2: string; c3: string; icon: React.ReactNode }) {
  return (
    <CBadgeShell glow={c1} id={id}>
      <defs>
        <linearGradient id={`cr-c-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="50%" stopColor={c2} />
          <stop offset="100%" stopColor={c3} />
        </linearGradient>
      </defs>
      <circle cx="32" cy="32" r="28" fill={`url(#cr-c-${id})`} stroke={c1} strokeWidth="1.5" />
      <circle cx="32" cy="32" r="20" fill={c3} stroke={c2} strokeWidth="1" />
      {icon}
    </CBadgeShell>
  );
}

function CreatorDiamond({ id, c1, c2, c3, icon }: { id: string; c1: string; c2: string; c3: string; icon: React.ReactNode }) {
  return (
    <CBadgeShell glow={c1} id={id}>
      <defs>
        <linearGradient id={`cr-d-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={c1} />
          <stop offset="50%" stopColor={c2} />
          <stop offset="100%" stopColor={c3} />
        </linearGradient>
      </defs>
      <polygon points="32,2 62,32 32,62 2,32" fill={`url(#cr-d-${id})`} stroke={c1} strokeWidth="1" />
      <polygon points="32,10 54,32 32,54 10,32" fill={c3} stroke={c2} strokeWidth="0.8" />
      {icon}
    </CBadgeShell>
  );
}

// Color palettes: c1 (light/glow), c2 (mid), c3 (dark)
const E = { c1: "#6ee7b7", c2: "#10b981", c3: "#064e3b" };       // emerald
const A = { c1: "#fde68a", c2: "#eab308", c3: "#713f12" };       // amber
const R = { c1: "#fca5a5", c2: "#ef4444", c3: "#7f1d1d" };       // red
const B = { c1: "#93c5fd", c2: "#3b82f6", c3: "#1e3a5f" };       // blue
const P = { c1: "#c4b5fd", c2: "#8b5cf6", c3: "#4c1d95" };       // purple
const C = { c1: "#67e8f9", c2: "#06b6d4", c3: "#0e7490" };       // cyan
const K = { c1: "#f9a8d4", c2: "#ec4899", c3: "#831843" };       // pink
const O = { c1: "#fdba74", c2: "#f97316", c3: "#9a3412" };       // orange
const V = { c1: "#a78bfa", c2: "#7c3aed", c3: "#4c1d95" };       // violet
const T = { c1: "#94a3b8", c2: "#64748b", c3: "#1e293b" };       // slate

function Txt(centerX: number, centerY: number, fontSize: number, content: string, fill = "#fff") {
  const size = Math.max(fontSize, 9);
  return (
    <g transform={`translate(${centerX}, ${centerY})`}>
      <text x={0} y={0} textAnchor="middle" dominantBaseline="middle" fill={fill} fontSize={size} fontWeight="bold" fontFamily="sans-serif">
        {content}
      </text>
    </g>
  );
}

/** Unique star badge — distinct gold/amber burst star, assigned by staff as the signature Creator Star. */
export function CreatorStar() {
  return (
    <div
      className="relative group cursor-default transition-transform duration-200 hover:scale-110"
      style={{ width: S, height: S, filter: "drop-shadow(0 0 8px rgba(245,158,11,0.5))" }}
      data-testid="creator-badge-emblem-creator-star"
    >
      <svg viewBox="0 0 64 64" width={S} height={S} xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="creator-star-outer" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="creator-star-inner" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="100%" stopColor="#fcd34d" />
          </linearGradient>
          <radialGradient id="creator-star-glow" cx="50%" cy="45%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="70%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#92400e" />
          </radialGradient>
        </defs>
        <polygon points="32,2 36,22 56,22 40,34 46,54 32,42 18,54 24,34 8,22 28,22" fill="url(#creator-star-outer)" stroke="#fbbf24" strokeWidth="1.2" />
        <circle cx="32" cy="32" r="12" fill="url(#creator-star-glow)" stroke="#b45309" strokeWidth="1" />
        <polygon points="32,24 33.5,29 39,29 34.5,32 36,37 32,34 28,37 29.5,32 25,29 30.5,29" fill="#78350f" />
      </svg>
    </div>
  );
}

/** YouTube — red play button, inline SVG */
function CreatorYoutubeBadge() {
  const uid = React.useId();
  return (
    <CBadgeShell glow="rgba(255,0,0,0.5)" id="creator-youtube">
      <defs>
        <linearGradient id={`cr-yt-bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff4444" />
          <stop offset="100%" stopColor="#cc0000" />
        </linearGradient>
      </defs>
      <rect x="8" y="14" width="48" height="36" rx="8" fill={`url(#cr-yt-bg-${uid})`} />
      <path d="M26 22 L26 42 L42 32 Z" fill="#fff" />
    </CBadgeShell>
  );
}

/** Twitch — purple glitch-style, inline SVG */
function CreatorTwitchBadge() {
  const uid = React.useId();
  return (
    <CBadgeShell glow="rgba(145,70,255,0.5)" id="creator-twitch">
      <defs>
        <linearGradient id={`cr-tw-bg-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#b794f6" />
          <stop offset="100%" stopColor="#9146ff" />
        </linearGradient>
      </defs>
      <rect x="10" y="8" width="44" height="48" rx="6" fill={`url(#cr-tw-bg-${uid})`} />
      <circle cx="24" cy="24" r="5" fill="#fff" />
      <circle cx="40" cy="24" r="5" fill="#fff" />
      <path d="M20 36 Q24 40 32 40 Q40 40 44 36" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </CBadgeShell>
  );
}

/** TikTok — music note, inline SVG */
function CreatorTiktokBadge() {
  const uid = React.useId();
  return (
    <CBadgeShell glow="rgba(0,242,234,0.5)" id="creator-tiktok">
      <defs>
        <linearGradient id={`cr-tt-g-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#00f2ea" />
          <stop offset="100%" stopColor="#ff0050" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="44" height="44" rx="10" fill="#0a0a0a" stroke={`url(#cr-tt-g-${uid})`} strokeWidth="2" />
      <path d="M28 18 L28 46 M28 30 Q36 26 42 30 M42 36 Q36 40 28 36" fill="none" stroke={`url(#cr-tt-g-${uid})`} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="42" cy="30" r="5" fill={`url(#cr-tt-g-${uid})`} />
    </CBadgeShell>
  );
}

/** Instagram — camera shape, inline SVG */
function CreatorInstagramBadge() {
  const uid = React.useId();
  return (
    <CBadgeShell glow="rgba(253,29,29,0.4)" id="creator-instagram">
      <defs>
        <linearGradient id={`cr-ig-bg-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#833ab4" />
          <stop offset="50%" stopColor="#fd1d1d" />
          <stop offset="100%" stopColor="#fcaf45" />
        </linearGradient>
      </defs>
      <rect x="10" y="10" width="44" height="44" rx="12" fill={`url(#cr-ig-bg-${uid})`} />
      <rect x="18" y="18" width="28" height="28" rx="6" fill="none" stroke="#fff" strokeWidth="2" />
      <circle cx="32" cy="30" r="6" fill="none" stroke="#fff" strokeWidth="2" />
      <circle cx="38" cy="22" r="2" fill="#fff" />
    </CBadgeShell>
  );
}

/** X (Twitter) — X logo, inline SVG */
function CreatorXBadge() {
  return (
    <CBadgeShell glow="rgba(255,255,255,0.2)" id="creator-x">
      <circle cx="32" cy="32" r="26" fill="#1a1a1a" stroke="#4b5563" strokeWidth="1" />
      <path d="M22 22 L42 42 M42 22 L22 42" stroke="#f3f4f6" strokeWidth="5" strokeLinecap="round" />
    </CBadgeShell>
  );
}

export type CreatorBadgeTier = "short" | "mid" | "long";
export type CreatorBadgeCategory = "auto" | "manual";
export type { CreatorBadgeId } from "../../shared/creator-badges";

export function CreatorBase() {
  return <CreatorStarShell id="creator-base" c1={E.c1} c2={E.c2} c3={E.c3} icon={Txt(32, 30, 10, "★", E.c1)} />;
}
export function CreatorYoutube() {
  return <CreatorYoutubeBadge />;
}
export function CreatorTwitch() {
  return <CreatorTwitchBadge />;
}
export function CreatorTiktok() {
  return <CreatorTiktokBadge />;
}
export function CreatorInstagram() {
  return <CreatorInstagramBadge />;
}
export function CreatorX() {
  return <CreatorXBadge />;
}
export function CreatorFirstOrder() {
  return <CreatorStarShell id="creator-first-order" c1={A.c1} c2={A.c2} c3={A.c3} icon={Txt(32, 30, 10, "1st", A.c1)} />;
}
export function CreatorOrders5() {
  return <CreatorMedal id="creator-orders-5" c1={B.c1} c2={B.c2} c3={B.c3} icon={Txt(32, 38, 14, "5", B.c1)} />;
}
export function CreatorOrders10() {
  return <CreatorStarShell id="creator-orders-10" c1={B.c1} c2={B.c2} c3={B.c3} icon={Txt(32, 30, 12, "10", B.c1)} />;
}
export function CreatorOrders25() {
  return <CreatorHex id="creator-orders-25" c1={V.c1} c2={V.c2} c3={V.c3} icon={Txt(32, 32, 12, "25", V.c1)} />;
}
export function CreatorOrders50() {
  return <CreatorShield id="creator-orders-50" c1={E.c1} c2={E.c2} c3={E.c3} icon={Txt(32, 32, 12, "50", E.c1)} />;
}
export function CreatorOrders100() {
  return <CreatorDiamond id="creator-orders-100" c1={A.c1} c2={A.c2} c3={A.c3} icon={Txt(32, 32, 10, "100", A.c1)} />;
}
export function CreatorFirstPayout() {
  return <CreatorStarShell id="creator-first-payout" c1={E.c1} c2={E.c2} c3={E.c3} icon={Txt(32, 30, 10, "$", E.c1)} />;
}
export function CreatorPayouts5() {
  return <CreatorMedal id="creator-payouts-5" c1={E.c1} c2={E.c2} c3={E.c3} icon={Txt(32, 38, 10, "$5", E.c1)} />;
}
export function CreatorPayouts10() {
  return <CreatorHex id="creator-payouts-10" c1={C.c1} c2={C.c2} c3={C.c3} icon={Txt(32, 32, 9, "$10", C.c1)} />;
}
export function CreatorEarned100() {
  return <CreatorStarShell id="creator-earned-100" c1={A.c1} c2={A.c2} c3={A.c3} icon={Txt(32, 30, 8, "$100", A.c1)} />;
}
export function CreatorEarned500() {
  return <CreatorShield id="creator-earned-500" c1={A.c1} c2={A.c2} c3={A.c3} icon={Txt(32, 32, 8, "$500", A.c1)} />;
}
export function CreatorEarned1k() {
  return <CreatorCircle id="creator-earned-1k" c1={A.c1} c2={A.c2} c3={A.c3} icon={Txt(32, 32, 10, "$1K", A.c1)} />;
}
export function CreatorEarned5k() {
  return <CreatorMedal id="creator-earned-5k" c1={A.c1} c2={A.c2} c3={A.c3} icon={Txt(32, 38, 9, "$5K", A.c1)} />;
}
export function CreatorEarned10k() {
  return <CreatorDiamond id="creator-earned-10k" c1={A.c1} c2={A.c2} c3={A.c3} icon={Txt(32, 32, 8, "$10K", A.c1)} />;
}
export function CreatorEarned25k() {
  return <CreatorStarShell id="creator-earned-25k" c1={O.c1} c2={O.c2} c3={O.c3} icon={Txt(32, 30, 7, "$25K", O.c1)} />;
}
export function CreatorEarned50k() {
  return <CreatorHex id="creator-earned-50k" c1={O.c1} c2={O.c2} c3={O.c3} icon={Txt(32, 32, 7, "$50K", O.c1)} />;
}
export function CreatorEarned100k() {
  return <CreatorShield id="creator-earned-100k" c1={R.c1} c2={R.c2} c3={R.c3} icon={Txt(32, 32, 6, "$100K", R.c1)} />;
}
export function CreatorBalance100() {
  return <CreatorCircle id="creator-balance-100" c1={E.c1} c2={E.c2} c3={E.c3} icon={Txt(32, 32, 7, "B100", E.c1)} />;
}
export function Creator7d() {
  return <CreatorStarShell id="creator-7d" c1={B.c1} c2={B.c2} c3={B.c3} icon={Txt(32, 30, 10, "7d", B.c1)} />;
}
export function Creator30d() {
  return <CreatorMedal id="creator-30d" c1={V.c1} c2={V.c2} c3={V.c3} icon={Txt(32, 38, 9, "30d", V.c1)} />;
}
export function Creator90d() {
  return <CreatorHex id="creator-90d" c1={P.c1} c2={P.c2} c3={P.c3} icon={Txt(32, 32, 9, "90d", P.c1)} />;
}
export function Creator365d() {
  return <CreatorShield id="creator-365d" c1={A.c1} c2={A.c2} c3={A.c3} icon={Txt(32, 32, 8, "1yr", A.c1)} />;
}
export function CreatorSocial2() {
  return <CreatorCircle id="creator-social-2" c1={E.c1} c2={E.c2} c3={E.c3} icon={Txt(32, 32, 10, "2✓", E.c1)} />;
}
export function CreatorSocial3() {
  return <CreatorStarShell id="creator-social-3" c1={C.c1} c2={C.c2} c3={C.c3} icon={Txt(32, 30, 10, "3✓", C.c1)} />;
}
export function CreatorSocialAll() {
  return <CreatorDiamond id="creator-social-all" c1={E.c1} c2={E.c2} c3={E.c3} icon={Txt(32, 32, 8, "All", E.c1)} />;
}
export function Creator6m() {
  return <CreatorHex id="creator-6m" c1={O.c1} c2={O.c2} c3={O.c3} icon={Txt(32, 32, 8, "6m", O.c1)} />;
}
export function Creator2y() {
  return <CreatorShield id="creator-2y" c1={A.c1} c2={A.c2} c3={A.c3} icon={Txt(32, 32, 8, "2yr", A.c1)} />;
}
export function CreatorOrders250() {
  return <CreatorMedal id="creator-orders-250" c1={V.c1} c2={V.c2} c3={V.c3} icon={Txt(32, 38, 7, "250", V.c1)} />;
}
export function CreatorEarned250k() {
  return <CreatorDiamond id="creator-earned-250k" c1={R.c1} c2={R.c2} c3={R.c3} icon={Txt(32, 32, 6, "$250K", R.c1)} />;
}
export function CreatorPayouts25() {
  return <CreatorStarShell id="creator-payouts-25" c1={C.c1} c2={C.c2} c3={C.c3} icon={Txt(32, 30, 7, "$25", C.c1)} />;
}
export function CreatorBalance500() {
  return <CreatorCircle id="creator-balance-500" c1={E.c1} c2={E.c2} c3={E.c3} icon={Txt(32, 32, 6, "B500", E.c1)} />;
}
export function CreatorAmbassador() {
  return <CreatorShield id="creator-ambassador" c1={P.c1} c2={P.c2} c3={P.c3} icon={Txt(32, 32, 7, "Amb", P.c1)} />;
}
export function CreatorTopPromoter() {
  return <CreatorDiamond id="creator-top-promoter" c1={A.c1} c2={A.c2} c3={A.c3} icon={Txt(32, 32, 6, "Top", A.c1)} />;
}
export function CreatorEarlyAdopter() {
  return <CreatorMedal id="creator-early-adopter" c1={V.c1} c2={V.c2} c3={V.c3} icon={Txt(32, 38, 6, "Early", V.c1)} />;
}
export function CreatorCommunityStar() {
  return <CreatorStarShell id="creator-community-star" c1={K.c1} c2={K.c2} c3={K.c3} icon={Txt(32, 30, 6, "Star", K.c1)} />;
}
export function CreatorQualityPartner() {
  return <CreatorHex id="creator-quality-partner" c1={E.c1} c2={E.c2} c3={E.c3} icon={Txt(32, 32, 6, "QP", E.c1)} />;
}
export function CreatorMvp() {
  return <CreatorShield id="creator-mvp" c1={A.c1} c2={A.c2} c3={A.c3} icon={Txt(32, 32, 10, "MVP", A.c1)} />;
}
export function CreatorInnovator() {
  return <CreatorCircle id="creator-innovator" c1={C.c1} c2={C.c2} c3={C.c3} icon={Txt(32, 32, 6, "Inno", C.c1)} />;
}
export function CreatorSupportChamp() {
  return <CreatorMedal id="creator-support-champ" c1={B.c1} c2={B.c2} c3={B.c3} icon={Txt(32, 38, 5, "Support", B.c1)} />;
}
export function CreatorGrowthDriver() {
  return <CreatorStarShell id="creator-growth-driver" c1={E.c1} c2={E.c2} c3={E.c3} icon={Txt(32, 30, 5, "Growth", E.c1)} />;
}
export function CreatorReliable() {
  return <CreatorHex id="creator-reliable" c1={E.c1} c2={E.c2} c3={E.c3} icon={Txt(32, 32, 7, "Rel", E.c1)} />;
}
export function CreatorCommunicator() {
  return <CreatorShield id="creator-communicator" c1={B.c1} c2={B.c2} c3={B.c3} icon={Txt(32, 32, 5, "Com", B.c1)} />;
}
export function CreatorTeamPlayer() {
  return <CreatorCircle id="creator-team-player" c1={B.c1} c2={B.c2} c3={B.c3} icon={Txt(32, 32, 5, "Team", B.c1)} />;
}
export function CreatorMentor() {
  return <CreatorDiamond id="creator-mentor" c1={C.c1} c2={C.c2} c3={C.c3} icon={Txt(32, 32, 8, "Mentor", C.c1)} />;
}
export function CreatorAboveBeyond() {
  return <CreatorStarShell id="creator-above-beyond" c1={A.c1} c2={A.c2} c3={A.c3} icon={Txt(32, 30, 5, "A&B", A.c1)} />;
}
export function CreatorFoundingCreator() {
  return <CreatorShield id="creator-founding-creator" c1={A.c1} c2={A.c2} c3={A.c3} icon={Txt(32, 32, 5, "Found", A.c1)} />;
}
export function CreatorRisingStar() {
  return <CreatorMedal id="creator-rising-star" c1={K.c1} c2={K.c2} c3={K.c3} icon={Txt(32, 38, 5, "Rise", K.c1)} />;
}
export function CreatorTrendsetter() {
  return <CreatorHex id="creator-trendsetter" c1={O.c1} c2={O.c2} c3={O.c3} icon={Txt(32, 32, 5, "Trend", O.c1)} />;
}
export function CreatorInfluencer() {
  return <CreatorCircle id="creator-influencer" c1={K.c1} c2={K.c2} c3={K.c3} icon={Txt(32, 32, 5, "Inf", K.c1)} />;
}
export function CreatorPartner() {
  return <CreatorStarShell id="creator-partner" c1={P.c1} c2={P.c2} c3={P.c3} icon={Txt(32, 30, 7, "Partner", P.c1)} />;
}
export function CreatorVisionary() {
  return <CreatorDiamond id="creator-visionary" c1={V.c1} c2={V.c2} c3={V.c3} icon={Txt(32, 32, 5, "Vision", V.c1)} />;
}
export function CreatorPioneer() {
  return <CreatorShield id="creator-pioneer" c1={O.c1} c2={O.c2} c3={O.c3} icon={Txt(32, 32, 6, "Pioneer", O.c1)} />;
}

export const CREATOR_BADGE_COMPONENTS: Record<CreatorBadgeId, () => JSX.Element> = {
  "creator-base": CreatorBase,
  "creator-youtube": CreatorYoutube,
  "creator-twitch": CreatorTwitch,
  "creator-tiktok": CreatorTiktok,
  "creator-instagram": CreatorInstagram,
  "creator-x": CreatorX,
  "creator-first-order": CreatorFirstOrder,
  "creator-orders-5": CreatorOrders5,
  "creator-orders-10": CreatorOrders10,
  "creator-orders-25": CreatorOrders25,
  "creator-orders-50": CreatorOrders50,
  "creator-orders-100": CreatorOrders100,
  "creator-first-payout": CreatorFirstPayout,
  "creator-payouts-5": CreatorPayouts5,
  "creator-payouts-10": CreatorPayouts10,
  "creator-earned-100": CreatorEarned100,
  "creator-earned-500": CreatorEarned500,
  "creator-earned-1k": CreatorEarned1k,
  "creator-earned-5k": CreatorEarned5k,
  "creator-earned-10k": CreatorEarned10k,
  "creator-earned-25k": CreatorEarned25k,
  "creator-earned-50k": CreatorEarned50k,
  "creator-earned-100k": CreatorEarned100k,
  "creator-balance-100": CreatorBalance100,
  "creator-7d": Creator7d,
  "creator-30d": Creator30d,
  "creator-90d": Creator90d,
  "creator-365d": Creator365d,
  "creator-social-2": CreatorSocial2,
  "creator-social-3": CreatorSocial3,
  "creator-social-all": CreatorSocialAll,
  "creator-6m": Creator6m,
  "creator-2y": Creator2y,
  "creator-orders-250": CreatorOrders250,
  "creator-earned-250k": CreatorEarned250k,
  "creator-payouts-25": CreatorPayouts25,
  "creator-balance-500": CreatorBalance500,
  "creator-ambassador": CreatorAmbassador,
  "creator-top-promoter": CreatorTopPromoter,
  "creator-early-adopter": CreatorEarlyAdopter,
  "creator-community-star": CreatorCommunityStar,
  "creator-quality-partner": CreatorQualityPartner,
  "creator-mvp": CreatorMvp,
  "creator-innovator": CreatorInnovator,
  "creator-support-champ": CreatorSupportChamp,
  "creator-growth-driver": CreatorGrowthDriver,
  "creator-reliable": CreatorReliable,
  "creator-communicator": CreatorCommunicator,
  "creator-team-player": CreatorTeamPlayer,
  "creator-mentor": CreatorMentor,
  "creator-above-beyond": CreatorAboveBeyond,
  "creator-founding-creator": CreatorFoundingCreator,
  "creator-rising-star": CreatorRisingStar,
  "creator-trendsetter": CreatorTrendsetter,
  "creator-influencer": CreatorInfluencer,
  "creator-partner": CreatorPartner,
  "creator-visionary": CreatorVisionary,
  "creator-pioneer": CreatorPioneer,
  "creator-star": CreatorStar,
};

export const CREATOR_BADGE_META: Record<
  CreatorBadgeId,
  { label: string; tooltip: string; category: CreatorBadgeCategory; tier: CreatorBadgeTier }
> = {
  "creator-base": { label: "Creator", tooltip: "Joined the Creator Program", category: "auto", tier: "short" },
  "creator-youtube": { label: "YouTube", tooltip: "Linked your YouTube channel", category: "auto", tier: "short" },
  "creator-twitch": { label: "Twitch", tooltip: "Linked your Twitch channel", category: "auto", tier: "short" },
  "creator-tiktok": { label: "TikTok", tooltip: "Linked your TikTok", category: "auto", tier: "short" },
  "creator-instagram": { label: "Instagram", tooltip: "Linked your Instagram", category: "auto", tier: "short" },
  "creator-x": { label: "X", tooltip: "Linked your X (Twitter) profile", category: "auto", tier: "short" },
  "creator-first-order": { label: "First Sale", tooltip: "First order completed with your code", category: "auto", tier: "short" },
  "creator-orders-5": { label: "5 Orders", tooltip: "5+ orders with your code", category: "auto", tier: "short" },
  "creator-orders-10": { label: "10 Orders", tooltip: "10+ orders with your code", category: "auto", tier: "mid" },
  "creator-orders-25": { label: "25 Orders", tooltip: "25+ orders with your code", category: "auto", tier: "mid" },
  "creator-orders-50": { label: "50 Orders", tooltip: "50+ orders with your code", category: "auto", tier: "long" },
  "creator-orders-100": { label: "Century", tooltip: "100+ orders with your code", category: "auto", tier: "long" },
  "creator-first-payout": { label: "First Payout", tooltip: "Received your first payout", category: "auto", tier: "short" },
  "creator-payouts-5": { label: "5 Payouts", tooltip: "5+ payouts received", category: "auto", tier: "mid" },
  "creator-payouts-10": { label: "10 Payouts", tooltip: "10+ payouts received", category: "auto", tier: "long" },
  "creator-earned-100": { label: "$100 Earned", tooltip: "Earned $100+ total", category: "auto", tier: "short" },
  "creator-earned-500": { label: "$500 Earned", tooltip: "Earned $500+ total", category: "auto", tier: "short" },
  "creator-earned-1k": { label: "$1K Earned", tooltip: "Earned $1,000+ total", category: "auto", tier: "mid" },
  "creator-earned-5k": { label: "$5K Earned", tooltip: "Earned $5,000+ total", category: "auto", tier: "mid" },
  "creator-earned-10k": { label: "$10K Earned", tooltip: "Earned $10,000+ total", category: "auto", tier: "long" },
  "creator-earned-25k": { label: "$25K Earned", tooltip: "Earned $25,000+ total", category: "auto", tier: "long" },
  "creator-earned-50k": { label: "$50K Earned", tooltip: "Earned $50,000+ total", category: "auto", tier: "long" },
  "creator-earned-100k": { label: "$100K Earned", tooltip: "Earned $100,000+ total", category: "auto", tier: "long" },
  "creator-balance-100": { label: "$100 Balance", tooltip: "Reached $100+ available balance", category: "auto", tier: "short" },
  "creator-7d": { label: "Week One", tooltip: "Creator for 7+ days", category: "auto", tier: "short" },
  "creator-30d": { label: "Month One", tooltip: "Creator for 30+ days", category: "auto", tier: "mid" },
  "creator-90d": { label: "Quarter", tooltip: "Creator for 90+ days", category: "auto", tier: "mid" },
  "creator-365d": { label: "One Year", tooltip: "Creator for 1+ year", category: "auto", tier: "long" },
  "creator-social-2": { label: "2 Socials", tooltip: "Linked 2 social platforms", category: "auto", tier: "short" },
  "creator-social-3": { label: "3 Socials", tooltip: "Linked 3 social platforms", category: "auto", tier: "mid" },
  "creator-social-all": { label: "All Socials", tooltip: "Linked all 5 social platforms", category: "auto", tier: "long" },
  "creator-6m": { label: "Six Months", tooltip: "Creator for 6+ months", category: "auto", tier: "mid" },
  "creator-2y": { label: "Two Years", tooltip: "Creator for 2+ years", category: "auto", tier: "long" },
  "creator-orders-250": { label: "250 Orders", tooltip: "250+ orders with your code", category: "auto", tier: "long" },
  "creator-earned-250k": { label: "$250K Earned", tooltip: "Earned $250,000+ total", category: "auto", tier: "long" },
  "creator-payouts-25": { label: "25 Payouts", tooltip: "25+ payouts received", category: "auto", tier: "long" },
  "creator-balance-500": { label: "$500 Balance", tooltip: "Reached $500+ available balance", category: "auto", tier: "mid" },
  "creator-ambassador": { label: "Ambassador", tooltip: "Brand ambassador — represents the program with excellence", category: "manual", tier: "long" },
  "creator-top-promoter": { label: "Top Promoter", tooltip: "Exceptional promotion and referral performance", category: "manual", tier: "long" },
  "creator-early-adopter": { label: "Early Adopter", tooltip: "Joined the Creator Program in its early days", category: "manual", tier: "mid" },
  "creator-community-star": { label: "Community Star", tooltip: "Built community and engagement around the brand", category: "manual", tier: "mid" },
  "creator-quality-partner": { label: "Quality Partner", tooltip: "Consistently high-quality collaboration", category: "manual", tier: "mid" },
  "creator-mvp": { label: "Creator MVP", tooltip: "Most valuable creator — outstanding contribution", category: "manual", tier: "long" },
  "creator-innovator": { label: "Innovator", tooltip: "Brought creative or innovative ideas to promotion", category: "manual", tier: "mid" },
  "creator-support-champ": { label: "Support Champ", tooltip: "Went above and beyond for support or feedback", category: "manual", tier: "short" },
  "creator-growth-driver": { label: "Growth Driver", tooltip: "Directly drove significant growth or revenue", category: "manual", tier: "long" },
  "creator-communicator": { label: "Communicator", tooltip: "Clear and effective communication", category: "manual", tier: "short" },
  "creator-team-player": { label: "Team Player", tooltip: "Collaborated well with the team", category: "manual", tier: "short" },
  "creator-mentor": { label: "Mentor", tooltip: "Helped guide or support other creators", category: "manual", tier: "mid" },
  "creator-above-beyond": { label: "Above & Beyond", tooltip: "Exceeded expectations in a significant way", category: "manual", tier: "long" },
  "creator-founding-creator": { label: "Founding Creator", tooltip: "Original founding creator of the program", category: "manual", tier: "long" },
  "creator-reliable": { label: "Reliable", tooltip: "Consistent and dependable creator", category: "manual", tier: "short" },
  "creator-rising-star": { label: "Rising Star", tooltip: "Fast-growing creator with strong potential", category: "manual", tier: "mid" },
  "creator-trendsetter": { label: "Trendsetter", tooltip: "Sets trends in promotion and content", category: "manual", tier: "mid" },
  "creator-influencer": { label: "Influencer", tooltip: "Recognized influence and reach", category: "manual", tier: "long" },
  "creator-partner": { label: "Partner", tooltip: "Trusted program partner", category: "manual", tier: "long" },
  "creator-visionary": { label: "Visionary", tooltip: "Brought vision and strategy to promotion", category: "manual", tier: "long" },
  "creator-pioneer": { label: "Pioneer", tooltip: "Pioneered new ways to grow the program", category: "manual", tier: "long" },
  "creator-star": { label: "Creator Star", tooltip: "Signature badge — outstanding creator recognized by the team", category: "auto", tier: "long" },
};

export const CREATOR_TIER_LABELS: Record<CreatorBadgeTier, string> = {
  short: "Short-Term",
  mid: "Mid-Term",
  long: "Long-Term",
};

export const CREATOR_TIER_COLORS: Record<CreatorBadgeTier, string> = {
  short: "text-emerald-400",
  mid: "text-amber-400",
  long: "text-red-400",
};
