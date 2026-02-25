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
    recalculate();

    const timer = setTimeout(recalculate, 150);
    const timer2 = setTimeout(recalculate, 500);

    window.addEventListener("resize", recalculate);

    const observer = new MutationObserver(recalculate);
    const el = tableContainerRef.current;
    if (el?.parentElement) {
      observer.observe(el.parentElement, { childList: true, subtree: true });
    }

    return () => {
      window.removeEventListener("resize", recalculate);
      clearTimeout(timer);
      clearTimeout(timer2);
      observer.disconnect();
    };
  }, [recalculate]);

  return { tableContainerRef, tableHeight };
}
