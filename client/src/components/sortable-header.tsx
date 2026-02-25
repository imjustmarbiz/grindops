import { TableHead } from "@/components/ui/table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import type { SortDir } from "@/hooks/use-table-sort";

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSortKey: string | null;
  currentSortDir: SortDir;
  onToggle: (key: string) => void;
  className?: string;
}

export function SortableHeader({
  label,
  sortKey,
  currentSortKey,
  currentSortDir,
  onToggle,
  className = "",
}: SortableHeaderProps) {
  const isActive = currentSortKey === sortKey;

  return (
    <TableHead
      className={`whitespace-nowrap cursor-pointer select-none hover:text-foreground transition-colors group ${className}`}
      onClick={() => onToggle(sortKey)}
      data-testid={`sort-header-${sortKey}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
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
    </TableHead>
  );
}
