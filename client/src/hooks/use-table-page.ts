import { useEffect, useRef, useState, useCallback } from "react";

export function useTablePage() {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const [tableHeight, setTableHeight] = useState<number | undefined>(undefined);

  const recalculate = useCallback(() => {
    const el = tableContainerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const available = window.innerHeight - rect.top - 24;
    setTableHeight(Math.max(200, available));
  }, []);

  useEffect(() => {
    const main = document.querySelector("main");
    if (main) {
      main.style.overflow = "hidden";
    }

    recalculate();

    const timer = setTimeout(recalculate, 100);

    window.addEventListener("resize", recalculate);
    return () => {
      window.removeEventListener("resize", recalculate);
      clearTimeout(timer);
      if (main) {
        main.style.overflow = "";
      }
    };
  }, [recalculate]);

  return { tableContainerRef, tableHeight };
}
