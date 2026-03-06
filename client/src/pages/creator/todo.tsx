import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Circle,
  ClipboardList,
  Star,
  LayoutDashboard,
  Megaphone,
  ScrollText,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";

const ACCENT_TEXT = "text-emerald-400";

const CREATOR_TODO_ITEMS = [
  {
    id: "tutorial",
    title: "Complete the Tutorial",
    description: "Tour your dashboard and see how earnings work.",
    link: "/creator",
    linkLabel: "Go to Overview",
    icon: LayoutDashboard,
    gradient: "from-emerald-500/10 to-emerald-900/5",
    border: "border-emerald-500/15",
    hoverBorder: "hover:border-emerald-500/30",
    iconBg: "bg-emerald-500/15",
    iconColor: "text-emerald-400",
    hoverBg: "hover:bg-emerald-500/15",
  },
  {
    id: "link-social",
    title: "Link at least one social",
    description: "Add YouTube, Twitch, TikTok, or other links on the Promote page.",
    link: "/creator/promote",
    linkLabel: "Go to Promote",
    icon: Megaphone,
    gradient: "from-blue-500/10 to-blue-900/5",
    border: "border-blue-500/15",
    hoverBorder: "hover:border-blue-500/30",
    iconBg: "bg-blue-500/15",
    iconColor: "text-blue-400",
    hoverBg: "hover:bg-blue-500/15",
  },
  {
    id: "review-rules",
    title: "Review Rules & Policy",
    description: "Read program guidelines and referral terms.",
    link: "/creator/rules",
    linkLabel: "Go to Rules",
    icon: ScrollText,
    gradient: "from-amber-500/10 to-amber-900/5",
    border: "border-amber-500/15",
    hoverBorder: "hover:border-amber-500/30",
    iconBg: "bg-amber-500/15",
    iconColor: "text-yellow-400",
    hoverBg: "hover:bg-amber-500/15",
  },
];

const TUTORIAL_COMPLETED_KEY = "grindops-tutorial-creator-v2-completed";
const RULES_VISITED_KEY = "grindops-creator-rules-visited";

function ProgressRing({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? (completed / total) * 100 : 0;
  const size = 36;
  const stroke = 3;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (pct / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90 shrink-0">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-white/10"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-emerald-400 transition-all duration-700"
        />
      </svg>
      <span className="absolute text-xs font-bold text-white">{completed}</span>
    </div>
  );
}

export default function CreatorTodo() {
  const { toast } = useToast();
  const { data: creatorData } = useQuery<{ creator: { code: string; youtubeUrl?: string | null; twitchUrl?: string | null; tiktokUrl?: string | null; instagramUrl?: string | null; xUrl?: string | null } }>({ queryKey: ["/api/creator/me"] });
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    try {
      const s = localStorage.getItem("grindops-creator-todo");
      return s ? JSON.parse(s) : {};
    } catch { return {}; }
  });

  useEffect(() => {
    localStorage.setItem("grindops-creator-todo", JSON.stringify(completed));
  }, [completed]);

  const creator = creatorData?.creator;
  const hasLinkedSocial = creator && [creator.youtubeUrl, creator.twitchUrl, creator.tiktokUrl, creator.instagramUrl, creator.xUrl].some(Boolean);
  const tutorialCompletedFromStorage = typeof window !== "undefined" && localStorage.getItem(TUTORIAL_COMPLETED_KEY) === "true";
  const rulesVisitedFromStorage = typeof window !== "undefined" && localStorage.getItem(RULES_VISITED_KEY) === "true";
  const tutorialDone = (tutorialCompletedFromStorage || completed["tutorial"] === true) && completed["tutorial"] !== false;
  const linkSocialDone = (!!hasLinkedSocial || completed["link-social"] === true) && completed["link-social"] !== false;
  const rulesDone = (rulesVisitedFromStorage || completed["review-rules"] === true) && completed["review-rules"] !== false;

  const toggle = (id: string) => {
    setCompleted((prev) => ({ ...prev, [id]: !prev[id] }));
    toast({ title: completed[id] ? "Marked incomplete" : "Marked complete" });
  };

  const completedCount = [tutorialDone, linkSocialDone, rulesDone].filter(Boolean).length;
  const totalCount = CREATOR_TODO_ITEMS.length;
  const allDone = completedCount === totalCount;

  return (
    <AnimatedPage className="space-y-6">
      {/* Hero with progress */}
      <FadeInUp>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-green-950/30 p-4 sm:p-5">
          <div
            className="absolute top-0 right-0 w-64 h-64 -translate-y-12 translate-x-8 rounded-full overflow-hidden [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [mask-size:100%_100%] [mask-position:center]"
          >
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 flex items-center justify-center opacity-30">
              <ClipboardList className="w-32 h-32 text-emerald-400" />
            </div>
          </div>
          <div className="relative z-10 flex flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <ClipboardList className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
              </div>
              <div className="min-w-0">
                <h1 className="text-lg sm:text-xl lg:text-2xl font-bold font-display tracking-tight text-white">
                  To-Do List
                </h1>
                <p className="text-xs sm:text-sm text-white/80 mt-0.5">
                  {allDone ? "You’re all set to promote your code." : "Complete these steps to get the most out of the creator program."}
                </p>
                {!allDone && (
                  <Badge className="mt-1.5 bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                    {completedCount} of {totalCount} completed
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center shrink-0">
              <ProgressRing completed={completedCount} total={totalCount} />
              {allDone && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">All done</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </FadeInUp>

      {/* All done celebration */}
      {allDone && (
        <FadeInUp>
          <Card className="border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-emerald-900/5 to-transparent overflow-hidden">
            <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-lg font-semibold text-white">You’re ready to go</h2>
                <p className="text-sm text-white/70 mt-0.5">Share your code and start earning. Head to Promote to link your channels.</p>
              </div>
              <Link href="/creator/promote">
                <Button className="bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 shrink-0">
                  Promote
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      {/* Get Started - step cards */}
      <FadeInUp>
        <Card className="border-white/[0.06] bg-white/[0.02]">
          <CardHeader className="p-4 sm:p-6 pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="w-5 h-5 text-emerald-400" />
              Get started
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">Complete each step to unlock the full creator experience.</p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 space-y-2 sm:space-y-3">
            {CREATOR_TODO_ITEMS.map((item) => {
              const done = item.id === "tutorial" ? tutorialDone : item.id === "link-social" ? linkSocialDone : rulesDone;
              const Icon = item.icon;
              const canToggle = item.id !== "link-social" || hasLinkedSocial;
              return (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-gradient-to-br ${item.gradient} border ${item.border} ${item.hoverBorder} transition-all ${
                    done ? "opacity-80" : ""
                  }`}
                >
                  <button
                    type="button"
                    aria-label={done ? "Mark incomplete" : "Mark complete"}
                    onClick={() => canToggle && toggle(item.id)}
                    className={`shrink-0 rounded-full p-0.5 transition-colors ${canToggle ? "hover:bg-white/10" : "cursor-default"}`}
                  >
                    {done ? (
                      <CheckCircle2 className={`w-5 h-5 sm:w-6 sm:h-6 ${item.iconColor}`} />
                    ) : (
                      <Circle className="w-5 h-5 sm:w-6 sm:h-6 text-white/40" />
                    )}
                  </button>
                  <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${item.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${item.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                    <div className="flex flex-nowrap items-center justify-between gap-2">
                      <p className={`font-medium text-sm sm:text-base min-w-0 truncate ${done ? "text-white/60 line-through" : "text-white"}`}>
                        {item.title}
                      </p>
                      <Link href={item.link} className="shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-7 text-xs whitespace-nowrap ${item.iconColor} ${item.hoverBg} px-2 -mr-1`}
                        >
                          {item.linkLabel}
                          <ArrowRight className="w-3 h-3 ml-0.5" />
                        </Button>
                      </Link>
                    </div>
                    <p className="text-[11px] sm:text-xs text-white/50">{item.description}</p>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </FadeInUp>
    </AnimatedPage>
  );
}
