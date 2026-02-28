import { useState } from "react";
import { X } from "lucide-react";
import {
  STAFF_BADGE_COMPONENTS, STAFF_BADGE_META, type StaffBadgeId,
} from "@/components/staff-achievement-badges";

function getAdaptiveClasses(count: number) {
  if (count <= 4) return { icon: "w-14 h-14", svg: "[&_svg]:w-14 [&_svg]:h-14 [&>div]:!w-14 [&>div]:!h-14", gap: "gap-4", label: "text-[10px] max-w-[80px]" };
  if (count <= 8) return { icon: "w-12 h-12", svg: "[&_svg]:w-12 [&_svg]:h-12 [&>div]:!w-12 [&>div]:!h-12", gap: "gap-3", label: "text-[10px] max-w-[72px]" };
  return { icon: "w-10 h-10", svg: "[&_svg]:w-10 [&_svg]:h-10 [&>div]:!w-10 [&>div]:!h-10", gap: "gap-2.5", label: "text-[9px] max-w-[64px]" };
}

function StaffBadgeItem({ badgeId, onSelect, sizeClasses, prefix }: {
  badgeId: StaffBadgeId;
  onSelect: (id: StaffBadgeId) => void;
  sizeClasses: ReturnType<typeof getAdaptiveClasses>;
  prefix: string;
}) {
  const BadgeComp = STAFF_BADGE_COMPONENTS[badgeId];
  const meta = STAFF_BADGE_META[badgeId];
  if (!BadgeComp || !meta) return null;

  return (
    <div className="relative group">
      <button
        onClick={() => onSelect(badgeId)}
        className="flex flex-col items-center gap-1 transition-transform active:scale-95"
        data-testid={`${prefix}-badge-${badgeId}`}
      >
        <div className={`${sizeClasses.icon} flex items-center justify-center ${sizeClasses.svg}`}>
          <BadgeComp />
        </div>
        <span className={`${sizeClasses.label} font-semibold text-muted-foreground/80 leading-tight text-center break-words`}>
          {meta.label}
        </span>
      </button>

      <div
        className="hidden md:group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 p-2.5 rounded-lg bg-popover border border-border shadow-2xl z-[9999] pointer-events-none"
        data-testid={`${prefix}-badge-tooltip-${badgeId}`}
      >
        <p className="text-xs font-bold text-foreground">{meta.label}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{meta.tooltip}</p>
      </div>
    </div>
  );
}

export function StaffBadgeGrid({ badgeIds, testIdPrefix = "staff" }: {
  badgeIds: StaffBadgeId[];
  testIdPrefix?: string;
}) {
  const [selectedBadge, setSelectedBadge] = useState<StaffBadgeId | null>(null);
  const selectedMeta = selectedBadge ? STAFF_BADGE_META[selectedBadge] : null;
  const SelectedComp = selectedBadge ? STAFF_BADGE_COMPONENTS[selectedBadge] : null;
  const sizeClasses = getAdaptiveClasses(badgeIds.length);

  if (badgeIds.length === 0) return null;

  return (
    <div className="relative" data-testid={`${testIdPrefix}-badge-grid`}>
      <div className={`flex items-start ${sizeClasses.gap} flex-wrap`}>
        {badgeIds.map(id => (
          <StaffBadgeItem
            key={id}
            badgeId={id}
            onSelect={(bid) => setSelectedBadge(prev => prev === bid ? null : bid)}
            sizeClasses={sizeClasses}
            prefix={testIdPrefix}
          />
        ))}
      </div>

      {selectedBadge && selectedMeta && SelectedComp && (
        <div
          className="md:hidden mt-3 p-3 rounded-xl bg-popover/95 backdrop-blur-sm border border-border shadow-2xl animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
          data-testid={`${testIdPrefix}-badge-popup-${selectedBadge}`}
        >
          <div className="flex items-center gap-3">
            <div className="shrink-0 w-12 h-12 [&_svg]:w-12 [&_svg]:h-12 [&>div]:!w-12 [&>div]:!h-12 flex items-center justify-center">
              <SelectedComp />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{selectedMeta.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{selectedMeta.tooltip}</p>
            </div>
            <button
              onClick={() => setSelectedBadge(null)}
              className="shrink-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-muted-foreground hover:text-foreground"
              data-testid={`${testIdPrefix}-button-close-badge-popup`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
