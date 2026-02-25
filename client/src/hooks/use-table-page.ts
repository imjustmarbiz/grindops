import { useEffect, useRef, useState, useCallback } from "react";

export function useTablePage() {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [tableHeight, setTableHeight] = useState<number | undefined>(undefined);

  const recalculate = useCallback(() => {
    const el = tableContainerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const available = window.innerHeight - rect.top - 16;
    if (available > 200) {
      setTableHeight(available);
    }
  }, []);

  useEffect(() => {
    const scrollToTable = () => {
      const el = tableContainerRef.current;
      if (!el) return;
      const card = el.closest(".overflow-hidden");
      if (card) {
        card.scrollIntoView({ block: "start", behavior: "instant" });
      }
    };

    const timer1 = setTimeout(() => { recalculate(); }, 50);
    const timer2 = setTimeout(() => { recalculate(); }, 200);
    const timer3 = setTimeout(() => { recalculate(); }, 500);

    window.addEventListener("resize", recalculate);

    return () => {
      window.removeEventListener("resize", recalculate);
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [recalculate]);

  return { tableContainerRef, tableHeight };
}
