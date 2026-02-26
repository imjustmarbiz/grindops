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
}

export function SortableHeader({
  label,
  sortKey,
  currentSortKey,
  currentSortDir,
  onToggle,
  className = "",
  tooltip,
}: SortableHeaderProps) {
  const isActive = currentSortKey === sortKey;

  const content = (
    <span className="inline-flex items-center gap-1">
      {label}
      {tooltip && <HelpCircle className="w-3 h-3 text-muted-foreground/40" />}
      {isActive ? (
        currentSortDir === "asc" ? (
          <ArrowUp className="w-3 h-3 text-primary" />
        ) : (
          <ArrowDown className="w-3 h-3 text-primary" />
        )
      ) : (
        <ArrowUpDown className="w-3 h-3 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-colors" />
      )}
    </span>
  );

  return (
    <TableHead
      className={`whitespace-nowrap cursor-pointer select-none hover:text-foreground transition-colors group ${className}`}
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
