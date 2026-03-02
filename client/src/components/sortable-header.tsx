import { TableHead } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowUp, ArrowDown, ArrowUpDown, HelpCircle } from "lucide-react";
import type { SortDir } from "@/hooks/use-table-sort";

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey: string | null;
  currentSortDir: SortDir;
  onToggle: (key: string) => void;
  className?: string;
  tooltip?: string;
  /** When true, render label on two lines (first word on line 1, rest on line 2) to save horizontal space */
  twoLine?: boolean;
}

export function SortableHeader({
  label,
  sortKey,
  currentSortKey,
  currentSortDir,
  onToggle,
  className = "",
  tooltip,
  twoLine = false,
}: SortableHeaderProps) {
  const isActive = currentSortKey === sortKey;

  const labelParts = twoLine && label.includes(" ") ? label.split(/\s+(.*)/).filter(Boolean) : null;
  const labelContent = twoLine && labelParts && labelParts.length >= 2 ? (
    <span className="inline-flex flex-col items-center leading-tight">
      <span>{labelParts[0]}</span>
      <span>{labelParts[1]}</span>
    </span>
  ) : (
    <span>{label}</span>
  );

  const content = (
    <span className="inline-flex items-center gap-1">
      {labelContent}
      {tooltip && <HelpCircle className="w-3 h-3 text-muted-foreground/40 shrink-0" />}
      {isActive ? (
        currentSortDir === "asc" ? (
          <ArrowUp className="w-3 h-3 text-primary shrink-0" />
        ) : (
          <ArrowDown className="w-3 h-3 text-primary shrink-0" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors shrink-0" />
      )}
    </span>
  );

  return (
    <TableHead
      className={`cursor-pointer select-none hover:text-foreground transition-colors group px-2 py-3 ${twoLine ? "whitespace-normal text-center min-h-[3.25rem]" : "whitespace-nowrap"} ${className}`}
      onClick={() => onToggle(sortKey)}
      data-testid={`sort-header-${sortKey}`}
    >
      {tooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>
            {content}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-[200px] text-xs">
            {tooltip}
          </TooltipContent>
        </Tooltip>
      ) : (
        content
      )}
    </TableHead>
  );
}
