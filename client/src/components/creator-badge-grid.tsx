import { useState, useRef, useEffect, useCallback } from "react";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
import {
  CREATOR_BADGE_COMPONENTS,
  CREATOR_BADGE_META,
  CREATOR_TIER_LABELS,
  type CreatorBadgeId,
} from "@/components/creator-achievement-badges";

function getAdaptiveClasses(count: number) {
  if (count <= 4) return { icon: "w-14 h-14", svg: "[&_svg]:w-14 [&_svg]:h-14 [&>div]:!w-14 [&>div]:!h-14", gap: "gap-4", label: "text-xs" };
  if (count <= 8) return { icon: "w-12 h-12", svg: "[&_svg]:w-12 [&_svg]:h-12 [&>div]:!w-12 [&>div]:!h-12", gap: "gap-3", label: "text-xs" };
  return { icon: "w-10 h-10", svg: "[&_svg]:w-10 [&_svg]:h-10 [&>div]:!w-10 [&>div]:!h-10", gap: "gap-2.5", label: "text-[11px]" };
}

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth >= 768 : false
  );
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return isDesktop;
}

function FloatingTooltip({ badgeId, anchorEl }: {
  badgeId: CreatorBadgeId;
  anchorEl: HTMLElement;
}) {
  const meta = CREATOR_BADGE_META[badgeId];
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    const rect = anchorEl.getBoundingClientRect();
    const tooltipWidth = 208;
    let left = rect.left + rect.width / 2 - tooltipWidth / 2;
    if (left < 8) left = 8;
    if (left + tooltipWidth > window.innerWidth - 8) left = window.innerWidth - 8 - tooltipWidth;
    setPos({ top: rect.top - 8, left });
  }, [anchorEl]);

  if (!meta || !pos) return null;

  return createPortal(
    <div
      className="fixed w-52 p-2.5 rounded-lg bg-popover border border-border shadow-2xl pointer-events-none animate-in fade-in-0 zoom-in-95 duration-150"
      style={{ top: pos.top, left: pos.left, transform: "translateY(-100%)", zIndex: 99999 }}
      data-testid={`creator-tooltip-floating-${badgeId}`}
    >
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm font-bold text-foreground">{meta.label}</p>
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{CREATOR_TIER_LABELS[meta.tier]}</span>
      </div>
      <p className="text-xs text-muted-foreground/80 mt-0.5">{meta.category === "auto" ? "Auto-Earned" : "Staff awarded"}</p>
      <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{meta.tooltip}</p>
    </div>,
    document.body,
  );
}

function CreatorBadgeItem({ badgeId, onSelect, sizeClasses, prefix, isDesktop }: {
  badgeId: CreatorBadgeId;
  onSelect: (id: CreatorBadgeId) => void;
  sizeClasses: ReturnType<typeof getAdaptiveClasses>;
  prefix: string;
  isDesktop: boolean;
}) {
  const BadgeComp = CREATOR_BADGE_COMPONENTS[badgeId];
  const meta = CREATOR_BADGE_META[badgeId];
  const [hovered, setHovered] = useState(false);
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  if (!BadgeComp || !meta) return null;

  const handleMouseEnter = useCallback(() => {
    if (isDesktop && btnRef.current) {
      setAnchorEl(btnRef.current);
      setHovered(true);
    }
  }, [isDesktop]);

  const handleMouseLeave = useCallback(() => {
    setHovered(false);
    setAnchorEl(null);
  }, []);

  const handleClick = useCallback(() => {
    if (!isDesktop) {
      onSelect(badgeId);
    }
  }, [isDesktop, badgeId, onSelect]);

  return (
    <div className="relative" data-testid={`${prefix}-creator-badge-wrapper-${badgeId}`}>
      <button
        ref={btnRef}
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="flex flex-col items-center gap-1 transition-transform active:scale-95"
        data-testid={`${prefix}-creator-badge-${badgeId}`}
      >
        <div className={`${sizeClasses.icon} flex items-center justify-center ${sizeClasses.svg} pointer-events-none`}>
          <BadgeComp />
        </div>
        <span className={`${sizeClasses.label} font-semibold text-muted-foreground/80 leading-tight text-center break-words pointer-events-none`}>
          {meta.label}
        </span>
      </button>

      {hovered && isDesktop && anchorEl && (
        <FloatingTooltip badgeId={badgeId} anchorEl={anchorEl} />
      )}
    </div>
  );
}

export function CreatorBadgeGrid({ badgeIds, testIdPrefix = "creator" }: {
  badgeIds: CreatorBadgeId[];
  testIdPrefix?: string;
}) {
  const [selectedBadge, setSelectedBadge] = useState<CreatorBadgeId | null>(null);
  const selectedMeta = selectedBadge ? CREATOR_BADGE_META[selectedBadge] : null;
  const SelectedComp = selectedBadge ? CREATOR_BADGE_COMPONENTS[selectedBadge] : null;
  const knownIds = badgeIds.filter((id): id is CreatorBadgeId => id in CREATOR_BADGE_COMPONENTS);
  const sizeClasses = getAdaptiveClasses(knownIds.length);
  const isDesktop = useIsDesktop();

  if (knownIds.length === 0) return null;

  return (
    <div className="relative" data-testid={`${testIdPrefix}-creator-badge-grid`}>
      <div className={`flex items-start ${sizeClasses.gap} flex-wrap`}>
        {knownIds.map(id => (
          <CreatorBadgeItem
            key={id}
            badgeId={id}
            onSelect={(bid) => setSelectedBadge(prev => prev === bid ? null : bid)}
            sizeClasses={sizeClasses}
            prefix={testIdPrefix}
            isDesktop={isDesktop}
          />
        ))}
      </div>

      {selectedBadge && selectedMeta && SelectedComp && !isDesktop && (
        <div
          className="mt-3 p-3 rounded-xl bg-popover/95 backdrop-blur-sm border border-border shadow-2xl animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
          data-testid={`${testIdPrefix}-creator-badge-popup-${selectedBadge}`}
        >
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-12 h-12 [&_svg]:w-12 [&_svg]:h-12 [&>div]:!w-12 [&>div]:!h-12 flex items-center justify-center">
              <SelectedComp />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-bold text-foreground">{selectedMeta.label}</p>
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {CREATOR_TIER_LABELS[selectedMeta.tier]}
                </span>
              </div>
              <p className="text-xs text-muted-foreground/80">{selectedMeta.category === "auto" ? "Auto-Earned" : "Staff awarded"}</p>
              <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{selectedMeta.tooltip}</p>
            </div>
            <button
              onClick={() => setSelectedBadge(null)}
              className="shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground"
              data-testid={`${testIdPrefix}-button-close-creator-badge-popup`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
