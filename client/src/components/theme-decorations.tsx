import { useEffect, useState } from "react";
import nba2kS5Bg from "@assets/N26-S5-MT-MC-BONUS-OFFER_INFOGRAPHIC-NA-STATIC-ENUS-ESRB-AGN-_1772302161182.avif";

const SNOWFLAKES = ["❄", "❅", "❆", "✦"];
const LEAVES = ["🍂", "🍁", "🍃"];
const BATS = ["🦇"];
const HEARTS = ["💕", "💗", "♥"];
const STARS = ["✦", "★", "✧", "⭐"];
const CLOVERS = ["☘", "🍀"];
const CONFETTI = ["✦", "✧", "★", "🎊"];
const ENERGY = ["✦", "⚡", "✧"];

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

function NBA2KS5Theme() {
  return (
    <>
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url(${nba2kS5Bg})`,
          backgroundSize: "cover",
          backgroundPosition: "center top",
          opacity: 0.04,
          filter: "saturate(1.2)",
        }}
      />

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full nba2k-glow-pulse"
          style={{
            background: "radial-gradient(circle, rgba(25,168,220,0.08) 0%, rgba(25,168,220,0) 70%)",
          }}
        />
        <div
          className="absolute -bottom-32 -left-32 w-[600px] h-[600px] rounded-full nba2k-glow-pulse"
          style={{
            background: "radial-gradient(circle, rgba(54,167,201,0.06) 0%, rgba(54,167,201,0) 70%)",
            animationDelay: "3s",
          }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-[300px] h-[300px] rounded-full nba2k-glow-pulse"
          style={{
            background: "radial-gradient(circle, rgba(25,168,220,0.04) 0%, rgba(25,168,220,0) 70%)",
            animationDelay: "6s",
          }}
        />
      </div>

      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03]">
        <div className="absolute top-1/2 left-0 right-0 h-px bg-cyan-400" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 rounded-full border border-cyan-400" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-cyan-400" />
        <div className="absolute top-0 bottom-0 left-8 right-8 border-l border-r border-cyan-400" />
        <div className="absolute top-1/4 left-0 w-28 h-52 border border-cyan-400 rounded-r-full -translate-y-1/2" />
        <div className="absolute top-1/4 right-0 w-28 h-52 border border-cyan-400 rounded-l-full -translate-y-1/2" />
      </div>

      <div className="absolute bottom-3 right-4 pointer-events-none select-none flex flex-col items-end gap-0">
        <div className="text-cyan-400/[0.04] text-[100px] font-black leading-none tracking-tighter" style={{ fontFamily: "var(--font-display)" }}>
          2K26
        </div>
        <div className="text-cyan-300/[0.06] text-[28px] font-bold tracking-[0.3em] leading-none -mt-2 mr-1" style={{ fontFamily: "var(--font-display)" }}>
          SEASON 5
        </div>
      </div>

      <div className="absolute top-16 left-0 right-0 pointer-events-none overflow-hidden h-px">
        <div className="w-full h-full nba2k-scanline" style={{ background: "linear-gradient(90deg, transparent, rgba(25,168,220,0.15), transparent)" }} />
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
        setParticles(generateParticles(ENERGY, 8));
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
      {theme === "nba2k" && <NBA2KS5Theme />}
    </div>
  );
}
