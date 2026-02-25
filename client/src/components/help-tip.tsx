import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { CircleHelp } from "lucide-react";

export function HelpTip({ text, className }: { text: string; className?: string }) {
  const [show, setShow] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const justOpenedRef = useRef(false);
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean }>({ top: 0, left: 0, above: true });

  const calcPosition = useCallback(() => {
    if (!btnRef.current) return { top: 0, left: 0, above: true };
    const rect = btnRef.current.getBoundingClientRect();
    const popupW = 256;
    const popupH = 120;
    const pad = 8;

    const above = rect.top > popupH + pad;
    const top = above ? rect.top - pad : rect.bottom + pad;

    let left = rect.left + rect.width / 2 - popupW / 2;
    if (left < pad) left = pad;
    if (left + popupW > window.innerWidth - pad) left = window.innerWidth - pad - popupW;

    return { top, left, above };
  }, []);

  const handleToggle = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (show) {
      setShow(false);
    } else {
      setPos(calcPosition());
      justOpenedRef.current = true;
      setShow(true);
      requestAnimationFrame(() => { justOpenedRef.current = false; });
    }
  }, [show, calcPosition]);

  useEffect(() => {
    if (!show) return;
    const onScroll = () => setShow(false);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", () => setPos(calcPosition()));
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", () => setPos(calcPosition()));
    };
  }, [show, calcPosition]);

  useEffect(() => {
    if (!show) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (justOpenedRef.current) return;
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (popupRef.current?.contains(target)) return;
      setShow(false);
    };
    document.addEventListener("mousedown", handler, true);
    document.addEventListener("touchstart", handler, true);
    return () => {
      document.removeEventListener("mousedown", handler, true);
      document.removeEventListener("touchstart", handler, true);
    };
  }, [show]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleToggle}
        onTouchEnd={handleToggle}
        className={`inline-flex p-0.5 rounded-full text-muted-foreground hover:text-foreground transition-colors ${className || ""}`}
        data-testid="button-help-tip"
        type="button"
      >
        <CircleHelp className="w-4 h-4" />
      </button>
      {createPortal(
        show ? (
          <div
            ref={popupRef}
            style={{
              position: "fixed",
              top: pos.above ? undefined : pos.top,
              bottom: pos.above ? `${window.innerHeight - pos.top}px` : undefined,
              left: pos.left,
              width: 256,
              opacity: 1,
            }}
            className="rounded-lg border border-white/10 bg-black/90 backdrop-blur-md p-3 shadow-2xl z-[9999] animate-in fade-in zoom-in-95 duration-100"
            data-testid="popup-help-tip"
          >
            <p className="text-xs text-gray-300 leading-relaxed">{text}</p>
          </div>
        ) : null,
        document.body
      )}
    </>
  );
}
