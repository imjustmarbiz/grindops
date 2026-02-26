import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearch } from "wouter";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Crown, Coins, Landmark, AlertTriangle, Trophy, DollarSign, Target, Minus, Plus, Calendar, UserPlus, Loader2, FileText, BarChart3, ScrollText, Send, CheckSquare, MessageSquare, Award, X, Settings, Wrench, Globe } from "lucide-react";
import { FaXbox } from "react-icons/fa6";
import { SiPlaystation } from "react-icons/si";
import { apiRequest, queryClient as qc } from "@/lib/queryClient";
import { categoryIcon as sharedCategoryIcon } from "@/lib/staff-utils";
import { useToast } from "@/hooks/use-toast";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { useTableSort } from "@/hooks/use-table-sort";
import { SortableHeader } from "@/components/sortable-header";
import { BADGE_COMPONENTS, BADGE_META, ALL_BADGE_IDS, type BadgeId } from "@/components/achievement-badges";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import type { Grinder, GrinderBadge } from "@shared/schema";

function formatCurrency(val: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(val);
}

function daysAgo(date: string | Date | null | undefined): { label: string; days: number | null } {
  if (!date) return { label: "Never", days: null };
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return { label: "Today", days: 0 };
  if (diffDays === 1) return { label: "1 day ago", days: 1 };
  return { label: `${diffDays}d ago`, days: diffDays };
}

const ROLE_OPTIONS = ["Grinder", "Elite Grinder", "VC Grinder", "Event Grinder", "International Grinder", "Xbox Grinder", "PS5 Grinder"];

const roleStyle = (r: string) =>
  r === "Elite Grinder" ? "border-cyan-500/30 text-cyan-400 bg-cyan-500/10" :
  r === "VC Grinder" ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" :
  r === "Event Grinder" ? "border-blue-500/30 text-blue-400 bg-blue-500/10" :
  r === "International Grinder" ? "border-pink-500/30 text-pink-400 bg-pink-500/10" :
  r === "Xbox Grinder" ? "border-green-500/30 text-green-400 bg-green-500/10" :
  r === "PS5 Grinder" ? "border-blue-600/30 text-blue-400 bg-blue-600/10" :
  "border-purple-500/30 text-purple-400 bg-purple-500/10";

const tierStyle = (t: string) =>
  t === "Diamond" ? "border-cyan-500/30 text-cyan-300 bg-cyan-500/10" :
  t === "Elite" ? "border-amber-500/30 text-amber-300 bg-amber-500/10" :
  t === "Gold" ? "border-yellow-500/30 text-yellow-400 bg-yellow-500/10" :
  t === "Silver" ? "border-slate-400/30 text-slate-300 bg-slate-400/10" :
  t === "Bronze" ? "border-orange-500/30 text-orange-400 bg-orange-500/10" :
  "border-white/10 text-muted-foreground bg-white/[0.04]";

const TIER_REQUIREMENTS = [
  { tier: "Bronze",  minCompleted: 3,  minQuality: 50, minWinRate: 20, minOnTime: 50, minEarnings: 50 },
  { tier: "Silver",  minCompleted: 10, minQuality: 65, minWinRate: 35, minOnTime: 65, minEarnings: 300 },
  { tier: "Gold",    minCompleted: 25, minQuality: 75, minWinRate: 45, minOnTime: 75, minEarnings: 1000 },
  { tier: "Diamond", minCompleted: 50, minQuality: 85, minWinRate: 55, minOnTime: 85, minEarnings: 2500 },
  { tier: "Elite",   minCompleted: 75, minQuality: 90, minWinRate: 65, minOnTime: 90, minEarnings: 5000 },
];

const TIER_ORDER = ["New", "Bronze", "Silver", "Gold", "Diamond", "Elite"];

function TierProgressBar({ currentTier, grinder }: { currentTier: string; grinder: Grinder }) {
  const currentIdx = TIER_ORDER.indexOf(currentTier);
  const nextIdx = currentIdx + 1;
  if (nextIdx >= TIER_ORDER.length) {
    return <p className="text-[10px] text-amber-400 ml-16">Max tier reached</p>;
  }

  const nextReqs = TIER_REQUIREMENTS[nextIdx - 1];
  if (!nextReqs) return null;

  const completed = grinder.completedOrders || 0;
  const quality = Number(grinder.avgQualityRating) || 0;
  const winRate = Number(grinder.winRate) || 0;
  const onTime = Number(grinder.onTimeRate) || 0;
  const earnings = Number(grinder.totalEarnings) || 0;

  const metrics = [
    { label: "Orders", current: completed, required: nextReqs.minCompleted, fmt: (v: number) => String(v) },
    { label: "Quality", current: quality, required: nextReqs.minQuality, fmt: (v: number) => `${v.toFixed(0)}%` },
    { label: "Win Rate", current: winRate, required: nextReqs.minWinRate, fmt: (v: number) => `${v.toFixed(0)}%` },
    { label: "On-Time", current: onTime, required: nextReqs.minOnTime, fmt: (v: number) => `${v.toFixed(0)}%` },
    { label: "Earnings", current: earnings, required: nextReqs.minEarnings, fmt: (v: number) => `$${v.toFixed(0)}` },
  ];

  return (
    <div className="ml-16 space-y-1">
      <p className="text-[10px] text-muted-foreground">Next: <span className={tierStyle(nextReqs.tier).split(" ").find(c => c.startsWith("text-")) || "text-muted-foreground"}>{nextReqs.tier}</span></p>
      <div className="grid grid-cols-5 gap-1">
        {metrics.map(m => {
          const pct = Math.min(100, (m.current / m.required) * 100);
          const met = m.current >= m.required;
          return (
            <div key={m.label} className="text-center" data-testid={`tier-progress-${m.label.toLowerCase().replace(/\s/g, "-")}`}>
              <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                <div className={`h-full rounded-full transition-all ${met ? "bg-emerald-500" : "bg-primary/60"}`} style={{ width: `${pct}%` }} />
              </div>
              <p className={`text-[9px] mt-0.5 ${met ? "text-emerald-400" : "text-muted-foreground"}`}>
                {m.fmt(m.current)}/{m.fmt(m.required)}
              </p>
              <p className="text-[8px] text-muted-foreground/60">{m.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ScorecardContent({ grinder, handleStrikeChange, onUpdate }: { grinder: Grinder; handleStrikeChange: (g: Grinder, delta: number) => void; onUpdate: (id: string, data: any) => void }) {
  const { data: scorecardData, isLoading: scorecardLoading } = useQuery<any>({
    queryKey: ["/api/staff/grinder-scorecard", grinder.id],
    queryFn: async () => {
      const res = await fetch(`/api/staff/grinder-scorecard/${grinder.id}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch scorecard");
      return res.json();
    },
  });

  const reports: any[] = scorecardData?.reports || [];
  const orderLogs: any[] = scorecardData?.orderLogs || [];
  const strikeLogs: any[] = scorecardData?.strikeLogs || [];

  const currentRoles: string[] = (grinder as any).roles || [];
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(grinder.name);
  const [editRoles, setEditRoles] = useState<string[]>(currentRoles.length > 0 ? currentRoles : [grinder.category || "Grinder"]);
  const [editCapacity, setEditCapacity] = useState(String(grinder.capacity));
  const [editNotes, setEditNotes] = useState(grinder.notes || "");
  const [editTwitch, setEditTwitch] = useState(grinder.twitchUsername || "");
  const { toast } = useToast();

  const [editDisplayRole, setEditDisplayRole] = useState(grinder.displayRole || "");

  const toggleRole = (role: string) => {
    setEditRoles(prev => {
      const next = prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role];
      if (!next.includes(editDisplayRole)) setEditDisplayRole("");
      return next;
    });
  };

  const handleSave = () => {
    if (editRoles.length === 0) {
      toast({ title: "At least one role required", variant: "destructive" });
      return;
    }
    const selectedDisplay = editRoles.length > 1 ? (editDisplayRole || editRoles[0]) : null;
    onUpdate(grinder.id, {
      name: editName.trim() || grinder.name,
      roles: editRoles,
      category: editRoles[0],
      displayRole: selectedDisplay,
      capacity: parseInt(editCapacity) || grinder.capacity,
      notes: editNotes.trim() || null,
      twitchUsername: editTwitch.trim() || null,
    });
    setEditMode(false);
  };

  return (
    <div className="space-y-4 mt-2">
      <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" />
            Profile
          </h3>
          <Button
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 border-white/10"
            onClick={() => setEditMode(!editMode)}
            data-testid="button-toggle-edit-profile"
          >
            <Wrench className="w-3.5 h-3.5" />
            {editMode ? "Cancel" : "Edit"}
          </Button>
        </div>

        {editMode ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Display Name</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="bg-white/[0.03] border-white/10 h-9"
                data-testid="input-edit-grinder-name"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Roles (select multiple)</Label>
              <div className="flex flex-wrap gap-2">
                {ROLE_OPTIONS.map(role => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      editRoles.includes(role)
                        ? roleStyle(role) + " ring-1 ring-white/20"
                        : "border-white/[0.06] text-muted-foreground bg-white/[0.02] hover:bg-white/[0.05]"
                    }`}
                    data-testid={`toggle-role-${role.toLowerCase().replace(/\s/g, "-")}`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {editRoles.length > 1 && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Display Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {editRoles.map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setEditDisplayRole(role)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all flex items-center gap-1.5 ${
                        (editDisplayRole || editRoles[0]) === role
                          ? "border-primary/50 text-primary bg-primary/10 ring-1 ring-primary/30"
                          : "border-white/[0.06] text-muted-foreground bg-white/[0.02] hover:bg-white/[0.05]"
                      }`}
                      data-testid={`toggle-display-icon-${role.toLowerCase().replace(/\s/g, "-")}`}
                    >
                      {sharedCategoryIcon(role)}
                      {role}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">Choose which role icon appears on the grinder list</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Tier (auto-calculated)</Label>
                <div className="h-9 flex items-center px-3 rounded-md bg-white/[0.03] border border-white/10">
                  <Badge variant="outline" className={`text-xs ${tierStyle(grinder.tier || "New")}`}>{grinder.tier || "New"}</Badge>
                  <span className="text-[10px] text-muted-foreground ml-2">Based on performance</span>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Order Capacity</Label>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(e.target.value)}
                  className="bg-white/[0.03] border-white/10 h-9"
                  data-testid="input-edit-capacity"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Twitch Username</Label>
              <Input
                value={editTwitch}
                onChange={(e) => setEditTwitch(e.target.value)}
                placeholder="twitch_username"
                className="bg-white/[0.03] border-white/10 h-9"
                data-testid="input-edit-twitch"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Notes</Label>
              <Textarea
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Internal notes about this grinder..."
                className="bg-white/[0.03] border-white/10 resize-none min-h-[60px]"
                data-testid="input-edit-notes"
              />
            </div>

            <Button
              className="w-full bg-primary/20 text-primary hover:bg-primary/30"
              onClick={handleSave}
              data-testid="button-save-profile"
            >
              Save Changes
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-muted-foreground w-16 shrink-0">Roles</span>
              <div className="flex flex-wrap gap-1.5">
                {currentRoles.length > 0 ? currentRoles.map(r => (
                  <Badge key={r} variant="outline" className={`text-xs ${roleStyle(r)}`} data-testid={`badge-role-${r.toLowerCase().replace(/\s/g, "-")}`}>{r}</Badge>
                )) : (
                  <Badge variant="outline" className={`text-xs ${roleStyle(grinder.category || "Grinder")}`}>{grinder.category || "Grinder"}</Badge>
                )}
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16 shrink-0">Tier</span>
                <Badge variant="outline" className={`text-xs ${tierStyle(grinder.tier || "New")}`} data-testid="badge-tier">
                  {grinder.tier || "New"}
                </Badge>
                <span className="text-[10px] text-muted-foreground">Auto-calculated</span>
              </div>
              <TierProgressBar currentTier={grinder.tier || "New"} grinder={grinder} />
            </div>
            {grinder.twitchUsername && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16 shrink-0">Twitch</span>
                <span className="text-sm text-purple-400">{grinder.twitchUsername}</span>
              </div>
            )}
            {grinder.discordUsername && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16 shrink-0">Discord</span>
                <span className="text-sm">@{grinder.discordUsername}</span>
              </div>
            )}
            <div className="flex items-start gap-2 pt-1 border-t border-white/[0.06]">
              <span className="text-xs text-muted-foreground w-16 shrink-0 mt-0.5">Notes</span>
              {grinder.notes ? (
                <p className="text-sm text-amber-300/90 italic" data-testid="text-grinder-notes">{grinder.notes}</p>
              ) : (
                <p className="text-xs text-muted-foreground/50 italic">No internal notes</p>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { icon: DollarSign, value: formatCurrency(Number(grinder.totalEarnings)), label: "Total Earned", color: "text-emerald-400", bg: "bg-emerald-500/15" },
          { icon: Target, value: `${grinder.completedOrders}/${grinder.totalOrders}`, label: "Completed", color: "text-blue-400", bg: "bg-blue-500/15" },
          { icon: Trophy, value: grinder.winRate ? Number(grinder.winRate).toFixed(0) + "%" : "N/A", label: "Win Rate", color: "text-yellow-400", bg: "bg-yellow-500/15" },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white/[0.03] border border-white/[0.06]">
            <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <p className={`text-sm font-bold ${s.color} leading-tight`}>{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" />
            Performance
          </h3>
          <div className="space-y-1.5">
            {[
              { label: "Capacity", value: `${grinder.activeOrders}/${grinder.capacity}`, color: grinder.activeOrders >= grinder.capacity ? "text-red-400" : "" },
              { label: "Utilization", value: grinder.utilization ? `${Number(grinder.utilization).toFixed(0)}%` : "0%" },
              { label: "On-Time Rate", value: grinder.onTimeRate ? `${Number(grinder.onTimeRate).toFixed(0)}%` : "N/A" },
              { label: "Completion Rate", value: grinder.completionRate ? `${Number(grinder.completionRate).toFixed(0)}%` : "N/A" },
              { label: "Quality Rating", value: grinder.avgQualityRating ? `${(Number(grinder.avgQualityRating) / 20).toFixed(1)}/5` : "N/A" },
              { label: "Avg Turnaround", value: grinder.avgTurnaroundDays ? `${Number(grinder.avgTurnaroundDays).toFixed(1)} days` : "N/A" },
            ].map(m => (
              <div key={m.label} className="flex justify-between py-1.5 px-2 rounded bg-white/[0.02]">
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <span className={`text-xs font-medium ${(m as any).color || ""}`}>{m.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
          <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-violet-400" />
            Activity
          </h3>
          <div className="space-y-1.5">
            {[
              { label: "Orders (Last 7d)", value: String(grinder.ordersAssignedL7D) },
              { label: "Total Reviews", value: String(grinder.totalReviews) },
              { label: "Last Order", value: (() => { const info = daysAgo(grinder.lastAssigned); return grinder.lastAssigned ? `${info.label}` : "Never"; })() },
              { label: "Reassignments", value: String(grinder.reassignmentCount) },
              { label: "Cancel Rate", value: grinder.cancelRate ? `${Number(grinder.cancelRate).toFixed(0)}%` : "N/A" },
            ].map(m => (
              <div key={m.label} className="flex justify-between py-1.5 px-2 rounded bg-white/[0.02]">
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <span className="text-xs font-medium">{m.value}</span>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-white/[0.06]">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs text-muted-foreground uppercase tracking-wider">Strikes</h4>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-7 w-7 border-white/10" onClick={() => handleStrikeChange(grinder, -1)} disabled={grinder.strikes <= 0}>
                  <Minus className="w-3.5 h-3.5" />
                </Button>
                <div className="flex gap-1.5">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={`w-4 h-4 rounded-full ${i < grinder.strikes ? "bg-red-500" : "bg-white/10"}`} />
                  ))}
                </div>
                <span className="text-sm font-bold">{grinder.strikes}/3</span>
                <Button variant="outline" size="icon" className="h-7 w-7 border-white/10" onClick={() => handleStrikeChange(grinder, 1)} disabled={grinder.strikes >= 3}>
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          Strike & Fine History
          <Badge variant="outline" className="text-[10px] ml-auto">{strikeLogs.length}</Badge>
        </h3>
        {scorecardLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : strikeLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No strikes or fines on record.</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {strikeLogs.map((log: any) => (
              <div key={log.id} className={`p-3 rounded-lg border ${log.action === "add" ? "bg-red-500/[0.04] border-red-500/10" : "bg-emerald-500/[0.04] border-emerald-500/10"}`} data-testid={`strike-log-${log.id}`}>
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <div className="flex items-center gap-2">
                    {log.action === "add" ? (
                      <Badge className="border-0 text-[10px] bg-red-500/15 text-red-400">+Strike</Badge>
                    ) : (
                      <Badge className="border-0 text-[10px] bg-emerald-500/15 text-emerald-400">-Strike</Badge>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {log.resultingStrikes}/3 strikes after
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {log.createdAt ? format(new Date(log.createdAt), "MMM d, yyyy h:mm a") : ""}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{log.reason}</p>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {Number(log.fineAmount) > 0 && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3 text-amber-400" />
                      <span className="text-xs font-medium text-amber-400">${Number(log.fineAmount).toFixed(2)} fine</span>
                    </div>
                  )}
                  {Number(log.fineAmount) > 0 && (
                    <Badge variant="outline" className={`text-[10px] ${log.finePaid ? "border-emerald-500/20 text-emerald-400 bg-emerald-500/10" : "border-red-500/20 text-red-400 bg-red-500/10"}`}>
                      {log.finePaid ? "Paid" : "Unpaid"}
                    </Badge>
                  )}
                  {log.finePaid && log.finePaidAt && (
                    <span className="text-[10px] text-muted-foreground">
                      Paid {format(new Date(log.finePaidAt), "MMM d, yyyy")}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground ml-auto">by {log.createdBy}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <FileText className="w-4 h-4 text-violet-400" />
          Performance Reports
          <Badge variant="outline" className="text-[10px] ml-auto">{reports.length}</Badge>
        </h3>
        {scorecardLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : reports.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No performance reports yet.</p>
        ) : (
          <div className="space-y-2">
            {reports.map((report: any) => {
              const metrics = report.metricsSnapshot || {};
              return (
                <div key={report.id} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]" data-testid={`staff-report-${report.id}`}>
                  <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-violet-400" />
                      <span className="text-sm font-medium">#{report.assignmentId}</span>
                      <span className="text-xs text-muted-foreground">{report.createdAt ? new Date(report.createdAt).toLocaleDateString() : ""}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge className={`border-0 text-[10px] ${report.status === "Approved" ? "bg-emerald-500/15 text-emerald-400" : "bg-amber-500/15 text-amber-400"}`}>
                        {report.status}
                      </Badge>
                      {report.overallGrade && (
                        <Badge className={`border-0 text-[10px] ${report.overallGrade === "A" ? "bg-emerald-500/20 text-emerald-400" : report.overallGrade === "B" ? "bg-blue-500/20 text-blue-400" : report.overallGrade === "C" ? "bg-yellow-500/20 text-yellow-400" : "bg-red-500/20 text-red-400"}`}>
                          {report.overallGrade}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                    {[
                      { label: "Quality", value: metrics.qualityScore, color: "text-violet-400" },
                      { label: "Completion", value: metrics.completionRate, color: "text-emerald-400" },
                      { label: "Win Rate", value: metrics.winRate, color: "text-blue-400" },
                      { label: "On-Time", value: metrics.onTimeRate, color: "text-cyan-400" },
                      { label: "Updates", value: report.dailyUpdateCompliance, color: "text-amber-400" },
                    ].map(m => (
                      <div key={m.label} className="text-center p-1.5 rounded bg-white/[0.03]">
                        <p className="text-[9px] text-muted-foreground uppercase">{m.label}</p>
                        <p className={`text-xs font-semibold ${m.color}`}>{m.value != null ? `${Number(m.value).toFixed(0)}%` : "—"}</p>
                      </div>
                    ))}
                  </div>
                  {report.staffNotes && (
                    <div className="mt-2 flex items-start gap-1.5">
                      <MessageSquare className="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">{report.staffNotes}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <ScrollText className="w-4 h-4 text-blue-400" />
          Order Logs
          <Badge variant="outline" className="text-[10px] ml-auto">{orderLogs.length}</Badge>
        </h3>
        {scorecardLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : orderLogs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No order logs yet.</p>
        ) : (
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {orderLogs.map((log: any, idx: number) => (
              <div key={log.id || idx} className="p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]" data-testid={`staff-order-log-${log.id || idx}`}>
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div className="flex items-start gap-2">
                    <div className={`w-7 h-7 rounded-lg ${log.updateType === "progress" ? "bg-blue-500/15" : log.updateType === "completion" ? "bg-emerald-500/15" : "bg-yellow-500/15"} flex items-center justify-center shrink-0 mt-0.5`}>
                      {log.updateType === "completion" ? (
                        <CheckSquare className={`w-3.5 h-3.5 text-emerald-400`} />
                      ) : (
                        <Send className={`w-3.5 h-3.5 ${log.updateType === "progress" ? "text-blue-400" : "text-yellow-400"}`} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{log.orderTitle}</p>
                      <p className="text-[10px] text-muted-foreground">{log.createdAt ? new Date(log.createdAt).toLocaleString() : "N/A"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge className={`border-0 text-[10px] ${log.updateType === "progress" ? "bg-blue-500/20 text-blue-400" : log.updateType === "completion" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}>
                      {log.updateType === "progress" ? "Progress" : log.updateType === "completion" ? "Completion" : log.updateType}
                    </Badge>
                    {log.acknowledgedAt && (
                      <Badge className="border-0 text-[10px] bg-emerald-500/10 text-emerald-400">Ack'd</Badge>
                    )}
                  </div>
                </div>
                <p className="mt-1.5 ml-9 text-xs text-muted-foreground whitespace-pre-wrap">{log.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <BadgeManagement grinderId={grinder.id} grinderName={grinder.name} />
    </div>
  );
}

function BadgeManagement({ grinderId, grinderName }: { grinderId: string; grinderName: string }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedBadge, setSelectedBadge] = useState<BadgeId | "">("");
  const [badgeNote, setBadgeNote] = useState("");

  const { data: assignedBadges, isLoading } = useQuery<GrinderBadge[]>({
    queryKey: ["/api/staff/grinder-badges", grinderId],
    queryFn: async () => {
      const res = await fetch(`/api/staff/grinder-badges/${grinderId}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch badges");
      return res.json();
    },
  });

  const assignedIds = new Set((assignedBadges || []).map(b => b.badgeId));

  const availableBadges = ALL_BADGE_IDS.filter(id => !assignedIds.has(id));

  const assignMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/staff/grinder-badges", {
        grinderId,
        badgeId: selectedBadge,
        note: badgeNote || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/grinder-badges", grinderId] });
      toast({ title: "Badge awarded", description: `${BADGE_META[selectedBadge as BadgeId]?.label} badge given to ${grinderName}` });
      setSelectedBadge("");
      setBadgeNote("");
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Failed to assign badge", variant: "destructive" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: async (badgeDbId: string) => {
      await apiRequest("DELETE", `/api/staff/grinder-badges/${badgeDbId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/grinder-badges", grinderId] });
      toast({ title: "Badge removed" });
    },
  });

  return (
    <div className="space-y-3 p-4 rounded-xl bg-white/[0.03] border border-white/[0.06]">
      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
        <Award className="w-4 h-4 text-amber-400" />
        Achievement Badges
        <Badge variant="outline" className="text-[10px] ml-auto">{assignedBadges?.length || 0} assigned</Badge>
      </h3>

      {isLoading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {assignedBadges && assignedBadges.length > 0 && (
            <TooltipProvider delayDuration={200}>
              <div className="flex flex-wrap gap-2" data-testid="staff-badge-list">
                {assignedBadges.map(badge => {
                  const id = badge.badgeId as BadgeId;
                  const BadgeComp = BADGE_COMPONENTS[id];
                  const meta = BADGE_META[id];
                  if (!BadgeComp || !meta) return null;
                  return (
                    <div key={badge.id} className="relative group" data-testid={`staff-badge-${id}`}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex flex-col items-center gap-0.5">
                            <BadgeComp />
                            <span className="text-[9px] font-semibold text-muted-foreground/80 leading-none text-center max-w-[64px] truncate">{meta.label}</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="text-xs">
                          <p className="font-bold">{meta.label}</p>
                          <p>{meta.tooltip}</p>
                          {badge.awardedByName && <p className="text-muted-foreground mt-1">Awarded by {badge.awardedByName}</p>}
                          {badge.note && <p className="text-muted-foreground italic">"{badge.note}"</p>}
                          <p className="text-[10px] text-muted-foreground/60 mt-1">{meta.category === "auto" ? "Auto-earned" : "Staff awarded"}</p>
                        </TooltipContent>
                      </Tooltip>
                      {meta.category !== "auto" && (
                        <button
                          onClick={() => removeMutation.mutate(badge.id)}
                          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          data-testid={`remove-badge-${id}`}
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </TooltipProvider>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-white/[0.06]">
            <Select value={selectedBadge} onValueChange={(v) => setSelectedBadge(v as BadgeId)}>
              <SelectTrigger className="flex-1 h-9 text-sm bg-white/[0.03] border-white/10" data-testid="select-badge">
                <SelectValue placeholder="Select badge to award..." />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {availableBadges.map(id => (
                  <SelectItem key={id} value={id} data-testid={`badge-option-${id}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{BADGE_META[id].label}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {BADGE_META[id].category === "auto" ? "(auto)" : "(manual)"}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Textarea
              value={badgeNote}
              onChange={e => setBadgeNote(e.target.value)}
              placeholder="Optional note..."
              className="flex-1 h-9 min-h-[36px] text-sm bg-white/[0.03] border-white/10 resize-none"
              rows={1}
              data-testid="input-badge-note"
            />
            <Button
              size="sm"
              onClick={() => assignMutation.mutate()}
              disabled={!selectedBadge || assignMutation.isPending}
              className="bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 border-amber-500/30"
              data-testid="button-award-badge"
            >
              {assignMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4 mr-1" />}
              Award
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

export default function Grinders() {
  const queryClient = useQueryClient();
  const { data: grinders, isLoading } = useQuery<Grinder[]>({ queryKey: ["/api/grinders"], refetchInterval: 30000 });
  const [selectedGrinder, setSelectedGrinder] = useState<Grinder | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({ discordUserId: "", name: "", category: "Grinder", capacity: "3" });
  const { toast } = useToast();
  const searchString = useSearch();

  useEffect(() => {
    if (!grinders) return;
    const params = new URLSearchParams(searchString);
    const scorecardId = params.get("scorecard");
    if (scorecardId) {
      const g = grinders.find(gr => gr.id === scorecardId);
      if (g) setSelectedGrinder(g);
    }
  }, [grinders, searchString]);

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/grinders/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      toast({ title: "Grinder updated" });
    },
  });

  const addGrinderMutation = useMutation({
    mutationFn: async (data: { discordUserId: string; name?: string; category?: string; capacity?: number }) => {
      const res = await apiRequest("POST", "/api/grinders", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinders"] });
      setShowAddDialog(false);
      setAddForm({ discordUserId: "", name: "", category: "Grinder", capacity: "3" });
      toast({ title: "Grinder added", description: `${data.name} has been added to the roster.` });
    },
    onError: (e: any) => toast({ title: "Failed to add grinder", description: e.message, variant: "destructive" }),
  });

  const handleAddGrinder = () => {
    if (!addForm.discordUserId.trim()) {
      toast({ title: "Discord ID required", description: "Please enter the grinder's Discord User ID.", variant: "destructive" });
      return;
    }
    addGrinderMutation.mutate({
      discordUserId: addForm.discordUserId.trim(),
      name: addForm.name.trim() || undefined,
      category: addForm.category,
      capacity: parseInt(addForm.capacity) || 3,
    });
  };

  const handleStrikeChange = (grinder: Grinder, delta: number) => {
    const newStrikes = Math.max(0, Math.min(3, grinder.strikes + delta));
    updateMutation.mutate({ id: grinder.id, data: { strikes: newStrikes } });
  };

  const grinderHasRole = (g: Grinder, role: string) => {
    const roles = (g as any).roles as string[] | null | undefined;
    if (roles && roles.length > 0) return roles.includes(role);
    return (g.category || "Grinder") === role;
  };
  const categories = ["All", "Elite Grinder", "Grinder", "VC Grinder", "Event Grinder", "International Grinder", "Xbox Grinder", "PS5 Grinder"];

  const categoryIcon = (cat: string) => {
    if (cat === "Elite Grinder") return <Crown className="w-4 h-4 text-cyan-400" />;
    if (cat === "VC Grinder") return <Coins className="w-4 h-4 text-yellow-400" />;
    if (cat === "Event Grinder") return <Landmark className="w-4 h-4 text-blue-400" />;
    if (cat === "International Grinder") return <Globe className="w-4 h-4 text-pink-400" />;
    if (cat === "Xbox Grinder") return <FaXbox className="w-4 h-4 text-green-400" />;
    if (cat === "PS5 Grinder") return <SiPlaystation className="w-4 h-4 text-blue-400" />;
    return <Users className="w-4 h-4 text-purple-400" />;
  };

  const filterGrinders = (category: string) => {
    if (!grinders) return [];
    if (category === "All") return grinders;
    return grinders.filter(g => grinderHasRole(g, category));
  };

  function GrinderTable({ grinders: filteredGrinders, isLoading }: { grinders: Grinder[]; isLoading: boolean }) {
    const { sortedItems, sortKey: currentSortKey, sortDir: currentSortDir, toggleSort } = useTableSort<Grinder>(filteredGrinders);
    const sortProps = { currentSortKey, currentSortDir, onToggle: toggleSort };

    if (isLoading) {
      return (
        <Card className="border-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01]">
          <CardContent className="p-8 text-center">Loading...</CardContent>
        </Card>
      );
    }

    if (sortedItems.length === 0) {
      return (
        <Card className="border-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01]">
          <CardContent className="p-8 text-center text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-20" />
            No grinders in this category
          </CardContent>
        </Card>
      );
    }

    return (
      <>
        <div className="sm:hidden space-y-2">
          {sortedItems.map(g => {
            const winRateNum = g.winRate ? Number(g.winRate) : null;
            const lastInfo = daysAgo(g.lastAssigned);
            const lastColor = lastInfo.days === null ? "text-muted-foreground" : lastInfo.days <= 3 ? "text-green-400" : lastInfo.days <= 7 ? "text-yellow-400" : "text-red-400";
            return (
              <Card key={g.id} className="border-0 bg-white/[0.03] active:bg-white/[0.06] transition-colors cursor-pointer" onClick={() => setSelectedGrinder(g)} data-testid={`row-grinder-${g.id}`}>
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {categoryIcon(g.displayRole || g.category || "Grinder")}
                      <div className="min-w-0">
                        <span className="font-medium text-sm block truncate" data-testid={`text-grinder-name-${g.id}`}>{g.name}</span>
                        {g.discordUsername && <p className="text-[10px] text-muted-foreground truncate">@{g.discordUsername}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className={`w-2.5 h-2.5 rounded-full ${i < g.strikes ? "bg-red-500" : "bg-white/10"}`} />
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(g.roles as string[] | null)?.length ? (g.roles as string[]).map((r: string) => (
                      <Badge key={r} variant="outline" className={`text-[10px] px-1.5 py-0 ${roleStyle(r)}`}>{r}</Badge>
                    )) : (
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${roleStyle(g.category || "Grinder")}`}>{g.category || "Grinder"}</Badge>
                    )}
                    {g.tier && g.tier !== "New" && (
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${tierStyle(g.tier)}`}>{g.tier}</Badge>
                    )}
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div>
                      <p className={`text-xs font-bold ${g.activeOrders >= g.capacity ? "text-red-400" : ""}`}>{g.activeOrders}/{g.capacity}</p>
                      <p className="text-[9px] text-muted-foreground">Capacity</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-emerald-400">{formatCurrency(Number(g.totalEarnings))}</p>
                      <p className="text-[9px] text-muted-foreground">Earned</p>
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${winRateNum !== null ? (winRateNum >= 70 ? "text-green-400" : winRateNum >= 40 ? "text-yellow-400" : "text-red-400") : "text-muted-foreground"}`}>
                        {winRateNum !== null ? `${winRateNum.toFixed(0)}%` : "N/A"}
                      </p>
                      <p className="text-[9px] text-muted-foreground">Win Rate</p>
                    </div>
                    <div>
                      <p className={`text-xs font-bold ${lastColor}`}>{lastInfo.label}</p>
                      <p className="text-[9px] text-muted-foreground">Last Order</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="border-0 bg-gradient-to-br from-white/[0.03] to-white/[0.01] overflow-hidden hidden sm:block">
          <div className="overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader className="bg-white/[0.03]">
              <TableRow className="border-white/[0.06]">
                <SortableHeader label="Grinder" sortKey="name" {...sortProps} />
                <SortableHeader label="Tier" sortKey="category" {...sortProps} />
                <SortableHeader label="Capacity" sortKey="activeOrders" className="text-center" {...sortProps} />
                <SortableHeader label="Orders" sortKey="totalOrders" className="text-center" {...sortProps} />
                <SortableHeader label="Earnings" sortKey="totalEarnings" className="text-right" {...sortProps} />
                <SortableHeader label="Win Rate" sortKey="winRate" className="text-center" {...sortProps} />
                <SortableHeader label="Last Order" sortKey="lastAssigned" className="text-center" {...sortProps} />
                <SortableHeader label="Strikes" sortKey="strikes" className="text-center" {...sortProps} />
                <TableHead className="text-center whitespace-nowrap">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedItems.map(g => {
                const winRateNum = g.winRate ? Number(g.winRate) : null;
                return (
                  <TableRow key={g.id} className="hover:bg-white/[0.03] cursor-pointer border-white/[0.04] transition-colors" onClick={() => setSelectedGrinder(g)} data-testid={`row-grinder-${g.id}`}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {categoryIcon(g.displayRole || g.category || "Grinder")}
                        <div>
                          <span className="font-medium" data-testid={`text-grinder-name-${g.id}`}>{g.name}</span>
                          {g.discordUsername && <p className="text-xs text-muted-foreground">@{g.discordUsername}</p>}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(g.roles as string[] | null)?.length ? (g.roles as string[]).map((r: string) => (
                          <Badge key={r} variant="outline" className={`text-xs ${roleStyle(r)}`}>{r}</Badge>
                        )) : (
                          <Badge variant="outline" className={`text-xs ${roleStyle(g.category || "Grinder")}`}>{g.category || "Grinder"}</Badge>
                        )}
                        {g.tier && g.tier !== "New" && (
                          <Badge variant="outline" className={`text-[10px] ${tierStyle(g.tier)}`}>{g.tier}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={g.activeOrders >= g.capacity ? "text-red-400 font-bold" : "text-muted-foreground"}>
                        {g.activeOrders}/{g.capacity}
                      </span>
                    </TableCell>
                    <TableCell className="text-center whitespace-nowrap">
                      <div>
                        <span className="font-medium">{g.totalOrders}</span>
                        <span className="text-xs text-muted-foreground ml-1">({g.completedOrders} done)</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold text-emerald-400 whitespace-nowrap">
                      {formatCurrency(Number(g.totalEarnings))}
                    </TableCell>
                    <TableCell className="text-center">
                      {winRateNum !== null ? (
                        <span className={`font-medium ${winRateNum >= 70 ? "text-green-400" : winRateNum >= 40 ? "text-yellow-400" : "text-red-400"}`}>
                          {winRateNum.toFixed(0)}%
                        </span>
                      ) : <span className="text-muted-foreground">N/A</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {(() => {
                        const info = daysAgo(g.lastAssigned);
                        const colorClass = info.days === null ? "text-muted-foreground" : info.days <= 3 ? "text-green-400" : info.days <= 7 ? "text-yellow-400" : "text-red-400";
                        return (
                          <div className="flex flex-col items-center">
                            <span className={`text-sm font-medium ${colorClass}`}>{info.label}</span>
                            {g.lastAssigned && (
                              <span className="text-[10px] text-muted-foreground">{new Date(g.lastAssigned).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                            )}
                          </div>
                        );
                      })()}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1" onClick={e => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStrikeChange(g, -1)} disabled={g.strikes <= 0} data-testid={`button-strike-minus-${g.id}`}>
                          <Minus className="w-3 h-3" />
                        </Button>
                        <div className="flex gap-1">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className={`w-3 h-3 rounded-full ${i < g.strikes ? "bg-red-500" : "bg-white/10"}`} />
                          ))}
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStrikeChange(g, 1)} disabled={g.strikes >= 3} data-testid={`button-strike-plus-${g.id}`}>
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button variant="outline" size="sm" className="text-xs bg-white/[0.03] border-white/10 hover:bg-white/10 hover:text-primary" onClick={(e) => { e.stopPropagation(); setSelectedGrinder(g); }} data-testid={`button-scorecard-${g.id}`}>
                        Scorecard
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          </div>
        </Card>
      </>
    );
  }

  return (
    <AnimatedPage className="space-y-5">
      <FadeInUp>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight flex items-center gap-3" data-testid="text-grinders-title">
            <Users className="w-7 h-7 text-primary" />
            Grinder Roster
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Auto-imported from MGT Bot. Click a grinder to view their scorecard.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-primary/15 text-primary border border-primary/20 gap-1">
            <Users className="w-3 h-3" />
            {(grinders || []).length} total
          </Badge>
          <Button size="sm" className="gap-1.5" onClick={() => setShowAddDialog(true)} data-testid="button-add-grinder">
            <UserPlus className="w-4 h-4" />
            Add Grinder
          </Button>
        </div>
      </div>
      </FadeInUp>

      <FadeInUp>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2 sm:gap-3">
        {[
          { label: "Elite", count: filterGrinders("Elite Grinder").length, icon: Crown, gradient: "from-cyan-500/[0.08] via-background to-cyan-900/[0.04]", iconBg: "bg-cyan-500/15", color: "text-cyan-400" },
          { label: "Grinder", count: filterGrinders("Grinder").length, icon: Users, gradient: "from-purple-500/[0.08] via-background to-purple-900/[0.04]", iconBg: "bg-purple-500/15", color: "text-purple-400" },
          { label: "VC", count: filterGrinders("VC Grinder").length, icon: Coins, gradient: "from-yellow-500/[0.08] via-background to-yellow-900/[0.04]", iconBg: "bg-yellow-500/15", color: "text-yellow-400" },
          { label: "Event", count: filterGrinders("Event Grinder").length, icon: Landmark, gradient: "from-blue-500/[0.08] via-background to-blue-900/[0.04]", iconBg: "bg-blue-500/15", color: "text-blue-400" },
          { label: "Int'l", count: filterGrinders("International Grinder").length, icon: Globe, gradient: "from-pink-500/[0.08] via-background to-pink-900/[0.04]", iconBg: "bg-pink-500/15", color: "text-pink-400" },
          { label: "Xbox", count: filterGrinders("Xbox Grinder").length, icon: FaXbox, gradient: "from-green-500/[0.08] via-background to-green-900/[0.04]", iconBg: "bg-green-500/15", color: "text-green-400" },
          { label: "PS5", count: filterGrinders("PS5 Grinder").length, icon: SiPlaystation, gradient: "from-blue-600/[0.08] via-background to-blue-900/[0.04]", iconBg: "bg-blue-600/15", color: "text-blue-400" },
        ].map(s => (
          <Card key={s.label} className={`border-0 bg-gradient-to-br ${s.gradient} overflow-hidden relative`}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/[0.02] -translate-y-6 translate-x-6" />
            <CardContent className="p-2.5 sm:p-4 flex items-center gap-2 sm:gap-3 relative">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl ${s.iconBg} flex items-center justify-center shrink-0`}>
                <s.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${s.color}`} />
              </div>
              <div>
                <p className={`text-lg sm:text-xl font-bold ${s.color}`}>{s.count}</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      </FadeInUp>

      <FadeInUp>
      <Tabs defaultValue="All">
        <div className="overflow-x-auto -mx-1 px-1 pb-1">
          <TabsList className="bg-white/[0.03] border border-white/[0.06] w-max">
            {categories.map(cat => (
              <TabsTrigger key={cat} value={cat} className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary text-xs sm:text-sm whitespace-nowrap" data-testid={`tab-${cat.toLowerCase().replace(/\s/g, "-")}`}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {categories.map(cat => (
          <TabsContent key={cat} value={cat}>
            <GrinderTable grinders={filterGrinders(cat)} isLoading={!!isLoading} />
          </TabsContent>
        ))}
      </Tabs>
      </FadeInUp>

      <Dialog open={!!selectedGrinder} onOpenChange={() => setSelectedGrinder(null)}>
        <DialogContent className="sm:max-w-[800px] max-h-[85vh] overflow-y-auto border-white/10 bg-background/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              {selectedGrinder && categoryIcon(selectedGrinder.displayRole || selectedGrinder.category || "Grinder")}
              {selectedGrinder?.name} - Scorecard
            </DialogTitle>
          </DialogHeader>
          {selectedGrinder && (
            <ScorecardContent grinder={selectedGrinder} handleStrikeChange={handleStrikeChange} onUpdate={(id, data) => updateMutation.mutate({ id, data })} />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="bg-[#0a0a0f] border-white/[0.08] max-w-md" data-testid="dialog-add-grinder">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <UserPlus className="w-4 h-4 text-emerald-400" />
              </div>
              Add Grinder
            </DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Enter their Discord User ID. Their name and roles will be pulled from Discord automatically.
            </p>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="add-discord-id" className="text-sm font-medium">Discord User ID *</Label>
              <Input
                id="add-discord-id"
                value={addForm.discordUserId}
                onChange={(e) => setAddForm({ ...addForm, discordUserId: e.target.value })}
                placeholder="e.g. 123456789012345678"
                className="bg-white/[0.03] border-white/[0.08] font-mono"
                data-testid="input-add-grinder-discord-id"
              />
              <p className="text-xs text-muted-foreground">Right-click user in Discord → Copy User ID (enable Developer Mode in Discord settings)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-name" className="text-sm font-medium">Display Name (optional)</Label>
              <Input
                id="add-name"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                placeholder="Auto-detected from Discord if left blank"
                className="bg-white/[0.03] border-white/[0.08]"
                data-testid="input-add-grinder-name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Category</Label>
                <Select value={addForm.category} onValueChange={(v) => setAddForm({ ...addForm, category: v })}>
                  <SelectTrigger className="bg-white/[0.03] border-white/[0.08]" data-testid="select-add-grinder-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(role => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="add-capacity" className="text-sm font-medium">Order Limit</Label>
                <Input
                  id="add-capacity"
                  type="number"
                  min="1"
                  max="10"
                  value={addForm.capacity}
                  onChange={(e) => setAddForm({ ...addForm, capacity: e.target.value })}
                  className="bg-white/[0.03] border-white/[0.08]"
                  data-testid="input-add-grinder-capacity"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowAddDialog(false)} className="border-white/[0.08]" data-testid="button-add-grinder-cancel">
              Cancel
            </Button>
            <Button
              onClick={handleAddGrinder}
              disabled={addGrinderMutation.isPending}
              className="gap-2"
              data-testid="button-add-grinder-submit"
            >
              {addGrinderMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              Add Grinder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  );
}
