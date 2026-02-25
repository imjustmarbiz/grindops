import { useState, useMemo } from "react";

export type SortDir = "asc" | "desc";

export function useTableSort<T>(
  items: T[],
  defaultKey?: string,
  defaultDir: SortDir = "asc"
) {
  const [sortKey, setSortKey] = useState<string | null>(defaultKey || null);
  const [sortDir, setSortDir] = useState<SortDir>(defaultDir);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const sortedItems = useMemo(() => {
    if (!sortKey) return items;

    return [...items].sort((a, b) => {
      const aVal = (a as any)[sortKey];
      const bVal = (b as any)[sortKey];

      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let cmp = 0;

      const aNum = Number(aVal);
      const bNum = Number(bVal);
      if (!isNaN(aNum) && !isNaN(bNum) && aVal !== "" && bVal !== "") {
        cmp = aNum - bNum;
      } else {
        const aStr = String(aVal);
        const bStr = String(bVal);
        const aDate = Date.parse(aStr);
        const bDate = Date.parse(bStr);
        if (!isNaN(aDate) && !isNaN(bDate) && aStr.length > 8) {
          cmp = aDate - bDate;
        } else {
          cmp = aStr.localeCompare(bStr, undefined, { sensitivity: "base" });
        }
      }

      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [items, sortKey, sortDir]);

  return { sortedItems, sortKey, sortDir, toggleSort };
}
