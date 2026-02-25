import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CircleHelp } from "lucide-react";

export function HelpTip({ text, className }: { text: string; className?: string }) {
  const [show, setShow] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number; above: boolean }>({ top: 0, left: 0, above: true });

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const popupW = 256;
    const popupH = 120;
    const pad = 8;

    const above = rect.top > popupH + pad;
    const top = above ? rect.top - pad : rect.bottom + pad;

    let left = rect.left + rect.width / 2 - popupW / 2;
    if (left < pad) left = pad;
    if (left + popupW > window.innerWidth - pad) left = window.innerWidth - pad - popupW;

    setPos({ top, left, above });
  }, []);

  useEffect(() => {
    if (!show) return;
    updatePosition();
    const onScroll = () => setShow(false);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [show, updatePosition]);

  useEffect(() => {
    if (!show) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (btnRef.current?.contains(target)) return;
      if (popupRef.current?.contains(target)) return;
      setShow(false);
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [show]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); setShow(prev => !prev); }}
        className={`inline-flex p-0.5 rounded-full text-muted-foreground hover:text-foreground transition-colors ${className || ""}`}
        data-testid="button-help-tip"
        type="button"
      >
        <CircleHelp className="w-4 h-4" />
      </button>
      {createPortal(
        <AnimatePresence>
          {show && (
            <motion.div
              ref={popupRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: "fixed",
                top: pos.above ? undefined : pos.top,
                bottom: pos.above ? `${window.innerHeight - pos.top}px` : undefined,
                left: pos.left,
                width: 256,
              }}
              className="rounded-lg border border-white/10 bg-black/90 backdrop-blur-md p-3 shadow-2xl z-[9999]"
              data-testid="popup-help-tip"
            >
              <p className="text-xs text-gray-300 leading-relaxed">{text}</p>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
