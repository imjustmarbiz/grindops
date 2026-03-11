import { useState, useMemo, useEffect } from "react";
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
import { calculateQuote, type QuoteInputs, type QuoteResults } from "@shared/quote-generator-calc";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ALL_BADGES, BADGE_CATEGORIES, BADGES_BY_CATEGORY, formatBadgeRouteForDiscord, formatBadgeRouteFromIds } from "@shared/badge-data";
import type { MyPlayerType } from "@shared/my-player-type-settings";
import { calculateBadgeQuote, type BadgeQuoteInputs, type BadgeQuoteResults } from "@shared/badge-quote-calc";

const URGENCY_OPTIONS_EDIT = ["Slow", "Normal", "Rush"] as const;
type UrgencyEdit = (typeof URGENCY_OPTIONS_EDIT)[number];
const URGENCY_LABELS_EDIT: Record<UrgencyEdit, string> = { Slow: "No Rush", Normal: "Normal", Rush: "Rush" };

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
                    if (v === "" || /^\d*\.?\d*$/.test(v)) setGrinderBid(v);
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
  const [showDetails, setShowDetails] = useState(false);
  const [customerIdentifier, setCustomerIdentifier] = useState("");
  const [quoteSource, setQuoteSource] = useState<"ai" | "market" | "custom">("ai");
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
  const [quoteGeneratorTab, setQuoteGeneratorTab] = useState<"rep" | "badge">("rep");
  const [badgeIds, setBadgeIds] = useState<string[]>([]);
  const [myPlayerType, setMyPlayerType] = useState<MyPlayerType>("Non-Rebirth");
  const [discordCopied, setDiscordCopied] = useState(false);
  const [saveDisabledTooltipOpen, setSaveDisabledTooltipOpen] = useState(false);
  const { toast } = useToast();

  const { data: creatorsList = [] } = useQuery<{ id: string; code: string; quoteDiscountPercent?: string | number | null }[]>({
    queryKey: ["/api/staff/creators"],
  });

  const { data: queueConfig } = useQuery<{ quoteGeneratorCompanyPct?: string | number; quoteGeneratorGrinderPct?: string | number; repQuoteSettings?: { roundBy?: number }; badgeQuoteSettings?: { roundBy?: number }; myPlayerTypeSettings?: { nonRebirthAdd?: number; rebirthAdd?: number } }>({
    queryKey: ["/api/config"],
  });
  const { data: savedQuotesList = [] } = useQuery<Array<{ id: string; serviceType?: string; customerIdentifier?: string | null; createdByName: string; createdAt: string; inputs?: Record<string, unknown>; results?: { recommendedQuote?: number; estimatedTimeframe?: string } }>>({
    queryKey: ["/api/staff/quotes"],
  });
  const defaultCompanyPct = queueConfig?.quoteGeneratorCompanyPct != null
    ? Math.max(0, Math.min(1, Number(queueConfig.quoteGeneratorCompanyPct) / 100))
    : 0.70;
  const defaultGrinderPct = queueConfig?.quoteGeneratorGrinderPct != null
    ? Math.max(0, Math.min(1, Number(queueConfig.quoteGeneratorGrinderPct) / 100))
    : 0.30;

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
    chosenFinalQuote: Number(chosenFinalQuote) || 0,
    grinderBid: Number(grinderBid) || 0,
  };

  const saveQuoteMutation = useMutation({
    mutationFn: async () => {
      const price = customerPrice;
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
      const discordMsg = buildQuoteDiscordMessage({
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
    queueConfig?.repQuoteSettings,
  ]);

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
        chosenFinalQuote: Number(chosenFinalQuote) || 0,
        grinderBid: Number(grinderBid) || 0,
        myPlayerType,
      };
      return calculateBadgeQuote(badgeInputs, (queueConfig as { badgeQuoteSettings?: unknown })?.badgeQuoteSettings, (queueConfig as { myPlayerTypeSettings?: unknown })?.myPlayerTypeSettings);
    } catch {
      return null;
    }
  }, [badgeIds, urgency, discountPct, creatorCode, creatorDiscountPercentForCode, defaultCompanyPct, defaultGrinderPct, chosenFinalQuote, grinderBid, myPlayerType, queueConfig?.badgeQuoteSettings, queueConfig?.myPlayerTypeSettings]);

  const customerPrice = useMemo(() => {
    if (quoteGeneratorTab === "badge") {
      if (!badgeResults) return 0;
      const custom = Number(chosenFinalQuote) || 0;
      return custom > 0 ? custom : badgeResults.recommendedQuote;
    }
    if (!results) return 0;
    if (quoteSource === "ai") return results.aiSuggestedQuote;
    if (quoteSource === "market") return results.marketQuote;
    const custom = Number(chosenFinalQuote) || 0;
    return custom > 0 ? custom : results.recommendedQuote;
  }, [quoteGeneratorTab, badgeResults, results, quoteSource, chosenFinalQuote]);

  useEffect(() => {
    if (quoteSource === "custom" && (!chosenFinalQuote || Number(chosenFinalQuote) <= 0)) {
      setQuoteSource("ai");
    }
  }, [quoteSource, chosenFinalQuote]);

  const filteredSavedQuotes = useMemo(() => {
    const targetService = quoteGeneratorTab === "rep" ? "rep_grinding" : "badge_grinding";
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
          : (() => { const ids = Array.isArray(q2.inputs?.badgeIds) ? q2.inputs.badgeIds : []; return `${ids.length === 1 ? "**Badge** — " : "**Badges** — "}${formatBadgeRouteFromIds(ids)}`; })();
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

    // Rep-only: Start tier, Target tier
    if (targetService === "rep_grinding") {
      if (filterStartTier) {
        list = list.filter((q2) => String(q2.inputs?.startTier ?? "").toLowerCase() === filterStartTier.toLowerCase());
      }
      if (filterTargetTier) {
        list = list.filter((q2) => String(q2.inputs?.targetTier ?? "").toLowerCase() === filterTargetTier.toLowerCase());
      }
    }

    // Badge-only: Badge count
    if (targetService === "badge_grinding") {
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

    // Rep-only: Start %, Target %
    if (targetService === "rep_grinding") {
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
      <div className="space-y-4 sm:space-y-6 overflow-x-hidden min-w-0 pb-6">
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

        <Tabs value={quoteGeneratorTab} onValueChange={(v) => setQuoteGeneratorTab(v as "rep" | "badge")} className="space-y-4">
          <TabsList className="w-full sm:w-auto grid grid-cols-2 bg-white/[0.04] border border-white/10 p-1 h-auto">
            <TabsTrigger value="rep" className="min-h-11 sm:min-h-9 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/30 border border-transparent text-sm">
              <Zap className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <span className="truncate">Rep Grinding</span>
            </TabsTrigger>
            <TabsTrigger value="badge" className="min-h-11 sm:min-h-9 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:border-primary/30 border border-transparent text-sm">
              <Medal className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              <span className="truncate">Badge Grinding</span>
            </TabsTrigger>
          </TabsList>

        {/* Rep Grinding tab */}
        <TabsContent value="rep" className="mt-0 space-y-4">
        {/* Inputs — sliders + tier/creator dropdowns */}
        <FadeInUp delay={0.04}>
          <Card className="border-0 bg-white/[0.02] border border-white/[0.06]">
            <CardHeader className="pb-4 sm:pb-6">
              <CardTitle className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2 text-primary">
                <Zap className="w-4 h-4 text-primary" />
                REP GRINDING
              </CardTitle>
              <p className="text-xs sm:text-sm text-muted-foreground font-normal">Get a quote for Rep Grinding — You define the tiers, set the urgency, and manage every attribution and payout detail with total oversight</p>
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
                      if (v === "" || /^\d*\.?\d*$/.test(v)) setGrinderBid(v);
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
                      if (v === "" || /^\d*\.?\d*$/.test(v)) setGrinderBid(v);
                    }}
                    className="bg-white/[0.04] border-white/10 h-11 min-h-11 sm:h-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeInUp>
        </TabsContent>
        </Tabs>

        {(quoteGeneratorTab === "rep" ? results : badgeResults) && (
          <>
            {/* KPI row — quotes */}
            <FadeInUp delay={0.06}>
              <div
                className={cn(
                  "grid grid-cols-2 gap-2 sm:gap-4 transition-opacity min-w-0",
                  quoteGeneratorTab === "rep" && "sm:grid-cols-2 lg:grid-cols-4",
                  quoteGeneratorTab === "badge" && "sm:grid-cols-2 lg:grid-cols-3",
                  chosenFinalQuote && Number(chosenFinalQuote) > 0 && "opacity-40"
                )}
              >
                {quoteGeneratorTab === "rep" && results ? (
                  <>
                    <QuoteKpiCard label="Market Suggestion" value={`$${results.marketQuote.toLocaleString()}`} subtitle="Community value" icon={BarChart2} gradient="bg-gradient-to-br from-pink-500/15 via-pink-500/5 to-transparent border border-pink-500/10" iconBg="bg-pink-500/20" textColor="text-pink-400" />
                    <QuoteKpiCard label="AI Suggestion" value={`$${results.aiSuggestedQuote.toLocaleString()}`} subtitle={urgency !== "Normal" ? `${URGENCY_LABELS[urgency]} applied` : "Our value applied"} icon={Bot} gradient="bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent border border-blue-500/10" iconBg="bg-blue-500/20" textColor="text-blue-400" />
                    <QuoteKpiCard label="Recommended Quote" value={`$${results.recommendedQuote.toLocaleString()}`} subtitle={results.recommendedQuote === results.marketQuote ? "Market suggestion" : results.recommendedQuote === results.aiSuggestedQuote ? "AI suggestion" : "Use this quote"} icon={Calculator} gradient="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/10" iconBg="bg-primary/20" textColor="text-primary" borderFlash />
                    <Card className={cn("border-0 overflow-hidden relative group sm:hover:scale-[1.02] transition-transform duration-300 shrink-0", results.marketVsAiGrade === "STRONG" && "bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border border-emerald-500/20", results.marketVsAiGrade === "ACCEPTABLE" && "bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/20", results.marketVsAiGrade === "RISKY" && "bg-gradient-to-br from-red-500/15 via-red-500/5 to-transparent border border-red-500/20")}>
                      <CardContent className="p-3 sm:p-4 relative z-10">
                        <p className="text-[10px] font-medium uppercase tracking-wider text-white/70">Market vs AI</p>
                        <Badge className={cn("text-sm font-semibold border shrink-0 w-fit mt-1", results.marketVsAiGrade === "STRONG" && "border-emerald-500/50 text-emerald-400 bg-emerald-500/20", results.marketVsAiGrade === "ACCEPTABLE" && "border-amber-500/50 text-amber-400 bg-amber-500/20", results.marketVsAiGrade === "RISKY" && "border-red-500/50 text-red-400 bg-red-500/20")}>{results.marketVsAiGrade}</Badge>
                        <p className="text-[10px] text-white/40 mt-0.5">{(results.marketVsAiDiff * 100).toFixed(1)}% difference</p>
                      </CardContent>
                    </Card>
                  </>
                ) : badgeResults ? (
                  <>
                    <QuoteKpiCard label="Base Cost" value={`$${badgeResults.baseCost.toLocaleString()}`} subtitle={`${badgeIds.length} badge${badgeIds.length !== 1 ? "s" : ""} · ${myPlayerType}`} icon={DollarSign} gradient="bg-gradient-to-br from-pink-500/15 via-pink-500/5 to-transparent border border-pink-500/10" iconBg="bg-pink-500/20" textColor="text-pink-400" />
                    <QuoteKpiCard label="Recommended Quote" value={`$${badgeResults.recommendedQuote.toLocaleString()}`} subtitle={urgency !== "Normal" ? `${URGENCY_LABELS[urgency]} applied` : (badgeResults.discountUsed > 0 || badgeResults.creatorDiscount > 0) ? "After discount" : "Base price"} icon={Calculator} gradient="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent border border-primary/10" iconBg="bg-primary/20" textColor="text-primary" borderFlash />
                    <QuoteKpiCard label="Delivery" value={badgeResults.timeframeText} subtitle={`${badgeResults.minDays}–${badgeResults.maxDays} days`} icon={Clock} gradient="bg-gradient-to-br from-blue-500/15 via-blue-500/5 to-transparent border border-blue-500/10" iconBg="bg-blue-500/20" textColor="text-blue-400" />
                  </>
                ) : null}
              </div>
            </FadeInUp>

            {/* KPI row — payout */}
            <FadeInUp delay={0.08}>
              {(() => {
                const r = (quoteGeneratorTab === "rep" ? results : badgeResults)!;
                const chosenNum = Number(chosenFinalQuote) || 0;
                const grinderNum = Number(grinderBid) || 0;
                const hasOverride = chosenNum > 0 || grinderNum > 0;
                const overrideLabel = hasOverride
                  ? [
                      chosenNum > 0 ? `Custom Quote ($${formatUSD(chosenNum)})` : null,
                      grinderNum > 0 ? `Grinder Payout ($${formatUSD(grinderNum)})` : null,
                    ]
                    .filter(Boolean)
                    .join(" · ")
                  : null;
                const overrideIndicator = hasOverride ? (
                  <>
                    With {chosenNum > 0 && <>Custom Quote ({"$" + formatUSD(chosenNum)})</>}
                    {chosenNum > 0 && grinderNum > 0 && <> · </>}
                    {grinderNum > 0 && <span className="text-white/50">Grinder Payout ({"$" + formatUSD(grinderNum)})</span>}
                  </>
                ) : undefined;
                return (
                  <>
                    {overrideLabel && (
                      <p className="text-xs font-bold text-white italic mb-2">
                        Payouts based on: {chosenNum > 0 && <>Custom Quote ({"$" + formatUSD(chosenNum)})</>}
                        {chosenNum > 0 && grinderNum > 0 && <> · </>}
                        {grinderNum > 0 && <span className="text-white/50">Grinder Payout ({"$" + formatUSD(grinderNum)})</span>}
                      </p>
                    )}
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
                            <span className="inline-flex items-center gap-1 text-amber-300">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                              Grinder bid above default %
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
                    {hasOverride && (
                      <p className="text-[10px] text-white italic mt-0.5 sm:mt-1">
                        With {chosenNum > 0 && <>Custom Quote ({"$" + formatUSD(chosenNum)})</>}
                        {chosenNum > 0 && grinderNum > 0 && <> · </>}
                        {grinderNum > 0 && <span className="text-white/50">Grinder Payout ({"$" + formatUSD(grinderNum)})</span>}
                      </p>
                    )}
                  </CardContent>
                </Card>
                    </div>
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
                        { id: "market" as const, label: "Market", value: results.marketQuote, disabled: false },
                        { id: "ai" as const, label: "AI", value: results.aiSuggestedQuote, disabled: false },
                        {
                          id: "custom" as const,
                          label: Number(chosenFinalQuote) > 0 ? `Custom: $${formatUSD(Number(chosenFinalQuote))}` : "Custom: Enter at Custom Quote ($)",
                          value: Number(chosenFinalQuote) || results.recommendedQuote,
                          disabled: !chosenFinalQuote || Number(chosenFinalQuote) <= 0,
                        },
                      ].map(({ id, label, disabled }) => {
                        const selected = quoteSource === id;
                        const btnClasses = cn(
                          "px-4 py-3 min-h-11 rounded-lg text-sm font-medium border transition-colors touch-manipulation",
                          selected && id === "market" && "bg-pink-500/20 text-white border-pink-500/40",
                          selected && id === "ai" && "bg-blue-500/20 text-white border-blue-500/40",
                          selected && id === "custom" && "bg-white/10 text-white border-white/20",
                          !selected && disabled && "bg-white/[0.02] border-white/5 text-muted-foreground/50 cursor-not-allowed",
                          !selected && !disabled && "bg-white/[0.04] border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
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
                    ) : badgeResults ? (
                      <p className="text-sm text-muted-foreground">Quote: ${formatUSD(customerPrice)}</p>
                    ) : null}
                    <p className="text-xs font-medium text-muted-foreground mt-2">Discord preview:</p>
                    <pre className="text-[11px] text-muted-foreground bg-black/20 rounded-lg p-3 mt-1 overflow-x-auto overflow-y-auto max-h-40 sm:max-h-none whitespace-pre-wrap break-words font-mono border border-white/5">
                      {buildQuoteDiscordMessage({
                        customerPrice,
                        estimatedTimeframe: quoteGeneratorTab === "rep" && results ? results.estimatedTimeframe : (badgeResults?.timeframeText ?? ""),
                        timeframeText: (quoteGeneratorTab === "rep" ? results : badgeResults)!.timeframeText,
                        customerIdentifier: customerIdentifier.trim() || undefined,
                        route: quoteGeneratorTab === "rep" ? `${startTier} ${startLvl} → ${targetTier} ${targetLvl}` : (() => { const bb = badgeResults?.badgeBreakdown ?? []; return `${bb.length === 1 ? "**Badge** — " : "**Badges** — "}${formatBadgeRouteForDiscord(bb)}`; })(),
                        serviceLabel: quoteGeneratorTab === "badge" ? "Badge Grinding Quote" : undefined,
                        urgency,
                        creatorCode: creatorCode || undefined,
                        myPlayerType: quoteGeneratorTab === "badge" ? myPlayerType : undefined,
                        startTier: quoteGeneratorTab === "rep" ? startTier : undefined,
                        startLvl: quoteGeneratorTab === "rep" ? startLvl : undefined,
                        startPct: quoteGeneratorTab === "rep" ? (startPct ?? 0) : undefined,
                        targetTier: quoteGeneratorTab === "rep" ? targetTier : undefined,
                        targetLvl: quoteGeneratorTab === "rep" ? targetLvl : undefined,
                        targetPct: quoteGeneratorTab === "rep" ? (targetPct ?? 0) : undefined,
                        ...(((quoteGeneratorTab === "rep" ? results : badgeResults)!.discountUsed ?? 0) > 0 && { discountPercent: ((quoteGeneratorTab === "rep" ? results : badgeResults)!.discountUsed ?? 0) * 100 }),
                      })}
                    </pre>
                  </div>
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2 pt-2 border-t border-white/[0.06]">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10 min-h-11 w-full sm:w-auto touch-manipulation"
                      onClick={() => {
                        const r2 = quoteGeneratorTab === "rep" ? results : badgeResults;
                        const msg = buildQuoteDiscordMessage({
                          customerPrice,
                          estimatedTimeframe: quoteGeneratorTab === "rep" && results ? results.estimatedTimeframe : (badgeResults?.timeframeText ?? ""),
                          timeframeText: r2!.timeframeText,
                          customerIdentifier: customerIdentifier.trim() || undefined,
                          route: quoteGeneratorTab === "rep" ? `${startTier} ${startLvl} → ${targetTier} ${targetLvl}` : (() => { const bb = badgeResults?.badgeBreakdown ?? []; return `${bb.length === 1 ? "**Badge** — " : "**Badges** — "}${formatBadgeRouteForDiscord(bb)}`; })(),
                          serviceLabel: quoteGeneratorTab === "badge" ? "Badge Grinding Quote" : undefined,
                          urgency,
                          creatorCode: creatorCode || undefined,
                          myPlayerType: quoteGeneratorTab === "badge" ? myPlayerType : undefined,
                          startTier: quoteGeneratorTab === "rep" ? startTier : undefined,
                          startLvl: quoteGeneratorTab === "rep" ? startLvl : undefined,
                          startPct: quoteGeneratorTab === "rep" ? (startPct ?? 0) : undefined,
                          targetTier: quoteGeneratorTab === "rep" ? targetTier : undefined,
                          targetLvl: quoteGeneratorTab === "rep" ? targetLvl : undefined,
                          targetPct: quoteGeneratorTab === "rep" ? (targetPct ?? 0) : undefined,
                          ...((r2!.discountUsed ?? 0) > 0 && { discountPercent: (r2!.discountUsed ?? 0) * 100 }),
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
                        placeholder={quoteGeneratorTab === "rep" ? "Search rep quotes by customer, staff, price, route…" : "Search badge quotes by customer, staff, price, badge count…"}
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2 sm:gap-3 p-3 rounded-lg bg-white/[0.02] border border-white/[0.06] overflow-x-auto">
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
                      {quoteGeneratorTab === "rep" ? (
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
                      ) : (
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
