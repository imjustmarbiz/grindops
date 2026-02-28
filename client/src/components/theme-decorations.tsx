import { useEffect, useState } from "react";

const SNOWFLAKES = ["❄", "❅", "❆", "✦"];
const LEAVES = ["🍂", "🍁", "🍃"];
const BATS = ["🦇"];
const HEARTS = ["💕", "💗", "♥"];
const STARS = ["✦", "★", "✧", "⭐"];
const CLOVERS = ["☘", "🍀"];
const CONFETTI = ["✦", "✧", "★", "🎊"];
const BASKETBALLS = ["🏀"];

interface Particle {
  id: number;
  x: number;
  char: string;
  delay: number;
  duration: number;
  size: number;
  opacity: number;
  drift: number;
}

function generateParticles(chars: string[], count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    char: chars[Math.floor(Math.random() * chars.length)],
    delay: Math.random() * 15,
    duration: 8 + Math.random() * 12,
    size: 10 + Math.random() * 14,
    opacity: 0.15 + Math.random() * 0.2,
    drift: -30 + Math.random() * 60,
  }));
}

function FallingParticles({ particles }: { particles: Particle[] }) {
  return (
    <>
      {particles.map((p) => (
        <span
          key={p.id}
          className="theme-particle"
          style={{
            left: `${p.x}%`,
            fontSize: `${p.size}px`,
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            ["--drift" as any]: `${p.drift}px`,
          }}
        >
          {p.char}
        </span>
      ))}
    </>
  );
}

function CornerWebs() {
  return (
    <>
      <svg className="absolute top-0 left-0 w-32 h-32 opacity-[0.07] pointer-events-none" viewBox="0 0 128 128">
        <path d="M0 0 L128 0 L0 128 Z" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-orange-300" />
        <path d="M0 0 Q64 16 128 0" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-orange-300" />
        <path d="M0 0 Q16 64 0 128" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-orange-300" />
        <path d="M0 0 Q48 48 0 128" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-orange-300" />
        <path d="M0 0 Q48 48 128 0" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-orange-300" />
        <path d="M0 0 L96 32" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-orange-300" />
        <path d="M0 0 L32 96" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-orange-300" />
        <path d="M0 0 L64 64" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-orange-300" />
        <circle cx="64" cy="64" r="1.5" fill="currentColor" className="text-orange-400" opacity="0.3" />
      </svg>
      <svg className="absolute top-0 right-0 w-32 h-32 opacity-[0.07] pointer-events-none scale-x-[-1]" viewBox="0 0 128 128">
        <path d="M0 0 L128 0 L0 128 Z" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-orange-300" />
        <path d="M0 0 Q64 16 128 0" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-orange-300" />
        <path d="M0 0 Q16 64 0 128" fill="none" stroke="currentColor" strokeWidth="0.4" className="text-orange-300" />
        <path d="M0 0 Q48 48 0 128" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-orange-300" />
        <path d="M0 0 Q48 48 128 0" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-orange-300" />
        <path d="M0 0 L96 32" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-orange-300" />
        <path d="M0 0 L32 96" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-orange-300" />
        <path d="M0 0 L64 64" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-orange-300" />
      </svg>
    </>
  );
}

function CourtLines() {
  return (
    <>
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04]">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-orange-400" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full border border-orange-400" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-orange-400" />
        <div className="absolute top-0 bottom-0 left-8 right-8 border-l border-r border-orange-400" />
        <div className="absolute top-1/4 left-0 w-24 h-48 border border-orange-400 rounded-r-full -translate-y-1/2" />
        <div className="absolute top-1/4 right-0 w-24 h-48 border border-orange-400 rounded-l-full -translate-y-1/2" />
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-32 h-20 border-b border-l border-r border-orange-400" />
        <div className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-20 border-t border-l border-r border-orange-400" />
      </div>
      <div className="absolute bottom-4 right-4 text-orange-500/[0.06] text-[120px] font-black pointer-events-none select-none leading-none" style={{ fontFamily: "var(--font-display)" }}>
        2K
      </div>
    </>
  );
}

function ChristmasLights() {
  const colors = ["text-red-400", "text-green-400", "text-yellow-400", "text-blue-400", "text-pink-400"];
  return (
    <div className="absolute top-0 left-0 right-0 flex justify-between px-8 pointer-events-none opacity-40">
      {Array.from({ length: 12 }, (_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${colors[i % colors.length]} theme-twinkle`}
          style={{
            animationDelay: `${i * 0.3}s`,
            boxShadow: `0 0 6px currentColor, 0 0 12px currentColor`,
          }}
        />
      ))}
    </div>
  );
}

function Fireworks() {
  return (
    <div className="absolute top-8 right-12 pointer-events-none">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="absolute theme-firework"
          style={{
            left: `${i * 80 - 40}px`,
            top: `${i * 20}px`,
            animationDelay: `${i * 2}s`,
          }}
        >
          {Array.from({ length: 8 }, (_, j) => (
            <span
              key={j}
              className="absolute w-1 h-1 rounded-full"
              style={{
                background: ["#ef4444", "#3b82f6", "#ffffff"][i % 3],
                transform: `rotate(${j * 45}deg) translateY(-12px)`,
                opacity: 0.4,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function ThemeDecorations({ theme }: { theme: string | null | undefined }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!theme || theme === "none") {
      setParticles([]);
      return;
    }
    switch (theme) {
      case "christmas":
        setParticles(generateParticles(SNOWFLAKES, 20));
        break;
      case "thanksgiving":
        setParticles(generateParticles(LEAVES, 15));
        break;
      case "halloween":
        setParticles(generateParticles(BATS, 8));
        break;
      case "valentines":
        setParticles(generateParticles(HEARTS, 12));
        break;
      case "new-years":
        setParticles(generateParticles(CONFETTI, 18));
        break;
      case "st-patricks":
        setParticles(generateParticles(CLOVERS, 12));
        break;
      case "4th-of-july":
        setParticles(generateParticles(STARS, 14));
        break;
      case "nba2k":
        setParticles(generateParticles(BASKETBALLS, 5));
        break;
      default:
        setParticles([]);
    }
  }, [theme]);

  if (!theme || theme === "none") return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[1] overflow-hidden" data-testid="theme-decorations">
      <FallingParticles particles={particles} />

      {theme === "christmas" && <ChristmasLights />}
      {theme === "halloween" && <CornerWebs />}
      {theme === "4th-of-july" && <Fireworks />}
      {theme === "nba2k" && <CourtLines />}
    </div>
  );
}
