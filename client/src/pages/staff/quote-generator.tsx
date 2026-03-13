import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TIERS, ROUND_BY, CREATORS_DISCOUNTS } from "@shared/quote-generator-data";
import { calculateQuote, suggestRepTargetForBudget, type QuoteInputs, type QuoteResults } from "@shared/quote-generator-calc";
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Minus,
  Bot,
  DollarSign,
  Clock,
  Zap,
  Medal,
  Building2,
  User,
  Sparkles,
  Star,
  ChevronDown,
  BarChart2,
  GitCompare,
  AlertTriangle,
  Copy,
  Check,
  Save,
  Loader2,
  Search,
  Pencil,
  Trash2,
  BookOpen,
  Filter,
  Package,
  Flame,
} from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { cn, copyToClipboard } from "@/lib/utils";
import { buildQuoteDiscordMessage, formatQuoteRoute } from "@shared/quote-discord-message";
import { useToast } from "@/hooks/use-toast";
import { FaDiscord } from "react-icons/fa6";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ALL_BADGES, BADGE_CATEGORIES, BADGES_BY_CATEGORY, formatBadgeRouteForDiscord, formatBadgeRouteFromIds } from "@shared/badge-data";
import type { MyPlayerType } from "@shared/my-player-type-settings";
import { calculateBadgeQuote, type BadgeQuoteInputs, type BadgeQuoteResults } from "@shared/badge-quote-calc";
import { mergeHotZonesQuoteSettings, getHotZonePrice, getHotZonesDelivery } from "@shared/hot-zones-quote-settings";

const URGENCY_OPTIONS_EDIT = ["Slow", "Normal", "Rush"] as const;
type UrgencyEdit = (typeof URGENCY_OPTIONS_EDIT)[number];
const URGENCY_LABELS_EDIT: Record<UrgencyEdit, string> = { Slow: "No Rush", Normal: "Normal", Rush: "Rush" };

/** Hot zones for shot chart: 5 mid-range + 5 3PT. Paint zones are not selectable. */
export type HotZoneCategory = "midrange" | "3pt";
export interface HotZoneDef {
  id: string;
  label: string;
  category: HotZoneCategory;
  price: number;
  selectable: boolean;
}
export const HOT_ZONES: HotZoneDef[] = [
  { id: "midrange-left", label: "Mid-Range Left", category: "midrange", price: 25, selectable: true },
  { id: "midrange-left-center", label: "Mid-Range Left-Center", category: "midrange", price: 25, selectable: true },
  { id: "midrange-center", label: "Mid-Range Center", category: "midrange", price: 25, selectable: true },
  { id: "midrange-right-center", label: "Mid-Range Right-Center", category: "midrange", price: 25, selectable: true },
  { id: "midrange-right", label: "Mid-Range Right", category: "midrange", price: 25, selectable: true },
  { id: "3pt-left", label: "3PT Left", category: "3pt", price: 35, selectable: true },
  { id: "3pt-left-center", label: "3PT Left-Center", category: "3pt", price: 35, selectable: true },
  { id: "3pt-center", label: "3PT Center", category: "3pt", price: 35, selectable: true },
  { id: "3pt-right-center", label: "3PT Right-Center", category: "3pt", price: 35, selectable: true },
  { id: "3pt-right", label: "3PT Right", category: "3pt", price: 35, selectable: true },
];
const HOT_ZONES_SELECTABLE = HOT_ZONES.filter((z) => z.selectable);
const HOT_ZONE_IDS_3PT = HOT_ZONES_SELECTABLE.filter((z) => z.category === "3pt").map((z) => z.id);
const HOT_ZONE_IDS_MIDRANGE = HOT_ZONES_SELECTABLE.filter((z) => z.category === "midrange").map((z) => z.id);
const HOT_ZONE_IDS_ALL = HOT_ZONES_SELECTABLE.map((z) => z.id);

/** SVG half-court: cx,cy basket; radii in px; angles in degrees (180=left, 270=top, 0=right) */
const COURT_CX = 200;
const COURT_CY = 28;
const PAINT_R = 28;
const PAINT_H = 52;
const PAINT_W = 100;
const MID_R_INNER = 52;
const MID_R_OUTER = 112;
const THREE_R_INNER = 112;
const THREE_R_OUTER = 195;

const COURT_LEFT_X = 5;
const COURT_RIGHT_X = 395;

const CHART_COURT_FILL = "hsl(var(--background))";

function deg2rad(d: number) {
  return (d * Math.PI) / 180;
}
function sectorPath(cx: number, cy: number, r1: number, r2: number, startDeg: number, endDeg: number): string {
  const s = deg2rad(startDeg);
  const e = deg2rad(endDeg);
  // SVG y increases downward; math angles have 270° = bottom, so use -sin so bottom has larger y
  const x1 = cx + r1 * Math.cos(s);
  const y1 = cy - r1 * Math.sin(s);
  const x2 = cx + r2 * Math.cos(s);
  const y2 = cy - r2 * Math.sin(s);
  const x3 = cx + r2 * Math.cos(e);
  const y3 = cy - r2 * Math.sin(e);
  const x4 = cx + r1 * Math.cos(e);
  const y4 = cy - r1 * Math.sin(e);
  const large = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  return `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2} 0 ${large} 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1} 0 ${large} 0 ${x1} ${y1} Z`;
}

/** Zone order: mid-range left→right (180–360°), then 3PT left→right. Angles: left 180–216, left-center 216–252, center 252–288, right-center 288–324, right 324–360. */
const HOT_ZONE_ANGLES: [number, number][] = [[180, 216], [216, 252], [252, 288], [288, 324], [324, 360]];
const HOT_ZONE_SVG = HOT_ZONES_SELECTABLE.map((z, i) => {
  const is3pt = z.category === "3pt";
  const [start, end] = HOT_ZONE_ANGLES[i % 5];
  const r1 = is3pt ? THREE_R_INNER : MID_R_INNER;
  const r2 = is3pt ? THREE_R_OUTER : MID_R_OUTER;
  return { id: z.id, pathD: sectorPath(COURT_CX, COURT_CY, r1, r2, start, end) };
});

function HotZonePath({
  id,
  pathD,
  selected,
  onToggle,
}: {
  id: string;
  pathD: string;
  selected: boolean;
  onToggle: () => void;
}) {
  const fill = selected ? "hsl(var(--primary) / 0.5)" : "rgba(255,255,255,0.08)";
  const stroke = selected ? "hsl(var(--primary))" : "rgba(255,255,255,0.12)";
  return (
    <path
      d={pathD}
      fill={fill}
      stroke={stroke}
      strokeWidth="1.5"
      className="transition-colors"
      onClick={onToggle}
    />
  );
}

function HotZoneRow({
  zone,
  selected,
  onToggle,
}: {
  zone: HotZoneDef;
  selected: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 px-3 py-2.5",
        selected && "bg-white/[0.04]"
      )}
    >
      <span className="text-sm text-foreground">{zone.label}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">${zone.price}</span>
        <Switch checked={selected} onCheckedChange={onToggle} />
      </div>
    </div>
  );
}

function EditQuoteDialog({
  quoteId,
  onClose,
  onUpdate,
  isPending,
}: {
  quoteId: string | null;
  onClose: () => void;
  onUpdate: (data: Record<string, unknown>) => void;
  isPending: boolean;
}) {
  const { data: quote, isLoading } = useQuery<{
    id: string;
    customerIdentifier?: string | null;
    inputs?: Record<string, unknown>;
    results?: Record<string, unknown>;
    discordMessage?: string | null;
    createdByName?: string;
  }>({
    queryKey: ["/api/staff/quotes", quoteId],
    enabled: !!quoteId,
  });
  const { data: creatorsList = [] } = useQuery<{ id: string; code: string; quoteDiscountPercent?: string | number | null }[]>({
    queryKey: ["/api/staff/creators"],
    enabled: !!quoteId,
  });
  const { data: queueConfig } = useQuery<{ quoteGeneratorCompanyPct?: string | number; quoteGeneratorGrinderPct?: string | number; repQuoteSettings?: { roundBy?: number } }>({
    queryKey: ["/api/config"],
    enabled: !!quoteId,
  });

  const defaultCompanyPct = queueConfig?.quoteGeneratorCompanyPct != null
    ? Math.max(0, Math.min(1, Number(queueConfig.quoteGeneratorCompanyPct) / 100))
    : 0.70;
  const defaultGrinderPct = queueConfig?.quoteGeneratorGrinderPct != null
    ? Math.max(0, Math.min(1, Number(queueConfig.quoteGeneratorGrinderPct) / 100))
    : 0.30;

  const [customerIdentifier, setCustomerIdentifier] = useState("");
  const [discordMessage, setDiscordMessage] = useState("");
  const [startTier, setStartTier] = useState("Rookie");
  const [startLvl, setStartLvl] = useState(1);
  const [startPct, setStartPct] = useState(0);
  const [startPctInput, setStartPctInput] = useState("0");
  const [targetTier, setTargetTier] = useState("Legend");
  const [targetLvl, setTargetLvl] = useState(5);
  const [targetPct, setTargetPct] = useState(0);
  const [targetPctInput, setTargetPctInput] = useState("0");
  const [urgency, setUrgency] = useState<UrgencyEdit>("Normal");
  const [discountPct, setDiscountPct] = useState(0);
  const [creatorCode, setCreatorCode] = useState("");
  const [chosenFinalQuote, setChosenFinalQuote] = useState("");
  const [grinderBid, setGrinderBid] = useState("");
  const { toast } = useToast();

  const creatorDiscountPercentForCode = useMemo((): number | undefined => {
    if (!creatorCode) return undefined;
    const codeUpper = creatorCode.toUpperCase();
    const fromApi = creatorsList.find((c) => (c.code || "").toUpperCase() === codeUpper);
    if (fromApi?.quoteDiscountPercent != null) {
      const pct = Number(fromApi.quoteDiscountPercent);
      return Number.isNaN(pct) ? undefined : pct / 100;
    }
    const fromStatic = CREATORS_DISCOUNTS[codeUpper];
    return fromStatic;
  }, [creatorCode, creatorsList]);

  useEffect(() => {
    if (quote) {
      setCustomerIdentifier(quote.customerIdentifier || "");
      setDiscordMessage(quote.discordMessage || "");
      const inp = quote.inputs || {};
      setStartTier(String(inp.startTier ?? "Rookie"));
      setStartLvl(typeof inp.startLvl === "number" ? inp.startLvl : 1);
      const sp = typeof inp.startPct === "number" ? inp.startPct : 0;
      setStartPct(sp);
      setStartPctInput(String(sp));
      setTargetTier(String(inp.targetTier ?? "Legend"));
      setTargetLvl(typeof inp.targetLvl === "number" ? inp.targetLvl : 5);
      const tp = typeof inp.targetPct === "number" ? inp.targetPct : 0;
      setTargetPct(tp);
      setTargetPctInput(String(tp));
      setUrgency((inp.urgency === "Rush" || inp.urgency === "Slow" ? inp.urgency : "Normal") as UrgencyEdit);
      setDiscountPct(typeof inp.discountPct === "number" ? inp.discountPct : 0);
      setCreatorCode(String(inp.creatorCode ?? ""));
      const cfq = inp.chosenFinalQuote;
      setChosenFinalQuote(cfq != null && Number(cfq) > 0 ? String(Number(cfq)) : "");
      const gb = inp.grinderBid;
      setGrinderBid(gb != null && Number(gb) > 0 ? String(Number(gb)) : "");
    }
  }, [quote]);

  const inputsForCalc: QuoteInputs = {
    startTier,
    startLvl,
    startPct,
    targetTier,
    targetLvl,
    targetPct,
    urgency,
    discountPct,
    creatorCode,
    ...(creatorDiscountPercentForCode !== undefined && { creatorDiscountPercent: creatorDiscountPercentForCode }),
    defaultCompanyPct,
    defaultGrinderPct,
    roundedBy: queueConfig?.repQuoteSettings?.roundBy ?? ROUND_BY,
    chosenFinalQuote: Number(chosenFinalQuote) || 0,
    grinderBid: Number(grinderBid) || 0,
  };

  const recalcResults = useMemo((): QuoteResults | null => {
    if (!startTier || !targetTier) return null;
    try {
      return calculateQuote(inputsForCalc, queueConfig?.repQuoteSettings ?? undefined);
    } catch {
      return null;
    }
  }, [startTier, startLvl, startPct, targetTier, targetLvl, targetPct, urgency, discountPct, creatorCode, creatorDiscountPercentForCode, defaultCompanyPct, defaultGrinderPct, chosenFinalQuote, grinderBid, queueConfig?.repQuoteSettings]);

  useEffect(() => {
    if (!quote) return;
    const results = recalcResults;
    const customPrice = Number(chosenFinalQuote) || 0;
    const customerPrice = results
      ? (customPrice > 0 ? customPrice : results.recommendedQuote)
      : Number(quote.results?.recommendedQuote ?? quote.results?.aiSuggestedQuote ?? quote.results?.marketQuote ?? 0);
    const route = `${startTier} ${startLvl} → ${targetTier} ${targetLvl}`;
    const discountUsed = results?.discountUsed ?? (quote.results as { discountUsed?: number })?.discountUsed ?? 0;
    const msg = buildQuoteDiscordMessage({
      customerPrice,
      estimatedTimeframe: results ? results.estimatedTimeframe : String(quote.results?.estimatedTimeframe ?? ""),
      timeframeText: results?.timeframeText,
      customerIdentifier: customerIdentifier.trim() || undefined,
      route,
      urgency,
      creatorCode: creatorCode || undefined,
      startTier,
      startLvl,
      startPct,
      targetTier,
      targetLvl,
      targetPct,
      ...(discountUsed > 0 && { discountPercent: discountUsed * 100 }),
    });
    setDiscordMessage(msg);
  }, [
    quote,
    recalcResults,
    customerIdentifier,
    startTier,
    startLvl,
    startPct,
    targetTier,
    targetLvl,
    targetPct,
    urgency,
    discountPct,
    creatorCode,
    chosenFinalQuote,
    grinderBid,
  ]);

  const handleSave = () => {
    if (!quote) return;
    const results = recalcResults;
    const customPrice = Number(chosenFinalQuote) || 0;
    const customerPrice = results
      ? (customPrice > 0 ? customPrice : results.recommendedQuote)
      : Number(quote.results?.recommendedQuote ?? quote.results?.aiSuggestedQuote ?? quote.results?.marketQuote ?? 0);
    const route = `${startTier} ${startLvl} → ${targetTier} ${targetLvl}`;
    const discountUsed = results?.discountUsed ?? (quote.results as { discountUsed?: number })?.discountUsed ?? 0;
    const msg =
      discordMessage.trim() ||
      buildQuoteDiscordMessage({
        customerPrice,
        estimatedTimeframe: results ? results.estimatedTimeframe : String(quote.results?.estimatedTimeframe ?? ""),
        timeframeText: results?.timeframeText,
        customerIdentifier: customerIdentifier.trim() || undefined,
        route,
        urgency,
        creatorCode: creatorCode || undefined,
        startTier,
        startLvl,
        startPct,
        targetTier,
        targetLvl,
        targetPct,
        ...(discountUsed > 0 && { discountPercent: discountUsed * 100 }),
      });
    const inputsPayload = {
      ...quote.inputs,
      startTier,
      startLvl,
      startPct,
      targetTier,
      targetLvl,
      targetPct,
      urgency,
      discountPct,
      creatorCode: creatorCode || undefined,
      chosenFinalQuote: Number(chosenFinalQuote) || undefined,
      grinderBid: Number(grinderBid) || undefined,
    };
    const resultsPayload = results
      ? { ...quote.results, ...results, recommendedQuote: customerPrice }
      : quote.results;
    onUpdate({
      customerIdentifier: customerIdentifier.trim() || null,
      discordMessage: msg,
      inputs: inputsPayload,
      results: resultsPayload,
    });
  };

  return (
    <Dialog open={!!quoteId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Quote</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : quote ? (
          <div className="space-y-4 overflow-y-auto pr-1 -mr-1">
            <div>
              <Label className="text-xs">Discord Username, Gamertag, or Name</Label>
              <Input
                value={customerIdentifier}
                onChange={(e) => setCustomerIdentifier(e.target.value)}
                placeholder="Discord Username, Gamertag, or Name"
                className="mt-1 bg-white/[0.04]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Start Tier</Label>
                <Select value={startTier} onValueChange={setStartTier}>
                  <SelectTrigger className="bg-white/[0.04] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIERS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Start Level · {startLvl}</Label>
                <Slider
                  value={[startLvl]}
                  onValueChange={([v]) => setStartLvl(v)}
                  min={1}
                  max={5}
                  step={1}
                  className="py-2"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Start %</Label>
              <div className="flex gap-2 items-center">
                <Slider
                  value={[Math.round(startPct)]}
                  onValueChange={([v]) => { setStartPct(v); setStartPctInput(String(v)); }}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1 py-2"
                />
                <Input
                  type="text"
                  value={startPctInput}
                  onChange={(e) => setStartPctInput(e.target.value)}
                  onBlur={() => {
                    const v = parsePct(startPctInput);
                    setStartPct(v);
                    setStartPctInput(String(v));
                  }}
                  className="w-16 h-9 text-right text-sm bg-white/[0.04]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Target Tier</Label>
                <Select value={targetTier} onValueChange={setTargetTier}>
                  <SelectTrigger className="bg-white/[0.04] h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIERS.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Target Level · {targetLvl}</Label>
                <Slider
                  value={[targetLvl]}
                  onValueChange={([v]) => setTargetLvl(v)}
                  min={1}
                  max={5}
                  step={1}
                  className="py-2"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Target %</Label>
              <div className="flex gap-2 items-center">
                <Slider
                  value={[Math.round(targetPct)]}
                  onValueChange={([v]) => { setTargetPct(v); setTargetPctInput(String(v)); }}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1 py-2"
                />
                <Input
                  type="text"
                  value={targetPctInput}
                  onChange={(e) => setTargetPctInput(e.target.value)}
                  onBlur={() => {
                    const v = parsePct(targetPctInput);
                    setTargetPct(v);
                    setTargetPctInput(String(v));
                  }}
                  className="w-16 h-9 text-right text-sm bg-white/[0.04]"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Urgency</Label>
              <div className="flex gap-2 flex-wrap">
                {URGENCY_OPTIONS_EDIT.map((u) => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUrgency(u)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors",
                      urgency === u && u === "Slow" && "bg-amber-500/20 text-amber-400 border-amber-500/40",
                      urgency === u && u === "Normal" && "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
                      urgency === u && u === "Rush" && "bg-red-500/20 text-red-400 border-red-500/40",
                      urgency !== u && "bg-white/[0.04] border-white/10 text-muted-foreground hover:border-white/20"
                    )}
                  >
                    {URGENCY_LABELS_EDIT[u]}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Discount % · {discountPct}</Label>
              <Slider
                value={[discountPct]}
                onValueChange={([v]) => setDiscountPct(v)}
                min={0}
                max={100}
                step={1}
                className="py-2"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Creator Code</Label>
              <Select value={creatorCode || "_none"} onValueChange={(v) => setCreatorCode(v === "_none" ? "" : v)}>
                <SelectTrigger className="bg-white/[0.04] h-9">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {[...creatorsList]
                    .sort((a, b) => (a.code || "").localeCompare(b.code || ""))
                    .map((c) => {
                      const code = (c.code || "").toUpperCase();
                      const pct = c.quoteDiscountPercent != null ? Number(c.quoteDiscountPercent) : (CREATORS_DISCOUNTS[code] ?? 0) * 100;
                      return (
                        <SelectItem key={c.id} value={code}>
                          {code} ({Number.isNaN(pct) ? "—" : pct}%)
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Custom Quote ($)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Optional"
                  value={chosenFinalQuote}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\s/g, "");
                    if (v === "" || /^\d*\.?\d*$/.test(v)) setChosenFinalQuote(v);
                  }}
                  className="h-9 bg-white/[0.04]"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Grinder Payout ($)</Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Optional"
                  value={grinderBid}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\s/g, "");
                    if (v === "" || /^\d*\.?\d*$/.test(v)) {
                      const num = parseFloat(v);
                      const effectiveQuote = (Number(chosenFinalQuote) || 0) > 0 ? Number(chosenFinalQuote) : (results?.recommendedQuote ?? 0);
                      if (v !== "" && !Number.isNaN(num) && effectiveQuote > 0 && num > effectiveQuote) {
                        setGrinderBid(String(effectiveQuote));
                        return;
                      }
                      setGrinderBid(v);
                    }
                  }}
                  className="h-9 bg-white/[0.04]"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2">
                <div>
                  <Label className="text-xs">Discord Message</Label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Automatically updated when edits are made above</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs gap-1.5 shrink-0 self-start"
                  onClick={() => {
                    copyToClipboard(discordMessage).then((ok) => {
                      if (ok) toast({ title: "Copied to clipboard" });
                      else toast({ title: "Could not copy", variant: "destructive" });
                    });
                  }}
                >
                  <Copy className="w-3 h-3" />
                  Copy
                </Button>
              </div>
              <textarea
                value={discordMessage}
                readOnly
                rows={3}
                className="mt-1 w-full rounded-md border border-input bg-white/[0.04] px-3 py-2 text-sm cursor-default"
              />
            </div>
            <p className="text-xs text-muted-foreground">Created by: {quote.createdByName}</p>
          </div>
        ) : null}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isPending || !quote}>
            {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PricingPlaybookDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-primary/20 bg-card">
        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/[0.08] via-background to-primary/5 overflow-hidden">
          <div className="bg-primary/20 border-b border-primary/20 px-6 py-4">
            <DialogTitle className="text-lg font-bold flex items-center gap-2 text-primary">
              <BookOpen className="w-5 h-5" />
              Pricing Playbook (AI vs Market)
            </DialogTitle>
          </div>
          <div className="p-6 space-y-6 text-sm">
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary/90 mb-2">How to read AI vs Market</h3>
              <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                <li>Market Quote = &quot;street price&quot; (no efficiency/volume/AI bands).</li>
                <li>AI Suggested Offer = your internal valuation (difficulty, efficiency, volume, urgency).</li>
                <li>Use Market to anchor customer expectations; use AI to protect margins.</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary/90 mb-2">What it means</h3>
              <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                <li>AI &gt; Market: order is riskier/harder for you than market assumes (cap with Market).</li>
                <li>AI &lt; Market: you can execute efficiently (price at Market and keep upside).</li>
                <li>AI ≈ Market: both agree (use AI Mid / Market interchangeably).</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary/90 mb-2">Which price to lean toward (rules)</h3>
              <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                <li>If |AI − Market| ≤ 10% → Lean AI (Suggested Offer).</li>
                <li>If AI &gt; Market by &gt;10% → Lean Market (cap).</li>
                <li>If AI &lt; Market by &gt;10% → Lean Market (capture upside).</li>
                <li>Confidence: Green ≤5%, Yellow 5–15%, Red &gt;15%.</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary/90 mb-2">Examples</h3>
              <ul className="space-y-1.5 text-muted-foreground list-disc list-inside">
                <li>Final Quote $550, Grinder agrees $350 → Grinder gets $350; Company gets $200 (30% base + extra).</li>
                <li>If Market is $500 and AI Suggested is $600 → quote near $500 (or small premium) unless Rush/VIP.</li>
                <li>If Market is $500 and AI Suggested is $420 → quote near $500; negotiate down only if needed.</li>
              </ul>
            </section>
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-primary/90 mb-3">Decision Table</h3>
              <div className="overflow-x-auto rounded-lg border border-white/[0.06]">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-primary/15 text-primary border-b border-primary/20">
                      <th className="px-4 py-2.5 font-semibold">Condition</th>
                      <th className="px-4 py-2.5 font-semibold">Meaning</th>
                      <th className="px-4 py-2.5 font-semibold">Lean Toward</th>
                      <th className="px-4 py-2.5 font-semibold">Customer-Facing</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5">AI &gt; Market by &gt;10%</td>
                      <td className="px-4 py-2.5">Harder/riskier than market assumes</td>
                      <td className="px-4 py-2.5">Market (cap)</td>
                      <td className="px-4 py-2.5">Market or Market + small</td>
                    </tr>
                    <tr className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5">AI &lt; Market by &gt;10%</td>
                      <td className="px-4 py-2.5">You&apos;re more efficient than market</td>
                      <td className="px-4 py-2.5">Market (capture)</td>
                      <td className="px-4 py-2.5">Market</td>
                    </tr>
                    <tr className="hover:bg-white/[0.02]">
                      <td className="px-4 py-2.5">|AI − Market| ≤ 10%</td>
                      <td className="px-4 py-2.5">Market and AI agree</td>
                      <td className="px-4 py-2.5">AI Suggested</td>
                      <td className="px-4 py-2.5">AI Suggested</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const URGENCY_OPTIONS = ["Slow", "Normal", "Rush"] as const;
type Urgency = (typeof URGENCY_OPTIONS)[number];
const URGENCY_LABELS: Record<Urgency, string> = { Slow: "No Rush", Normal: "Normal", Rush: "Rush" };

function parsePct(s: string): number {
  const v = parseFloat(s);
  return Number.isNaN(v) ? 0 : Math.min(100, Math.max(0, v));
}

function formatUSD(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function QuoteKpiCard({
  label,
  value,
  subtitle,
  indicator,
  icon: Icon,
  gradient,
  iconBg,
  textColor,
  borderFlash,
  borderFlashWhite,
}: {
  label: string;
  value: string;
  subtitle?: string;
  indicator?: React.ReactNode;
  icon: React.ElementType;
  gradient: string;
  iconBg: string;
  textColor: string;
  borderFlash?: boolean;
  borderFlashWhite?: boolean;
}) {
  return (
    <Card
      className={cn(
        "border-0 overflow-hidden relative group sm:hover:scale-[1.02] transition-transform duration-300 shrink-0",
        gradient,
        borderFlash && !borderFlashWhite && "animate-border-flash",
        borderFlash && borderFlashWhite && "animate-border-flash-white"
      )}
    >
      <div className="absolute top-0 right-0 w-20 h-20 sm:w-28 sm:h-28 -translate-y-1 sm:-translate-y-2 translate-x-1 sm:translate-x-2 rounded-full overflow-hidden [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)]">
        <div className={cn("absolute inset-0 rounded-full flex items-center justify-center opacity-25", iconBg)}>
          <Icon className={cn("w-10 h-10 sm:w-14 sm:h-14", textColor)} />
        </div>
      </div>
      <CardContent className="p-3 sm:p-4 relative z-10 min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider text-white/70 truncate">{label}</p>
        <p className={cn("text-base sm:text-2xl font-bold tracking-tight truncate mt-0.5", textColor)}>{value}</p>
        {subtitle && <p className="text-[10px] text-muted-foreground mt-0.5 sm:mt-1">{subtitle}</p>}
        {indicator && <p className="text-[10px] text-white italic mt-0.5 sm:mt-1">{indicator}</p>}
      </CardContent>
    </Card>
  );
}

export default function QuoteGeneratorPage() {
  const [startTier, setStartTier] = useState("Rookie");
  const [startLvl, setStartLvl] = useState(1);
  const [startPct, setStartPct] = useState(0);
  const [startPctInput, setStartPctInput] = useState("0");
  const [targetTier, setTargetTier] = useState("Legend");
  const [targetLvl, setTargetLvl] = useState(5);
  const [targetPct, setTargetPct] = useState(0);
  const [targetPctInput, setTargetPctInput] = useState("0");
  const [urgency, setUrgency] = useState<Urgency>("Normal");
  const [discountPct, setDiscountPct] = useState(0);
  const [creatorCode, setCreatorCode] = useState("");
  const [chosenFinalQuote, setChosenFinalQuote] = useState("");
  const [grinderBid, setGrinderBid] = useState("");
  const [repBudgetAmount, setRepBudgetAmount] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [customerIdentifier, setCustomerIdentifier] = useState("");
  const [quoteSource, setQuoteSource] = useState<"recommended" | "market" | "ai" | "budget" | "custom">("recommended");
  const [quoteFilter, setQuoteFilter] = useState("");
  const [filterDateRange, setFilterDateRange] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [filterStartTier, setFilterStartTier] = useState("");
  const [filterTargetTier, setFilterTargetTier] = useState("");
  const [filterUrgency, setFilterUrgency] = useState("");
  const [filterAmountMin, setFilterAmountMin] = useState("");
  const [filterAmountMax, setFilterAmountMax] = useState("");
  const [filterTimeframe, setFilterTimeframe] = useState("");
  const [filterStartPctMin, setFilterStartPctMin] = useState("");
  const [filterTargetPctMin, setFilterTargetPctMin] = useState("");
  const [filterDiscountPctMin, setFilterDiscountPctMin] = useState("");
  const [filterBadgeCountMin, setFilterBadgeCountMin] = useState("");
  const [filterBadgeCountMax, setFilterBadgeCountMax] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [editQuoteId, setEditQuoteId] = useState<string | null>(null);
  const [copiedQuoteId, setCopiedQuoteId] = useState<string | null>(null);
  const [playbookOpen, setPlaybookOpen] = useState(false);
  const [quoteGeneratorTab, setQuoteGeneratorTab] = useState<"rep" | "badge" | "bundle" | "hotzones">("rep");
  const [hotZoneIds, setHotZoneIds] = useState<string[]>([]);
  const [badgeIds, setBadgeIds] = useState<string[]>([]);
  const [myPlayerType, setMyPlayerType] = useState<MyPlayerType>("Non-Rebirth");
  const [bundleCustomRepQuote, setBundleCustomRepQuote] = useState("");
  const [bundleCustomBadgeQuote, setBundleCustomBadgeQuote] = useState("");
  const [bundleCustomRepGrinder, setBundleCustomRepGrinder] = useState("");
  const [bundleCustomBadgeGrinder, setBundleCustomBadgeGrinder] = useState("");
  const [bundleCustomTotalGrinder, setBundleCustomTotalGrinder] = useState("");
  const [bundleSelectedServices, setBundleSelectedServices] = useState<("rep" | "badge" | "hotzones")[]>(["rep", "badge"]);
  const [bundleCustomHotZonesQuote, setBundleCustomHotZonesQuote] = useState("");
  const [bundleCustomHotZonesGrinder, setBundleCustomHotZonesGrinder] = useState("");
  const [discordCopied, setDiscordCopied] = useState(false);
  const [saveDisabledTooltipOpen, setSaveDisabledTooltipOpen] = useState(false);
  const badgeScrollRef = useRef<HTMLDivElement>(null);
  const [badgeListShowScrollHint, setBadgeListShowScrollHint] = useState(false);
  const { toast } = useToast();

  const resetRepTab = useCallback(() => {
    setStartTier("Rookie");
    setStartLvl(1);
    setStartPct(0);
    setStartPctInput("0");
    setTargetTier("Legend");
    setTargetLvl(5);
    setTargetPct(0);
    setTargetPctInput("0");
    setUrgency("Normal");
    setDiscountPct(0);
    setCreatorCode("");
    setChosenFinalQuote("");
    setGrinderBid("");
    setRepBudgetAmount("");
    setCustomerIdentifier("");
    setQuoteSource("recommended");
    setShowDetails(false);
    toast({ title: "Rep tab reset" });
  }, [toast]);

  const repTabIsDirty = useMemo(() => {
    return (
      startTier !== "Rookie" ||
      startLvl !== 1 ||
      startPct !== 0 ||
      targetTier !== "Legend" ||
      targetLvl !== 5 ||
      targetPct !== 0 ||
      urgency !== "Normal" ||
      discountPct !== 0 ||
      creatorCode !== "" ||
      chosenFinalQuote !== "" ||
      grinderBid !== "" ||
      repBudgetAmount !== "" ||
      customerIdentifier !== "" ||
      quoteSource !== "recommended" ||
      showDetails
    );
  }, [
    startTier,
    startLvl,
    startPct,
    targetTier,
    targetLvl,
    targetPct,
    urgency,
    discountPct,
    creatorCode,
    chosenFinalQuote,
    grinderBid,
    repBudgetAmount,
    customerIdentifier,
    quoteSource,
    showDetails,
  ]);

  const checkBadgeScrollHint = useCallback(() => {
    const el = badgeScrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const hasMoreToScroll = scrollHeight > clientHeight;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 8;
    setBadgeListShowScrollHint(hasMoreToScroll && !isAtBottom);
  }, []);

  useEffect(() => {
    if (quoteGeneratorTab !== "bundle") return;
    const el = badgeScrollRef.current;
    if (!el) return;
    const run = () => {
      checkBadgeScrollHint();
    };
    run();
    requestAnimationFrame(run);
    el.addEventListener("scroll", checkBadgeScrollHint);
    const ro = new ResizeObserver(checkBadgeScrollHint);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", checkBadgeScrollHint);
      ro.disconnect();
    };
  }, [quoteGeneratorTab, checkBadgeScrollHint]);

  const { data: creatorsList = [] } = useQuery<{ id: string; code: string; quoteDiscountPercent?: string | number | null }[]>({
    queryKey: ["/api/staff/creators"],
  });

  const { data: queueConfig } = useQuery<{ quoteGeneratorCompanyPct?: string | number; quoteGeneratorGrinderPct?: string | number; repQuoteSettings?: { roundBy?: number }; badgeQuoteSettings?: { roundBy?: number; companyPct?: number | null; grinderPct?: number | null }; bundleQuoteSettings?: { roundBy?: number; companyPct?: number | null; grinderPct?: number | null }; myPlayerTypeSettings?: { nonRebirthAdd?: number; rebirthAdd?: number }; hotZonesQuoteSettings?: Record<string, unknown> }>({
    queryKey: ["/api/config"],
  });
  const { data: savedQuotesList = [] } = useQuery<Array<{ id: string; serviceType?: string; customerIdentifier?: string | null; createdByName: string; createdAt: string; inputs?: Record<string, unknown>; results?: { recommendedQuote?: number; estimatedTimeframe?: string } }>>({
    queryKey: ["/api/staff/quotes"],
  });

  const globalCompanyPct = queueConfig?.quoteGeneratorCompanyPct != null
    ? Math.max(0, Math.min(1, Number(queueConfig.quoteGeneratorCompanyPct) / 100))
    : 0.70;
  const globalGrinderPct = queueConfig?.quoteGeneratorGrinderPct != null
    ? Math.max(0, Math.min(1, Number(queueConfig.quoteGeneratorGrinderPct) / 100))
    : 0.30;

  const { defaultCompanyPct, defaultGrinderPct } = useMemo(() => {
    const badge = queueConfig?.badgeQuoteSettings;
    const bundle = queueConfig?.bundleQuoteSettings;
    const hotZones = queueConfig?.hotZonesQuoteSettings as { companyPct?: number | null; grinderPct?: number | null } | undefined;
    if (quoteGeneratorTab === "badge" && badge?.companyPct != null && badge?.grinderPct != null) {
      const c = Math.max(0, Math.min(1, Number(badge.companyPct) / 100));
      const g = Math.max(0, Math.min(1, Number(badge.grinderPct) / 100));
      return { defaultCompanyPct: c, defaultGrinderPct: g };
    }
    if (quoteGeneratorTab === "bundle" && bundle?.companyPct != null && bundle?.grinderPct != null) {
      const c = Math.max(0, Math.min(1, Number(bundle.companyPct) / 100));
      const g = Math.max(0, Math.min(1, Number(bundle.grinderPct) / 100));
      return { defaultCompanyPct: c, defaultGrinderPct: g };
    }
    if (quoteGeneratorTab === "hotzones" && hotZones?.companyPct != null && hotZones?.grinderPct != null) {
      const c = Math.max(0, Math.min(1, Number(hotZones.companyPct) / 100));
      const g = Math.max(0, Math.min(1, Number(hotZones.grinderPct) / 100));
      return { defaultCompanyPct: c, defaultGrinderPct: g };
    }
    return { defaultCompanyPct: globalCompanyPct, defaultGrinderPct: globalGrinderPct };
  }, [quoteGeneratorTab, queueConfig?.badgeQuoteSettings?.companyPct, queueConfig?.badgeQuoteSettings?.grinderPct, queueConfig?.bundleQuoteSettings?.companyPct, queueConfig?.bundleQuoteSettings?.grinderPct, queueConfig?.hotZonesQuoteSettings, globalCompanyPct, globalGrinderPct]);

  const creatorDiscountPercentForCode = useMemo((): number | undefined => {
    if (!creatorCode) return undefined;
    const codeUpper = creatorCode.toUpperCase();
    const fromApi = creatorsList.find((c) => (c.code || "").toUpperCase() === codeUpper);
    if (fromApi?.quoteDiscountPercent != null) {
      const pct = Number(fromApi.quoteDiscountPercent);
      return Number.isNaN(pct) ? undefined : pct / 100;
    }
    const fromStatic = CREATORS_DISCOUNTS[codeUpper];
    return fromStatic;
  }, [creatorCode, creatorsList]);

  const inputs: QuoteInputs = {
    startTier,
    startLvl,
    startPct,
    targetTier,
    targetLvl,
    targetPct,
    urgency,
    discountPct,
    creatorCode,
    ...(creatorDiscountPercentForCode !== undefined && { creatorDiscountPercent: creatorDiscountPercentForCode }),
    defaultCompanyPct,
    defaultGrinderPct,
    roundedBy: queueConfig?.repQuoteSettings?.roundBy ?? ROUND_BY,
    chosenFinalQuote: quoteGeneratorTab === "bundle" ? ((Number(bundleCustomRepQuote) || 0) > 0 ? Number(bundleCustomRepQuote) : 0) : (Number(chosenFinalQuote) || 0),
    grinderBid: quoteGeneratorTab === "bundle" ? ((Number(bundleCustomRepGrinder) || 0) > 0 ? Number(bundleCustomRepGrinder) : 0) : (Number(grinderBid) || 0),
  };

  const saveQuoteMutation = useMutation({
    mutationFn: async () => {
      const price = customerPrice;
      if (quoteGeneratorTab === "bundle") {
        if (bundleSelectedServices.length === 0) throw new Error("Add at least one service to the bundle");
        if (bundleSelectedServices.includes("rep") && !results) throw new Error("Complete rep section or remove Rep from bundle");
        if (bundleSelectedServices.includes("badge") && !badgeResults) throw new Error("Complete badge section or remove Badges from bundle");
        const repPriceUsed = bundleSelectedServices.includes("rep") ? ((Number(bundleCustomRepQuote) || 0) > 0 ? Number(bundleCustomRepQuote) : (results?.recommendedQuote ?? 0)) : 0;
        const badgePriceUsed = bundleSelectedServices.includes("badge") ? ((Number(bundleCustomBadgeQuote) || 0) > 0 ? Number(bundleCustomBadgeQuote) : (badgeResults?.recommendedQuote ?? 0)) : 0;
        const hotZonesPriceUsed = bundleSelectedServices.includes("hotzones") ? ((Number(bundleCustomHotZonesQuote) || 0) > 0 ? Number(bundleCustomHotZonesQuote) : bundleHotZonesPrice) : 0;
        const totalQuote = repPriceUsed + badgePriceUsed + hotZonesPriceUsed;
        const timeframeParts: string[] = [];
        if (bundleSelectedServices.includes("rep") && results) timeframeParts.push("Rep: " + results.timeframeText);
        if (bundleSelectedServices.includes("badge") && badgeResults) timeframeParts.push("Badges: " + badgeResults.timeframeText);
        if (bundleSelectedServices.includes("hotzones")) timeframeParts.push("Hot Zones: " + hotZonesTimeframeText);
        const bundleTimeframe = timeframeParts.join(" · ");
        const routeParts: string[] = [];
        if (bundleSelectedServices.includes("rep") && results) routeParts.push("**Rep:** " + startTier + " " + startLvl + " → " + targetTier + " " + targetLvl);
        if (bundleSelectedServices.includes("badge") && badgeResults) routeParts.push("**Badges:** " + formatBadgeRouteForDiscord(badgeResults.badgeBreakdown).replace(/\*\*/g, ""));
        if (bundleSelectedServices.includes("hotzones")) routeParts.push("**Hot Zones:** " + hotZoneIds.length + " zone" + (hotZoneIds.length !== 1 ? "s" : ""));
        const discordMsg = "**📋 Bundle Quote**\n*Customer:* " + (customerIdentifier.trim() || "—") + "\n\n" + routeParts.join("\n") + "\n" + (bundleSelectedServices.some((s) => s === "rep" || s === "badge") ? "**MyPlayer Type:** " + myPlayerType + "\n" : "") + "**Urgency:** " + (URGENCY_LABELS[urgency] ?? urgency) + (creatorCode ? " | **Creator:** " + creatorCode : "") + "\n\n```\nYour quote:  $" + price.toLocaleString() + "\nEstimated timeframe: " + bundleTimeframe + "\n```";
        const payload = {
          serviceType: "bundle",
          customerIdentifier: customerIdentifier.trim() || null,
          customerPrice: price,
          inputs: {
            ...inputs,
            bundleSelectedServices,
            ...(bundleSelectedServices.includes("badge") && { badgeIds, myPlayerType }),
            bundleCustomRepQuote: bundleCustomRepQuote || undefined,
            bundleCustomBadgeQuote: bundleCustomBadgeQuote || undefined,
            bundleCustomHotZonesQuote: bundleCustomHotZonesQuote || undefined,
            bundleCustomRepGrinder: bundleCustomRepGrinder || undefined,
            bundleCustomBadgeGrinder: bundleCustomBadgeGrinder || undefined,
            bundleCustomHotZonesGrinder: bundleCustomHotZonesGrinder || undefined,
            bundleCustomTotalGrinder: bundleCustomTotalGrinder || undefined,
            ...(bundleSelectedServices.includes("hotzones") && { hotZoneIds }),
          },
          results: {
            ...(bundleSelectedServices.includes("rep") && results && { repResults: results }),
            ...(bundleSelectedServices.includes("badge") && badgeResults && { badgeResults }),
            ...(bundleSelectedServices.includes("hotzones") && {
              hotZonesResults: {
                recommendedQuote: hotZonesPriceUsed,
                timeframeText: hotZonesTimeframeText,
                minDays: hotZonesMinDays,
                maxDays: hotZonesMaxDays,
              },
            }),
            recommendedQuote: price,
            totalQuote,
            estimatedTimeframe: bundleTimeframe,
            timeframeText: bundleTimeframe,
          },
          discordMessage: discordMsg,
          aiSuggestion: null,
        };
        const res = await apiRequest("POST", "/api/staff/quotes", payload);
        const text = await res.text();
        if (text.startsWith("<") || !text.trim()) throw new Error("Server returned HTML instead of JSON. You may need to log in.");
        return JSON.parse(text);
      }
      if (quoteGeneratorTab === "badge") {
        if (!badgeResults) throw new Error("No results");
        const discordMsg = buildQuoteDiscordMessage({
          customerPrice: price,
          estimatedTimeframe: `${badgeResults.minDays}–${badgeResults.maxDays} days`,
          timeframeText: badgeResults.timeframeText,
          customerIdentifier: customerIdentifier.trim() || undefined,
          route: `${badgeResults.badgeBreakdown.length === 1 ? "**Badge** — " : "**Badges** — "}${formatBadgeRouteForDiscord(badgeResults.badgeBreakdown)}`,
          serviceLabel: "Badge Grinding Quote",
          urgency,
          creatorCode: creatorCode || undefined,
          myPlayerType,
          ...((badgeResults.discountUsed ?? 0) > 0 && { discountPercent: (badgeResults.discountUsed ?? 0) * 100 }),
        });
        const badgeInputs: BadgeQuoteInputs = {
          badgeIds,
          urgency,
          discountPct,
          creatorCode,
          ...(creatorDiscountPercentForCode !== undefined && { creatorDiscountPercent: creatorDiscountPercentForCode }),
          defaultCompanyPct,
          defaultGrinderPct,
          roundedBy: queueConfig?.badgeQuoteSettings?.roundBy ?? 5,
          chosenFinalQuote: Number(chosenFinalQuote) || 0,
          grinderBid: Number(grinderBid) || 0,
          myPlayerType,
        };
        const payload = {
          serviceType: "badge_grinding",
          customerIdentifier: customerIdentifier.trim() || null,
          customerPrice: price,
          inputs: badgeInputs,
          results: { ...badgeResults, recommendedQuote: price },
          discordMessage: discordMsg,
          aiSuggestion: null,
        };
        const res = await apiRequest("POST", "/api/staff/quotes", payload);
        const text = await res.text();
        if (text.startsWith("<") || !text.trim()) {
          throw new Error("Server returned HTML instead of JSON. You may need to log in.");
        }
        try {
          return JSON.parse(text);
        } catch {
          throw new Error("Server returned invalid JSON. You may need to log in.");
        }
      }
      if (!results) throw new Error("No results");
      const repDiscordForSave = quoteSource === "budget" && repDiscordContext
        ? buildQuoteDiscordMessage({
            customerPrice: repDiscordContext.customerPrice,
            estimatedTimeframe: repDiscordContext.estimatedTimeframe,
            timeframeText: repDiscordContext.timeframeText,
            customerIdentifier: customerIdentifier.trim() || undefined,
            route: `${repDiscordContext.startTier} ${repDiscordContext.startLvl} → ${repDiscordContext.targetTier} ${repDiscordContext.targetLvl}`,
            urgency: inputs.urgency,
            creatorCode: inputs.creatorCode || undefined,
            startTier: repDiscordContext.startTier,
            startLvl: repDiscordContext.startLvl,
            startPct: repDiscordContext.startPct ?? 0,
            targetTier: repDiscordContext.targetTier,
            targetLvl: repDiscordContext.targetLvl,
            targetPct: repDiscordContext.targetPct ?? 0,
            ...((results.discountUsed ?? 0) > 0 && { discountPercent: (results.discountUsed ?? 0) * 100 }),
          })
        : buildQuoteDiscordMessage({
            customerPrice: price,
            estimatedTimeframe: results.estimatedTimeframe,
            timeframeText: results.timeframeText,
            customerIdentifier: customerIdentifier.trim() || undefined,
            route: `${inputs.startTier} ${inputs.startLvl} → ${inputs.targetTier} ${inputs.targetLvl}`,
            urgency: inputs.urgency,
            creatorCode: inputs.creatorCode || undefined,
            startTier: inputs.startTier,
            startLvl: inputs.startLvl,
            startPct: inputs.startPct ?? 0,
            targetTier: inputs.targetTier,
            targetLvl: inputs.targetLvl,
            targetPct: inputs.targetPct ?? 0,
            ...((results.discountUsed ?? 0) > 0 && { discountPercent: (results.discountUsed ?? 0) * 100 }),
          });
      const payload = {
        serviceType: "rep_grinding",
        customerIdentifier: customerIdentifier.trim() || null,
        customerPrice: price,
        inputs: { ...inputs },
        results: { ...results, recommendedQuote: price },
        discordMessage: repDiscordForSave,
        aiSuggestion: null,
      };
      const res = await apiRequest("POST", "/api/staff/quotes", payload);
      const text = await res.text();
      if (text.startsWith("<") || !text.trim()) {
        throw new Error("Server returned HTML instead of JSON. You may need to log in.");
      }
      try {
        return JSON.parse(text);
      } catch {
        throw new Error("Server returned invalid JSON. You may need to log in.");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/quotes"] });
      toast({ title: "Quote saved" });
    },
    onError: (e: unknown) => toast({ title: "Failed to save quote", description: String((e as Error)?.message), variant: "destructive" }),
  });
  const updateQuoteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await apiRequest("PATCH", `/api/staff/quotes/${id}`, data);
      const text = await res.text();
      if (text.startsWith("<") || !text.trim()) throw new Error("Server returned HTML instead of JSON.");
      return JSON.parse(text);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/quotes"] });
      setEditQuoteId(null);
      toast({ title: "Quote updated" });
    },
    onError: (e: unknown) => toast({ title: "Failed to update quote", description: String((e as Error)?.message), variant: "destructive" }),
  });
  const deleteQuoteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/staff/quotes/${id}`);
      if (res.status !== 204) {
        const text = await res.text();
        throw new Error(text || "Failed to delete quote");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/quotes"] });
      toast({ title: "Quote deleted" });
    },
    onError: (e: unknown) => toast({ title: "Failed to delete quote", description: String((e as Error)?.message), variant: "destructive" }),
  });

  const results = useMemo((): QuoteResults | null => {
    if (!startTier || !targetTier) return null;
    try {
      return calculateQuote(inputs, (queueConfig as { repQuoteSettings?: unknown })?.repQuoteSettings);
    } catch {
      return null;
    }
  }, [
    startTier,
    startLvl,
    startPct,
    targetTier,
    targetLvl,
    targetPct,
    urgency,
    discountPct,
    creatorCode,
    creatorDiscountPercentForCode,
    defaultCompanyPct,
    defaultGrinderPct,
    chosenFinalQuote,
    grinderBid,
    quoteGeneratorTab,
    bundleCustomRepQuote,
    bundleCustomRepGrinder,
    queueConfig?.repQuoteSettings,
  ]);

  const repBudgetSuggestion = useMemo(() => {
    const budget = Number(repBudgetAmount) || 0;
    if (quoteGeneratorTab !== "rep" || budget <= 0) return null;
    return suggestRepTargetForBudget(
      {
        ...inputs,
        chosenFinalQuote: 0,
        grinderBid: 0,
      },
      budget,
      (queueConfig as { repQuoteSettings?: unknown })?.repQuoteSettings as any
    );
  }, [quoteGeneratorTab, repBudgetAmount, inputs, queueConfig?.repQuoteSettings]);

  const repBudgetSuggestionApplied = useMemo(() => {
    if (!repBudgetSuggestion) return false;
    return (
      targetTier === repBudgetSuggestion.suggestedTier &&
      targetLvl === repBudgetSuggestion.suggestedLvl &&
      Math.round(targetPct) === repBudgetSuggestion.suggestedPct
    );
  }, [repBudgetSuggestion, targetTier, targetLvl, targetPct]);

  const repBudgetExtraRevenue = useMemo(() => {
    if (!repBudgetSuggestion) return 0;
    return Math.max(0, repBudgetSuggestion.budget - repBudgetSuggestion.desiredQuote);
  }, [repBudgetSuggestion]);

  const repBudgetQuoteDelta = useMemo(() => {
    if (!repBudgetSuggestion) return 0;
    return Math.max(0, repBudgetSuggestion.suggestedQuote - repBudgetSuggestion.desiredQuote);
  }, [repBudgetSuggestion]);

  const repBudgetHigherTargetSameQuote = useMemo(() => {
    return !!repBudgetSuggestion
      && repBudgetSuggestion.comparisonToDesired === "above"
      && repBudgetQuoteDelta === 0;
  }, [repBudgetSuggestion, repBudgetQuoteDelta]);

  const repBudgetQuoteResults = useMemo(() => {
    if (quoteGeneratorTab !== "rep" || !results || !repBudgetSuggestion) return null;
    return calculateQuote(
      {
        ...inputs,
        targetTier: repBudgetSuggestion.suggestedTier,
        targetLvl: repBudgetSuggestion.suggestedLvl,
        targetPct: repBudgetSuggestion.suggestedPct,
        chosenFinalQuote: 0,
        grinderBid: 0,
      },
      (queueConfig as { repQuoteSettings?: unknown })?.repQuoteSettings as any
    );
  }, [quoteGeneratorTab, results, repBudgetSuggestion, inputs, queueConfig?.repQuoteSettings]);

  const badgeResults = useMemo((): BadgeQuoteResults | null => {
    try {
      const badgeInputs: BadgeQuoteInputs = {
        badgeIds,
        urgency,
        discountPct,
        creatorCode,
        ...(creatorDiscountPercentForCode !== undefined && { creatorDiscountPercent: creatorDiscountPercentForCode }),
        defaultCompanyPct,
        defaultGrinderPct,
        roundedBy: queueConfig?.badgeQuoteSettings?.roundBy ?? 5,
        chosenFinalQuote: quoteGeneratorTab === "bundle" ? ((Number(bundleCustomBadgeQuote) || 0) > 0 ? Number(bundleCustomBadgeQuote) : 0) : (Number(chosenFinalQuote) || 0),
        grinderBid: quoteGeneratorTab === "bundle" ? ((Number(bundleCustomBadgeGrinder) || 0) > 0 ? Number(bundleCustomBadgeGrinder) : 0) : (Number(grinderBid) || 0),
        myPlayerType,
      };
      return calculateBadgeQuote(badgeInputs, (queueConfig as { badgeQuoteSettings?: unknown })?.badgeQuoteSettings, (queueConfig as { myPlayerTypeSettings?: unknown })?.myPlayerTypeSettings);
    } catch {
      return null;
    }
  }, [badgeIds, urgency, discountPct, creatorCode, creatorDiscountPercentForCode, defaultCompanyPct, defaultGrinderPct, chosenFinalQuote, grinderBid, myPlayerType, quoteGeneratorTab, bundleCustomBadgeQuote, bundleCustomBadgeGrinder, queueConfig?.badgeQuoteSettings, queueConfig?.myPlayerTypeSettings]);

  const hotZonesSettings = useMemo(
    () => mergeHotZonesQuoteSettings(queueConfig?.hotZonesQuoteSettings),
    [queueConfig?.hotZonesQuoteSettings]
  );
  const resolvedHotZones = useMemo(
    () => HOT_ZONES_SELECTABLE.map((z) => ({ ...z, price: getHotZonePrice(hotZonesSettings, z.id) })),
    [hotZonesSettings]
  );
  const hotZonesDelivery = useMemo(
    () => getHotZonesDelivery(hotZonesSettings, urgency),
    [hotZonesSettings, urgency]
  );
  const { minDays: hotZonesMinDays, maxDays: hotZonesMaxDays, timeframeText: hotZonesTimeframeText } = hotZonesDelivery;

  const bundleHotZonesPrice = useMemo(() => {
    const total = resolvedHotZones.filter((z) => hotZoneIds.includes(z.id)).reduce((sum, z) => sum + z.price, 0);
    const roundBy = hotZonesSettings.roundBy > 0 ? hotZonesSettings.roundBy : 5;
    return roundBy > 0 ? Math.round(total / roundBy) * roundBy : total;
  }, [resolvedHotZones, hotZoneIds, hotZonesSettings.roundBy]);

  const customerPrice = useMemo(() => {
    if (quoteGeneratorTab === "hotzones") {
      const total = resolvedHotZones.filter((z) => hotZoneIds.includes(z.id)).reduce((sum, z) => sum + z.price, 0);
      const custom = Number(chosenFinalQuote) || 0;
      const roundBy = hotZonesSettings.roundBy > 0 ? hotZonesSettings.roundBy : 5;
      const rounded = roundBy > 0 ? Math.round(total / roundBy) * roundBy : total;
      return custom > 0 ? custom : rounded;
    }
    if (quoteGeneratorTab === "badge") {
      if (!badgeResults) return 0;
      const custom = Number(chosenFinalQuote) || 0;
      return custom > 0 ? custom : badgeResults.recommendedQuote;
    }
    if (quoteGeneratorTab === "bundle") {
      const customTotal = Number(chosenFinalQuote) || 0;
      let total = 0;
      if (bundleSelectedServices.includes("rep")) {
        const repPrice = (Number(bundleCustomRepQuote) || 0) > 0 ? Number(bundleCustomRepQuote) : (results?.recommendedQuote ?? 0);
        total += repPrice;
      }
      if (bundleSelectedServices.includes("badge")) {
        const badgePrice = (Number(bundleCustomBadgeQuote) || 0) > 0 ? Number(bundleCustomBadgeQuote) : (badgeResults?.recommendedQuote ?? 0);
        total += badgePrice;
      }
      if (bundleSelectedServices.includes("hotzones")) {
        const hotPrice = (Number(bundleCustomHotZonesQuote) || 0) > 0 ? Number(bundleCustomHotZonesQuote) : bundleHotZonesPrice;
        total += hotPrice;
      }
      if (customTotal > 0) total = customTotal;
      const bundleRoundBy = queueConfig?.bundleQuoteSettings?.roundBy;
      if (total > 0 && typeof bundleRoundBy === "number" && bundleRoundBy > 0) {
        total = Math.round(total / bundleRoundBy) * bundleRoundBy;
      }
      return total;
    }
    if (!results) return 0;
    if (quoteSource === "recommended") return results.recommendedQuote;
    if (quoteSource === "budget") return repBudgetSuggestion?.suggestedQuote ?? results.recommendedQuote;
    if (quoteSource === "ai") return results.aiSuggestedQuote;
    if (quoteSource === "market") return results.marketQuote;
    const custom = Number(chosenFinalQuote) || 0;
    return custom > 0 ? custom : results.recommendedQuote;
  }, [quoteGeneratorTab, badgeResults, results, quoteSource, chosenFinalQuote, bundleCustomRepQuote, bundleCustomBadgeQuote, bundleCustomHotZonesQuote, bundleSelectedServices, bundleHotZonesPrice, queueConfig?.bundleQuoteSettings?.roundBy, hotZoneIds, resolvedHotZones, hotZonesSettings.roundBy, repBudgetSuggestion?.suggestedQuote]);

  const payoutBaseQuote = useMemo(() => {
    const custom = Number(chosenFinalQuote) || 0;
    if (custom > 0) return custom;
    if (quoteGeneratorTab === "hotzones") {
      const total = resolvedHotZones.filter((z) => hotZoneIds.includes(z.id)).reduce((sum, z) => sum + z.price, 0);
      const roundBy = hotZonesSettings.roundBy > 0 ? hotZonesSettings.roundBy : 5;
      return roundBy > 0 ? Math.round(total / roundBy) * roundBy : total;
    }
    if (quoteGeneratorTab === "badge") return badgeResults?.recommendedQuote ?? 0;
    if (quoteGeneratorTab === "bundle") {
      let sum = 0;
      if (bundleSelectedServices.includes("rep")) sum += (Number(bundleCustomRepQuote) || 0) > 0 ? Number(bundleCustomRepQuote) : (results?.recommendedQuote ?? 0);
      if (bundleSelectedServices.includes("badge")) sum += (Number(bundleCustomBadgeQuote) || 0) > 0 ? Number(bundleCustomBadgeQuote) : (badgeResults?.recommendedQuote ?? 0);
      if (bundleSelectedServices.includes("hotzones")) sum += (Number(bundleCustomHotZonesQuote) || 0) > 0 ? Number(bundleCustomHotZonesQuote) : bundleHotZonesPrice;
      const bundleRoundBy = queueConfig?.bundleQuoteSettings?.roundBy;
      if (sum > 0 && typeof bundleRoundBy === "number" && bundleRoundBy > 0) {
        sum = Math.round(sum / bundleRoundBy) * bundleRoundBy;
      }
      return sum;
    }
    return results?.recommendedQuote ?? 0;
  }, [chosenFinalQuote, quoteGeneratorTab, resolvedHotZones, hotZoneIds, hotZonesSettings.roundBy, badgeResults?.recommendedQuote, bundleSelectedServices, bundleCustomRepQuote, results?.recommendedQuote, bundleCustomBadgeQuote, bundleCustomHotZonesQuote, bundleHotZonesPrice, queueConfig?.bundleQuoteSettings?.roundBy]);

  useEffect(() => {
    if (quoteGeneratorTab !== "rep") return;
    const budgetModeActive = quoteSource === "budget" || repBudgetSuggestionApplied;
    if (quoteSource === "custom" && (!chosenFinalQuote || Number(chosenFinalQuote) <= 0)) {
      setQuoteSource("recommended");
      return;
    }
    if (quoteSource === "budget" && !repBudgetSuggestion) {
      setQuoteSource("recommended");
      return;
    }
    if (!budgetModeActive && quoteSource === "market" && results && results.recommendedQuote === results.marketQuote) {
      setQuoteSource("recommended");
      return;
    }
    if (!budgetModeActive && quoteSource === "ai" && results && results.recommendedQuote === results.aiSuggestedQuote) {
      setQuoteSource("recommended");
    }
  }, [quoteSource, chosenFinalQuote, quoteGeneratorTab, repBudgetSuggestion, results, repBudgetSuggestionApplied]);

  const effectiveQuoteForGrinder = payoutBaseQuote;

  const creatorRateForPayouts = (creatorCode && (creatorDiscountPercentForCode ?? 0) > 0)
    ? (creatorDiscountPercentForCode ?? 0)
    : 0;

  const buildPayoutFromQuote = useCallback((quoteAmount: number, grinderOverride = 0) => {
    let grinderPayout: number;
    let companyPayout: number;
    let creatorCommission: number;

    if (grinderOverride > 0) {
      grinderPayout = grinderOverride;
      const maxCreator = Math.max(0, quoteAmount - grinderPayout);
      const companyGross = Math.max(0, quoteAmount - grinderPayout);
      creatorCommission = Math.min(companyGross * creatorRateForPayouts, maxCreator);
      companyPayout = Math.max(0, companyGross - creatorCommission);
    } else {
      grinderPayout = quoteAmount * defaultGrinderPct;
      const companyGross = quoteAmount * defaultCompanyPct;
      creatorCommission = companyGross * creatorRateForPayouts;
      companyPayout = Math.max(0, companyGross - creatorCommission);
    }

    const companyPct = quoteAmount > 0 ? companyPayout / quoteAmount : 0;
    const grinderPct = quoteAmount > 0 ? grinderPayout / quoteAmount : 0;
    const creatorPct = quoteAmount > 0 ? creatorCommission / quoteAmount : 0;
    const grinderBidAboveDefault = grinderOverride > 0 && quoteAmount > 0 && grinderOverride > quoteAmount * defaultGrinderPct;
    const profitMargin: "GREEN" | "YELLOW" | "RED" | null =
      quoteAmount > 0
        ? companyPct < 0.3
          ? "RED"
          : companyPct < 0.4
            ? "YELLOW"
            : "GREEN"
        : null;

    return {
      companyPayout,
      grinderPayout,
      creatorCommission,
      companyPct,
      grinderPct,
      creatorPct,
      grinderBidAboveDefault,
      profitMargin,
    };
  }, [creatorRateForPayouts, defaultCompanyPct, defaultGrinderPct]);

  const repDiscordContext = useMemo(() => {
    if (quoteGeneratorTab !== "rep" || !results) return null;

    if (quoteSource === "budget" && repBudgetSuggestion && repBudgetQuoteResults) {
      return {
        customerPrice: repBudgetSuggestion.suggestedQuote,
        estimatedTimeframe: repBudgetQuoteResults.estimatedTimeframe,
        timeframeText: repBudgetQuoteResults.timeframeText,
        startTier,
        startLvl,
        startPct,
        targetTier: repBudgetSuggestion.suggestedTier,
        targetLvl: repBudgetSuggestion.suggestedLvl,
        targetPct: repBudgetSuggestion.suggestedPct,
      };
    }

    return {
      customerPrice,
      estimatedTimeframe: results.estimatedTimeframe,
      timeframeText: results.timeframeText,
      startTier,
      startLvl,
      startPct,
      targetTier,
      targetLvl,
      targetPct,
    };
  }, [quoteGeneratorTab, results, quoteSource, repBudgetSuggestion, repBudgetQuoteResults, startTier, startLvl, startPct, targetTier, targetLvl, targetPct, customerPrice]);

  const repDiscordMessage = useMemo(() => {
    if (!repDiscordContext) return "";
    return buildQuoteDiscordMessage({
      customerPrice: repDiscordContext.customerPrice,
      estimatedTimeframe: repDiscordContext.estimatedTimeframe,
      timeframeText: repDiscordContext.timeframeText,
      customerIdentifier: customerIdentifier.trim() || undefined,
      route: `${repDiscordContext.startTier} ${repDiscordContext.startLvl} → ${repDiscordContext.targetTier} ${repDiscordContext.targetLvl}`,
      urgency,
      creatorCode: creatorCode || undefined,
      startTier: repDiscordContext.startTier,
      startLvl: repDiscordContext.startLvl,
      startPct: repDiscordContext.startPct ?? 0,
      targetTier: repDiscordContext.targetTier,
      targetLvl: repDiscordContext.targetLvl,
      targetPct: repDiscordContext.targetPct ?? 0,
      ...(results && (results.discountUsed ?? 0) > 0 && { discountPercent: (results.discountUsed ?? 0) * 100 }),
    });
  }, [repDiscordContext, customerIdentifier, urgency, creatorCode, results]);

  useEffect(() => {
    const gb = Number(grinderBid) || 0;
    if (gb > 0 && effectiveQuoteForGrinder > 0 && gb > effectiveQuoteForGrinder) {
      setGrinderBid(String(effectiveQuoteForGrinder));
    }
  }, [effectiveQuoteForGrinder, grinderBid]);

  const bundleRepQuoteForGrinder = (Number(bundleCustomRepQuote) || 0) > 0 ? Number(bundleCustomRepQuote) : (results?.recommendedQuote ?? 0);
  const bundleBadgeQuoteForGrinder = (Number(bundleCustomBadgeQuote) || 0) > 0 ? Number(bundleCustomBadgeQuote) : (badgeResults?.recommendedQuote ?? 0);
  useEffect(() => {
    if (quoteGeneratorTab !== "bundle") return;
    const repGb = Number(bundleCustomRepGrinder) || 0;
    const badgeGb = Number(bundleCustomBadgeGrinder) || 0;
    const hzGb = Number(bundleCustomHotZonesGrinder) || 0;
    if (repGb > 0 && bundleRepQuoteForGrinder > 0 && repGb > bundleRepQuoteForGrinder) {
      setBundleCustomRepGrinder(String(bundleRepQuoteForGrinder));
    }
    if (badgeGb > 0 && bundleBadgeQuoteForGrinder > 0 && badgeGb > bundleBadgeQuoteForGrinder) {
      setBundleCustomBadgeGrinder(String(bundleBadgeQuoteForGrinder));
    }
    const bundleHotZonesQuoteForGrinder = (Number(bundleCustomHotZonesQuote) || 0) > 0 ? Number(bundleCustomHotZonesQuote) : bundleHotZonesPrice;
    if (bundleSelectedServices.includes("hotzones") && hzGb > 0 && bundleHotZonesQuoteForGrinder > 0 && hzGb > bundleHotZonesQuoteForGrinder) {
      setBundleCustomHotZonesGrinder(String(bundleHotZonesQuoteForGrinder));
    }
  }, [quoteGeneratorTab, bundleRepQuoteForGrinder, bundleBadgeQuoteForGrinder, bundleCustomRepGrinder, bundleCustomBadgeGrinder, bundleCustomHotZonesGrinder, bundleCustomHotZonesQuote, bundleSelectedServices, bundleHotZonesPrice]);

  const filteredSavedQuotes = useMemo(() => {
    const targetService = quoteGeneratorTab === "rep" ? "rep_grinding" : quoteGeneratorTab === "badge" ? "badge_grinding" : "bundle";
    let list = savedQuotesList.filter((q2) => (q2.serviceType || "rep_grinding") === targetService);

    // Text search
    if (quoteFilter.trim()) {
      const q = quoteFilter.trim().toLowerCase();
      list = list.filter((q2) => {
        const cust = (q2.customerIdentifier || "").toLowerCase();
        const created = (q2.createdByName || "").toLowerCase();
        const price = String(Number(q2.results?.recommendedQuote ?? 0));
        const id = (q2.id || "").toLowerCase();
        const route = targetService === "rep_grinding"
          ? formatQuoteRoute(q2.inputs as { startTier?: string; startLvl?: number; startPct?: number; targetTier?: string; targetLvl?: number; targetPct?: number } | undefined)
          : targetService === "badge_grinding"
            ? (() => { const ids = Array.isArray(q2.inputs?.badgeIds) ? q2.inputs.badgeIds : []; return `${ids.length === 1 ? "**Badge** — " : "**Badges** — "}${formatBadgeRouteFromIds(ids)}`; })()
            : (() => {
                const inp = q2.inputs as { startTier?: string; targetTier?: string; badgeIds?: string[] } | undefined;
                const repR = inp?.startTier && inp?.targetTier ? formatQuoteRoute(inp as any) : "";
                const ids = Array.isArray(inp?.badgeIds) ? inp.badgeIds : [];
                const badgeR = ids.length ? (ids.length === 1 ? "Badge" : "Badges") + " — " + formatBadgeRouteFromIds(ids) : "";
                return [repR, badgeR].filter(Boolean).join(" + ");
              })();
        return cust.includes(q) || created.includes(q) || price.includes(q) || id.includes(q) || route.toLowerCase().includes(q);
      });
    }

    // Date range
    if (filterDateRange === "custom" && (filterDateFrom || filterDateTo)) {
      if (filterDateFrom) {
        const fromStart = new Date(filterDateFrom);
        fromStart.setHours(0, 0, 0, 0);
        list = list.filter((q2) => q2.createdAt && new Date(q2.createdAt) >= fromStart);
      }
      if (filterDateTo) {
        const toEnd = new Date(filterDateTo);
        toEnd.setHours(23, 59, 59, 999);
        list = list.filter((q2) => q2.createdAt && new Date(q2.createdAt) <= toEnd);
      }
    } else if (filterDateRange && filterDateRange !== "custom") {
      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      const msByRange: Record<string, number> = {
        "1d": 1 * dayMs,
        "3d": 3 * dayMs,
        "7d": 7 * dayMs,
        "14d": 14 * dayMs,
        "30d": 30 * dayMs,
        "90d": 90 * dayMs,
        "180d": 180 * dayMs,
        "365d": 365 * dayMs,
      };
      const ms = msByRange[filterDateRange] ?? 30 * dayMs;
      const cutoff = now - ms;
      list = list.filter((q2) => q2.createdAt && new Date(q2.createdAt).getTime() >= cutoff);
    }

    // Rep-only or bundle: Start tier, Target tier
    if (targetService === "rep_grinding" || targetService === "bundle") {
      if (filterStartTier) {
        list = list.filter((q2) => String(q2.inputs?.startTier ?? "").toLowerCase() === filterStartTier.toLowerCase());
      }
      if (filterTargetTier) {
        list = list.filter((q2) => String(q2.inputs?.targetTier ?? "").toLowerCase() === filterTargetTier.toLowerCase());
      }
    }

    // Badge-only or bundle: Badge count
    if (targetService === "badge_grinding" || targetService === "bundle") {
      if (filterBadgeCountMin !== "") {
        const min = Number(filterBadgeCountMin) || 0;
        list = list.filter((q2) => (Array.isArray(q2.inputs?.badgeIds) ? q2.inputs.badgeIds.length : 0) >= min);
      }
      if (filterBadgeCountMax !== "") {
        const max = Number(filterBadgeCountMax) || Infinity;
        list = list.filter((q2) => (Array.isArray(q2.inputs?.badgeIds) ? q2.inputs.badgeIds.length : 0) <= max);
      }
    }

    // Urgency
    if (filterUrgency) {
      list = list.filter((q2) => String(q2.inputs?.urgency ?? "").toLowerCase() === filterUrgency.toLowerCase());
    }

    // Amount range
    if (filterAmountMin !== "") {
      const min = Number(filterAmountMin) || 0;
      list = list.filter((q2) => Number(q2.results?.recommendedQuote ?? 0) >= min);
    }
    if (filterAmountMax !== "") {
      const max = Number(filterAmountMax) || Infinity;
      list = list.filter((q2) => Number(q2.results?.recommendedQuote ?? 0) <= max);
    }

    // Delivery timeframe (text match)
    if (filterTimeframe.trim()) {
      const tf = filterTimeframe.trim().toLowerCase();
      list = list.filter((q2) => (q2.results?.estimatedTimeframe ?? "").toLowerCase().includes(tf) || (String(q2.results?.timeframeText ?? "")).toLowerCase().includes(tf));
    }

    // Rep-only or bundle: Start %, Target %
    if (targetService === "rep_grinding" || targetService === "bundle") {
      if (filterStartPctMin !== "") {
        const min = Number(filterStartPctMin) || 0;
        list = list.filter((q2) => (Number(q2.inputs?.startPct ?? 0) ?? 0) >= min);
      }
      if (filterTargetPctMin !== "") {
        const min = Number(filterTargetPctMin) || 0;
        list = list.filter((q2) => (Number(q2.inputs?.targetPct ?? 0) ?? 0) >= min);
      }
    }

    // Discount %
    if (filterDiscountPctMin !== "") {
      const min = Number(filterDiscountPctMin) || 0;
      list = list.filter((q2) => {
        const discountUsed = Number((q2.results as { discountUsed?: number })?.discountUsed ?? 0);
        const discountPct = Math.round(discountUsed * 100);
        return discountPct >= min;
      });
    }

    return list;
  }, [savedQuotesList, quoteGeneratorTab, quoteFilter, filterDateRange, filterDateFrom, filterDateTo, filterStartTier, filterTargetTier, filterBadgeCountMin, filterBadgeCountMax, filterUrgency, filterAmountMin, filterAmountMax, filterTimeframe, filterStartPctMin, filterTargetPctMin, filterDiscountPctMin]);

  return (
    <AnimatedPage>
      <div className="space-y-4 sm:space-y-6 overflow-x-hidden min-w-0 pb-6 px-2">
        {/* Hero — exclusive feel */}
        <FadeInUp delay={0.02}>
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 p-4 sm:p-6">
            <div className="absolute top-0 right-0 w-72 h-72 -translate-y-16 translate-x-12 rounded-full bg-primary/10 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_30%,transparent_70%)]" />
            <div className="absolute bottom-0 left-0 w-48 h-48 -translate-x-8 translate-y-8 rounded-full bg-primary/5 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_30%,transparent_70%)]" />
            <div className="relative z-10 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-xl bg-primary/20 border border-primary/30">
                  <Calculator className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Quote Generator</h1>
                    <Badge className="bg-primary/20 text-primary border-primary/30 text-[10px] uppercase tracking-wider shrink-0">
                      <Sparkles className="w-3 h-3 mr-1" />
                      Staff Only
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-white/60 mt-1">
                    Simplify your multi-service workflow with a centralized tab to generate quotes, leverage AI-driven suggestions, and manage payout breakdowns in one place.
                  </p>
                </div>
              </div>
              {quoteGeneratorTab === "rep" && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto border-primary/50 text-primary hover:bg-primary/20 hover:text-primary text-xs min-h-11 sm:min-h-9"
                  onClick={() => setPlaybookOpen(true)}
                >
                  <BookOpen className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  Rep Pricing Playbook
                </Button>
              )}
            </div>
          </div>
        </FadeInUp>

        <Tabs value={quoteGeneratorTab} onValueChange={(v) => setQuoteGeneratorTab(v as "rep" | "badge" | "bundle" | "hotzones")} className="space-y-4">
          <div className="w-full">
            <Select
              value={quoteGeneratorTab}
              onValueChange={(v) => setQuoteGeneratorTab(v as "rep" | "badge" | "bundle" | "hotzones")}
            >
              <SelectTrigger className="w-full bg-white/[0.04] border-white/10 min-h-11 sm:min-h-9 h-11 sm:h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rep" className="text-sm">
                  <span className="flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 shrink-0" />
                    Rep
                  </span>
                </SelectItem>
                <SelectItem value="badge" className="text-sm">
                  <span className="flex items-center gap-2">
                    <Medal className="w-3.5 h-3.5 shrink-0" />
                    Badges
                  </span>
                </SelectItem>
                <SelectItem value="bundle" className="text-sm">
                  <span className="flex items-center gap-2">
                    <Package className="w-3.5 h-3.5 shrink-0" />
                    Bundle
                  </span>
                </SelectItem>
                <SelectItem value="hotzones" className="text-sm">
                  <span className="flex items-center gap-2">
                    <Flame className="w-3.5 h-3.5 shrink-0" />
                    Hot Zones
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

        {/* Rep Grinding tab */}
        <TabsContent value="rep" className="mt-0 space-y-4">
        {/* Inputs — sliders + tier/creator dropdowns */}
        <FadeInUp delay={0.04}>
          <Card className="border-0 bg-white/[0.02] border border-white/[0.06]">
            <CardHeader className="pb-4 sm:pb-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 text-primary">
                    <Zap className="w-4 h-4 text-primary" />
                    REP GRINDING
                  </CardTitle>
                  <p className="text-xs sm:text-sm text-muted-foreground font-normal mt-2">Get a quote for Rep Grinding — You define the tiers, set the urgency, and manage every attribution and payout detail with total oversight</p>
                </div>
                {repTabIsDirty && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full sm:w-auto h-11 min-h-11 sm:h-9 sm:min-h-0 border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                    onClick={resetRepTab}
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                    Reset Rep Tab
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-4 space-y-5 sm:space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-8">
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-primary">Start</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Customer's current rep tier and progress level</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="w-full sm:w-40 space-y-2">
                      <Label className="text-xs">Rep</Label>
                      <Select value={startTier} onValueChange={setStartTier}>
                        <SelectTrigger className="bg-white/[0.04] border-white/10 min-h-11 sm:min-h-0 h-11 sm:h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIERS.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-0 sm:min-w-[120px] space-y-2">
                      <Label className="text-xs">Level · {startLvl}</Label>
                      <Slider
                        value={[startLvl]}
                        onValueChange={([v]) => setStartLvl(v)}
                        min={1}
                        max={5}
                        step={1}
                        className="py-4 sm:py-3"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Start %</Label>
                    <div className="flex gap-3 items-center">
                      <Slider
                        value={[Math.round(startPct)]}
                        onValueChange={([v]) => {
                          setStartPct(v);
                          setStartPctInput(String(v));
                        }}
                        min={0}
                        max={100}
                        step={1}
                        className="flex-1 py-4 sm:py-3"
                      />
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        placeholder="0–100"
                        value={startPctInput}
                        onChange={(e) => setStartPctInput(e.target.value)}
                        onBlur={() => {
                          const v = parsePct(startPctInput);
                          setStartPct(v);
                          setStartPctInput(String(v));
                        }}
                        className="w-20 h-9 bg-white/[0.04] border-white/10 text-right text-sm"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-primary">Target</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Customer's target rep tier and progress level</p>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="w-full sm:w-40 space-y-2">
                      <Label className="text-xs">Rep</Label>
                      <Select value={targetTier} onValueChange={setTargetTier}>
                        <SelectTrigger className="bg-white/[0.04] border-white/10 min-h-11 sm:min-h-0 h-11 sm:h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIERS.map((t) => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex-1 min-w-0 sm:min-w-[120px] space-y-2">
                      <Label className="text-xs">Level · {targetLvl}</Label>
                      <Slider
                        value={[targetLvl]}
                        onValueChange={([v]) => setTargetLvl(v)}
                        min={1}
                        max={5}
                        step={1}
                        className="py-4 sm:py-3"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Target % (Default: 0)</Label>
                    <div className="flex gap-3 items-center">
                      <Slider
                        value={[Math.round(targetPct)]}
                        onValueChange={([v]) => {
                          setTargetPct(v);
                          setTargetPctInput(String(v));
                        }}
                        min={0}
                        max={100}
                        step={1}
                        className="flex-1 py-4 sm:py-3"
                      />
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="any"
                        placeholder="0–100"
                        value={targetPctInput}
                        onChange={(e) => setTargetPctInput(e.target.value)}
                        onBlur={() => {
                          const v = parsePct(targetPctInput);
                          setTargetPct(v);
                          setTargetPctInput(String(v));
                        }}
                        className="w-20 h-9 bg-white/[0.04] border-white/10 text-right text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-4 border-t border-white/[0.06]">
                <p className="text-xs font-medium uppercase tracking-wider text-primary">Pricing & options</p>
                <p className="text-[11px] text-muted-foreground">Urgency and discount settings adjust the suggested quote.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-xs">Urgency</Label>
                  <div className="flex gap-2 flex-wrap">
                    {URGENCY_OPTIONS.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUrgency(u)}
                    className={cn(
                          "px-4 py-3 min-h-11 rounded-lg text-sm font-medium border transition-colors touch-manipulation",
                          urgency === u && u === "Slow" && "bg-amber-500/20 text-amber-400 border-amber-500/40",
                          urgency === u && u === "Normal" && "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
                          urgency === u && u === "Rush" && "bg-red-500/20 text-red-400 border-red-500/40",
                          urgency !== u && "bg-white/[0.04] border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
                        )}
                      >
                        {URGENCY_LABELS[u]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Discount % · {discountPct}</Label>
                  <Slider
                    value={[discountPct]}
                    onValueChange={([v]) => setDiscountPct(v)}
                    min={0}
                    max={100}
                    step={1}
                    className="py-4 sm:py-3"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Customer <span className="text-destructive">*</span></Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Required to save and link quotes to orders.</p>
                  <Input
                    required
                    placeholder="Discord Username, Gamertag, or Name"
                    value={customerIdentifier}
                    onChange={(e) => setCustomerIdentifier(e.target.value)}
                    className="bg-white/[0.04] border-white/10 h-11 min-h-11 sm:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Creator Code</Label>
                  <p className="text-[11px] text-muted-foreground mt-0.5 whitespace-nowrap">If the customer used a creator code, select it here to view updated payout analytics.</p>
                  <Select value={creatorCode || "_none"} onValueChange={(v) => setCreatorCode(v === "_none" ? "" : v)}>
                    <SelectTrigger className="bg-white/[0.04] border-white/10 min-h-11 sm:min-h-0 h-11 sm:h-9">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">None</SelectItem>
                      {[...creatorsList]
                        .sort((a, b) => (a.code || "").localeCompare(b.code || ""))
                        .map((c) => {
                          const code = (c.code || "").toUpperCase();
                          const pct = c.quoteDiscountPercent != null
                            ? Number(c.quoteDiscountPercent)
                            : (CREATORS_DISCOUNTS[code] ?? 0) * 100;
                          return (
                            <SelectItem key={c.id} value={code}>
                              {code} ({Number.isNaN(pct) ? "—" : pct}%)
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1 pt-4 border-t border-white/[0.06]">
                <p className="text-xs font-medium uppercase tracking-wider text-primary">Budget suggestion</p>
                <p className="text-[11px] text-muted-foreground">Enter the customer's budget to see the highest rep target reachable using the recommended quote logic.</p>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,220px)_1fr] gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Budget ($)</Label>
                    <Input
                      type="text"
                      inputMode="decimal"
                      placeholder="Optional"
                      value={repBudgetAmount}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\s/g, "");
                        if (v === "" || /^\d*\.?\d*$/.test(v)) setRepBudgetAmount(v);
                      }}
                      className="bg-white/[0.04] border-white/10 h-11 min-h-11 sm:h-10"
                    />
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.03] p-4">
                    {repBudgetSuggestion ? (
                      <div className="space-y-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">Target within budget</p>
                            <p className="mt-1 text-lg font-semibold text-white">
                              {repBudgetSuggestion.suggestedTier} {repBudgetSuggestion.suggestedLvl} · {repBudgetSuggestion.suggestedPct}%
                            </p>
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              {repBudgetSuggestion.comparisonToDesired === "below"
                                ? `Budget is short by $${formatUSD(repBudgetSuggestion.shortfallToDesired)} for the current target, so this is the highest reachable rep.`
                                : repBudgetSuggestion.comparisonToDesired === "above"
                                  ? repBudgetHigherTargetSameQuote
                                    ? "Budget can push beyond the current target and reach this higher rep milestone without increasing the quoted amount."
                                    : `Budget can push beyond the current target and reach this higher rep milestone.`
                                  : repBudgetSuggestion.remainingBudget > 0
                                    ? `Budget covers the current target and leaves $${formatUSD(repBudgetSuggestion.remainingBudget)} of headroom, but not enough to unlock the next rep milestone.`
                                    : "Budget covers the current target exactly under recommended quote logic."}
                            </p>
                            {((repBudgetSuggestion.comparisonToDesired === "above" && !repBudgetHigherTargetSameQuote) || (repBudgetSuggestion.comparisonToDesired === "meets" && repBudgetExtraRevenue > 0)) && (
                              <p className="mt-2 text-[11px] font-medium text-emerald-400">
                                Additional revenue opportunity: +${formatUSD(
                                  repBudgetSuggestion.comparisonToDesired === "above"
                                    ? repBudgetQuoteDelta
                                    : repBudgetExtraRevenue
                                )} vs the desired quote.
                              </p>
                            )}
                            {repBudgetHigherTargetSameQuote && (
                              <p className="mt-2 text-[11px] font-medium text-cyan-400">
                                Higher rep target unlocked at the same quoted amount.
                              </p>
                            )}
                          </div>
                          <div className="flex gap-2 shrink-0">
                            <Button
                              type="button"
                              size="sm"
                              variant={repBudgetSuggestionApplied ? "secondary" : "default"}
                              className="h-10 sm:h-8 shrink-0"
                              disabled={repBudgetSuggestionApplied}
                              onClick={() => {
                                setTargetTier(repBudgetSuggestion.suggestedTier);
                                setTargetLvl(repBudgetSuggestion.suggestedLvl);
                                setTargetPct(repBudgetSuggestion.suggestedPct);
                                setTargetPctInput(String(repBudgetSuggestion.suggestedPct));
                              setQuoteSource("budget");
                              }}
                            >
                              {repBudgetSuggestionApplied ? "Applied" : "Apply suggestion"}
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              className="h-10 sm:h-8 shrink-0"
                              onClick={() => setRepBudgetAmount("")}
                            >
                              Re-adjust budget
                            </Button>
                          </div>
                        </div>
                        {repBudgetSuggestionApplied && (
                          <p className="text-[11px] text-emerald-400">
                            Suggestion applied. Adjust the budget field and apply again if the customer changes their amount.
                          </p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">Desired quote</p>
                            <p className="mt-1 text-sm font-semibold text-white">${formatUSD(repBudgetSuggestion.desiredQuote)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">Budget quote</p>
                            <p className="mt-1 text-sm font-semibold text-primary">${formatUSD(repBudgetSuggestion.suggestedQuote)}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-medium uppercase tracking-wider text-white/50">
                              {repBudgetSuggestion.comparisonToDesired === "below"
                                ? "Need for desired"
                                : repBudgetSuggestion.comparisonToDesired === "above"
                                  ? repBudgetHigherTargetSameQuote
                                    ? "Same quote upside"
                                    : "Additional revenue"
                                  : repBudgetExtraRevenue > 0
                                    ? "Extra budget"
                                    : "Difference"}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-white">
                              ${formatUSD(
                                repBudgetSuggestion.comparisonToDesired === "below"
                                  ? repBudgetSuggestion.shortfallToDesired
                                  : repBudgetSuggestion.comparisonToDesired === "above"
                                    ? repBudgetHigherTargetSameQuote
                                      ? 0
                                      : repBudgetQuoteDelta
                                    : repBudgetExtraRevenue > 0
                                      ? repBudgetExtraRevenue
                                      : 0
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-white">No budget entered</p>
                        <p className="text-[11px] text-muted-foreground">
                          Add a budget amount to see the best rep level and percentage the customer can afford from their current starting point.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1 pt-4 border-t border-white/[0.06]">
                <p className="text-xs font-medium uppercase tracking-wider text-primary">Quote override (optional)</p>
                <p className="text-[11px] text-muted-foreground">Enter a custom amount to override the suggested quote and view updated payout analytics.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Custom Quote ($)</Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Override the suggested quote to view updated payout split.</p>
                  </div>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="Optional"
                    value={chosenFinalQuote}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\s/g, "");
                      if (v === "" || /^\d*\.?\d*$/.test(v)) setChosenFinalQuote(v);
                    }}
                    className="bg-white/[0.04] border-white/10 h-11 min-h-11 sm:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <div>
                    <Label className="text-xs">Custom Grinder Payout ($)</Label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">If known, enter the grinder's payout to view updated company share.</p>
                  </div>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="Optional"
                    value={grinderBid}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\s/g, "");
                      if (v === "" || /^\d*\.?\d*$/.test(v)) {
                        const num = parseFloat(v);
                        const effectiveQuote = (Number(chosenFinalQuote) || 0) > 0 ? Number(chosenFinalQuote) : (recalcResults?.recommendedQuote ?? Number(quote?.results?.recommendedQuote ?? 0));
                        if (v !== "" && !Number.isNaN(num) && effectiveQuote > 0 && num > effectiveQuote) {
                          setGrinderBid(String(effectiveQuote));
                          return;
                        }
                        setGrinderBid(v);
                      }
                    }}
                    className="bg-white/[0.04] border-white/10 h-11 min-h-11 sm:h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeInUp>
        </TabsContent>

        {/* Badge Grinding tab */}
        <TabsContent value="badge" className="mt-0 space-y-4">
        <FadeInUp delay={0.04}>
          <Card className="border-0 bg-white/[0.02] border border-white/[0.06]">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 text-primary">
                <Medal className="w-4 h-4 text-primary" />
                BADGE GRINDING
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground font-normal">Get a quote for Badge Grinding — Select badges from NBA 2K26 and configure pricing.</p>
            </CardHeader>
            <CardContent className="pt-2 sm:pt-4 space-y-5 sm:space-y-8">
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wider text-primary">Select Badges</p>
                    <p className="text-[11px] text-muted-foreground">Choose the badges to include in the quote. Pricing is configurable in Admin → Quote Generator.</p>
                  </div>
                  <Button
                    type="button"
                    variant={badgeIds.length === ALL_BADGES.length ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "h-11 min-h-11 sm:h-8 sm:min-h-8 text-xs w-full sm:w-auto shrink-0",
                      badgeIds.length === ALL_BADGES.length
                        ? "bg-primary text-primary-foreground"
                        : "border-primary/50 text-primary hover:bg-primary/20"
                    )}
                    onClick={() => {
                      const allIds = ALL_BADGES.map((b) => b.id);
                      setBadgeIds(badgeIds.length === allIds.length ? [] : allIds);
                    }}
                  >
                    Max Badges
                  </Button>
                </div>
                <div className="space-y-4">
                  {BADGE_CATEGORIES.map((cat) => (
                    <div key={cat} className="space-y-2">
                      <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-1.5">
                        <p className="text-[11px] font-medium uppercase tracking-wider text-white">{cat}</p>
                        <button
                          type="button"
                          onClick={() => {
                            const catIds = BADGES_BY_CATEGORY[cat].map((b) => b.id);
                            setBadgeIds((prev) => {
                              const hasAll = catIds.every((id) => prev.includes(id));
                              if (hasAll) return prev.filter((id) => !catIds.includes(id));
                              return [...new Set([...prev, ...catIds])];
                            });
                          }}
                          className={cn(
                            "text-[10px] font-medium rounded px-2 py-1.5 min-h-[44px] sm:min-h-0 sm:py-0.5 transition-colors touch-manipulation",
                            BADGES_BY_CATEGORY[cat].every((b) => badgeIds.includes(b.id))
                              ? "bg-primary text-primary-foreground"
                              : "text-primary hover:bg-primary/20 hover:underline"
                          )}
                        >
                          All
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {BADGES_BY_CATEGORY[cat].map((b) => {
                          const sel = badgeIds.includes(b.id);
                          return (
                            <button
                              key={b.id}
                              type="button"
                              onClick={() => setBadgeIds((prev) => sel ? prev.filter((id) => id !== b.id) : [...prev, b.id])}
                              className={cn(
                                "px-2.5 py-2 sm:py-1 min-h-[44px] sm:min-h-0 rounded-md text-xs font-medium border transition-colors touch-manipulation",
                                sel ? (cat === "Shooting" ? "bg-[#1b5e20]/20 text-emerald-400 border-[#1b5e20]/40" : cat === "Playmaking" ? "bg-[#92400e]/20 text-amber-400 border-[#92400e]/40" : cat === "Finishing" ? "bg-[#1a237e]/20 text-indigo-400 border-[#1a237e]/40" : cat === "Defense" ? "bg-[#87050a]/20 text-red-400 border-[#87050a]/40" : cat === "Rebounding" ? "bg-purple-500/20 text-purple-400 border-purple-500/40" : "bg-slate-500/20 text-slate-400 border-slate-500/40") : "bg-white/[0.04] border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
                              )}
                            >
                              {b.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
                {badgeIds.length > 0 && (
                  <p className="text-xs text-muted-foreground">{badgeIds.length} badge{badgeIds.length !== 1 ? "s" : ""} selected</p>
                )}
              </div>

              <div className="space-y-1 pt-4 border-t border-white/[0.06]">
                <p className="text-xs font-medium uppercase tracking-wider text-primary">Pricing & options</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <div className="space-y-2">
                  <Label className="text-xs">MyPlayer Type</Label>
                  <div className="flex gap-2 flex-wrap">
                    {(["Non-Rebirth", "Rebirth"] as const).map((opt) => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setMyPlayerType(opt)}
                        className={cn(
                          "px-4 py-3 min-h-11 rounded-lg text-sm font-medium border transition-colors touch-manipulation",
                          myPlayerType === opt && opt === "Non-Rebirth" && "bg-amber-500/20 text-amber-400 border-amber-500/40",
                          myPlayerType === opt && opt === "Rebirth" && "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
                          myPlayerType !== opt && "bg-white/[0.04] border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
                        )}
                      >
                        {opt === "Non-Rebirth"
                          ? `Non-Rebirth (+$${queueConfig?.myPlayerTypeSettings?.nonRebirthAdd ?? 100})`
                          : `Rebirth (+$${queueConfig?.myPlayerTypeSettings?.rebirthAdd ?? 100})`}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">Both add to cost. Prices configurable in Admin.</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Urgency</Label>
                  <div className="flex gap-2 flex-wrap">
                    {URGENCY_OPTIONS.map((u) => (
                      <button
                        key={u}
                        type="button"
                        onClick={() => setUrgency(u)}
                        className={cn(
                          "px-4 py-3 min-h-11 rounded-lg text-sm font-medium border transition-colors touch-manipulation",
                          urgency === u && u === "Slow" && "bg-amber-500/20 text-amber-400 border-amber-500/40",
                          urgency === u && u === "Normal" && "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
                          urgency === u && u === "Rush" && "bg-red-500/20 text-red-400 border-red-500/40",
                          urgency !== u && "bg-white/[0.04] border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
                        )}
                      >
                        {URGENCY_LABELS[u]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Discount % · {discountPct}</Label>
                  <Slider value={[discountPct]} onValueChange={([v]) => setDiscountPct(v)} min={0} max={100} step={1} className="py-4 sm:py-3" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Customer <span className="text-destructive">*</span></Label>
                  <Input
                    required
                    placeholder="Discord Username, Gamertag, or Name"
                    value={customerIdentifier}
                    onChange={(e) => setCustomerIdentifier(e.target.value)}
                    className="bg-white/[0.04] border-white/10 h-11 min-h-11 sm:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Creator Code</Label>
                  <Select value={creatorCode || "_none"} onValueChange={(v) => setCreatorCode(v === "_none" ? "" : v)}>
                    <SelectTrigger className="bg-white/[0.04] border-white/10 min-h-11 sm:min-h-0 h-11 sm:h-9">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none">None</SelectItem>
                      {[...creatorsList]
                        .sort((a, b) => (a.code || "").localeCompare(b.code || ""))
                        .map((c) => {
                          const code = (c.code || "").toUpperCase();
                          const pct = c.quoteDiscountPercent != null ? Number(c.quoteDiscountPercent) : (CREATORS_DISCOUNTS[code] ?? 0) * 100;
                          return (
                            <SelectItem key={c.id} value={code}>
                              {code} ({Number.isNaN(pct) ? "—" : pct}%)
                            </SelectItem>
                          );
                        })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1 pt-4 border-t border-white/[0.06]">
                <p className="text-xs font-medium uppercase tracking-wider text-primary">Quote override (optional)</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="space-y-2">
                  <Label className="text-xs">Custom Quote ($)</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="Optional"
                    value={chosenFinalQuote}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\s/g, "");
                      if (v === "" || /^\d*\.?\d*$/.test(v)) setChosenFinalQuote(v);
                    }}
                    className="bg-white/[0.04] border-white/10 h-11 min-h-11 sm:h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs">Custom Grinder Payout ($)</Label>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="Optional"
                    value={grinderBid}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\s/g, "");
                      if (v === "" || /^\d*\.?\d*$/.test(v)) {
                        const num = parseFloat(v);
                        const effectiveQuote = (Number(chosenFinalQuote) || 0) > 0 ? Number(chosenFinalQuote) : (badgeResults?.recommendedQuote ?? 0);
                        if (v !== "" && !Number.isNaN(num) && effectiveQuote > 0 && num > effectiveQuote) {
                          setGrinderBid(String(effectiveQuote));
                          return;
                        }
                        setGrinderBid(v);
                      }
                    }}
                    className="bg-white/[0.04] border-white/10 h-11 min-h-11 sm:h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeInUp>
        </TabsContent>

        {/* Bundle tab — cart-style: select services, then expand to configure each */}
        <TabsContent value="bundle" className="mt-0 space-y-4">
          <FadeInUp delay={0.04}>
            <Card className="border-0 bg-white/[0.02] border border-white/[0.06]">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 text-primary">
                  <Package className="w-4 h-4 text-primary" />
                  BUNDLE ORDER
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground font-normal">Add services to your bundle, then expand each to configure. Combine Rep, Badges, Hot Zones, and more into one quote.</p>
              </CardHeader>
              <CardContent className="pt-2 sm:pt-4 space-y-6">
                {/* Services in bundle — shopping cart toggles */}
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-primary">Services in this bundle</p>
                  <p className="text-[11px] text-muted-foreground">Select which services to include. At least one required.</p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: "rep" as const, label: "Rep Grinding", icon: Zap },
                        { id: "badge" as const, label: "Badge Grinding", icon: Medal },
                        { id: "hotzones" as const, label: "Hot Zones", icon: Flame },
                      ] as const
                    ).map(({ id, label, icon: Icon }) => {
                      const included = bundleSelectedServices.includes(id);
                      return (
                        <Button
                          key={id}
                          type="button"
                          variant={included ? "default" : "outline"}
                          size="sm"
                          className={cn(
                            "gap-1.5",
                            included ? "bg-primary text-primary-foreground" : "border-white/20 hover:border-primary/40 hover:bg-primary/10"
                          )}
                          onClick={() => {
                            if (included && bundleSelectedServices.length <= 1) return;
                            setBundleSelectedServices((prev) =>
                              included ? prev.filter((s) => s !== id) : [...prev, id]
                            );
                          }}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                        </Button>
                      );
                    })}
                  </div>
                </div>

                {/* Cart summary + expandable config per service */}
                <div className="space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-primary">Configure each service</p>
                  <div className="space-y-2">
                    {bundleSelectedServices.includes("rep") && (
                      <Collapsible defaultOpen={bundleSelectedServices[0] === "rep"}>
                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                          <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-white/[0.04] transition-colors">
                            <span className="flex items-center gap-2 text-sm font-medium">
                              <Zap className="w-4 h-4 text-amber-400 shrink-0" />
                              Rep Grinding
                            </span>
                            <span className="text-sm text-primary font-semibold">
                              ${((Number(bundleCustomRepQuote) || 0) > 0 ? Number(bundleCustomRepQuote) : (results?.recommendedQuote ?? 0)).toLocaleString()}
                            </span>
                            <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="border-t border-white/[0.06] p-4 space-y-3">
                              <div className="space-y-1.5">
                                <Label className="text-xs">Start · {startTier} {startLvl}</Label>
                                <div className="flex gap-2 items-center">
                                  <Select value={startTier} onValueChange={setStartTier}>
                                    <SelectTrigger className="bg-white/[0.04] border-white/10 h-9 w-24 shrink-0">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TIERS.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Slider value={[startLvl]} onValueChange={([v]) => setStartLvl(v)} min={1} max={5} step={1} className="flex-1 py-2" />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <Label className="text-xs">Target · {targetTier} {targetLvl}</Label>
                                <div className="flex gap-2 items-center">
                                  <Select value={targetTier} onValueChange={setTargetTier}>
                                    <SelectTrigger className="bg-white/[0.04] border-white/10 h-9 w-24 shrink-0">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {TIERS.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Slider value={[targetLvl]} onValueChange={([v]) => setTargetLvl(v)} min={1} max={5} step={1} className="flex-1 py-2" />
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Start % · {Math.round(startPct)}</Label>
                                  <div className="flex gap-2 items-center">
                                    <Slider value={[Math.round(startPct)]} onValueChange={([v]) => { setStartPct(v); setStartPctInput(String(v)); }} min={0} max={100} step={1} className="flex-1 py-2" />
                                    <Input type="number" min={0} max={100} value={startPctInput} onChange={(e) => setStartPctInput(e.target.value)} onBlur={() => { const v = parsePct(startPctInput); setStartPct(v); setStartPctInput(String(v)); }} className="w-14 h-9 bg-white/[0.04] border-white/10 text-right text-xs shrink-0" />
                                  </div>
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Target % · {Math.round(targetPct)}</Label>
                                  <div className="flex gap-2 items-center">
                                    <Slider value={[Math.round(targetPct)]} onValueChange={([v]) => { setTargetPct(v); setTargetPctInput(String(v)); }} min={0} max={100} step={1} className="flex-1 py-2" />
                                    <Input type="number" min={0} max={100} value={targetPctInput} onChange={(e) => setTargetPctInput(e.target.value)} onBlur={() => { const v = parsePct(targetPctInput); setTargetPct(v); setTargetPctInput(String(v)); }} className="w-14 h-9 bg-white/[0.04] border-white/10 text-right text-xs shrink-0" />
                                  </div>
                                </div>
                              </div>
                              {results && (
                                <div className="text-[11px] px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-red-500/15 border border-white/10 w-full flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 pt-1">
                                  <span className="text-amber-400">AI LOW: <span className="text-amber-300/80">${formatUSD(results.aiLowQuote)}</span></span>
                                  <span className="text-emerald-400">AI MID: <span className="text-emerald-300/80">${formatUSD(results.aiSuggestedQuote)}</span></span>
                                  <span className="text-red-400">AI HIGH: <span className="text-red-300/80">${formatUSD(results.aiHighQuote)}</span></span>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    )}
                    {bundleSelectedServices.includes("badge") && (
                      <Collapsible defaultOpen={bundleSelectedServices[0] === "badge" && !bundleSelectedServices.includes("rep")}>
                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                          <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-white/[0.04] transition-colors">
                            <span className="flex items-center gap-2 text-sm font-medium">
                              <Medal className="w-4 h-4 text-pink-400 shrink-0" />
                              Badge Grinding
                            </span>
                            <span className="text-sm text-primary font-semibold">
                              ${((Number(bundleCustomBadgeQuote) || 0) > 0 ? Number(bundleCustomBadgeQuote) : (badgeResults?.recommendedQuote ?? 0)).toLocaleString()}
                            </span>
                            <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="border-t border-white/[0.06] p-4 space-y-4 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className="text-[10px] font-medium uppercase tracking-wider text-white/80">Badges</p>
                                <Button
                                  type="button"
                                  variant={badgeIds.length === ALL_BADGES.length ? "default" : "outline"}
                                  size="sm"
                                  className="h-7 text-[10px] shrink-0"
                                  onClick={() => setBadgeIds(badgeIds.length === ALL_BADGES.length ? [] : ALL_BADGES.map((b) => b.id))}
                                >
                                  Max Badges
                                </Button>
                              </div>
                              <div ref={badgeScrollRef} className="space-y-3 max-h-52 overflow-y-auto overflow-x-hidden overscroll-contain pr-1">
                                {BADGE_CATEGORIES.map((cat) => (
                                  <div key={cat} className="space-y-1.5">
                                    <div className="flex items-center justify-between gap-2 border-b border-white/[0.06] pb-1">
                                      <p className="text-[10px] font-medium uppercase tracking-wider text-white/80">{cat}</p>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const catIds = BADGES_BY_CATEGORY[cat].map((b) => b.id);
                                          setBadgeIds((prev) => {
                                            const hasAll = catIds.every((id) => prev.includes(id));
                                            if (hasAll) return prev.filter((id) => !catIds.includes(id));
                                            return [...new Set([...prev, ...catIds])];
                                          });
                                        }}
                                        className={cn(
                                          "text-[10px] font-medium rounded px-1.5 py-0.5 transition-colors",
                                          BADGES_BY_CATEGORY[cat].every((b) => badgeIds.includes(b.id))
                                            ? "bg-primary text-primary-foreground"
                                            : "text-primary hover:bg-primary/20 hover:underline"
                                        )}
                                      >
                                        All
                                      </button>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {BADGES_BY_CATEGORY[cat].map((b) => {
                                        const sel = badgeIds.includes(b.id);
                                        return (
                                          <button
                                            key={b.id}
                                            type="button"
                                            onClick={() => setBadgeIds((prev) => sel ? prev.filter((id) => id !== b.id) : [...prev, b.id])}
                                            className={cn(
                                              "px-2 py-1 rounded text-[10px] font-medium border transition-colors",
                                              sel ? (cat === "Shooting" ? "bg-[#1b5e20]/20 text-emerald-400 border-[#1b5e20]/40" : cat === "Playmaking" ? "bg-[#92400e]/20 text-amber-400 border-[#92400e]/40" : cat === "Finishing" ? "bg-[#1a237e]/20 text-indigo-400 border-[#1a237e]/40" : cat === "Defense" ? "bg-[#87050a]/20 text-red-400 border-[#87050a]/40" : cat === "Rebounding" ? "bg-purple-500/20 text-purple-400 border-purple-500/40" : "bg-slate-500/20 text-slate-400 border-slate-500/40") : "bg-white/[0.04] border-white/10 text-muted-foreground hover:border-white/20"
                                            )}
                                          >
                                            {b.name}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {badgeIds.length > 0 && <p className="text-[10px] text-muted-foreground">{badgeIds.length} badge{badgeIds.length !== 1 ? "s" : ""} selected</p>}
                              <div className="space-y-2 pt-1 border-t border-white/[0.06]">
                                <Label className="text-xs">MyPlayer Type</Label>
                                <div className="flex gap-2">
                                  {(["Non-Rebirth", "Rebirth"] as const).map((opt) => (
                                    <button
                                      key={opt}
                                      type="button"
                                      onClick={() => setMyPlayerType(opt)}
                                      className={cn(
                                        "px-3 py-2 rounded-lg text-xs font-medium border transition-colors",
                                        myPlayerType === opt ? "bg-primary/20 text-primary border-primary/40" : "bg-white/[0.04] border-white/10 hover:border-white/20"
                                      )}
                                    >
                                      {opt}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    )}
                    {bundleSelectedServices.includes("hotzones") && (
                      <Collapsible defaultOpen={bundleSelectedServices[bundleSelectedServices.length - 1] === "hotzones" && !bundleSelectedServices.includes("rep") && !bundleSelectedServices.includes("badge")}>
                        <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                          <CollapsibleTrigger className="flex w-full items-center justify-between gap-3 p-3 text-left hover:bg-white/[0.04] transition-colors">
                            <span className="flex items-center gap-2 text-sm font-medium">
                              <Flame className="w-4 h-4 text-orange-400 shrink-0" />
                              Hot Zones
                            </span>
                            <span className="text-sm text-primary font-semibold">
                              ${((Number(bundleCustomHotZonesQuote) || 0) > 0 ? Number(bundleCustomHotZonesQuote) : bundleHotZonesPrice).toLocaleString()}
                              {hotZoneIds.length > 0 && <span className="text-muted-foreground font-normal text-xs ml-1">({hotZoneIds.length} zone{hotZoneIds.length !== 1 ? "s" : ""})</span>}
                            </span>
                            <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="border-t border-white/[0.06] p-4 space-y-4">
                              <div className="flex flex-wrap gap-2">
                                <Button type="button" variant="outline" size="sm" className={cn("border", hotZoneIds.length === HOT_ZONE_IDS_ALL.length && HOT_ZONE_IDS_ALL.every((id) => hotZoneIds.includes(id)) ? "bg-primary text-primary-foreground border-primary" : "bg-white/[0.04] border-white/10")} onClick={() => { if (hotZoneIds.length === HOT_ZONE_IDS_ALL.length) setHotZoneIds([]); else setHotZoneIds([...HOT_ZONE_IDS_ALL]); }}>
                                  All-Around Court
                                </Button>
                                <Button type="button" variant="outline" size="sm" className={cn("border", hotZoneIds.length === HOT_ZONE_IDS_3PT.length && HOT_ZONE_IDS_3PT.every((id) => hotZoneIds.includes(id)) ? "bg-primary text-primary-foreground border-primary" : "bg-white/[0.04] border-white/10")} onClick={() => { if (hotZoneIds.length === HOT_ZONE_IDS_3PT.length && HOT_ZONE_IDS_3PT.every((id) => hotZoneIds.includes(id))) setHotZoneIds([]); else setHotZoneIds([...HOT_ZONE_IDS_3PT]); }}>
                                  3PT Zones
                                </Button>
                                <Button type="button" variant="outline" size="sm" className={cn("border", hotZoneIds.length === HOT_ZONE_IDS_MIDRANGE.length && HOT_ZONE_IDS_MIDRANGE.every((id) => hotZoneIds.includes(id)) ? "bg-primary text-primary-foreground border-primary" : "bg-white/[0.04] border-white/10")} onClick={() => { if (hotZoneIds.length === HOT_ZONE_IDS_MIDRANGE.length && HOT_ZONE_IDS_MIDRANGE.every((id) => hotZoneIds.includes(id))) setHotZoneIds([]); else setHotZoneIds([...HOT_ZONE_IDS_MIDRANGE]); }}>
                                  Mid-Range Zones
                                </Button>
                                <Button type="button" variant="outline" size="sm" className={cn("border", hotZoneIds.length === 0 ? "bg-primary text-primary-foreground border-primary" : "bg-white/[0.04] border-white/10")} onClick={() => setHotZoneIds([])}>
                                  Clear
                                </Button>
                              </div>
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                                <div className="min-h-[200px] flex flex-col items-center">
                                  <p className="text-xs text-muted-foreground mb-2">Click zones to select</p>
                                  <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid meet" className="w-full max-w-sm aspect-[400/240] rounded border border-white/10 bg-white/[0.02] cursor-pointer select-none">
                                    <rect x="0" y="0" width="400" height="240" fill={CHART_COURT_FILL} />
                                    <rect x="0" y="0" width="400" height="240" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                                    <path d={`M ${COURT_LEFT_X} ${COURT_CY} L ${COURT_CX - MID_R_OUTER} ${COURT_CY} A ${MID_R_OUTER} ${MID_R_OUTER} 0 0 1 ${COURT_CX + MID_R_OUTER} ${COURT_CY} L ${COURT_RIGHT_X} ${COURT_CY}`} fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="2" />
                                    <rect x={COURT_CX - PAINT_W / 2} y={0} width={PAINT_W} height={PAINT_H} fill="rgb(180,60,60)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                    <circle cx={COURT_CX} cy={PAINT_H} r={PAINT_R} fill="rgb(180,60,60)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                                    {HOT_ZONE_SVG.map(({ id, pathD }) => (
                                      <HotZonePath key={id} id={id} pathD={pathD} selected={hotZoneIds.includes(id)} onToggle={() => setHotZoneIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])} />
                                    ))}
                                  </svg>
                                </div>
                                <div className="space-y-2 min-w-0">
                                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">Selected zones</p>
                                  <ul className="flex flex-wrap gap-1.5">
                                    {resolvedHotZones.filter((z) => hotZoneIds.includes(z.id)).map((z) => (
                                      <li key={z.id}>
                                        <Badge variant="secondary" className="text-[10px] font-medium bg-white/10 border-white/10">
                                          {z.label} — ${z.price}
                                        </Badge>
                                      </li>
                                    ))}
                                  </ul>
                                  {hotZoneIds.length > 0 && (
                                    <p className="text-xs text-primary font-medium pt-1">
                                      Total: ${resolvedHotZones.filter((z) => hotZoneIds.includes(z.id)).reduce((sum, z) => sum + z.price, 0)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </div>
                      </Collapsible>
                    )}
                  </div>
                </div>

                <div className="space-y-1 pt-4 border-t border-white/[0.06]">
                  <p className="text-xs font-medium uppercase tracking-wider text-primary">Shared options</p>
                  <p className="text-[11px] text-muted-foreground">Urgency, discount, and customer apply to all services in the bundle.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Urgency</Label>
                    <div className="flex gap-2 flex-wrap">
                      {URGENCY_OPTIONS.map((u) => (
                        <button
                          key={u}
                          type="button"
                          onClick={() => setUrgency(u)}
                          className={cn(
                            "px-3 py-2 rounded-lg text-xs font-medium border transition-colors",
                            urgency === u && u === "Slow" && "bg-amber-500/20 text-amber-400 border-amber-500/40",
                            urgency === u && u === "Normal" && "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
                            urgency === u && u === "Rush" && "bg-red-500/20 text-red-400 border-red-500/40",
                            urgency !== u && "bg-white/[0.04] border-white/10 hover:border-white/20"
                          )}
                        >
                          {URGENCY_LABELS[u]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Discount % · {discountPct}</Label>
                    <Slider value={[discountPct]} onValueChange={([v]) => setDiscountPct(v)} min={0} max={100} step={1} className="py-3" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Customer <span className="text-destructive">*</span></Label>
                    <Input placeholder="Discord, Gamertag, or Name" value={customerIdentifier} onChange={(e) => setCustomerIdentifier(e.target.value)} className="bg-white/[0.04] border-white/10 h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Creator Code</Label>
                    <Select value={creatorCode || "_none"} onValueChange={(v) => setCreatorCode(v === "_none" ? "" : v)}>
                      <SelectTrigger className="bg-white/[0.04] border-white/10 h-9">
                        <SelectValue placeholder="None" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="_none">None</SelectItem>
                        {[...creatorsList].sort((a, b) => (a.code || "").localeCompare(b.code || "")).map((c) => (
                          <SelectItem key={c.id} value={(c.code || "").toUpperCase()}>{(c.code || "").toUpperCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1 pt-4 border-t border-white/[0.06]">
                  <p className="text-xs font-medium uppercase tracking-wider text-primary">Quote override (optional)</p>
                  <p className="text-[11px] text-muted-foreground">Override calculated values per service or use Custom Total / Custom Grinder Payout for the whole bundle.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bundleSelectedServices.includes("rep") && (
                    <div className="flex flex-col gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Custom Rep Quote ($)
                        </Label>
                        <Input type="text" inputMode="decimal" placeholder="Optional" value={bundleCustomRepQuote} onChange={(e) => { const v = e.target.value.replace(/\s/g, ""); if (v === "" || /^\d*\.?\d*$/.test(v)) setBundleCustomRepQuote(v); }} className="bg-white/[0.04] border-white/10 h-10" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" /> Custom Rep Grinder ($)
                        </Label>
                        <Input type="text" inputMode="decimal" placeholder="Optional" value={bundleCustomRepGrinder} onChange={(e) => { const v = e.target.value.replace(/\s/g, ""); if (v === "" || /^\d*\.?\d*$/.test(v)) { const num = parseFloat(v); const repQuote = (Number(bundleCustomRepQuote) || 0) > 0 ? Number(bundleCustomRepQuote) : (results?.recommendedQuote ?? 0); if (v !== "" && !Number.isNaN(num) && repQuote > 0 && num > repQuote) { setBundleCustomRepGrinder(String(repQuote)); return; } setBundleCustomRepGrinder(v); } }} className="bg-white/[0.04] border-white/10 h-10" />
                      </div>
                    </div>
                  )}
                  {bundleSelectedServices.includes("badge") && (
                    <div className="flex flex-col gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1.5">
                          <Medal className="w-3.5 h-3.5 text-pink-400 shrink-0" /> Custom Badge Quote ($)
                        </Label>
                        <Input type="text" inputMode="decimal" placeholder="Optional" value={bundleCustomBadgeQuote} onChange={(e) => { const v = e.target.value.replace(/\s/g, ""); if (v === "" || /^\d*\.?\d*$/.test(v)) setBundleCustomBadgeQuote(v); }} className="bg-white/[0.04] border-white/10 h-10" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1.5">
                          <Medal className="w-3.5 h-3.5 text-pink-400 shrink-0" /> Custom Badge Grinder ($)
                        </Label>
                        <Input type="text" inputMode="decimal" placeholder="Optional" value={bundleCustomBadgeGrinder} onChange={(e) => { const v = e.target.value.replace(/\s/g, ""); if (v === "" || /^\d*\.?\d*$/.test(v)) { const num = parseFloat(v); const badgeQuote = (Number(bundleCustomBadgeQuote) || 0) > 0 ? Number(bundleCustomBadgeQuote) : (badgeResults?.recommendedQuote ?? 0); if (v !== "" && !Number.isNaN(num) && badgeQuote > 0 && num > badgeQuote) { setBundleCustomBadgeGrinder(String(badgeQuote)); return; } setBundleCustomBadgeGrinder(v); } }} className="bg-white/[0.04] border-white/10 h-10" />
                      </div>
                    </div>
                  )}
                  {bundleSelectedServices.includes("hotzones") && (
                    <div className="flex flex-col gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" /> Custom Hot Zones Quote ($)
                        </Label>
                        <Input type="text" inputMode="decimal" placeholder="Optional" value={bundleCustomHotZonesQuote} onChange={(e) => { const v = e.target.value.replace(/\s/g, ""); if (v === "" || /^\d*\.?\d*$/.test(v)) setBundleCustomHotZonesQuote(v); }} className="bg-white/[0.04] border-white/10 h-10" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs flex items-center gap-1.5">
                          <Flame className="w-3.5 h-3.5 text-orange-400 shrink-0" /> Custom Hot Zones Grinder ($)
                        </Label>
                        <Input type="text" inputMode="decimal" placeholder="Optional" value={bundleCustomHotZonesGrinder} onChange={(e) => { const v = e.target.value.replace(/\s/g, ""); if (v === "" || /^\d*\.?\d*$/.test(v)) { const num = parseFloat(v); const hzQuote = (Number(bundleCustomHotZonesQuote) || 0) > 0 ? Number(bundleCustomHotZonesQuote) : bundleHotZonesPrice; if (v !== "" && !Number.isNaN(num) && hzQuote > 0 && num > hzQuote) { setBundleCustomHotZonesGrinder(String(hzQuote)); return; } setBundleCustomHotZonesGrinder(v); } }} className="bg-white/[0.04] border-white/10 h-10" />
                      </div>
                    </div>
                  )}
                  <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-primary shrink-0" /> Custom Total ($)
                      </Label>
                      <Input type="text" inputMode="decimal" placeholder="Override sum" value={chosenFinalQuote} onChange={(e) => { const v = e.target.value.replace(/\s/g, ""); if (v === "" || /^\d*\.?\d*$/.test(v)) setChosenFinalQuote(v); }} className="bg-white/[0.04] border-white/10 h-10" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-primary shrink-0" /> Custom Grinder Payout ($)
                      </Label>
                      <Input type="text" inputMode="decimal" placeholder="Override total grinder" value={bundleCustomTotalGrinder} onChange={(e) => { const v = e.target.value.replace(/\s/g, ""); if (v === "" || /^\d*\.?\d*$/.test(v)) { const num = parseFloat(v); if (v !== "" && !Number.isNaN(num) && customerPrice > 0 && num > customerPrice) { setBundleCustomTotalGrinder(String(customerPrice)); return; } setBundleCustomTotalGrinder(v); } }} className="bg-white/[0.04] border-white/10 h-10" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </FadeInUp>
        </TabsContent>

        {/* Hot Zones tab */}
        <TabsContent value="hotzones" className="mt-0 space-y-4">
          <FadeInUp>
            <Card className="border-0 bg-white/[0.02] border border-white/[0.06]">
              <CardHeader className="pb-4 sm:pb-6">
                <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 text-primary">
                  <Flame className="w-4 h-4 text-primary" />
                  HOT ZONES
                </CardTitle>
                <p className="text-xs sm:text-sm text-muted-foreground font-normal">Select the hot zone(s) the customer is purchasing. Paint areas are not selectable.</p>
              </CardHeader>
              <CardContent className="pt-2 sm:pt-4 space-y-6">
                <div className="space-y-6">
                {/* Quick select by category */}
                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
                  {(() => {
                    const ids = hotZoneIds;
                    const isAll = ids.length === HOT_ZONE_IDS_ALL.length && HOT_ZONE_IDS_ALL.every((id) => ids.includes(id));
                    const is3pt = ids.length === HOT_ZONE_IDS_3PT.length && HOT_ZONE_IDS_3PT.every((id) => ids.includes(id));
                    const isMid = ids.length === HOT_ZONE_IDS_MIDRANGE.length && HOT_ZONE_IDS_MIDRANGE.every((id) => ids.includes(id));
                    const isClear = ids.length === 0;
                    return (
                      <>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            "border",
                            isAll ? "bg-primary text-primary-foreground border-primary" : "bg-white/[0.04] border-white/10"
                          )}
                          onClick={() => {
                            if (isAll) setHotZoneIds([]);
                            else setHotZoneIds(HOT_ZONE_IDS_ALL);
                          }}
                        >
                          All-Around Court
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            "border",
                            is3pt ? "bg-primary text-primary-foreground border-primary" : "bg-white/[0.04] border-white/10"
                          )}
                          onClick={() => {
                            if (is3pt) setHotZoneIds([]);
                            else setHotZoneIds(HOT_ZONE_IDS_3PT);
                          }}
                        >
                          3PT Zones
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            "border",
                            isMid ? "bg-primary text-primary-foreground border-primary" : "bg-white/[0.04] border-white/10"
                          )}
                          onClick={() => {
                            if (isMid) setHotZoneIds([]);
                            else setHotZoneIds(HOT_ZONE_IDS_MIDRANGE);
                          }}
                        >
                          Mid-Range Zones
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={cn(
                            "border",
                            isClear ? "bg-primary text-primary-foreground border-primary" : "bg-white/[0.04] border-white/10"
                          )}
                          onClick={() => setHotZoneIds([])}
                        >
                          Clear
                        </Button>
                      </>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                  {/* Shot chart SVG */}
                  <div className="flex flex-col items-center min-h-0 h-full min-h-[min(320px,55vh)] lg:min-h-0">
                    <p className="text-xs text-muted-foreground mb-2 shrink-0">Click zones to select</p>
                    <div className="flex-1 min-h-0 w-full flex flex-col items-center justify-center min-h-[260px] lg:min-h-0">
                      <svg
                        viewBox="0 0 400 240"
                        preserveAspectRatio="xMidYMid meet"
                        className="h-full w-auto max-w-full aspect-[400/240] rounded border border-white/10 bg-white/[0.02] cursor-pointer select-none touch-none"
                      >
                      {/* Court outline */}
                      <rect x="0" y="0" width="400" height="240" fill={CHART_COURT_FILL} />
                      <rect x="0" y="0" width="400" height="240" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />
                      {/* 3PT line: straight segments from sidelines to arc, then semicircular arc (basket at top, arc bulges down) */}
                      <path
                        d={`M ${COURT_LEFT_X} ${COURT_CY} L ${COURT_CX - MID_R_OUTER} ${COURT_CY} A ${MID_R_OUTER} ${MID_R_OUTER} 0 0 1 ${COURT_CX + MID_R_OUTER} ${COURT_CY} L ${COURT_RIGHT_X} ${COURT_CY}`}
                        fill="none"
                        stroke="rgba(255,255,255,0.25)"
                        strokeWidth="2"
                      />
                      {/* Paint: key rectangle + FT circle */}
                      <rect
                        x={COURT_CX - PAINT_W / 2}
                        y={0}
                        width={PAINT_W}
                        height={PAINT_H}
                        fill="rgb(180,60,60)"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="1"
                      />
                      <circle
                        cx={COURT_CX}
                        cy={PAINT_H}
                        r={PAINT_R}
                        fill="rgb(180,60,60)"
                        stroke="rgba(255,255,255,0.15)"
                        strokeWidth="1"
                      />
                      {/* Selectable zone paths */}
                      {HOT_ZONE_SVG.map(({ id, pathD }) => (
                        <HotZonePath
                          key={id}
                          id={id}
                          pathD={pathD}
                          selected={hotZoneIds.includes(id)}
                          onToggle={() => {
                            setHotZoneIds((prev) =>
                              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                            );
                          }}
                        />
                      ))}
                    </svg>
                    </div>
                  </div>

                  {/* Zone list with toggles */}
                  <div className="space-y-3">
                    <p className="text-xs font-medium uppercase tracking-wider text-primary">Hot zones</p>
                    <div className="space-y-1 rounded-md border border-white/10 bg-white/[0.02] divide-y divide-white/5">
                      {resolvedHotZones.map((zone) => (
                        <HotZoneRow
                          key={zone.id}
                          zone={zone}
                          selected={hotZoneIds.includes(zone.id)}
                          onToggle={(checked) =>
                            setHotZoneIds((prev) =>
                              checked ? [...prev, zone.id] : prev.filter((x) => x !== zone.id)
                            )
                          }
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground pt-1">
                      Total: ${resolvedHotZones.filter((z) => hotZoneIds.includes(z.id)).reduce((sum, z) => sum + z.price, 0)}
                    </p>
                  </div>
                </div>
                </div>

                {/* Pricing & options — shared customer/urgency/discount for hot zones quote */}
                <FadeInUp>
                  <Card className="border-0 bg-white/[0.02] border border-white/[0.06]">
                    <CardContent className="pt-4 pb-4 sm:pt-6 sm:pb-6 space-y-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-primary">Pricing & options</p>
                      <p className="text-[11px] text-muted-foreground">Customer and options for this Hot Zones quote.</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className="space-y-2">
                          <Label className="text-xs">Urgency</Label>
                          <div className="flex gap-2 flex-wrap">
                            {URGENCY_OPTIONS.map((u) => (
                              <button
                                key={u}
                                type="button"
                                onClick={() => setUrgency(u)}
                                className={cn(
                                  "px-4 py-3 min-h-11 rounded-lg text-sm font-medium border transition-colors touch-manipulation",
                                  urgency === u && u === "Slow" && "bg-amber-500/20 text-amber-400 border-amber-500/40",
                                  urgency === u && u === "Normal" && "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
                                  urgency === u && u === "Rush" && "bg-red-500/20 text-red-400 border-red-500/40",
                                  urgency !== u && "bg-white/[0.04] border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
                                )}
                              >
                                {URGENCY_LABELS[u]}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Discount % · {discountPct}</Label>
                          <Slider value={[discountPct]} onValueChange={([v]) => setDiscountPct(v)} min={0} max={100} step={1} className="py-3" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Customer <span className="text-destructive">*</span></Label>
                          <Input placeholder="Discord, Gamertag, or Name" value={customerIdentifier} onChange={(e) => setCustomerIdentifier(e.target.value)} className="bg-white/[0.04] border-white/10 h-9" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Creator Code</Label>
                          <Select value={creatorCode || "_none"} onValueChange={(v) => setCreatorCode(v === "_none" ? "" : v)}>
                            <SelectTrigger className="bg-white/[0.04] border-white/10 h-9">
                              <SelectValue placeholder="None" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="_none">None</SelectItem>
                              {[...creatorsList].sort((a, b) => (a.code || "").localeCompare(b.code || "")).map((c) => (
                                <SelectItem key={c.id} value={(c.code || "").toUpperCase()}>{(c.code || "").toUpperCase()}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-1 pt-4 border-t border-white/[0.06]">
                        <p className="text-xs font-medium uppercase tracking-wider text-primary">Quote override (optional)</p>
                        <p className="text-[11px] text-muted-foreground">Override the total and grinder payout for this Hot Zones quote.</p>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <Label className="text-xs">Custom Quote ($)</Label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="Optional"
                            value={chosenFinalQuote}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\s/g, "");
                              if (v === "" || /^\d*\.?\d*$/.test(v)) setChosenFinalQuote(v);
                            }}
                            className="bg-white/[0.04] border-white/10 h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs">Custom Grinder Payout ($)</Label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="Optional"
                            value={grinderBid}
                            onChange={(e) => {
                              const v = e.target.value.replace(/\s/g, "");
                              if (v === "" || /^\d*\.?\d*$/.test(v)) setGrinderBid(v);
                            }}
                            className="bg-white/[0.04] border-white/10 h-10"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </FadeInUp>
              </CardContent>
            </Card>
          </FadeInUp>
        </TabsContent>
        </Tabs>

        {((quoteGeneratorTab === "rep" && results) || (quoteGeneratorTab === "badge" && badgeResults) || (quoteGeneratorTab === "bundle" && bundleSelectedServices.length > 0 && (!bundleSelectedServices.includes("rep") || results) && (!bundleSelectedServices.includes("badge") || badgeResults)) || quoteGeneratorTab === "hotzones") && (
          <>
            {/* KPI row — quotes */}
            <FadeInUp delay={0.06}>
              <div
                className={cn(
                  "grid grid-cols-2 gap-2 sm:gap-4 transition-opacity min-w-0",
                  quoteGeneratorTab === "rep" && "sm:grid-cols-2 lg:grid-cols-4",
                  quoteGeneratorTab === "badge" && "sm:grid-cols-2 lg:grid-cols-3",
                  quoteGeneratorTab === "bundle" && "grid-cols-1",
                  quoteGeneratorTab === "hotzones" && "grid-cols-1 sm:grid-cols-3",
                  ((chosenFinalQuote && Number(chosenFinalQuote) > 0 && quoteGeneratorTab !== "bundle") || (quoteGeneratorTab === "bundle" && ((Number(bundleCustomRepQuote) || 0) > 0 || (Number(bundleCustomBadgeQuote) || 0) > 0 || (Number(bundleCustomHotZonesQuote) || 0) > 0))) && "opacity-40"
                )}
              >
                {quoteGeneratorTab === "bundle" && bundleSelectedServices.length > 0 && (!bundleSelectedServices.includes("rep") || results) && (!bundleSelectedServices.includes("badge") || badgeResults) ? (
                  <Card className="border-0 overflow-hidden col-span-2 bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/10">
                    <CardContent className="p-3 sm:p-4 relative z-10 min-w-0 overflow-hidden">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 min-w-0">
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">Total Quote</p>
                          <p className="text-2xl sm:text-4xl font-bold tracking-tight text-primary mt-0.5 truncate">${customerPrice.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {(Number(chosenFinalQuote) || 0) > 0 ? (
                              <>Custom Total (${Number(chosenFinalQuote).toLocaleString()})</>
                            ) : (
                              <>
                                {bundleSelectedServices.includes("rep") && (
                                  <>Rep ${((Number(bundleCustomRepQuote) || 0) > 0 ? Number(bundleCustomRepQuote) : (results?.recommendedQuote ?? 0)).toLocaleString()}</>
                                )}
                                {bundleSelectedServices.includes("rep") && bundleSelectedServices.includes("badge") && <span className="text-muted-foreground/60 mx-1">+</span>}
                                {bundleSelectedServices.includes("badge") && (
                                  <>Badges ${((Number(bundleCustomBadgeQuote) || 0) > 0 ? Number(bundleCustomBadgeQuote) : (badgeResults?.recommendedQuote ?? 0)).toLocaleString()}</>
                                )}
                                {(bundleSelectedServices.includes("rep") || bundleSelectedServices.includes("badge")) && bundleSelectedServices.includes("hotzones") && <span className="text-muted-foreground/60 mx-1">+</span>}
                                {bundleSelectedServices.includes("hotzones") && (
                                  <>Hot Zones ${((Number(bundleCustomHotZonesQuote) || 0) > 0 ? Number(bundleCustomHotZonesQuote) : bundleHotZonesPrice).toLocaleString()}</>
                                )}
                                {(bundleCustomRepQuote || bundleCustomBadgeQuote || bundleCustomHotZonesQuote) ? (
                                  <span className="text-primary/70 ml-1">(Custom)</span>
                                ) : null}
                              </>
                            )}
                          </p>
                        </div>
                        {bundleSelectedServices.includes("rep") && results && (
                          <div className="shrink-0 min-w-0">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-white/70 mb-1">Rep benchmarks</p>
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-sm">
                              <span className="text-pink-400/90">Mkt ${results.marketQuote.toLocaleString()}</span>
                              <span className="text-white/40">·</span>
                              <span className="text-blue-400/90">AI ${results.aiSuggestedQuote.toLocaleString()}</span>
                              <span className="text-white/40">·</span>
                              <Badge className={cn("text-sm font-semibold border shrink-0 px-3 py-1", results.marketVsAiGrade === "STRONG" && "border-emerald-500/50 text-emerald-400 bg-emerald-500/20", results.marketVsAiGrade === "ACCEPTABLE" && "border-amber-500/50 text-amber-400 bg-amber-500/20", results.marketVsAiGrade === "RISKY" && "border-red-500/50 text-red-400 bg-red-500/20")}>
                                Mkt vs AI: {results.marketVsAiGrade}
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ) : quoteGeneratorTab === "rep" && results ? (
                  <>
                    <QuoteKpiCard
                      label="Market Suggestion"
                      value={`$${((quoteSource === "budget" || repBudgetSuggestionApplied) && repBudgetQuoteResults ? repBudgetQuoteResults.marketQuote : results.marketQuote).toLocaleString()}`}
                      subtitle={(quoteSource === "budget" || repBudgetSuggestionApplied) && repBudgetQuoteResults ? "Budget target market" : "Community value"}
                      icon={BarChart2}
                      gradient="bg-gradient-to-br from-pink-500/15 via-pink-500/5 to-transparent border border-pink-500/10"
                      iconBg="bg-pink-500/20"
                      textColor="text-pink-400"
                    />
                    <QuoteKpiCard
                      label="AI Suggestion"
                      value={`$${((quoteSource === "budget" || repBudgetSuggestionApplied) && repBudgetQuoteResults ? repBudgetQuoteResults.aiSuggestedQuote : results.aiSuggestedQuote).toLocaleString()}`}
                      subtitle={(quoteSource === "budget" || repBudgetSuggestionApplied) && repBudgetQuoteResults ? "Budget target AI" : (urgency !== "Normal" ? `${URGENCY_LABELS[urgency]} applied` : "Our value applied")}
                      icon={Bot}
                      gradient="bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent border border-blue-500/10"
                      iconBg="bg-blue-500/20"
                      textColor="text-blue-400"
                    />
                    <QuoteKpiCard
                      label={quoteSource === "budget" && repBudgetSuggestion ? "Budget Quote" : "Recommended Quote"}
                      value={`$${((quoteSource === "budget" && repBudgetSuggestion) ? repBudgetSuggestion.suggestedQuote : results.recommendedQuote).toLocaleString()}`}
                      subtitle={
                        quoteSource === "budget" && repBudgetSuggestion
                          ? `${repBudgetSuggestion.suggestedTier} ${repBudgetSuggestion.suggestedLvl} · ${repBudgetSuggestion.suggestedPct}%`
                          : results.recommendedQuote === results.marketQuote
                            ? "Market suggestion"
                            : results.recommendedQuote === results.aiSuggestedQuote
                              ? "AI suggestion"
                              : "Use this quote"
                      }
                      icon={Calculator}
                      gradient="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/10"
                      iconBg="bg-primary/20"
                      textColor="text-primary"
                      borderFlash
                    />
                    <Card className={cn("border-0 overflow-hidden relative group sm:hover:scale-[1.02] transition-transform duration-300 shrink-0", results.marketVsAiGrade === "STRONG" && "bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/20", results.marketVsAiGrade === "ACCEPTABLE" && "bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/20", results.marketVsAiGrade === "RISKY" && "bg-gradient-to-br from-red-500/15 via-red-500/5 to-transparent border border-red-500/20")}>
                      <CardContent className="p-3 sm:p-4 relative z-10">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">Market vs AI</p>
                        <Badge className={cn("text-sm font-semibold border shrink-0 w-fit mt-1", results.marketVsAiGrade === "STRONG" && "border-emerald-500/50 text-emerald-400 bg-emerald-500/20", results.marketVsAiGrade === "ACCEPTABLE" && "border-amber-500/50 text-amber-400 bg-amber-500/20", results.marketVsAiGrade === "RISKY" && "border-red-500/50 text-red-400 bg-red-500/20")}>{results.marketVsAiGrade}</Badge>
                        <p className="text-[10px] text-white/40 mt-0.5">{Math.abs(results.marketVsAiDiff * 100).toFixed(1)}% {results.marketVsAiDiff >= 0 ? "AI above market" : "AI below market"}</p>
                      </CardContent>
                    </Card>
                  </>
                ) : quoteGeneratorTab === "hotzones" ? (
                  <>
                    <QuoteKpiCard label="Hot Zones Total" value={`$${customerPrice.toLocaleString()}`} subtitle={(Number(chosenFinalQuote) || 0) > 0 ? "Custom quote" : `${hotZoneIds.length} zone${hotZoneIds.length !== 1 ? "s" : ""} selected`} icon={Flame} gradient="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/10" iconBg="bg-primary/20" textColor="text-primary" borderFlash />
                    <QuoteKpiCard label="Zones" value={String(hotZoneIds.length)} subtitle="Hot zones in quote" icon={DollarSign} gradient="bg-gradient-to-br from-pink-500/15 via-pink-500/5 to-transparent border border-pink-500/10" iconBg="bg-pink-500/20" textColor="text-pink-400" />
                    <QuoteKpiCard label="Delivery" value={hotZonesTimeframeText} subtitle={`${hotZonesMinDays}–${hotZonesMaxDays} days`} icon={Clock} gradient="bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent border border-blue-500/10" iconBg="bg-blue-500/20" textColor="text-blue-400" />
                  </>
                ) : badgeResults ? (
                  <>
                    <QuoteKpiCard label="Recommended Quote" value={`$${badgeResults.recommendedQuote.toLocaleString()}`} subtitle="Badge total" icon={Calculator} gradient="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/10" iconBg="bg-primary/20" textColor="text-primary" borderFlash />
                    <QuoteKpiCard label="Badges" value={String(badgeIds.length)} subtitle="In quote" icon={Medal} gradient="bg-gradient-to-br from-pink-500/15 via-pink-500/5 to-transparent border border-pink-500/10" iconBg="bg-pink-500/20" textColor="text-pink-400" />
                    <QuoteKpiCard label="Delivery" value={badgeResults.timeframeText} subtitle="Estimated days" icon={Clock} gradient="bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent border border-blue-500/10" iconBg="bg-blue-500/20" textColor="text-blue-400" />
                  </>
                ) : null}
              </div>
            </FadeInUp>

            {/* KPI row — payout */}
            <FadeInUp delay={0.08}>
              {(() => {
                const bundleRepPrice = (Number(bundleCustomRepQuote) || 0) > 0 ? Number(bundleCustomRepQuote) : (results?.recommendedQuote ?? 0);
                const bundleBadgePrice = (Number(bundleCustomBadgeQuote) || 0) > 0 ? Number(bundleCustomBadgeQuote) : (badgeResults?.recommendedQuote ?? 0);
                const bundleHotZonesPriceLine = (Number(bundleCustomHotZonesQuote) || 0) > 0 ? Number(bundleCustomHotZonesQuote) : bundleHotZonesPrice;
                const bundleTotalQuote = (bundleSelectedServices.includes("rep") ? bundleRepPrice : 0) + (bundleSelectedServices.includes("badge") ? bundleBadgePrice : 0) + (bundleSelectedServices.includes("hotzones") ? bundleHotZonesPriceLine : 0);
                const bundleTotalGrinderOverride = Number(bundleCustomTotalGrinder) || 0;
                const bundleUsingQuoteOverride = quoteGeneratorTab === "bundle" && (Number(chosenFinalQuote) || 0) > 0;
                const bundleUsingGrinderOverride = quoteGeneratorTab === "bundle" && bundleTotalGrinderOverride > 0;
                const bundleHasData = quoteGeneratorTab === "bundle" && bundleSelectedServices.length > 0 && (!bundleSelectedServices.includes("rep") || results) && (!bundleSelectedServices.includes("badge") || badgeResults);
                const bundlePayoutFromOverrides = bundleHasData && (bundleUsingQuoteOverride || bundleUsingGrinderOverride);
                const r = bundleHasData
                  ? (() => {
                      const creatorRate = (creatorCode && (creatorDiscountPercentForCode ?? 0) > 0) ? (creatorDiscountPercentForCode ?? 0) : 0;
                      const creatorTotal = (bundleSelectedServices.includes("rep") ? (results?.creatorCommission ?? 0) : 0)
                        + (bundleSelectedServices.includes("badge") ? (badgeResults?.creatorCommission ?? 0) : 0)
                        + (bundleSelectedServices.includes("hotzones") ? bundleHotZonesPriceLine * defaultCompanyPct * creatorRate : 0);
                      const grinderFromCalc = (bundleSelectedServices.includes("rep") ? (results?.grinderPayout ?? 0) : 0)
                        + (bundleSelectedServices.includes("badge") ? (badgeResults?.grinderPayout ?? 0) : 0)
                        + (bundleSelectedServices.includes("hotzones") ? (Number(bundleCustomHotZonesGrinder) || 0) > 0 ? Number(bundleCustomHotZonesGrinder) : bundleHotZonesPriceLine * defaultGrinderPct : 0);
                      const grinderTotal = bundleTotalGrinderOverride > 0 ? bundleTotalGrinderOverride : grinderFromCalc;
                      const companyFromCalc = (bundleSelectedServices.includes("rep") ? (results?.companyPayout ?? 0) : 0)
                        + (bundleSelectedServices.includes("badge") ? (badgeResults?.companyPayout ?? 0) : 0)
                        + (bundleSelectedServices.includes("hotzones") ? Math.max(0, bundleHotZonesPriceLine * defaultCompanyPct * (1 - creatorRate)) : 0);
                      let companyPayout: number;
                      let grinderPayout: number;
                      let creatorCommission: number;
                      let companyPct: number;
                      let grinderPct: number;
                      let creatorPct: number;
                      if (bundlePayoutFromOverrides && payoutBaseQuote > 0) {
                        if (bundleTotalGrinderOverride > 0) {
                          const effectiveGrinder = bundleTotalGrinderOverride;
                          grinderPayout = effectiveGrinder;
                          const maxCreator = Math.max(0, payoutBaseQuote - grinderPayout);
                          creatorCommission = Math.min(creatorTotal, maxCreator);
                          companyPayout = Math.max(0, payoutBaseQuote - grinderPayout - creatorCommission);
                          companyPct = companyPayout / payoutBaseQuote;
                          grinderPct = grinderPayout / payoutBaseQuote;
                          creatorPct = creatorCommission / payoutBaseQuote;
                        } else {
                          grinderPayout = payoutBaseQuote * defaultGrinderPct;
                          const companyGross = payoutBaseQuote * defaultCompanyPct;
                          creatorCommission = companyGross * creatorRate;
                          companyPayout = Math.max(0, companyGross - creatorCommission);
                          creatorPct = payoutBaseQuote > 0 ? creatorCommission / payoutBaseQuote : 0;
                          companyPct = companyPayout / payoutBaseQuote;
                          grinderPct = grinderPayout / payoutBaseQuote;
                        }
                      } else {
                        companyPayout = companyFromCalc;
                        grinderPayout = grinderTotal;
                        creatorCommission = creatorTotal;
                        companyPct = payoutBaseQuote > 0 ? companyFromCalc / payoutBaseQuote : 0;
                        grinderPct = payoutBaseQuote > 0 ? grinderTotal / payoutBaseQuote : 0;
                        creatorPct = payoutBaseQuote > 0 ? creatorTotal / payoutBaseQuote : 0;
                      }
                      const profitMarginFromPct: "GREEN" | "YELLOW" | "RED" | null =
                        payoutBaseQuote > 0
                          ? companyPct < 0.3
                            ? "RED"
                            : companyPct < 0.4
                              ? "YELLOW"
                              : "GREEN"
                          : (results?.profitMargin === "RED" || badgeResults?.profitMargin === "RED")
                            ? "RED"
                            : (results?.profitMargin === "YELLOW" || badgeResults?.profitMargin === "YELLOW")
                              ? "YELLOW"
                              : results?.profitMargin ?? badgeResults?.profitMargin ?? null;
                      return {
                        companyPayout,
                        grinderPayout,
                        creatorCommission,
                        companyPct,
                        grinderPct,
                        creatorPct,
                        grinderBidAboveDefault: (results?.grinderBidAboveDefault ?? false) || (badgeResults?.grinderBidAboveDefault ?? false),
                        profitMargin: profitMarginFromPct,
                      };
                    })()
                  : quoteGeneratorTab === "hotzones"
                    ? buildPayoutFromQuote(payoutBaseQuote, Number(grinderBid) || 0)
                  : quoteGeneratorTab === "rep" || quoteGeneratorTab === "badge"
                    ? buildPayoutFromQuote(payoutBaseQuote, Number(grinderBid) || 0)
                    : (quoteGeneratorTab === "rep" ? results : badgeResults)!;
                const chosenNum = Number(chosenFinalQuote) || 0;
                const grinderNum = Number(grinderBid) || 0;
                const bundleRepCustom = quoteGeneratorTab === "bundle" && (Number(bundleCustomRepQuote) || 0) > 0;
                const bundleBadgeCustom = quoteGeneratorTab === "bundle" && (Number(bundleCustomBadgeQuote) || 0) > 0;
                const bundleHotZonesCustom = quoteGeneratorTab === "bundle" && bundleSelectedServices.includes("hotzones") && (Number(bundleCustomHotZonesQuote) || 0) > 0;
                const bundleRepGrinderCustom = quoteGeneratorTab === "bundle" && (Number(bundleCustomRepGrinder) || 0) > 0;
                const bundleBadgeGrinderCustom = quoteGeneratorTab === "bundle" && (Number(bundleCustomBadgeGrinder) || 0) > 0;
                const bundleHotZonesGrinderCustom = quoteGeneratorTab === "bundle" && bundleSelectedServices.includes("hotzones") && (Number(bundleCustomHotZonesGrinder) || 0) > 0;
                const bundleTotalGrinderCustom = quoteGeneratorTab === "bundle" && bundleTotalGrinderOverride > 0;
                const hasOverride = chosenNum > 0 || grinderNum > 0 || bundleRepCustom || bundleBadgeCustom || bundleHotZonesCustom || bundleRepGrinderCustom || bundleBadgeGrinderCustom || bundleHotZonesGrinderCustom || bundleTotalGrinderCustom;
                const overrideParts = [
                  chosenNum > 0 ? (quoteGeneratorTab === "bundle" ? `Custom Total ($${formatUSD(chosenNum)})` : `Custom Quote ($${formatUSD(chosenNum)})`) : null,
                  bundleTotalGrinderCustom ? `Custom Grinder Payout ($${formatUSD(bundleTotalGrinderOverride)})` : null,
                  bundleRepCustom ? `Custom Rep ($${formatUSD(Number(bundleCustomRepQuote))})` : null,
                  bundleBadgeCustom ? `Custom Badge ($${formatUSD(Number(bundleCustomBadgeQuote))})` : null,
                  bundleHotZonesCustom ? `Custom Hot Zones ($${formatUSD(Number(bundleCustomHotZonesQuote))})` : null,
                  bundleRepGrinderCustom ? `Rep Grinder ($${formatUSD(Number(bundleCustomRepGrinder))})` : null,
                  bundleBadgeGrinderCustom ? `Badge Grinder ($${formatUSD(Number(bundleCustomBadgeGrinder))})` : null,
                  bundleHotZonesGrinderCustom ? `Hot Zones Grinder ($${formatUSD(Number(bundleCustomHotZonesGrinder))})` : null,
                  grinderNum > 0 && quoteGeneratorTab !== "bundle" ? `Grinder Payout ($${formatUSD(grinderNum)})` : null,
                ].filter(Boolean);
                const allFourBundle = quoteGeneratorTab === "bundle" && bundleRepCustom && bundleBadgeCustom && bundleRepGrinderCustom && bundleBadgeGrinderCustom && !chosenNum;
                const overrideLabel = hasOverride
                  ? allFourBundle
                    ? `Rep $${formatUSD(Number(bundleCustomRepQuote))} · R-Grind $${formatUSD(Number(bundleCustomRepGrinder))} · Badge $${formatUSD(Number(bundleCustomBadgeQuote))} · B-Grind $${formatUSD(Number(bundleCustomBadgeGrinder))}`
                    : overrideParts.join(" · ")
                  : null;
                const overrideIndicator = hasOverride ? (
                  quoteGeneratorTab === "bundle" ? (
                    allFourBundle ? (
                      <>
                        With{" "}
                        <span className="text-white">Rep ${formatUSD(Number(bundleCustomRepQuote))}</span>
                        {" · "}
                        <span className="text-white/50">R-Grind ${formatUSD(Number(bundleCustomRepGrinder))}</span>
                        {" · "}
                        <span className="text-white">Badge ${formatUSD(Number(bundleCustomBadgeQuote))}</span>
                        {" · "}
                        <span className="text-white/50">B-Grind ${formatUSD(Number(bundleCustomBadgeGrinder))}</span>
                      </>
                    ) : (
                      <>
                        With{" "}
                        {overrideParts.map((p, i) => (
                          <span key={i}>
                            {(p?.includes("Grinder") ?? false) ? (
                              <span className="text-white/50">{p}</span>
                            ) : (
                              <span className="text-white">{p}</span>
                            )}
                            {i < overrideParts.length - 1 && " · "}
                          </span>
                        ))}
                      </>
                    )
                  ) : (
                    <>
                      With {chosenNum > 0 && <>Custom Quote ({"$" + formatUSD(chosenNum)})</>}
                      {chosenNum > 0 && grinderNum > 0 && <> · </>}
                      {grinderNum > 0 && <span className="text-white/50">Grinder Payout ({"$" + formatUSD(grinderNum)})</span>}
                    </>
                  )
                ) : undefined;
                return (
                  <>
                    {overrideLabel && (
                      <p className="text-xs font-bold text-white italic mb-2">
                        {quoteGeneratorTab === "bundle" ? "Payouts based on: Custom Quote Override" : `Payouts based on: ${overrideLabel}`}
                      </p>
                    )}
                    {(quoteGeneratorTab === "bundle" ? (
                      <Card className={cn(
                        "border-0 overflow-hidden",
                        r.profitMargin === "GREEN" && "bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/10",
                        r.profitMargin === "YELLOW" && "bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/10",
                        r.profitMargin === "RED" && "bg-gradient-to-br from-red-500/15 via-red-500/5 to-transparent border border-red-500/10",
                        !r.profitMargin && "bg-white/[0.03] border border-white/[0.08]"
                      )}>
                        <CardContent className="p-3 sm:p-4 relative z-10 min-w-0 overflow-hidden">
                          <div className="flex flex-col gap-3 sm:gap-4 min-w-0">
                            <div className="flex flex-wrap gap-x-4 gap-y-2 sm:gap-x-6 sm:gap-y-0 sm:items-center sm:justify-between min-w-0">
                              <div className="flex flex-wrap gap-x-4 gap-y-1 sm:gap-x-6 min-w-0">
                                <div>
                                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">Company</p>
                                  <p className="text-base sm:text-lg font-bold text-white mt-0.5">${formatUSD(r.companyPayout)}</p>
                                  <p className="text-[10px] text-white/50">{(r.companyPct * 100).toFixed(0)}%</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">Grinder</p>
                                  <p className="text-base sm:text-lg font-bold text-purple-400 mt-0.5">${formatUSD(r.grinderPayout)}</p>
                                  <p className="text-[10px] text-white/50">{(r.grinderPct * 100).toFixed(0)}%</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">Creator</p>
                                  <p className="text-base sm:text-lg font-bold text-emerald-400 mt-0.5">${formatUSD(r.creatorCommission)}</p>
                                  <p className="text-[10px] text-white/50">{creatorCode && r.creatorPct > 0 ? `${(r.creatorPct * 100).toFixed(0)}%` : "—"}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Badge className={cn("text-sm font-semibold border px-3 py-1", r.profitMargin === "GREEN" && "border-emerald-500/50 text-emerald-400 bg-emerald-500/20", r.profitMargin === "YELLOW" && "border-amber-500/50 text-amber-400 bg-amber-500/20", r.profitMargin === "RED" && "border-red-500/50 text-red-400 bg-red-500/20", !r.profitMargin && "border-white/30 text-white/80 bg-white/10")}>
                                  Profit Margin: {(r.companyPct * 100).toFixed(1)}%
                                </Badge>
                                {r.grinderBidAboveDefault && !(quoteGeneratorTab === "bundle" && bundleTotalGrinderOverride > 0) && (
                                  <span className={cn("text-[10px] flex items-center gap-1", r.profitMargin === "RED" ? "text-red-400" : "text-amber-300")}>
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    {r.profitMargin === "RED"
                                      ? "Grinder bid above profit margin"
                                      : `Grinder bid above ${Math.round(defaultGrinderPct * 100)}%`}
                                  </span>
                                )}
                              </div>
                            </div>
                            {overrideIndicator && (
                              <p className="text-[10px] text-white/70 italic pt-2 border-t border-white/[0.06]">
                                {overrideIndicator}
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 sm:gap-4 lg:grid-cols-4 min-w-0">
                      <QuoteKpiCard
                        label="Company Payout"
                        value={`$${formatUSD(r.companyPayout)}`}
                        subtitle={`${(r.companyPct * 100).toFixed(0)}% of quote`}
                        indicator={overrideIndicator}
                        icon={Building2}
                        gradient="bg-gradient-to-br from-white/15 via-white/5 to-transparent border-2 border-white/30"
                        iconBg="bg-white/20"
                        textColor="text-white"
                      />
                      <QuoteKpiCard
                        label="Grinder Payout"
                        value={`$${formatUSD(r.grinderPayout)}`}
                        subtitle={`${(r.grinderPct * 100).toFixed(0)}% of quote`}
                        indicator={
                          r.grinderBidAboveDefault ? (
                            <span className={cn("inline-flex items-center gap-1", r.profitMargin === "RED" ? "text-red-400" : "text-amber-300")}>
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              {r.profitMargin === "RED"
                                ? "Grinder bid above profit margin"
                                : `Grinder bid above ${Math.round(defaultGrinderPct * 100)}%`}
                            </span>
                          ) : (
                            overrideIndicator
                          )
                        }
                        icon={User}
                        gradient="bg-gradient-to-br from-purple-500/15 via-purple-500/5 to-transparent border border-purple-500/10"
                        iconBg="bg-purple-500/20"
                        textColor="text-purple-400"
                      />
                      <QuoteKpiCard
                        label="Creator Commission"
                        value={`$${formatUSD(r.creatorCommission)}`}
                        subtitle={creatorCode ? (r.creatorPct > 0 ? `${(r.creatorPct * 100).toFixed(0)}%` : "—") : "Select creator"}
                        indicator={overrideIndicator}
                        icon={Star}
                        gradient="bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/10"
                        iconBg="bg-emerald-500/20"
                        textColor="text-emerald-400"
                      />
                <Card
                  className={cn(
                    "border-0 overflow-hidden relative group sm:hover:scale-[1.02] transition-transform duration-300 shrink-0",
                    r.profitMargin === "GREEN" && "bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/20",
                    r.profitMargin === "YELLOW" && "bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/20",
                    r.profitMargin === "RED" && "bg-gradient-to-br from-red-500/15 via-red-500/5 to-transparent border border-red-500/20",
                    !r.profitMargin && "bg-gradient-to-br from-slate-500/10 to-transparent border border-white/10"
                  )}
                >
                  {r.profitMargin && (
                    <div className="absolute top-0 right-0 w-20 h-20 sm:w-28 sm:h-28 -translate-y-1 sm:-translate-y-2 translate-x-1 sm:translate-x-2 rounded-full overflow-hidden [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)]">
                      <div className={cn(
                        "absolute inset-0 rounded-full flex items-center justify-center opacity-25",
                        r.profitMargin === "GREEN" && "bg-emerald-500/20",
                        r.profitMargin === "YELLOW" && "bg-amber-500/20",
                        r.profitMargin === "RED" && "bg-red-500/20"
                      )}>
                        {r.profitMargin === "RED" ? (
                          <TrendingDown className="w-10 h-10 sm:w-14 sm:h-14 text-red-400" />
                        ) : r.profitMargin === "YELLOW" ? (
                          <Minus className="w-10 h-10 sm:w-14 sm:h-14 text-amber-400" />
                        ) : (
                          <TrendingUp className="w-10 h-10 sm:w-14 sm:h-14 text-emerald-400" />
                        )}
                      </div>
                    </div>
                  )}
                  {!r.profitMargin && (
                    <div className="absolute top-0 right-0 w-20 h-20 sm:w-28 sm:h-28 -translate-y-1 sm:-translate-y-2 translate-x-1 sm:translate-x-2 rounded-full overflow-hidden [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)]">
                      <div className="absolute inset-0 rounded-full flex items-center justify-center opacity-25 bg-slate-500/20">
                        <TrendingUp className="w-10 h-10 sm:w-14 sm:h-14 text-slate-400" />
                      </div>
                    </div>
                  )}
                  <CardContent className="p-3 sm:p-4 relative z-10">
                    <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">Profit Margin</p>
                    {r.profitMargin && (
                      <>
                        <p className={cn(
                          "text-lg sm:text-2xl font-bold tracking-tight mt-0.5 sm:mt-1",
                          r.profitMargin === "GREEN" && "text-emerald-400",
                          r.profitMargin === "YELLOW" && "text-amber-400",
                          r.profitMargin === "RED" && "text-red-400"
                        )}>
                          {(r.companyPct * 100).toFixed(1)}%
                        </p>
                        <p className="text-[10px] text-white/40 mt-0.5 sm:mt-1">
                          {r.profitMargin === "GREEN" && "Good margin"}
                          {r.profitMargin === "YELLOW" && "Moderate margin"}
                          {r.profitMargin === "RED" && "Tight margin"}
                        </p>
                      </>
                    )}
                    {!r.profitMargin && chosenNum > 0 && (
                      <p className="text-sm text-white/60 mt-1">{(r.companyPct * 100).toFixed(1)}% company share</p>
                    )}
                    {hasOverride && overrideIndicator && (
                      <p className="text-[10px] text-white italic mt-0.5 sm:mt-1">
                        {overrideIndicator}
                      </p>
                    )}
                  </CardContent>
                </Card>
                      </div>
                    ))}
                  </>
                );
              })()}
            </FadeInUp>

            {quoteGeneratorTab === "rep" && results && (
              <FadeInUp delay={0.095}>
                <div className="text-[11px] px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/15 via-emerald-500/15 to-red-500/15 border border-white/10 w-full flex flex-wrap items-center justify-center sm:justify-start gap-x-2 sm:gap-x-0 gap-y-0.5 sm:gap-y-1">
                  <span className="shrink-0 text-amber-400">AI LOW: <span className="text-amber-300/80">${formatUSD(results.aiLowQuote)}</span></span>
                  <span className="flex-1 min-w-4 mx-1 h-px self-center hidden sm:block bg-gradient-to-r from-amber-400/60 via-emerald-400/60 to-transparent" aria-hidden />
                  <span className="shrink-0 text-emerald-400">AI MID: <span className="text-emerald-300/80">${formatUSD(results.aiSuggestedQuote)}</span></span>
                  <span className="flex-1 min-w-4 mx-1 h-px self-center hidden sm:block bg-gradient-to-r from-transparent via-emerald-400/60 to-red-400/60" aria-hidden />
                  <span className="shrink-0 text-red-400">AI HIGH: <span className="text-red-300/80">${formatUSD(results.aiHighQuote)}</span></span>
                </div>
              </FadeInUp>
            )}

            {/* Timeframe + details */}
            <FadeInUp delay={0.1}>
              <Card className="border-0 bg-white/[0.02] border border-white/[0.06]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Order Estimated Timeframe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {quoteGeneratorTab === "rep" && results ? (
                    <>
                      <div className="flex flex-wrap items-baseline gap-4">
                        <p className="text-2xl font-bold text-cyan-400">{results.timeframeText}</p>
                        {results.timeframeText !== results.estimatedTimeframe && (
                          <p className="text-sm text-muted-foreground">Estimated: {results.estimatedTimeframe}</p>
                        )}
                      </div>
                      <button type="button" onClick={() => setShowDetails((d) => !d)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronDown className={cn("w-4 h-4 transition-transform", showDetails && "rotate-180")} />
                        {showDetails ? "Hide" : "Show"} pricing breakdown and delivery timeline
                      </button>
                      {showDetails && (
                        <div className="pt-2 border-t border-white/[0.06] space-y-3 text-xs text-muted-foreground">
                          <p className="font-medium text-white/80">PRICING BREAKDOWN</p>
                          <p className="text-[11px]">LINE COST = Weight × Rate × 100 · EST. DAYS = Weight × segment min/max × urgency (urgency adjusts per segment)</p>
                          <div className="overflow-x-auto -mx-1">
                            <table className="w-full text-[11px] border-collapse">
                              <thead>
                                <tr className="border-b border-white/10">
                                  <th className="text-left py-1 px-1 font-medium">FROM</th>
                                  <th className="text-left py-1 px-1 font-medium">TO</th>
                                  <th className="text-right py-1 px-1 font-medium">RATE</th>
                                  <th className="text-right py-1 px-1 font-medium">WEIGHT</th>
                                  <th className="text-right py-1 px-1 font-medium">EST. DAYS</th>
                                  <th className="text-right py-1 px-1 font-medium">LINE COST</th>
                                </tr>
                              </thead>
                              <tbody>
                                {results.repBreakdown.map((row, i) => (
                                  <tr key={i} className={row.isActive ? "bg-cyan-500/10 border-l-2 border-cyan-500/50" : "opacity-60"}>
                                    <td className="py-1 px-1">{row.fromLabel}</td>
                                    <td className="py-1 px-1">{row.toLabel}</td>
                                    <td className="text-right py-1 px-1">${row.rate.toFixed(2)}</td>
                                    <td className="text-right py-1 px-1">{row.weight > 0 ? row.weight.toFixed(2) : "0"}</td>
                                    <td className="text-right py-1 px-1">{row.weight > 0 ? (row.weightedMinDays === row.weightedMaxDays ? `${row.weightedMinDays.toFixed(1)} d` : `${row.weightedMinDays.toFixed(1)}–${row.weightedMaxDays.toFixed(1)} d`) : "—"}</td>
                                    <td className="text-right py-1 px-1">${row.lineCost.toFixed(0)}</td>
                                  </tr>
                                ))}
                                <tr className="border-t border-white/20 font-medium bg-white/[0.03]">
                                  <td colSpan={4} className="py-1.5 px-1 text-right">Σ Total → {results.timeframeText}</td>
                                  <td className="text-right py-1.5 px-1">{results.minDays === results.maxDays ? `${results.minDays} d` : `${results.minDays}–${results.maxDays} d`}</td>
                                  <td className="text-right py-1.5 px-1">${results.baseCostAI.toFixed(0)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <div className="space-y-0.5">
                            <p>Base cost AI = Σ(Weight × Rate × 100) = ${formatUSD(results.baseCostAI)}</p>
                            <p>Bars touched: {results.barsTouched} · Volume modifier: {results.volumeModifier} · Late efficiency: {results.lateEfficiencyMultiplier.toFixed(3)}</p>
                            <p>After late-eff + volume: ${formatUSD(results.afterLateEffAI)} → Discount {(results.discountUsed * 100).toFixed(0)}%{results.creatorDiscount > 0 ? ` (Creator: ${(results.creatorDiscount * 100).toFixed(0)}%)` : ""} → AI Mid: ${formatUSD(results.aiSuggestedQuote)}</p>
                            <p>AI Low: 95% of Mid · AI High: 105% of Mid</p>
                          </div>
                        </div>
                      )}
                    </>
                  ) : quoteGeneratorTab === "hotzones" ? (
                    <>
                      <div className="flex flex-wrap items-baseline gap-4">
                        <p className="text-2xl font-bold text-cyan-400">{hotZonesTimeframeText}</p>
                        <p className="text-sm text-muted-foreground">{hotZonesMinDays}–{hotZonesMaxDays} days (base) · urgency applied</p>
                      </div>
                    </>
                  ) : quoteGeneratorTab === "bundle" && bundleSelectedServices.length > 0 && (!bundleSelectedServices.includes("rep") || results) && (!bundleSelectedServices.includes("badge") || badgeResults) ? (
                    <>
                      <div className="flex flex-wrap items-baseline gap-4">
                        <p className="text-2xl font-bold text-cyan-400">
                          {(() => {
                            const parts: string[] = [];
                            if (bundleSelectedServices.includes("rep") && results) parts.push(`Rep: ${results.timeframeText}`);
                            if (bundleSelectedServices.includes("badge") && badgeResults) parts.push(`Badges: ${badgeResults.timeframeText}`);
                            if (bundleSelectedServices.includes("hotzones")) parts.push(`Hot Zones: ${hotZonesTimeframeText}`);
                            return parts.join(" · ");
                          })()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {bundleSelectedServices.includes("rep") && results && `Rep: ${results.timeframeText}`}
                          {bundleSelectedServices.includes("rep") && results && bundleSelectedServices.includes("badge") && " · "}
                          {bundleSelectedServices.includes("badge") && badgeResults && `Badges: ${badgeResults.timeframeText}`}
                          {(bundleSelectedServices.includes("rep") || bundleSelectedServices.includes("badge")) && bundleSelectedServices.includes("hotzones") && " · "}
                          {bundleSelectedServices.includes("hotzones") && `Hot Zones: ${hotZonesTimeframeText}`}
                        </p>
                      </div>
                      <button type="button" onClick={() => setShowDetails((d) => !d)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronDown className={cn("w-4 h-4 transition-transform", showDetails && "rotate-180")} />
                        {showDetails ? "Hide" : "Show"} bundle breakdown
                      </button>
                      {showDetails && (
                        <div className="pt-2 border-t border-white/[0.06] space-y-4">
                          {(Number(chosenFinalQuote) || 0) > 0 && (
                            <p className="text-[11px] text-muted-foreground">Custom Total overrides the calculated sum below.</p>
                          )}
                          {bundleSelectedServices.includes("rep") && results && (
                            <div>
                              <p className="font-medium text-white/80 text-xs mb-2">
                                REP: ${((Number(bundleCustomRepQuote) || 0) > 0 ? Number(bundleCustomRepQuote) : results.recommendedQuote).toLocaleString()} — {results.timeframeText}
                                {(Number(chosenFinalQuote) || 0) > 0 && <span className="text-muted-foreground font-normal ml-1">(calculated)</span>}
                              </p>
                              <p className="text-[11px] text-muted-foreground">{startTier} {startLvl} → {targetTier} {targetLvl}</p>
                            </div>
                          )}
                          {bundleSelectedServices.includes("badge") && badgeResults && (
                            <div>
                              <p className="font-medium text-white/80 text-xs mb-2">
                                BADGES: ${((Number(bundleCustomBadgeQuote) || 0) > 0 ? Number(bundleCustomBadgeQuote) : badgeResults.recommendedQuote).toLocaleString()} — {badgeResults.timeframeText}
                                {(Number(chosenFinalQuote) || 0) > 0 && <span className="text-muted-foreground font-normal ml-1">(calculated)</span>}
                              </p>
                              <p className="text-[11px] text-muted-foreground">{badgeResults.badgeBreakdown.length} badge(s) · {myPlayerType}</p>
                            </div>
                          )}
                          {bundleSelectedServices.includes("hotzones") && (
                            <div>
                              <p className="font-medium text-white/80 text-xs mb-2">
                                HOT ZONES: ${((Number(bundleCustomHotZonesQuote) || 0) > 0 ? Number(bundleCustomHotZonesQuote) : bundleHotZonesPrice).toLocaleString()} — {hotZonesTimeframeText}
                                {(Number(chosenFinalQuote) || 0) > 0 && <span className="text-muted-foreground font-normal ml-1">(calculated)</span>}
                              </p>
                              <p className="text-[11px] text-muted-foreground">{hotZoneIds.length} zone{hotZoneIds.length !== 1 ? "s" : ""} selected</p>
                            </div>
                          )}
                          <p className="text-xs font-medium">
                            Total: ${(customerPrice).toLocaleString()}
                            {(Number(chosenFinalQuote) || 0) > 0 && <span className="text-muted-foreground ml-1">(Custom Total)</span>}
                          </p>
                        </div>
                      )}
                    </>
                  ) : badgeResults ? (
                    <>
                      <div className="flex flex-wrap items-baseline gap-4">
                        <p className="text-2xl font-bold text-cyan-400">{badgeResults.timeframeText}</p>
                      </div>
                      <button type="button" onClick={() => setShowDetails((d) => !d)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                        <ChevronDown className={cn("w-4 h-4 transition-transform", showDetails && "rotate-180")} />
                        {showDetails ? "Hide" : "Show"} badge breakdown and pricing
                      </button>
                      {showDetails && (
                        <div className="pt-2 border-t border-white/[0.06] space-y-2">
                          <p className="font-medium text-white/80 text-xs">BADGE BREAKDOWN</p>
                          <div className="overflow-x-auto -mx-1">
                            <table className="w-full text-[11px] border-collapse">
                              <thead>
                                <tr className="border-b border-white/10">
                                  <th className="text-left py-1 px-1 font-medium">Badge</th>
                                  <th className="text-right py-1 px-1 font-medium">Price</th>
                                </tr>
                              </thead>
                              <tbody>
                                {badgeResults.badgeBreakdown.map((row, i) => (
                                  <tr key={i} className="border-b border-white/5">
                                    <td className="py-1 px-1">{row.badgeName}</td>
                                    <td className="text-right py-1 px-1">${row.price.toFixed(0)}</td>
                                  </tr>
                                ))}
                                <tr className="border-t border-white/20 font-medium bg-white/[0.03]">
                                  <td className="py-1.5 px-1 text-right">Σ Total</td>
                                  <td className="text-right py-1.5 px-1">${badgeResults.baseCost.toFixed(0)}</td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                          <p className="text-[11px] text-muted-foreground">Base ${badgeResults.baseCost.toFixed(0)} × urgency {badgeResults.urgencyMultiplier} = ${badgeResults.afterUrgency.toFixed(0)} → Discount {(badgeResults.discountUsed * 100).toFixed(0)}% → Rounded: ${badgeResults.recommendedQuote.toFixed(0)}</p>
                        </div>
                      )}
                    </>
                  ) : null}
                </CardContent>
              </Card>
            </FadeInUp>

            {/* Choose price + save/share */}
            <FadeInUp delay={0.11}>
              <Card className="border-0 bg-white/[0.02] border border-white/[0.06]">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <FaDiscord className="w-4 h-4" />
                    Discord Quote
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Select a quote to generate a Discord-ready message. Save for quick access when creating orders.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    {quoteGeneratorTab === "rep" && results ? (
                    <div className="flex flex-wrap gap-2">
                      {[
                        ...((quoteSource === "budget" || repBudgetSuggestionApplied)
                          ? [
                              { id: "market" as const, label: "Market", disabled: false },
                              { id: "ai" as const, label: "AI", disabled: false },
                            ]
                          : [
                              {
                                id: "recommended" as const,
                                label: `Recommended${results.recommendedQuote === results.marketQuote ? " (Market)" : results.recommendedQuote === results.aiSuggestedQuote ? " (AI)" : ""}`,
                                disabled: false,
                              },
                              ...(results.recommendedQuote === results.marketQuote
                                ? []
                                : [{ id: "market" as const, label: "Market", disabled: false }]),
                              ...(results.recommendedQuote === results.aiSuggestedQuote
                                ? []
                                : [{ id: "ai" as const, label: "AI", disabled: false }]),
                            ]),
                        {
                          id: "budget" as const,
                          label: repBudgetSuggestion ? `Budget: $${formatUSD(repBudgetSuggestion.budget)}` : "Budget: Enter amount above",
                          disabled: !repBudgetSuggestion,
                        },
                        {
                          id: "custom" as const,
                          label: Number(chosenFinalQuote) > 0 ? `Custom: $${formatUSD(Number(chosenFinalQuote))}` : "Custom: Enter at Custom Quote ($)",
                          disabled: !chosenFinalQuote || Number(chosenFinalQuote) <= 0,
                        },
                      ].map(({ id, label, disabled }) => {
                        const selected = quoteSource === id;
                        const btnClasses = cn(
                          "px-4 py-3 min-h-11 rounded-lg text-sm font-medium border transition-colors touch-manipulation",
                          selected && id === "recommended" && "bg-primary/20 text-white border-primary/40",
                          selected && id === "market" && "bg-pink-500/20 text-white border-pink-500/40",
                          selected && id === "ai" && "bg-blue-500/20 text-white border-blue-500/40",
                          selected && id === "budget" && "bg-emerald-500/20 text-white border-emerald-500/40",
                          selected && id === "custom" && "bg-white/10 text-white border-white/20",
                          !selected && disabled && "bg-white/[0.02] border-white/5 text-muted-foreground/50 cursor-not-allowed",
                          !selected && !disabled && id === "market" && "bg-white/[0.04] border-pink-500/20 text-pink-300 hover:bg-pink-500/10 hover:border-pink-500/35 hover:text-white",
                          !selected && !disabled && id === "ai" && "bg-white/[0.04] border-blue-500/20 text-blue-300 hover:bg-blue-500/10 hover:border-blue-500/35 hover:text-white",
                          !selected && !disabled && id === "budget" && "bg-white/[0.04] border-emerald-500/20 text-emerald-300 hover:bg-emerald-500/10 hover:border-emerald-500/35 hover:text-white",
                          !selected && !disabled && !["market", "ai", "budget"].includes(id) && "bg-white/[0.04] border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
                        );
                        return (
                          <button
                            key={id}
                            type="button"
                            disabled={disabled}
                            onClick={() => !disabled && setQuoteSource(id)}
                            className={btnClasses}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    ) : quoteGeneratorTab === "bundle" && bundleSelectedServices.length > 0 && (!bundleSelectedServices.includes("rep") || results) && (!bundleSelectedServices.includes("badge") || badgeResults) ? (
                      <p className="text-sm text-muted-foreground">
                        {(Number(chosenFinalQuote) || 0) > 0
                          ? `Total: ${formatUSD(customerPrice)} (Custom Total)`
                          : `Total: ${formatUSD(customerPrice)} (${[
                              bundleSelectedServices.includes("rep") && `Rep ${formatUSD((Number(bundleCustomRepQuote) || 0) > 0 ? Number(bundleCustomRepQuote) : (results?.recommendedQuote ?? 0))}`,
                              bundleSelectedServices.includes("badge") && `Badge ${formatUSD((Number(bundleCustomBadgeQuote) || 0) > 0 ? Number(bundleCustomBadgeQuote) : (badgeResults?.recommendedQuote ?? 0))}`,
                              bundleSelectedServices.includes("hotzones") && `Hot Zones ${formatUSD((Number(bundleCustomHotZonesQuote) || 0) > 0 ? Number(bundleCustomHotZonesQuote) : bundleHotZonesPrice)}`,
                            ].filter(Boolean).join(" + ")})`
                        }
                      </p>
                    ) : quoteGeneratorTab === "hotzones" ? (
                      <p className="text-sm text-muted-foreground">
                        Total: ${formatUSD(customerPrice)}
                        {(Number(chosenFinalQuote) || 0) > 0 ? " (Custom)" : ` (${hotZoneIds.length} zone${hotZoneIds.length !== 1 ? "s" : ""})`}
                      </p>
                    ) : badgeResults ? (
                      <p className="text-sm text-muted-foreground">Quote: ${formatUSD(customerPrice)}</p>
                    ) : null}
                    <p className="text-xs font-medium text-muted-foreground mt-2">Discord preview:</p>
                    <pre className="text-[11px] text-muted-foreground bg-black/20 rounded-lg p-3 mt-1 overflow-x-auto overflow-y-auto max-h-40 sm:max-h-none whitespace-pre-wrap break-words font-mono border border-white/5">
                      {quoteGeneratorTab === "hotzones"
                        ? buildQuoteDiscordMessage({
                            customerPrice,
                            estimatedTimeframe: hotZonesTimeframeText,
                            customerIdentifier: customerIdentifier.trim() || undefined,
                            route: `Hot Zones — ${hotZoneIds.length} zone${hotZoneIds.length !== 1 ? "s" : ""}`,
                            serviceLabel: "Hot Zones Quote",
                            urgency,
                            creatorCode: creatorCode || undefined,
                            ...(discountPct > 0 && { discountPercent: discountPct }),
                          })
                        : quoteGeneratorTab === "bundle" && bundleSelectedServices.length > 0 && (!bundleSelectedServices.includes("rep") || results) && (!bundleSelectedServices.includes("badge") || badgeResults)
                        ? (() => {
                            const routeParts: string[] = [];
                            if (bundleSelectedServices.includes("rep") && results) routeParts.push("**Rep:** " + startTier + " " + startLvl + " → " + targetTier + " " + targetLvl);
                            if (bundleSelectedServices.includes("badge") && badgeResults) routeParts.push("**Badges:** " + formatBadgeRouteForDiscord(badgeResults.badgeBreakdown).replace(/\*\*/g, ""));
                            if (bundleSelectedServices.includes("hotzones")) routeParts.push("**Hot Zones:** " + hotZoneIds.length + " zone" + (hotZoneIds.length !== 1 ? "s" : ""));
                            const tfParts: string[] = [];
                            if (bundleSelectedServices.includes("rep") && results) tfParts.push("Rep: " + results.timeframeText);
                            if (bundleSelectedServices.includes("badge") && badgeResults) tfParts.push("Badges: " + badgeResults.timeframeText);
                            if (bundleSelectedServices.includes("hotzones")) tfParts.push("Hot Zones: " + hotZonesTimeframeText);
                            const bundleTf = tfParts.join(" · ");
                            return "**📋 Bundle Quote**\n*Customer:* " + (customerIdentifier.trim() || "—") + "\n\n" + routeParts.join("\n") + "\n" + (bundleSelectedServices.some((s) => s === "rep" || s === "badge") ? "**MyPlayer Type:** " + myPlayerType + "\n" : "") + "**Urgency:** " + (URGENCY_LABELS[urgency] ?? urgency) + (creatorCode ? " | **Creator:** " + creatorCode : "") + "\n\n```\nYour quote:  $" + customerPrice.toLocaleString() + "\nEstimated timeframe: " + bundleTf + "\n```";
                          })()
                        : quoteGeneratorTab === "rep" && repDiscordMessage
                        ? repDiscordMessage
                        : buildQuoteDiscordMessage({
                            customerPrice,
                            estimatedTimeframe: badgeResults?.timeframeText ?? "",
                            timeframeText: badgeResults!.timeframeText,
                            customerIdentifier: customerIdentifier.trim() || undefined,
                            route: (() => { const bb = badgeResults?.badgeBreakdown ?? []; return `${bb.length === 1 ? "**Badge** — " : "**Badges** — "}${formatBadgeRouteForDiscord(bb)}`; })(),
                            serviceLabel: "Badge Grinding Quote",
                            urgency,
                            creatorCode: creatorCode || undefined,
                            myPlayerType,
                            ...((badgeResults!.discountUsed ?? 0) > 0 && { discountPercent: (badgeResults!.discountUsed ?? 0) * 100 }),
                          })}
                    </pre>
                  </div>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2 border-t border-white/[0.06]">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 min-h-11 w-full sm:w-auto touch-manipulation"
                      onClick={() => {
                        const msg = quoteGeneratorTab === "hotzones"
                          ? buildQuoteDiscordMessage({
                              customerPrice,
                              estimatedTimeframe: hotZonesTimeframeText,
                              customerIdentifier: customerIdentifier.trim() || undefined,
                              route: `Hot Zones — ${hotZoneIds.length} zone${hotZoneIds.length !== 1 ? "s" : ""}`,
                              serviceLabel: "Hot Zones Quote",
                              urgency,
                              creatorCode: creatorCode || undefined,
                              ...(discountPct > 0 && { discountPercent: discountPct }),
                            })
                          : quoteGeneratorTab === "bundle" && bundleSelectedServices.length > 0 && (!bundleSelectedServices.includes("rep") || results) && (!bundleSelectedServices.includes("badge") || badgeResults)
                          ? (() => {
                              const routeParts: string[] = [];
                              if (bundleSelectedServices.includes("rep") && results) routeParts.push("**Rep:** " + startTier + " " + startLvl + " → " + targetTier + " " + targetLvl);
                              if (bundleSelectedServices.includes("badge") && badgeResults) routeParts.push("**Badges:** " + formatBadgeRouteForDiscord(badgeResults.badgeBreakdown).replace(/\*\*/g, ""));
                              if (bundleSelectedServices.includes("hotzones")) routeParts.push("**Hot Zones:** " + hotZoneIds.length + " zone" + (hotZoneIds.length !== 1 ? "s" : ""));
                              const tfParts: string[] = [];
                              if (bundleSelectedServices.includes("rep") && results) tfParts.push("Rep: " + results.timeframeText);
                              if (bundleSelectedServices.includes("badge") && badgeResults) tfParts.push("Badges: " + badgeResults.timeframeText);
                              if (bundleSelectedServices.includes("hotzones")) tfParts.push("Hot Zones: " + hotZonesTimeframeText);
                              return "**📋 Bundle Quote**\n*Customer:* " + (customerIdentifier.trim() || "—") + "\n\n" + routeParts.join("\n") + "\n" + (bundleSelectedServices.some((s) => s === "rep" || s === "badge") ? "**MyPlayer Type:** " + myPlayerType + "\n" : "") + "**Urgency:** " + (URGENCY_LABELS[urgency] ?? urgency) + (creatorCode ? " | **Creator:** " + creatorCode : "") + "\n\n```\nYour quote:  $" + customerPrice.toLocaleString() + "\nEstimated timeframe: " + tfParts.join(" · ") + "\n```";
                            })()
                          : quoteGeneratorTab === "rep" && repDiscordMessage
                          ? repDiscordMessage
                          : buildQuoteDiscordMessage({
                            customerPrice,
                            estimatedTimeframe: badgeResults?.timeframeText ?? "",
                            timeframeText: badgeResults!.timeframeText,
                            customerIdentifier: customerIdentifier.trim() || undefined,
                            route: (() => { const bb = badgeResults?.badgeBreakdown ?? []; return `${bb.length === 1 ? "**Badge** — " : "**Badges** — "}${formatBadgeRouteForDiscord(bb)}`; })(),
                            serviceLabel: "Badge Grinding Quote",
                            urgency,
                            creatorCode: creatorCode || undefined,
                            myPlayerType,
                            ...((badgeResults!.discountUsed ?? 0) > 0 && { discountPercent: (badgeResults!.discountUsed ?? 0) * 100 }),
                          });
                        copyToClipboard(msg).then((ok) => {
                          if (ok) {
                            setDiscordCopied(true);
                            toast({ title: "Copied to clipboard" });
                            setTimeout(() => setDiscordCopied(false), 2000);
                          } else {
                            toast({ title: "Could not copy", variant: "destructive" });
                          }
                        });
                      }}
                    >
                      {discordCopied ? <Check className="w-3.5 h-3.5 mr-1 text-emerald-400" /> : <FaDiscord className="w-3.5 h-3.5 mr-1" />}
                      {discordCopied ? "Copied!" : "Copy Discord Message"}
                    </Button>
                    {(saveQuoteMutation.isPending || !customerIdentifier.trim()) ? (
                      <Tooltip open={saveDisabledTooltipOpen} onOpenChange={setSaveDisabledTooltipOpen}>
                        <TooltipTrigger asChild>
                          <span
                            className="inline-flex cursor-not-allowed"
                            onClick={() => setSaveDisabledTooltipOpen(true)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => e.key === "Enter" && setSaveDisabledTooltipOpen(true)}
                          >
                            <Button
                              size="sm"
                              className="bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 pointer-events-none min-h-11 w-full sm:w-auto touch-manipulation"
                              disabled
                              tabIndex={-1}
                            >
                              {saveQuoteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                              Save Quote
                            </Button>
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[200px] border-white/10">
                          {saveQuoteMutation.isPending ? "Saving…" : "Customer field is required"}
                        </TooltipContent>
                      </Tooltip>
                    ) : (
                      <Button
                        size="sm"
                        className="bg-emerald-500/20 border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/30 min-h-11 w-full sm:w-auto touch-manipulation"
                        disabled={false}
                        onClick={() => saveQuoteMutation.mutate()}
                      >
                        <Save className="w-3.5 h-3.5 mr-1" />
                        Save Quote
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </FadeInUp>
          </>
        )}

        {/* Saved quotes — staff can see all quotes (check if customer was already quoted) */}
        {savedQuotesList.length > 0 && (
          <FadeInUp>
            <Card className="border-0 bg-white/[0.02] border border-white/[0.06]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Save className="w-4 h-4 text-emerald-400" />
                  Saved Quotes
                </CardTitle>
                <p className="text-xs text-muted-foreground">View and manage saved quotes. Search, filter, or edit—attach to orders during creation.</p>
                <div className="pt-2 space-y-2">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1 min-w-0">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                      <Input
                        placeholder={quoteGeneratorTab === "rep" ? "Search rep quotes…" : quoteGeneratorTab === "badge" ? "Search badge quotes…" : quoteGeneratorTab === "hotzones" ? "Search hot zone quotes…" : "Search bundle quotes…"}
                        value={quoteFilter}
                        onChange={(e) => setQuoteFilter(e.target.value)}
                        className="pl-9 h-11 min-h-11 sm:h-9 bg-white/[0.04] border-white/10"
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-11 min-h-11 sm:h-9 border-white/10 shrink-0 w-full sm:w-auto"
                      onClick={() => setShowFilters(!showFilters)}
                    >
                      <Filter className="w-4 h-4 mr-1 shrink-0" />
                      Filters
                    </Button>
                  </div>
                  {showFilters && (
                    <div className="flex flex-wrap gap-x-3 gap-y-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06]">
                      {/* Common filters */}
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <Label className="text-[10px]">Date</Label>
                        <Select value={filterDateRange || "_all"} onValueChange={(v) => setFilterDateRange(v === "_all" ? "" : v)}>
                          <SelectTrigger className="h-11 min-h-11 sm:h-8 text-xs bg-white/[0.04] border-white/10">
                            <SelectValue placeholder="Select date range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_all">All time</SelectItem>
                            <SelectItem value="custom">Custom range</SelectItem>
                            <SelectItem value="1d">Last 24 hours</SelectItem>
                            <SelectItem value="3d">Last 3 days</SelectItem>
                            <SelectItem value="7d">Last 7 days</SelectItem>
                            <SelectItem value="14d">Last 14 days</SelectItem>
                            <SelectItem value="30d">Last 30 days</SelectItem>
                            <SelectItem value="90d">Last 90 days</SelectItem>
                            <SelectItem value="180d">Last 6 months</SelectItem>
                            <SelectItem value="365d">Last year</SelectItem>
                          </SelectContent>
                        </Select>
                        {filterDateRange === "custom" && (
                          <div className="flex gap-1 mt-1">
                            <Input
                              type="date"
                              value={filterDateFrom}
                              onChange={(e) => setFilterDateFrom(e.target.value)}
                              className="h-11 min-h-11 sm:h-8 text-xs bg-white/[0.04] border-white/10"
                            />
                            <Input
                              type="date"
                              value={filterDateTo}
                              onChange={(e) => setFilterDateTo(e.target.value)}
                              className="h-11 min-h-11 sm:h-8 text-xs bg-white/[0.04] border-white/10"
                            />
                          </div>
                        )}
                      </div>
                      {(quoteGeneratorTab === "rep" || quoteGeneratorTab === "bundle") && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Start tier</Label>
                            <Select value={filterStartTier} onValueChange={setFilterStartTier}>
                              <SelectTrigger className="h-11 min-h-11 sm:h-8 text-xs bg-white/[0.04] border-white/10">
                                <SelectValue placeholder="Any" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="_any">Any</SelectItem>
                                {TIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Target tier</Label>
                            <Select value={filterTargetTier || "_any"} onValueChange={(v) => setFilterTargetTier(v === "_any" ? "" : v)}>
                              <SelectTrigger className="h-11 min-h-11 sm:h-8 text-xs bg-white/[0.04] border-white/10">
                                <SelectValue placeholder="Any" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="_any">Any</SelectItem>
                                {TIERS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Start % ≥</Label>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="Min %"
                              value={filterStartPctMin}
                              onChange={(e) => { const v = e.target.value.replace(/\s/g, ""); if (v === "" || /^\d*\.?\d*$/.test(v)) setFilterStartPctMin(v); }}
                              className="h-11 min-h-11 sm:h-8 text-xs bg-white/[0.04] border-white/10"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Target % ≥</Label>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="Min %"
                              value={filterTargetPctMin}
                              onChange={(e) => { const v = e.target.value.replace(/\s/g, ""); if (v === "" || /^\d*\.?\d*$/.test(v)) setFilterTargetPctMin(v); }}
                              className="h-11 min-h-11 sm:h-8 text-xs bg-white/[0.04] border-white/10"
                            />
                          </div>
                        </>
                      )}
                      {(quoteGeneratorTab === "badge" || quoteGeneratorTab === "bundle") && (
                        <>
                          <div className="space-y-1">
                            <Label className="text-[10px]">Badge count</Label>
                            <div className="flex gap-1">
                              <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="Min"
                                value={filterBadgeCountMin}
                                onChange={(e) => { const v = e.target.value.replace(/\s/g, ""); if (v === "" || /^\d*$/.test(v)) setFilterBadgeCountMin(v); }}
                                className="h-11 min-h-11 sm:h-8 text-xs bg-white/[0.04] border-white/10"
                              />
                              <Input
                                type="text"
                                inputMode="numeric"
                                placeholder="Max"
                                value={filterBadgeCountMax}
                                onChange={(e) => { const v = e.target.value.replace(/\s/g, ""); if (v === "" || /^\d*$/.test(v)) setFilterBadgeCountMax(v); }}
                                className="h-11 min-h-11 sm:h-8 text-xs bg-white/[0.04] border-white/10"
                              />
                            </div>
                          </div>
                        </>
                      )}
                      <div className="space-y-1">
                        <Label className="text-[10px]">Urgency</Label>
                        <Select value={filterUrgency || "_any"} onValueChange={(v) => setFilterUrgency(v === "_any" ? "" : v)}>
                          <SelectTrigger className="h-11 min-h-11 sm:h-8 text-xs bg-white/[0.04] border-white/10">
                            <SelectValue placeholder="Any" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="_any">Any</SelectItem>
                            <SelectItem value="Slow">No Rush</SelectItem>
                            <SelectItem value="Normal">Normal</SelectItem>
                            <SelectItem value="Rush">Rush</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <Label className="text-[10px]">Amount ($)</Label>
                        <div className="flex gap-1">
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="Min"
                            value={filterAmountMin}
                            onChange={(e) => { const v = e.target.value.replace(/\s/g, ""); if (v === "" || /^\d*\.?\d*$/.test(v)) setFilterAmountMin(v); }}
                            className="h-11 min-h-11 sm:h-8 text-xs bg-white/[0.04] border-white/10"
                          />
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="Max"
                            value={filterAmountMax}
                            onChange={(e) => { const v = e.target.value.replace(/\s/g, ""); if (v === "" || /^\d*\.?\d*$/.test(v)) setFilterAmountMax(v); }}
                            className="h-11 min-h-11 sm:h-8 text-xs bg-white/[0.04] border-white/10"
                          />
                        </div>
                      </div>
                      <div className="space-y-1 col-span-2 sm:col-span-1">
                        <Label className="text-[10px]">Timeframe</Label>
                        <Input
                          placeholder="e.g. Months, Days"
                          value={filterTimeframe}
                          onChange={(e) => setFilterTimeframe(e.target.value)}
                          className="h-11 min-h-11 sm:h-8 text-xs bg-white/[0.04] border-white/10"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px]">Discount % ≥</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="Min %"
                          value={filterDiscountPctMin}
                          onChange={(e) => { const v = e.target.value.replace(/\s/g, ""); if (v === "" || /^\d*\.?\d*$/.test(v)) setFilterDiscountPctMin(v); }}
                          className="h-11 min-h-11 sm:h-8 text-xs bg-white/[0.04] border-white/10"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {filteredSavedQuotes.slice(0, 20).map((q) => {
                    const isBadge = (q.serviceType || "rep_grinding") === "badge_grinding";
                    const badgeIdsArr = Array.isArray(q.inputs?.badgeIds) ? q.inputs.badgeIds : [];
                    const route = isBadge
                      ? `${badgeIdsArr.length === 1 ? "**Badge** — " : "**Badges** — "}${formatBadgeRouteFromIds(badgeIdsArr)}`
                      : formatQuoteRoute(q.inputs as { startTier?: string; startLvl?: number; startPct?: number; targetTier?: string; targetLvl?: number; targetPct?: number } | undefined);
                    const urgency = q.inputs?.urgency ? (URGENCY_LABELS[String(q.inputs.urgency)] ?? String(q.inputs.urgency)) : null;
                    const timeframe = q.results?.estimatedTimeframe ?? null;
                    const parts = [route, urgency, timeframe].filter(Boolean);
                    const priceVal = Number(q.results?.recommendedQuote ?? 0);
                    const discountUsed = Number((q.results as { discountUsed?: number })?.discountUsed ?? 0);
                    const discountPct = discountUsed > 0 ? Math.round(discountUsed * 100) : 0;
                    const price = formatUSD(priceVal);
                    const originalPrice = discountPct > 0 && discountUsed < 1 ? Math.round(priceVal / (1 - discountUsed)) : null;
                    const priceWithDiscount = discountPct > 0 ? `$${price} (${discountPct}% off)` : `$${price}`;
                    const byName = q.createdByName ? `By: ${q.createdByName}` : "";
                    const dateStr = q.createdAt ? new Date(q.createdAt).toLocaleDateString() : "";
                    const updatedByName = (q as { updatedByName?: string | null }).updatedByName;
                    const updatedAt = (q as { updatedAt?: string | null }).updatedAt;
                    const lastEdited = updatedAt && updatedByName
                      ? `Last edited by ${updatedByName} at ${new Date(updatedAt).toLocaleString()}`
                      : "";
                    const metaTitle = [...parts, priceWithDiscount, byName, dateStr, lastEdited].filter(Boolean).join(" · ");
                    return (
                    <div key={q.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 px-3 sm:py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] group">
                      <div className="min-w-0 flex-1 order-2 sm:order-1">
                        <p className="text-sm font-medium truncate">{q.customerIdentifier || "—"}</p>
                        <p className="text-xs text-muted-foreground line-clamp-4 sm:line-clamp-1 sm:truncate" title={metaTitle}>
                          {parts.join(" · ")}
                          {parts.length > 0 && " · "}
                          <span className="text-foreground">{discountPct > 0 ? <>{originalPrice != null && <><span className="line-through text-muted-foreground">${originalPrice.toLocaleString()}</span>{" "}</>}<span className="font-bold">${price}</span>{" "}<span className="font-normal italic">({discountPct}% off)</span></> : <span className="font-bold">${price}</span>}</span>
                          {byName && (
                            <>
                              {" · "}
                              <span className="text-primary font-medium">{byName}</span>
                            </>
                          )}
                          {dateStr && (
                            <>
                              {" · "}
                              {dateStr}
                            </>
                          )}
                          {lastEdited && (
                            <>
                              {" · "}
                              <span className="text-primary font-medium" title={lastEdited}>
                                Last edited by {updatedByName} at {new Date(updatedAt).toLocaleString()}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 order-1 sm:order-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-11 w-11 min-h-11 min-w-11 sm:h-8 sm:w-8 sm:min-h-8 sm:min-w-8 opacity-60 hover:opacity-100 touch-manipulation"
                          title="Copy Discord message"
                          onClick={() => {
                            const stored = (q as { discordMessage?: string | null }).discordMessage;
                            const msg =
                              typeof stored === "string" && stored.trim()
                                ? stored.trim()
                                : buildQuoteDiscordMessage({
                                    customerPrice: priceVal,
                                    estimatedTimeframe: String(q.results?.estimatedTimeframe ?? ""),
                                    timeframeText: (q.results as { timeframeText?: string })?.timeframeText,
                                    customerIdentifier: q.customerIdentifier ?? undefined,
                                    route: route || "—",
                                    serviceLabel: isBadge ? "Badge Grinding Quote" : undefined,
                                    urgency: String(q.inputs?.urgency ?? "Normal"),
                                    creatorCode: (q.inputs as { creatorCode?: string })?.creatorCode ?? undefined,
                                    myPlayerType: isBadge ? (q.inputs as { myPlayerType?: string })?.myPlayerType : undefined,
                                    startTier: (q.inputs as { startTier?: string })?.startTier,
                                    startLvl: (q.inputs as { startLvl?: number })?.startLvl,
                                    startPct: (q.inputs as { startPct?: number })?.startPct ?? undefined,
                                    targetTier: (q.inputs as { targetTier?: string })?.targetTier,
                                    targetLvl: (q.inputs as { targetLvl?: number })?.targetLvl,
                                    targetPct: (q.inputs as { targetPct?: number })?.targetPct ?? undefined,
                                    ...(discountPct > 0 && { discountPercent: discountPct }),
                                  });
                            copyToClipboard(msg).then((ok) => {
                              if (ok) {
                                setCopiedQuoteId(q.id);
                                toast({ title: "Discord message copied" });
                                setTimeout(() => setCopiedQuoteId(null), 2000);
                              } else {
                                toast({ title: "Could not copy", variant: "destructive" });
                              }
                            });
                          }}
                        >
                          {copiedQuoteId === q.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-11 w-11 min-h-11 min-w-11 sm:h-8 sm:w-8 sm:min-h-8 sm:min-w-8 opacity-60 hover:opacity-100 touch-manipulation"
                          onClick={() => setEditQuoteId(q.id)}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-11 w-11 min-h-11 min-w-11 sm:h-8 sm:w-8 sm:min-h-8 sm:min-w-8 opacity-60 hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 touch-manipulation"
                          onClick={() => {
                            if (confirm("Delete this quote?")) deleteQuoteMutation.mutate(q.id);
                          }}
                          disabled={deleteQuoteMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <code className="text-[10px] text-emerald-400 font-mono" title={q.id}>{q.id.slice(-3)}</code>
                      </div>
                    </div>
                  );})}
                </div>
              </CardContent>
            </Card>
          </FadeInUp>
        )}

        {/* Edit quote dialog */}
        <EditQuoteDialog
          quoteId={editQuoteId}
          onClose={() => setEditQuoteId(null)}
          onUpdate={(data) => editQuoteId && updateQuoteMutation.mutate({ id: editQuoteId, data })}
          isPending={updateQuoteMutation.isPending}
        />
        <PricingPlaybookDialog open={playbookOpen} onClose={() => setPlaybookOpen(false)} />
      </div>
    </AnimatedPage>
  );
}
