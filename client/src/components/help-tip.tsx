import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CircleHelp } from "lucide-react";

export function HelpTip({ text, className }: { text: string; className?: string }) {
  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!show) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShow(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [show]);

  return (
    <div className={`relative inline-flex ${className || ""}`} ref={ref}>
      <button
        onClick={() => setShow(prev => !prev)}
        onMouseEnter={() => setShow(true)}
        className="p-0.5 rounded-full text-muted-foreground hover:text-foreground transition-colors"
        data-testid="button-help-tip"
      >
        <CircleHelp className="w-3.5 h-3.5" />
      </button>
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 rounded-lg border border-white/10 bg-black/80 backdrop-blur-md p-3 shadow-xl z-50"
            data-testid="popup-help-tip"
          >
            <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
