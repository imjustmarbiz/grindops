import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, X, Sparkles, MousePointerClick, Eye, Zap, FileCheck, Gavel, Banknote, LayoutDashboard, Bell, MessageCircle, Brain, Crown, Settings, ListOrdered, Users, ClipboardCheck, BarChart3, Rocket, CheckCircle2, Play } from "lucide-react";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  targetSelector?: string;
  targetArea?: "sidebar" | "header" | "main" | "full";
  demoAction?: string;
  position?: "center" | "top" | "bottom" | "left" | "right";
}

const grinderSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to GrindOps",
    description: "Your command center for managing gaming service orders. This quick tour will show you how everything works so you can start earning right away.",
    icon: Sparkles,
    targetArea: "full",
    position: "center",
  },
  {
    id: "sidebar-nav",
    title: "Navigation Sidebar",
    description: "This is your navigation hub. Access all your pages from here — orders, bids, assignments, payouts, and more. Click the menu icon to collapse it on mobile.",
    icon: LayoutDashboard,
    targetSelector: "[data-sidebar]",
    targetArea: "sidebar",
    position: "right",
  },
  {
    id: "overview-stats",
    title: "Your Dashboard",
    description: "Your overview shows quick stats — active orders, completed jobs, pending bids, and your earnings at a glance. Keep an eye on these to track your performance.",
    icon: Eye,
    targetArea: "main",
    position: "center",
  },
  {
    id: "available-orders",
    title: "Available Orders",
    description: "When new orders come in, they appear in the Available Orders page. Each order shows the service, platform, price, and deadline. Orders with higher priority appear first.",
    icon: Zap,
    targetSelector: '[data-testid="nav-available-orders"]',
    targetArea: "sidebar",
    position: "right",
    demoAction: "watch_order_appear",
  },
  {
    id: "bidding",
    title: "Place Your Bids",
    description: "Found an order you want? Place a bid with your price. The AI queue system scores bids based on your performance, reliability, and specialization. Better scorecards = better chances!",
    icon: Gavel,
    targetSelector: '[data-testid="nav-my-bids"]',
    targetArea: "sidebar",
    position: "right",
    demoAction: "watch_bid_placed",
  },
  {
    id: "assignments",
    title: "Your Assignments",
    description: "Once your bid is accepted, the order moves here. You'll see login buttons, status checkpoints, and a timeline. Use Log In → Start → complete the work → Mark Complete.",
    icon: FileCheck,
    targetSelector: '[data-testid="nav-my-orders"]',
    targetArea: "sidebar",
    position: "right",
    demoAction: "watch_assignment_flow",
  },
  {
    id: "checkpoints",
    title: "Real-Time Checkpoints",
    description: "As you work, use the checkpoint buttons to update your status: Log In when you access the account, Start Order when you begin work, and report any Issues immediately.",
    icon: CheckCircle2,
    targetArea: "main",
    position: "center",
    demoAction: "watch_checkpoints",
  },
  {
    id: "scorecard",
    title: "Your Scorecard",
    description: "Your scorecard tracks quality, reliability, and speed. Higher scores mean better queue positioning and more order opportunities. Check it regularly to see what to improve.",
    icon: ClipboardCheck,
    targetSelector: '[data-testid="nav-my-scorecard"]',
    targetArea: "sidebar",
    position: "right",
  },
  {
    id: "payouts",
    title: "Get Paid",
    description: "After completing an order, request a payout from the Payouts page. Choose your payment method (Zelle, PayPal, Cash App, etc.) and staff will process it promptly.",
    icon: Banknote,
    targetSelector: '[data-testid="nav-payouts"]',
    targetArea: "sidebar",
    position: "right",
  },
  {
    id: "notifications",
    title: "Stay Updated",
    description: "The bell icon shows your notifications — bid results, new assignments, deadline changes, and team announcements. You'll also get sound alerts for important events.",
    icon: Bell,
    targetSelector: '[data-testid="button-notifications"]',
    targetArea: "header",
    position: "bottom",
  },
  {
    id: "chat",
    title: "Team Chat",
    description: "Use the chat icon to communicate with staff directly. Ask questions, report issues, or discuss orders — all within the dashboard.",
    icon: MessageCircle,
    targetSelector: '[data-testid="button-open-chat"]',
    targetArea: "header",
    position: "bottom",
  },
  {
    id: "complete",
    title: "You're Ready to Grind!",
    description: "That's the basics! Check Available Orders to find your first job, or explore the Operations Guide in the sidebar for detailed tips. Good luck out there!",
    icon: Rocket,
    targetArea: "full",
    position: "center",
  },
];

const staffSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to GrindOps Command Center",
    description: "Your centralized dashboard for managing the entire gaming service operation. This tour will walk you through the key tools at your disposal.",
    icon: Crown,
    targetArea: "full",
    position: "center",
  },
  {
    id: "overview",
    title: "Command Center Overview",
    description: "Your dashboard shows real-time financials — total revenue, grinder payouts, company profit, and average order value. The order pipeline below tracks every order's status.",
    icon: LayoutDashboard,
    targetArea: "main",
    position: "center",
  },
  {
    id: "orders",
    title: "Order Management",
    description: "Create and manage orders from the Orders page. Set services, prices, platforms, and deadlines. Change statuses, assign grinders, and track progress all in one place.",
    icon: ListOrdered,
    targetSelector: '[data-testid="nav-orders"]',
    targetArea: "sidebar",
    position: "right",
    demoAction: "watch_order_lifecycle",
  },
  {
    id: "grinders",
    title: "Grinder Management",
    description: "View all grinders, their stats, availability, and performance. Assign roles, manage strikes, and track who's online and ready to work.",
    icon: Users,
    targetSelector: '[data-testid="nav-grinders"]',
    targetArea: "sidebar",
    position: "right",
  },
  {
    id: "bids",
    title: "Bid Review",
    description: "When grinders bid on orders, review them here. The AI queue system ranks bids by scorecard, but you can override and accept any bid manually.",
    icon: Gavel,
    targetSelector: '[data-testid="nav-bids"]',
    targetArea: "sidebar",
    position: "right",
    demoAction: "watch_bid_review",
  },
  {
    id: "assignments",
    title: "Order Assignments",
    description: "Track all active assignments. See login status, checkpoints, and progress in real-time. Reassign orders if a grinder needs replacement.",
    icon: FileCheck,
    targetSelector: '[data-testid="nav-order-assignments"]',
    targetArea: "sidebar",
    position: "right",
  },
  {
    id: "payouts",
    title: "Payout Processing",
    description: "Review and approve grinder payout requests. Track payment history, methods, and amounts. Mark payouts as paid once processed.",
    icon: Banknote,
    targetSelector: '[data-testid="nav-grinder-payouts"]',
    targetArea: "sidebar",
    position: "right",
  },
  {
    id: "analytics",
    title: "Analytics & Reports",
    description: "Deep-dive into performance data — revenue trends, grinder rankings, order completion rates, and more. Use filters to analyze specific time periods.",
    icon: BarChart3,
    targetSelector: '[data-testid="nav-analytics"]',
    targetArea: "sidebar",
    position: "right",
  },
  {
    id: "admin",
    title: "Admin Settings",
    description: "Configure services, bidding windows, queue settings, embed branding, and maintenance mode. This is your control panel for the entire system.",
    icon: Settings,
    targetSelector: '[data-testid="nav-admin"]',
    targetArea: "sidebar",
    position: "right",
  },
  {
    id: "ai-queue",
    title: "AI Queue System",
    description: "The AI queue automatically ranks grinder bids based on scorecards, specialization, and reliability. View queue positions and understand how assignments are prioritized.",
    icon: Brain,
    targetSelector: '[data-testid="nav-ai-queue"]',
    targetArea: "sidebar",
    position: "right",
  },
  {
    id: "complete",
    title: "You're All Set!",
    description: "You now know the essentials. Check the Operations Guide in the sidebar for detailed workflows, or dive right in and start managing orders!",
    icon: Rocket,
    targetArea: "full",
    position: "center",
  },
];

function DemoAnimation({ action }: { action: string }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setFrame(f => f + 1);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const demoFrames: Record<string, { steps: { label: string; icon: any; color: string }[] }> = {
    watch_order_appear: {
      steps: [
        { label: "New order drops into queue", icon: Zap, color: "text-yellow-400" },
        { label: "Service: Ranked Boost — $85.00", icon: ListOrdered, color: "text-blue-400" },
        { label: "Platform: PlayStation — Due in 3 days", icon: Play, color: "text-cyan-400" },
        { label: "You place a bid for $35.00", icon: Gavel, color: "text-purple-400" },
      ],
    },
    watch_bid_placed: {
      steps: [
        { label: "You submit your bid amount", icon: Gavel, color: "text-purple-400" },
        { label: "AI Queue scores your bid...", icon: Brain, color: "text-cyan-400" },
        { label: "Your scorecard boosts priority", icon: ClipboardCheck, color: "text-green-400" },
        { label: "Bid accepted! Order assigned to you", icon: CheckCircle2, color: "text-emerald-400" },
      ],
    },
    watch_assignment_flow: {
      steps: [
        { label: "Order assigned — Accept the ticket", icon: FileCheck, color: "text-blue-400" },
        { label: "Log into the customer's account", icon: MousePointerClick, color: "text-yellow-400" },
        { label: "Start Order — begin the work", icon: Play, color: "text-cyan-400" },
        { label: "Mark Complete — submit proof video", icon: CheckCircle2, color: "text-emerald-400" },
      ],
    },
    watch_checkpoints: {
      steps: [
        { label: 'Click "Log In" — status updates live', icon: MousePointerClick, color: "text-yellow-400" },
        { label: 'Click "Start" — timer begins', icon: Play, color: "text-cyan-400" },
        { label: "Report issues instantly if needed", icon: Bell, color: "text-red-400" },
        { label: "Staff sees all updates in real-time", icon: Eye, color: "text-blue-400" },
      ],
    },
    watch_order_lifecycle: {
      steps: [
        { label: "Create order with service & price", icon: ListOrdered, color: "text-blue-400" },
        { label: "Open for bidding — grinders compete", icon: Gavel, color: "text-purple-400" },
        { label: "Accept best bid — auto-assigns", icon: CheckCircle2, color: "text-green-400" },
        { label: "Track progress through completion", icon: Eye, color: "text-cyan-400" },
      ],
    },
    watch_bid_review: {
      steps: [
        { label: "Bids come in from grinders", icon: Gavel, color: "text-purple-400" },
        { label: "AI ranks by scorecard & history", icon: Brain, color: "text-cyan-400" },
        { label: "Review top candidates", icon: Eye, color: "text-blue-400" },
        { label: "Accept bid — grinder gets notified", icon: CheckCircle2, color: "text-emerald-400" },
      ],
    },
  };

  const demo = demoFrames[action];
  if (!demo) return null;

  const currentFrame = frame % demo.steps.length;

  return (
    <div className="mt-3 space-y-1.5" aria-live="polite">
      {demo.steps.map((step, i) => {
        const isActive = i === currentFrame;
        const isPast = i < currentFrame;
        const Icon = step.icon;
        return (
          <div
            key={i}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-500 ${
              isActive
                ? "bg-white/10 border border-white/20 scale-[1.02]"
                : isPast
                ? "bg-white/[0.03] opacity-50"
                : "bg-white/[0.02] opacity-30"
            }`}
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 transition-all duration-500 ${
              isActive ? "bg-white/15 scale-110" : "bg-white/5"
            }`}>
              {isPast ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Icon className={`w-3.5 h-3.5 ${isActive ? step.color : "text-white/30"}`} />
              )}
            </div>
            <span className={`text-xs transition-all duration-500 ${
              isActive ? "text-white font-medium" : isPast ? "text-white/40 line-through" : "text-white/30"
            }`}>
              {step.label}
            </span>
            {isActive && (
              <div className="ml-auto flex gap-0.5" aria-hidden="true">
                <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-white/20 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SpotlightOverlay({ targetSelector, targetArea }: { targetSelector?: string; targetArea?: string }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (targetSelector) {
      const el = document.querySelector(targetSelector);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect(r);
        el.scrollIntoView({ behavior: "smooth", block: "nearest" });
      } else {
        setRect(null);
      }
    } else {
      setRect(null);
    }
  }, [targetSelector]);

  const resolvedArea = targetSelector && !rect ? "full" : targetArea;

  if (resolvedArea === "full" || (!targetSelector && !targetArea)) {
    return (
      <div className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm transition-all duration-500" aria-hidden="true" />
    );
  }

  if (!rect && resolvedArea === "sidebar") {
    return (
      <div className="fixed inset-0 z-[9998]" aria-hidden="true">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="absolute top-0 left-0 w-[var(--sidebar-width,18rem)] h-full" style={{ background: "transparent", boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)" }} />
      </div>
    );
  }

  if (!rect && resolvedArea === "header") {
    return (
      <div className="fixed inset-0 z-[9998]" aria-hidden="true">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
        <div className="absolute top-0 right-0 w-40 h-16" style={{ background: "transparent", boxShadow: "0 0 0 9999px rgba(0,0,0,0.7)" }} />
      </div>
    );
  }

  if (!rect && resolvedArea === "main") {
    return (
      <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px] transition-all duration-500" aria-hidden="true" />
    );
  }

  if (!rect) {
    return <div className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm" aria-hidden="true" />;
  }

  const padding = 8;
  return (
    <div className="fixed inset-0 z-[9998]" aria-hidden="true">
      <svg className="absolute inset-0 w-full h-full">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            <rect
              x={rect.x - padding}
              y={rect.y - padding}
              width={rect.width + padding * 2}
              height={rect.height + padding * 2}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          x="0" y="0" width="100%" height="100%"
          fill="rgba(0,0,0,0.75)"
          mask="url(#spotlight-mask)"
        />
        <rect
          x={rect.x - padding}
          y={rect.y - padding}
          width={rect.width + padding * 2}
          height={rect.height + padding * 2}
          rx="8"
          fill="none"
          stroke="hsl(262, 83%, 58%)"
          strokeWidth="2"
          className="animate-pulse"
        />
      </svg>
    </div>
  );
}

export function InteractiveTutorial() {
  const { user } = useAuth();
  const isStaff = user?.role === "staff" || user?.role === "owner";
  const steps = isStaff ? staffSteps : grinderSteps;
  const dialogRef = useRef<HTMLDivElement>(null);

  const storageKey = `grindops-tutorial-${isStaff ? "staff" : "grinder"}-completed`;
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true);

  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      setHasSeenTutorial(false);
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  useEffect(() => {
    if (isOpen && dialogRef.current) {
      const nextBtn = dialogRef.current.querySelector<HTMLElement>('[data-testid="button-tutorial-next"]');
      nextBtn?.focus();
    }
  }, [isOpen, currentStep]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setCurrentStep(0);
    localStorage.setItem(storageKey, "true");
    setHasSeenTutorial(true);
  }, [storageKey]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      handleClose();
    }
  }, [currentStep, steps.length, handleClose]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(s => s - 1);
    }
  }, [currentStep]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowRight" || e.key === "Enter") { e.preventDefault(); handleNext(); }
    if (e.key === "ArrowLeft") { e.preventDefault(); handlePrev(); }
    if (e.key === "Escape") { e.preventDefault(); handleClose(); }

    if (e.key === "Tab" && dialogRef.current) {
      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  }, [isOpen, handleNext, handlePrev, handleClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const step = steps[currentStep];
  const StepIcon = step?.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === steps.length - 1;
  const progress = ((currentStep + 1) / steps.length) * 100;

  if (!isOpen) {
    return (
      <button
        onClick={() => { setIsOpen(true); setCurrentStep(0); }}
        className="fixed bottom-20 right-4 z-[100] group"
        data-testid="button-start-tutorial"
        aria-label={hasSeenTutorial ? "Replay Tutorial" : "Start Tutorial"}
      >
        <div className={`w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/25 transition-all hover:scale-110 ${!hasSeenTutorial ? "animate-bounce" : ""}`}>
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="absolute right-14 top-1/2 -translate-y-1/2 bg-card border border-border px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-xl" aria-hidden="true">
          {hasSeenTutorial ? "Replay Tutorial" : "Start Tutorial"}
        </span>
      </button>
    );
  }

  const positionClass =
    step.position === "center" || step.targetArea === "full"
      ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
      : step.targetArea === "sidebar"
      ? "top-1/2 left-[calc(var(--sidebar-width,18rem)+1rem)] -translate-y-1/2"
      : step.targetArea === "header"
      ? "top-20 right-4"
      : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";

  return (
    <>
      <SpotlightOverlay targetSelector={step.targetSelector} targetArea={step.targetArea} />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-title"
        aria-describedby="tutorial-desc"
        className={`fixed z-[9999] ${positionClass}`}
      >
        <div className="w-[380px] max-w-[90vw] bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl shadow-black/50 overflow-hidden animate-in fade-in zoom-in-95 duration-300">
          <div className="h-1 bg-muted" aria-hidden="true">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center" aria-hidden="true">
                  <StepIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 id="tutorial-title" className="font-display font-bold text-base leading-tight">{step.title}</h3>
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 mt-0.5 border-primary/30 text-primary">
                    Step {currentStep + 1} of {steps.length}
                  </Badge>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                data-testid="button-close-tutorial"
                aria-label="Close tutorial"
                className="w-7 h-7"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p id="tutorial-desc" className="text-sm text-muted-foreground leading-relaxed mb-4">
              {step.description}
            </p>

            {step.demoAction && (
              <DemoAnimation action={step.demoAction} />
            )}

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
              <div className="flex gap-1" aria-label={`Step ${currentStep + 1} of ${steps.length}`} role="tablist">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={i === currentStep}
                    aria-label={`Go to step ${i + 1}`}
                    onClick={() => setCurrentStep(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === currentStep ? "bg-primary w-5" : i < currentStep ? "bg-primary/40 w-2" : "bg-white/10 w-2"
                    }`}
                    data-testid={`tutorial-dot-${i}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {!isFirst && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handlePrev}
                    data-testid="button-tutorial-prev"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Back
                  </Button>
                )}
                {isFirst && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClose}
                    data-testid="button-tutorial-skip"
                    className="text-muted-foreground"
                  >
                    Skip Tour
                  </Button>
                )}
                <Button
                  size="sm"
                  onClick={handleNext}
                  data-testid="button-tutorial-next"
                >
                  {isLast ? "Get Started" : "Next"}
                  {isLast ? <Rocket className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="px-5 pb-3" aria-hidden="true">
            <p className="text-[10px] text-muted-foreground/60 text-center">
              Use arrow keys to navigate · Press Esc to close
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
