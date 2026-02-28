import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { staffNavItems, grinderNavItems, getFilteredStaffNavItems } from "@/components/layout";
import {
  ChevronRight, ChevronLeft, X, GraduationCap, MousePointerClick, Eye, Zap,
  FileCheck, Gavel, Banknote, LayoutDashboard, Bell, MessageCircle, Brain,
  Crown, Settings, ListOrdered, Users, ClipboardCheck, BarChart3, Rocket,
  CheckCircle2, Play, AlertTriangle, Star, CalendarDays, Tv, Newspaper,
  BookOpen, ScrollText, Wrench, Package, Award, TrendingUp, ClipboardList,
  FileBarChart, Wallet, DollarSign, UserCheck, Calendar, Shield, Upload,
  Sparkles, LogIn, LogOut, Clock, Monitor, ArrowRight, Timer, Hash,
  Gamepad2, Video, CircleDot, Activity
} from "lucide-react";

type DemoStep = { label: string; icon: any; color: string };

interface PageMeta {
  description: string;
  demoSteps?: DemoStep[];
  mockupId?: string;
}

function MockOrderCard({ step, service, price, platform, dueIn, complexity, bids, isReplacement }: {
  step: number; service: string; price: string; platform: string; dueIn: string; complexity: number; bids: number; isReplacement?: boolean;
}) {
  return (
    <div className={`rounded-lg border p-2.5 transition-all duration-500 ${
      step >= 1 ? "bg-white/[0.04] border-white/10 scale-[1.02]" : "bg-white/[0.02] border-white/[0.06] opacity-60"
    }`}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Hash className="w-3 h-3 text-muted-foreground" />
          <span className="text-[10px] font-mono text-muted-foreground">#MGT-4821</span>
          {isReplacement && <Badge className="text-[8px] px-1 py-0 bg-red-500/20 text-red-400 border-red-500/20">REPLACEMENT</Badge>}
        </div>
        <div className="flex items-center gap-1">
          <Timer className="w-3 h-3 text-amber-400" />
          <span className="text-[9px] text-amber-400">Bidding: 8:42</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium">{service}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Gamepad2 className="w-2.5 h-2.5" />{platform}</span>
            <span className="text-[10px] text-muted-foreground">Due: {dueIn}</span>
            <span className="text-[10px] text-muted-foreground">⚡{complexity}/5</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-emerald-400">{price}</p>
          <span className="text-[9px] text-muted-foreground">{bids} bids</span>
        </div>
      </div>
      {step >= 2 && (
        <div className="mt-2 flex items-center gap-2 animate-in fade-in duration-500">
          <div className="flex-1 bg-white/[0.06] rounded px-2 py-1">
            <span className="text-[9px] text-muted-foreground">Your bid: </span>
            <span className="text-[10px] font-bold text-white">$65.00</span>
          </div>
          <div className="bg-purple-500/20 text-purple-400 text-[9px] px-2 py-1 rounded font-medium">Place Bid →</div>
        </div>
      )}
    </div>
  );
}

function MockAssignmentCard({ step }: { step: number }) {
  const buttons = [
    { label: "Accept", icon: CheckCircle2, done: step >= 1, active: step === 0, color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" },
    { label: "Log In", icon: LogIn, done: step >= 2, active: step === 1, color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
    { label: "Start", icon: Play, done: step >= 3, active: step === 2, color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30" },
    { label: "Log Off", icon: LogOut, done: step >= 4, active: step === 3, color: "bg-amber-500/20 text-amber-400 border-amber-500/30" },
    { label: "Complete", icon: Upload, done: false, active: step === 4, color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
  ];

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge className="text-[8px] px-1.5 py-0 bg-[#5865F2]/20 text-[#5865F2] border-[#5865F2]/30">In Progress</Badge>
          <span className="text-[10px] font-mono text-muted-foreground">#MGT-4821</span>
        </div>
        <span className="text-xs font-medium text-emerald-400">$85.00</span>
      </div>
      <p className="text-[11px] font-medium">VC Grinding 🪙 · PlayStation</p>
      <div className="flex items-center gap-1 flex-wrap">
        {buttons.map((btn, i) => {
          const Icon = btn.icon;
          return (
            <div
              key={i}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] border transition-all duration-500 ${
                btn.done ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                btn.active ? `${btn.color} scale-105 ring-1 ring-white/20` :
                "bg-white/[0.03] text-white/20 border-white/[0.06]"
              }`}
            >
              {btn.done ? <CheckCircle2 className="w-2.5 h-2.5" /> : <Icon className="w-2.5 h-2.5" />}
              {btn.label}
            </div>
          );
        })}
      </div>
      {step === 4 && (
        <div className="flex items-center gap-1.5 p-1.5 rounded bg-purple-500/10 border border-purple-500/20 animate-in fade-in duration-500">
          <Video className="w-3 h-3 text-purple-400" />
          <span className="text-[9px] text-purple-400">Upload proof video to mark complete</span>
        </div>
      )}
      {step >= 1 && step < 4 && (
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground animate-in fade-in duration-300">
          <Activity className="w-3 h-3" />
          <span>{step === 1 ? "Accepted ticket — ready to log in" : step === 2 ? "Logged in — start the order" : "Order started — complete when done"}</span>
        </div>
      )}
    </div>
  );
}

function MockBidCard({ step }: { step: number }) {
  const states = [
    { status: "Pending", color: "bg-yellow-500/20 text-yellow-400", desc: "Bid submitted — waiting for review" },
    { status: "Ranked #2", color: "bg-cyan-500/20 text-cyan-400", desc: "AI Queue scored your bid" },
    { status: "Accepted!", color: "bg-emerald-500/20 text-emerald-400", desc: "You won! Order assigned to you" },
  ];
  const current = states[Math.min(step, states.length - 1)];

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Gavel className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-medium">Your Bid on #MGT-4821</span>
        </div>
        <Badge className={`text-[8px] px-1.5 py-0 ${current.color} transition-all duration-500`}>{current.status}</Badge>
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <div className="bg-white/[0.04] rounded px-2 py-1">
          <span className="text-[8px] text-muted-foreground block">Amount</span>
          <span className="text-[11px] font-bold">$65.00</span>
        </div>
        <div className="bg-white/[0.04] rounded px-2 py-1">
          <span className="text-[8px] text-muted-foreground block">Timeline</span>
          <span className="text-[11px] font-medium">2 days</span>
        </div>
        <div className="bg-white/[0.04] rounded px-2 py-1">
          <span className="text-[8px] text-muted-foreground block">Start</span>
          <span className="text-[11px] font-medium">Today</span>
        </div>
      </div>
      {step >= 1 && (
        <div className="flex items-center gap-2 p-1.5 rounded bg-white/[0.04] animate-in fade-in duration-500">
          <Brain className="w-3.5 h-3.5 text-cyan-400" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-[9px] text-muted-foreground">AI Queue Rank</span>
              <span className="text-[10px] font-bold text-cyan-400">#2 of 6</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full mt-0.5">
              <div className="h-1 bg-cyan-400 rounded-full transition-all duration-700" style={{ width: "75%" }} />
            </div>
          </div>
        </div>
      )}
      {step >= 2 && (
        <div className="flex items-center gap-2 p-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 animate-in fade-in duration-500">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-[10px] text-emerald-400 font-medium">Order assigned — go to Assignments!</span>
          <ArrowRight className="w-3 h-3 text-emerald-400 ml-auto" />
        </div>
      )}
      <p className="text-[9px] text-muted-foreground italic">{current.desc}</p>
    </div>
  );
}

function MockPayoutCard({ step, isStaff }: { step: number; isStaff?: boolean }) {
  if (isStaff) {
    const stages = ["Pending Review", "Approved", "Paid"];
    const stageIdx = Math.min(step, 2);
    return (
      <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="w-3.5 h-3.5 text-green-400" />
            <span className="text-xs font-medium">Payout Request</span>
          </div>
          <Badge className={`text-[8px] px-1.5 py-0 ${
            stageIdx === 0 ? "bg-yellow-500/20 text-yellow-400" : stageIdx === 1 ? "bg-blue-500/20 text-blue-400" : "bg-emerald-500/20 text-emerald-400"
          }`}>{stages[stageIdx]}</Badge>
        </div>
        <div className="flex items-center justify-between bg-white/[0.04] rounded px-2 py-1.5">
          <div>
            <span className="text-[9px] text-muted-foreground">Grinder: </span>
            <span className="text-[11px] font-medium">ProGrinder99</span>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-emerald-400">$85.00</span>
            <span className="text-[9px] text-muted-foreground block">via Cash App</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {step === 0 && (
            <>
              <div className="flex-1 bg-emerald-500/20 text-emerald-400 text-[9px] text-center py-1 rounded font-medium">Approve</div>
              <div className="flex-1 bg-red-500/20 text-red-400 text-[9px] text-center py-1 rounded font-medium">Deny</div>
              <div className="flex-1 bg-amber-500/20 text-amber-400 text-[9px] text-center py-1 rounded font-medium">Reduce</div>
            </>
          )}
          {step === 1 && (
            <div className="flex-1 bg-blue-500/20 text-blue-400 text-[9px] text-center py-1 rounded font-medium animate-in fade-in duration-500">
              💰 Mark Paid — upload proof
            </div>
          )}
          {step === 2 && (
            <div className="flex items-center gap-1.5 flex-1 p-1 rounded bg-emerald-500/10 border border-emerald-500/20 animate-in fade-in duration-500">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              <span className="text-[9px] text-emerald-400">Paid — grinder notified</span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Your Earnings</span>
        <span className="text-sm font-bold text-emerald-400">$1,250.00</span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <div className="bg-white/[0.04] rounded px-2 py-1">
          <span className="text-[8px] text-muted-foreground block">Pending</span>
          <span className="text-[11px] font-bold text-yellow-400">$200.00</span>
        </div>
        <div className="bg-white/[0.04] rounded px-2 py-1">
          <span className="text-[8px] text-muted-foreground block">Paid</span>
          <span className="text-[11px] font-bold text-emerald-400">$1,050.00</span>
        </div>
      </div>
      {step >= 1 && (
        <div className="bg-white/[0.04] rounded px-2 py-1.5 animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-muted-foreground">Request: $200 via Cash App</span>
            <Badge className={`text-[8px] px-1 py-0 ${step >= 2 ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`}>
              {step >= 2 ? "Approved" : "Pending"}
            </Badge>
          </div>
        </div>
      )}
      {step >= 2 && (
        <div className="flex items-center gap-1.5 p-1 rounded bg-emerald-500/10 border border-emerald-500/20 animate-in fade-in duration-500">
          <DollarSign className="w-3 h-3 text-emerald-400" />
          <span className="text-[9px] text-emerald-400">Payout sent to your Cash App!</span>
        </div>
      )}
    </div>
  );
}

function MockDashboardCard({ step, isStaff }: { step: number; isStaff?: boolean }) {
  if (isStaff) {
    return (
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { label: "Revenue", value: "$12,450", icon: DollarSign, color: "text-green-400" },
            { label: "Payouts", value: "$8,200", icon: Banknote, color: "text-blue-400" },
            { label: "Profit", value: "$4,250", icon: TrendingUp, color: "text-emerald-400" },
            { label: "Avg Order", value: "$95", icon: BarChart3, color: "text-cyan-400" },
          ].map((kpi, i) => {
            const Icon = kpi.icon;
            return (
              <div key={i} className={`rounded-lg bg-white/[0.04] border border-white/[0.06] p-2 transition-all duration-500 ${
                step === i ? "ring-1 ring-primary/40 scale-[1.03]" : ""
              }`}>
                <div className="flex items-center gap-1 mb-0.5">
                  <Icon className={`w-3 h-3 ${kpi.color}`} />
                  <span className="text-[8px] text-muted-foreground">{kpi.label}</span>
                </div>
                <span className="text-sm font-bold">{kpi.value}</span>
              </div>
            );
          })}
        </div>
        {step >= 2 && (
          <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-2 animate-in fade-in duration-500">
            <span className="text-[9px] text-muted-foreground block mb-1">Order Pipeline</span>
            <div className="flex items-center gap-0.5 h-2 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-l" style={{ width: "20%" }} />
              <div className="h-full bg-amber-500" style={{ width: "15%" }} />
              <div className="h-full bg-[#5865F2]" style={{ width: "25%" }} />
              <div className="h-full bg-emerald-500" style={{ width: "25%" }} />
              <div className="h-full bg-cyan-500 rounded-r" style={{ width: "15%" }} />
            </div>
            <div className="flex items-center justify-between mt-1">
              {["Open", "Assigned", "Active", "Done", "Paid"].map((s, i) => (
                <span key={i} className="text-[7px] text-muted-foreground">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { label: "Active", value: "2", color: "text-blue-400" },
          { label: "Completed", value: "15", color: "text-emerald-400" },
          { label: "Earned", value: "$1,250", color: "text-green-400" },
        ].map((stat, i) => (
          <div key={i} className={`rounded bg-white/[0.04] border border-white/[0.06] p-1.5 text-center transition-all duration-500 ${
            step === i ? "ring-1 ring-primary/40 scale-[1.03]" : ""
          }`}>
            <span className={`text-sm font-bold ${stat.color}`}>{stat.value}</span>
            <span className="text-[8px] text-muted-foreground block">{stat.label}</span>
          </div>
        ))}
      </div>
      {step >= 1 && (
        <div className="rounded bg-white/[0.04] border border-white/[0.06] p-2 animate-in fade-in duration-500">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] font-medium">Availability</span>
            <div className="flex items-center gap-1">
              <CircleDot className="w-2.5 h-2.5 text-green-400" />
              <span className="text-[9px] text-green-400">Available</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-muted-foreground">Win Rate: 78%</span>
            <span className="text-[9px] text-muted-foreground">·</span>
            <span className="text-[9px] text-muted-foreground">Quality: 92%</span>
          </div>
        </div>
      )}
      {step >= 2 && (
        <div className="rounded bg-white/[0.04] border border-white/[0.06] p-2 animate-in fade-in duration-500">
          <span className="text-[9px] text-muted-foreground block mb-1">Quality Score</span>
          <div className="h-1.5 bg-white/10 rounded-full">
            <div className="h-1.5 bg-emerald-400 rounded-full transition-all duration-700" style={{ width: "92%" }} />
          </div>
          <span className="text-[10px] font-bold text-emerald-400 mt-0.5 block">92/100</span>
        </div>
      )}
    </div>
  );
}

function MockScorecardCard({ step }: { step: number }) {
  const factors = [
    { name: "Quality", score: 92, color: "bg-emerald-400" },
    { name: "Reliability", score: 88, color: "bg-blue-400" },
    { name: "Speed", score: 75, color: "bg-cyan-400" },
    { name: "Communication", score: 95, color: "bg-purple-400" },
  ];

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Your Scorecard</span>
        <Badge className="text-[8px] px-1.5 py-0 bg-blue-500/20 text-blue-400 border-blue-500/20">Regular Tier</Badge>
      </div>
      <div className="space-y-1.5">
        {factors.map((f, i) => (
          <div key={i} className={`transition-all duration-500 ${step >= i ? "opacity-100" : "opacity-30"}`}>
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[9px] text-muted-foreground">{f.name}</span>
              <span className="text-[10px] font-bold">{step >= i ? f.score : "—"}%</span>
            </div>
            <div className="h-1 bg-white/10 rounded-full">
              <div className={`h-1 ${f.color} rounded-full transition-all duration-700`} style={{ width: step >= i ? `${f.score}%` : "0%" }} />
            </div>
          </div>
        ))}
      </div>
      {step >= 3 && (
        <div className="flex items-center gap-2 p-1.5 rounded bg-blue-500/10 border border-blue-500/20 animate-in fade-in duration-500">
          <TrendingUp className="w-3 h-3 text-blue-400" />
          <span className="text-[9px] text-blue-400">Next tier: Veteran — 5 more orders!</span>
        </div>
      )}
    </div>
  );
}

function MockStaffOrderCard({ step }: { step: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Order Management</span>
        <Badge className="text-[8px] px-1.5 py-0 bg-blue-500/20 text-blue-400">Create New</Badge>
      </div>
      {step === 0 && (
        <div className="space-y-1.5 animate-in fade-in duration-500">
          <div className="bg-white/[0.04] rounded px-2 py-1 flex items-center gap-2">
            <Package className="w-3 h-3 text-blue-400" />
            <span className="text-[9px]">Service: VC Grinding</span>
          </div>
          <div className="bg-white/[0.04] rounded px-2 py-1 flex items-center gap-2">
            <Gamepad2 className="w-3 h-3 text-cyan-400" />
            <span className="text-[9px]">Platform: PlayStation</span>
          </div>
          <div className="bg-white/[0.04] rounded px-2 py-1 flex items-center gap-2">
            <DollarSign className="w-3 h-3 text-green-400" />
            <span className="text-[9px]">Price: $120.00</span>
          </div>
        </div>
      )}
      {step >= 1 && (
        <div className="animate-in fade-in duration-500">
          <div className="flex items-center gap-0.5 h-2 rounded-full overflow-hidden mb-1">
            <div className={`h-full transition-all duration-500 rounded-l ${step === 1 ? "bg-blue-500 w-full" : step === 2 ? "bg-amber-500 w-full" : "bg-emerald-500 w-full rounded-r"}`} />
          </div>
          <div className="flex items-center justify-between text-[9px] text-muted-foreground">
            <span className={step === 1 ? "text-blue-400 font-medium" : ""}>Open</span>
            <ArrowRight className="w-2.5 h-2.5" />
            <span className={step === 2 ? "text-amber-400 font-medium" : ""}>Assigned</span>
            <ArrowRight className="w-2.5 h-2.5" />
            <span className={step >= 3 ? "text-emerald-400 font-medium" : ""}>Complete</span>
          </div>
        </div>
      )}
      {step >= 2 && (
        <div className="flex items-center gap-1.5 p-1.5 rounded bg-white/[0.04] border border-white/[0.06] animate-in fade-in duration-500">
          <Users className="w-3 h-3 text-amber-400" />
          <span className="text-[9px]">Assigned to ProGrinder99 via bid accept</span>
        </div>
      )}
    </div>
  );
}

function MockStaffBidsCard({ step }: { step: number }) {
  const bids = [
    { grinder: "ProGrinder99", amount: "$65", rank: 1, score: 92 },
    { grinder: "SpeedRunner_X", amount: "$70", rank: 2, score: 85 },
    { grinder: "GrindMaster", amount: "$60", rank: 3, score: 78 },
  ];

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Gavel className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-medium">Bid Review — #MGT-4821</span>
        </div>
        <span className="text-[9px] text-muted-foreground">3 bids</span>
      </div>
      <div className="space-y-1">
        {bids.map((b, i) => (
          <div key={i} className={`flex items-center gap-2 px-2 py-1 rounded transition-all duration-500 ${
            step >= 1 && i === 0 ? "bg-emerald-500/10 border border-emerald-500/20 scale-[1.02]" :
            step >= 2 && i > 0 ? "bg-white/[0.02] opacity-40" :
            "bg-white/[0.04]"
          }`}>
            <div className="flex items-center gap-1 flex-1">
              <Brain className="w-2.5 h-2.5 text-cyan-400" />
              <span className="text-[9px] font-medium">#{b.rank}</span>
              <span className="text-[10px]">{b.grinder}</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-400">{b.amount}</span>
            <span className="text-[8px] text-muted-foreground">{b.score}pts</span>
            {step >= 2 && i === 0 && (
              <CheckCircle2 className="w-3 h-3 text-emerald-400 animate-in fade-in duration-500" />
            )}
          </div>
        ))}
      </div>
      {step >= 2 && (
        <p className="text-[9px] text-emerald-400 italic animate-in fade-in duration-500">
          ✓ Top bid accepted — grinder notified
        </p>
      )}
    </div>
  );
}

function MockStaffAssignmentsCard({ step }: { step: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium">Active Assignments</span>
        <Badge className="text-[8px] px-1.5 py-0 bg-blue-500/20 text-blue-400">3 Active</Badge>
      </div>
      <div className="bg-white/[0.04] rounded px-2 py-1.5">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] font-medium">ProGrinder99 → #MGT-4821</span>
          <Badge className={`text-[8px] px-1 py-0 transition-all duration-500 ${
            step === 0 ? "bg-blue-500/20 text-blue-400" :
            step === 1 ? "bg-[#5865F2]/20 text-[#5865F2]" :
            step === 2 ? "bg-amber-500/20 text-amber-400" :
            "bg-emerald-500/20 text-emerald-400"
          }`}>
            {step === 0 ? "Assigned" : step === 1 ? "In Progress" : step === 2 ? "Proof Submitted" : "Completed"}
          </Badge>
        </div>
        <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
          <span>VC Grinding · PS5</span>
          <span>·</span>
          <span>$85.00</span>
        </div>
      </div>
      {step >= 1 && (
        <div className="flex items-center gap-1.5 text-[9px] animate-in fade-in duration-500">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span className="text-muted-foreground">
            {step === 1 ? "Grinder logged in 5 min ago" : step === 2 ? "Proof video uploaded — review needed" : "Customer approved — ready for payout"}
          </span>
        </div>
      )}
      {step >= 2 && (
        <div className="flex items-center gap-1.5 animate-in fade-in duration-500">
          {step === 2 && <div className="bg-amber-500/20 text-amber-400 text-[9px] px-2 py-0.5 rounded">Review Proof</div>}
          {step === 2 && <div className="bg-blue-500/20 text-blue-400 text-[9px] px-2 py-0.5 rounded">Reassign</div>}
          {step >= 3 && (
            <div className="flex items-center gap-1 text-[9px] text-emerald-400">
              <UserCheck className="w-3 h-3" />
              <span>Customer approved ✓</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function InteractiveMockup({ mockupId, isStaff }: { mockupId: string; isStaff?: boolean }) {
  const [step, setStep] = useState(0);
  const maxSteps = mockupId === "grinder-orders" ? 3 : mockupId === "grinder-assignments" ? 5 : mockupId === "grinder-scorecard" ? 4 : mockupId === "staff-bids" ? 3 : 4;

  useEffect(() => {
    setStep(0);
    const interval = setInterval(() => {
      setStep(s => (s + 1) % (maxSteps + 1));
    }, 2000);
    return () => clearInterval(interval);
  }, [mockupId, maxSteps]);

  switch (mockupId) {
    case "grinder-orders":
      return (
        <div className="mt-3 space-y-1.5">
          <MockOrderCard step={step} service="VC Grinding 🪙" price="$85.00" platform="PS5" dueIn="3 days" complexity={3} bids={4} />
          {step >= 1 && (
            <div className="text-[9px] text-muted-foreground flex items-center gap-1 px-1 animate-in fade-in duration-500">
              <ArrowRight className="w-3 h-3 text-purple-400" />
              {step === 1 ? "Browse available orders by service & platform" : "Click 'Place Bid' to enter your price and timeline"}
            </div>
          )}
        </div>
      );

    case "grinder-assignments":
      return (
        <div className="mt-3">
          <MockAssignmentCard step={step} />
          <div className="text-[9px] text-muted-foreground flex items-center gap-1 px-1 mt-1.5">
            <ArrowRight className="w-3 h-3 text-cyan-400" />
            {step === 0 ? "Accept the ticket to begin" :
             step === 1 ? "Log into the customer's account" :
             step === 2 ? "Click Start to begin grinding" :
             step === 3 ? "Log off when session ends" :
             "Upload proof video to complete"}
          </div>
        </div>
      );

    case "grinder-bids":
      return (
        <div className="mt-3">
          <MockBidCard step={step > 2 ? 2 : step} />
        </div>
      );

    case "grinder-payouts":
      return (
        <div className="mt-3">
          <MockPayoutCard step={step > 2 ? 2 : step} />
        </div>
      );

    case "grinder-scorecard":
      return (
        <div className="mt-3">
          <MockScorecardCard step={step > 3 ? 3 : step} />
        </div>
      );

    case "grinder-dashboard":
      return (
        <div className="mt-3">
          <MockDashboardCard step={step > 2 ? 2 : step} isStaff={false} />
        </div>
      );

    case "staff-dashboard":
      return (
        <div className="mt-3">
          <MockDashboardCard step={step > 3 ? 3 : step} isStaff={true} />
        </div>
      );

    case "staff-orders":
      return (
        <div className="mt-3">
          <MockStaffOrderCard step={step > 3 ? 3 : step} />
        </div>
      );

    case "staff-bids":
      return (
        <div className="mt-3">
          <MockStaffBidsCard step={step > 2 ? 2 : step} />
        </div>
      );

    case "staff-assignments":
      return (
        <div className="mt-3">
          <MockStaffAssignmentsCard step={step > 3 ? 3 : step} />
        </div>
      );

    case "staff-payouts":
      return (
        <div className="mt-3">
          <MockPayoutCard step={step > 2 ? 2 : step} isStaff={true} />
        </div>
      );

    default:
      return null;
  }
}

const staffPageDescriptions: Record<string, PageMeta> = {
  "/": {
    description: "Your command center — real-time financials, order pipeline, and fleet health at a glance.",
    mockupId: "staff-dashboard",
    demoSteps: [
      { label: "Revenue, payouts, profit at a glance", icon: DollarSign, color: "text-green-400" },
      { label: "Order pipeline: Open → Assigned → Done", icon: ListOrdered, color: "text-blue-400" },
      { label: "Fleet utilization ring shows capacity", icon: Users, color: "text-cyan-400" },
      { label: "Active bidding countdown timer", icon: Gavel, color: "text-purple-400" },
    ],
  },
  "/notifications": {
    description: "Your notification hub — bid results, order updates, system alerts, and team announcements all in one feed. Filter by type and mark as read.",
    demoSteps: [
      { label: "New bid submitted on Order #42", icon: Gavel, color: "text-purple-400" },
      { label: "Grinder completed assignment", icon: CheckCircle2, color: "text-emerald-400" },
      { label: "Payout request needs approval", icon: Banknote, color: "text-yellow-400" },
      { label: "Mark all as read in one click", icon: Eye, color: "text-blue-400" },
    ],
  },
  "/todo": {
    description: "Your task dashboard — pending approvals, unreviewed bids, orders needing attention, and administrative duties organized by priority.",
    demoSteps: [
      { label: "3 payout requests pending review", icon: Banknote, color: "text-yellow-400" },
      { label: "2 bids awaiting acceptance", icon: Gavel, color: "text-purple-400" },
      { label: "1 order repair needs resolution", icon: Wrench, color: "text-orange-400" },
      { label: "Check off tasks as you go", icon: CheckCircle2, color: "text-emerald-400" },
    ],
  },
  "/staff-overview": {
    description: "Owner-only view of your entire staff team — activity metrics, actions per day, and individual performance breakdowns for every team member.",
    demoSteps: [
      { label: "Total staff actions today: 47", icon: UserCheck, color: "text-blue-400" },
      { label: "Activity bars show 7-day trends", icon: BarChart3, color: "text-cyan-400" },
      { label: "Staff audit log by action type", icon: ScrollText, color: "text-purple-400" },
      { label: "Compare team member contributions", icon: Users, color: "text-green-400" },
    ],
  },
  "/admin": {
    description: "System configuration hub with 3 tabs — Operations (order management, alerts), Management (elite requests, strikes, profiles), and System (bot, maintenance, services).",
    demoSteps: [
      { label: "Operations: override orders & alerts", icon: Settings, color: "text-blue-400" },
      { label: "Management: strikes, limits, profiles", icon: Shield, color: "text-orange-400" },
      { label: "System: bot toggle, maintenance mode", icon: Wrench, color: "text-red-400" },
      { label: "Service toggles affect entire platform", icon: Package, color: "text-cyan-400" },
    ],
  },
  "/wallets": {
    description: "Financial wallet system — company and personal wallets, transfers between staff, order payment linking, and full transaction history with proof uploads.",
    demoSteps: [
      { label: "Company wallet tracks all revenue", icon: Wallet, color: "text-green-400" },
      { label: "Personal wallets for each staff member", icon: DollarSign, color: "text-blue-400" },
      { label: "Transfer funds with approval workflow", icon: Banknote, color: "text-yellow-400" },
      { label: "Link order payments to wallets", icon: FileCheck, color: "text-cyan-400" },
    ],
  },
  "/business": {
    description: "Owner-only business analytics — monthly revenue trends, profit margins, service performance breakdowns, grinder economics, and financial projections.",
    demoSteps: [
      { label: "Monthly revenue vs. grinder payouts", icon: DollarSign, color: "text-green-400" },
      { label: "Profit margin per service type", icon: BarChart3, color: "text-cyan-400" },
      { label: "Top-earning services ranked", icon: TrendingUp, color: "text-blue-400" },
      { label: "Grinder cost analysis breakdown", icon: Users, color: "text-purple-400" },
    ],
  },
  "/analytics": {
    description: "Deep-dive data visualization — order volume trends, completion rates, growth metrics, and platform engagement over customizable time periods.",
    demoSteps: [
      { label: "Order volume trends over time", icon: BarChart3, color: "text-blue-400" },
      { label: "Completion rate by service type", icon: CheckCircle2, color: "text-emerald-400" },
      { label: "Revenue growth month-over-month", icon: TrendingUp, color: "text-green-400" },
      { label: "Filter by date range and service", icon: CalendarDays, color: "text-cyan-400" },
    ],
  },
  "/services": {
    description: "Manage all gaming services offered — toggle services on/off, set pricing, configure platforms, and control visibility across the system.",
    demoSteps: [
      { label: "Toggle services active or inactive", icon: Package, color: "text-blue-400" },
      { label: "Set base pricing per service", icon: DollarSign, color: "text-green-400" },
      { label: "Configure platform availability", icon: Settings, color: "text-cyan-400" },
      { label: "Disabled services hidden everywhere", icon: Eye, color: "text-orange-400" },
    ],
  },
  "/grinders": {
    description: "Your grinder roster — view all grinders with availability status, performance stats, tier levels, and management tools. Colored dots show who's online.",
    demoSteps: [
      { label: "Green dot = available for orders", icon: CheckCircle2, color: "text-green-400" },
      { label: "View scorecard, bids, and history", icon: ClipboardCheck, color: "text-blue-400" },
      { label: "Manage roles, strikes, and limits", icon: Shield, color: "text-orange-400" },
      { label: "Edit grinder profiles and tiers", icon: Settings, color: "text-cyan-400" },
    ],
  },
  "/tier-progress": {
    description: "Track grinder tier progression — from New to Elite. Review promotions, demotions, and requirements for each tier level.",
    demoSteps: [
      { label: "New → Regular → Veteran → Elite", icon: TrendingUp, color: "text-blue-400" },
      { label: "See requirements for next tier", icon: ClipboardCheck, color: "text-cyan-400" },
      { label: "Manual promote or demote grinders", icon: Crown, color: "text-yellow-400" },
      { label: "Elite perks: priority orders, higher pay", icon: Star, color: "text-purple-400" },
    ],
  },
  "/badges": {
    description: "Achievement badge system — create badges, set auto-earn criteria, manually award badges, and manage the progression tiers for grinder motivation.",
    demoSteps: [
      { label: "Auto-earned: First Order, 10 Completed", icon: Award, color: "text-yellow-400" },
      { label: "Manual awards for exceptional work", icon: Star, color: "text-purple-400" },
      { label: "Bronze → Silver → Gold → Diamond", icon: TrendingUp, color: "text-cyan-400" },
      { label: "Badges display on grinder profiles", icon: Eye, color: "text-blue-400" },
    ],
  },
  "/reports": {
    description: "Generate exportable reports — order summaries, grinder performance, financial breakdowns, and custom date ranges. Export as CSV or PDF.",
    demoSteps: [
      { label: "Select report type and date range", icon: FileBarChart, color: "text-blue-400" },
      { label: "Order completion summary generated", icon: ListOrdered, color: "text-cyan-400" },
      { label: "Grinder earnings breakdown ready", icon: DollarSign, color: "text-green-400" },
      { label: "Export to CSV or PDF download", icon: Upload, color: "text-purple-400" },
    ],
  },
  "/bids": {
    description: "Review all grinder bids — AI ranks by scorecard. Accept the best, reject others, or let the system auto-assign.",
    mockupId: "staff-bids",
    demoSteps: [
      { label: "Bids arrive from grinders on orders", icon: Gavel, color: "text-purple-400" },
      { label: "AI ranks bids by scorecard & history", icon: Brain, color: "text-cyan-400" },
      { label: "Review top candidates side-by-side", icon: Eye, color: "text-blue-400" },
      { label: "Accept bid — grinder gets notified", icon: CheckCircle2, color: "text-emerald-400" },
    ],
  },
  "/orders": {
    description: "Order management central — create, assign, track, and complete orders through their full lifecycle.",
    mockupId: "staff-orders",
    demoSteps: [
      { label: "Create order: service, platform, price", icon: ListOrdered, color: "text-blue-400" },
      { label: "Open for bidding — grinders compete", icon: Gavel, color: "text-purple-400" },
      { label: "Track: Open → Assigned → In Progress", icon: Eye, color: "text-cyan-400" },
      { label: "Completed → Paid Out — full lifecycle", icon: CheckCircle2, color: "text-emerald-400" },
    ],
  },
  "/assignments": {
    description: "Track all active assignments — grinder login status, checkpoints, proof submissions, and customer approvals in real-time.",
    mockupId: "staff-assignments",
    demoSteps: [
      { label: "Grinder logs in → status updates live", icon: MousePointerClick, color: "text-yellow-400" },
      { label: "Checkpoint: started, progress, issues", icon: CheckCircle2, color: "text-cyan-400" },
      { label: "Customer approval flow when required", icon: UserCheck, color: "text-blue-400" },
      { label: "Reassign if grinder needs replacement", icon: Users, color: "text-orange-400" },
    ],
  },
  "/order-updates": {
    description: "Real-time feed of all order status updates — login events, progress reports, completion proofs, and customer communications across all active orders.",
    demoSteps: [
      { label: "Live stream of grinder checkpoints", icon: Zap, color: "text-yellow-400" },
      { label: "Proof videos and screenshots posted", icon: Upload, color: "text-blue-400" },
      { label: "Customer update messages tracked", icon: MessageCircle, color: "text-cyan-400" },
      { label: "Filter by order, grinder, or status", icon: Eye, color: "text-purple-400" },
    ],
  },
  "/order-claims": {
    description: "Order repair system — review and resolve repair requests from grinders. Handle missing orders, claim fixes, and add completed orders to the system.",
    demoSteps: [
      { label: "Fix: correct existing order data", icon: Wrench, color: "text-orange-400" },
      { label: "Claim: grinder claims missing order", icon: FileCheck, color: "text-blue-400" },
      { label: "Add: insert completed order manually", icon: ListOrdered, color: "text-cyan-400" },
      { label: "Approve or deny with audit trail", icon: CheckCircle2, color: "text-emerald-400" },
    ],
  },
  "/payouts": {
    description: "Payout processing — review requests, verify amounts, approve, and mark as paid with proof.",
    mockupId: "staff-payouts",
    demoSteps: [
      { label: "Grinder requests $85 via Cash App", icon: Banknote, color: "text-green-400" },
      { label: "Verify against completed order value", icon: Eye, color: "text-blue-400" },
      { label: "Approve and process the payment", icon: CheckCircle2, color: "text-emerald-400" },
      { label: "Mark paid — grinder gets notified", icon: DollarSign, color: "text-yellow-400" },
    ],
  },
  "/queue": {
    description: "AI-powered queue system — see how grinder bids are ranked using 9 scoring factors: reliability, speed, quality, specialization, fairness, and more.",
    demoSteps: [
      { label: "9-factor scoring: quality, speed, etc.", icon: Brain, color: "text-cyan-400" },
      { label: "Queue position updates in real-time", icon: TrendingUp, color: "text-blue-400" },
      { label: "Specialization bonuses for top grinders", icon: Star, color: "text-purple-400" },
      { label: "Fairness factor prevents monopoly", icon: Shield, color: "text-green-400" },
    ],
  },
  "/scorecard-guide": {
    description: "Educational resource explaining how the scorecard and queue system work — factor weights, tips for improvement, and how rankings are calculated.",
    demoSteps: [
      { label: "9 scoring factors explained", icon: Brain, color: "text-cyan-400" },
      { label: "How quality score is calculated", icon: Star, color: "text-yellow-400" },
      { label: "Tips to improve your ranking", icon: TrendingUp, color: "text-green-400" },
      { label: "Queue position formula breakdown", icon: BarChart3, color: "text-blue-400" },
    ],
  },
  "/reviews": {
    description: "Customer review management — moderate reviews, view ratings, and manage the review approval workflow. Reviews are linked to specific orders.",
    demoSteps: [
      { label: "Customer submits 5-star review", icon: Star, color: "text-yellow-400" },
      { label: "Auto-linked to order and grinder", icon: FileCheck, color: "text-blue-400" },
      { label: "Moderate: approve or flag reviews", icon: Shield, color: "text-orange-400" },
      { label: "Public reviews build grinder reputation", icon: Eye, color: "text-cyan-400" },
    ],
  },
  "/calendar": {
    description: "Master calendar showing all order deadlines, scheduled events, and important dates across the entire operation.",
    demoSteps: [
      { label: "Order deadlines marked on calendar", icon: CalendarDays, color: "text-blue-400" },
      { label: "Events and promos highlighted", icon: Calendar, color: "text-purple-400" },
      { label: "Click any date for order details", icon: Eye, color: "text-cyan-400" },
      { label: "Never miss a deadline again", icon: CheckCircle2, color: "text-green-400" },
    ],
  },
  "/streams": {
    description: "Monitor grinder Twitch streams — verify active gameplay, track stream hours, and generate automatic activity checkpoints from live sessions.",
    demoSteps: [
      { label: "Grinder goes live on Twitch", icon: Tv, color: "text-purple-400" },
      { label: "Auto-checkpoint: streaming verified", icon: CheckCircle2, color: "text-green-400" },
      { label: "Staff can watch streams in real-time", icon: Eye, color: "text-blue-400" },
      { label: "Stream hours logged for performance", icon: BarChart3, color: "text-cyan-400" },
    ],
  },
  "/events": {
    description: "Event and promo management — schedule double-payout weekends, bonus challenges, community events, and platform-wide announcements.",
    demoSteps: [
      { label: "Create: Double Payout Weekend event", icon: Calendar, color: "text-blue-400" },
      { label: "Set start/end dates and eligibility", icon: CalendarDays, color: "text-cyan-400" },
      { label: "Grinders see events on their dashboard", icon: Eye, color: "text-green-400" },
      { label: "Track participation and impact", icon: BarChart3, color: "text-purple-400" },
    ],
  },
  "/audit-log": {
    description: "Comprehensive system activity log — every action by staff, grinders, and the system is recorded with timestamps, actor details, and change data.",
    demoSteps: [
      { label: "Order #42 status changed by Staff", icon: ListOrdered, color: "text-blue-400" },
      { label: "Grinder role updated by Owner", icon: Shield, color: "text-orange-400" },
      { label: "Payout approved at 2:45 PM", icon: Banknote, color: "text-green-400" },
      { label: "Filter by action type, user, or date", icon: Eye, color: "text-cyan-400" },
    ],
  },
  "/activity-log": {
    description: "Owner-only user activity tracker — see who's using the platform, which pages they visit, login sessions, and user behavior analytics.",
    demoSteps: [
      { label: "Track user logins and page views", icon: Activity, color: "text-blue-400" },
      { label: "Filter by user, category, action", icon: Eye, color: "text-cyan-400" },
      { label: "24h stats: active users, sessions", icon: Users, color: "text-green-400" },
      { label: "Detailed session and IP tracking", icon: Monitor, color: "text-purple-400" },
    ],
  },
  "/patch-notes": {
    description: "Internal staff notes and platform updates — document changes, share operational updates, and keep the team informed about new features.",
    demoSteps: [
      { label: "New feature release notes posted", icon: Newspaper, color: "text-blue-400" },
      { label: "Bug fixes and improvements listed", icon: Wrench, color: "text-orange-400" },
      { label: "Stay informed about platform changes", icon: Eye, color: "text-cyan-400" },
      { label: "Archive of all past updates", icon: ScrollText, color: "text-purple-400" },
    ],
  },
};

const grinderPageDescriptions: Record<string, PageMeta> = {
  "/": {
    description: "Your personal dashboard — active orders, stats, availability toggle, and performance overview.",
    mockupId: "grinder-dashboard",
    demoSteps: [
      { label: "Active orders, completed, pending bids", icon: LayoutDashboard, color: "text-blue-400" },
      { label: "Toggle availability: Online/Busy/Away", icon: CheckCircle2, color: "text-green-400" },
      { label: "Total earned and win rate tracked", icon: DollarSign, color: "text-emerald-400" },
      { label: "Quality score progress bar updates", icon: BarChart3, color: "text-cyan-400" },
    ],
  },
  "/grinder/notifications": {
    description: "Your notification feed — bid results, assignment updates, deadline changes, team announcements, and staff messages. Sound alerts for important events.",
    demoSteps: [
      { label: "Your bid on Order #42 was accepted!", icon: CheckCircle2, color: "text-emerald-400" },
      { label: "New order available matching your skills", icon: Zap, color: "text-yellow-400" },
      { label: "Deadline extended by 24 hours", icon: CalendarDays, color: "text-blue-400" },
      { label: "Staff announcement: bonus weekend!", icon: Bell, color: "text-purple-400" },
    ],
  },
  "/grinder/todo": {
    description: "Your action items — orders needing attention, bids to submit, proofs to upload, and tasks assigned by staff. Stay on top of your work.",
    demoSteps: [
      { label: "Start Order #42 — assigned yesterday", icon: Play, color: "text-cyan-400" },
      { label: "Upload proof for completed order", icon: Upload, color: "text-blue-400" },
      { label: "Submit bid before timer expires", icon: Gavel, color: "text-purple-400" },
      { label: "Check off tasks as you complete them", icon: CheckCircle2, color: "text-emerald-400" },
    ],
  },
  "/grinder/orders": {
    description: "Browse available orders — see service, platform, price, deadline, and place bids on orders you want.",
    mockupId: "grinder-orders",
    demoSteps: [
      { label: "New order drops into the queue", icon: Zap, color: "text-yellow-400" },
      { label: "Service: VC Grinding — $85.00", icon: ListOrdered, color: "text-blue-400" },
      { label: "Platform: PlayStation — Due in 3 days", icon: Play, color: "text-cyan-400" },
      { label: "Click to place your bid amount", icon: Gavel, color: "text-purple-400" },
    ],
  },
  "/grinder/assignments": {
    description: "Your active work — follow the flow: Accept → Log In → Start → Log Off → Complete with proof.",
    mockupId: "grinder-assignments",
    demoSteps: [
      { label: "Order assigned — click to accept", icon: FileCheck, color: "text-blue-400" },
      { label: "Log into the customer's account", icon: MousePointerClick, color: "text-yellow-400" },
      { label: "Start Order — begin the work", icon: Play, color: "text-cyan-400" },
      { label: "Mark Complete — upload proof video", icon: CheckCircle2, color: "text-emerald-400" },
    ],
  },
  "/grinder/order-claims": {
    description: "Order repairs — report issues with your orders, request data corrections, or claim missing orders that weren't tracked by the system.",
    demoSteps: [
      { label: "Report: order data needs correction", icon: Wrench, color: "text-orange-400" },
      { label: "Claim: completed order not in system", icon: FileCheck, color: "text-blue-400" },
      { label: "Provide evidence and details", icon: Upload, color: "text-cyan-400" },
      { label: "Staff reviews and approves/denies", icon: Shield, color: "text-green-400" },
    ],
  },
  "/grinder/bids": {
    description: "Track your bids — see pending, AI-ranked, accepted, and rejected bids with full details.",
    mockupId: "grinder-bids",
    demoSteps: [
      { label: "You submit your bid amount", icon: Gavel, color: "text-purple-400" },
      { label: "AI Queue scores your bid...", icon: Brain, color: "text-cyan-400" },
      { label: "Your scorecard boosts priority", icon: ClipboardCheck, color: "text-green-400" },
      { label: "Bid accepted! Order assigned to you", icon: CheckCircle2, color: "text-emerald-400" },
    ],
  },
  "/grinder/scorecard": {
    description: "Your performance metrics — quality, speed, reliability, communication scores, with tier progress.",
    mockupId: "grinder-scorecard",
    demoSteps: [
      { label: "Quality Score: 92% — Excellent", icon: Star, color: "text-yellow-400" },
      { label: "Reliability: 15/15 on-time deliveries", icon: CheckCircle2, color: "text-emerald-400" },
      { label: "Speed: avg 1.2 days per order", icon: Zap, color: "text-cyan-400" },
      { label: "Tier Progress: 80% to Veteran", icon: TrendingUp, color: "text-blue-400" },
    ],
  },
  "/grinder/queue": {
    description: "See your queue position — the 9-factor AI system explains exactly why you're ranked where you are, with personalized tips to improve your position.",
    demoSteps: [
      { label: "Your queue position: #3 of 12", icon: Brain, color: "text-cyan-400" },
      { label: "Strength: high reliability score", icon: CheckCircle2, color: "text-green-400" },
      { label: "Tip: bid on PS5 orders for bonus", icon: Star, color: "text-yellow-400" },
      { label: "Fairness boost: not assigned recently", icon: Shield, color: "text-blue-400" },
    ],
  },
  "/scorecard-guide": {
    description: "Learn how the scorecard and queue system work — factor weights, scoring breakdown, tips for improvement, and how rankings determine order assignments.",
    demoSteps: [
      { label: "9 scoring factors explained", icon: Brain, color: "text-cyan-400" },
      { label: "How quality score is calculated", icon: Star, color: "text-yellow-400" },
      { label: "Tips to improve your ranking", icon: TrendingUp, color: "text-green-400" },
      { label: "Queue position formula breakdown", icon: BarChart3, color: "text-blue-400" },
    ],
  },
  "/grinder/status": {
    description: "Your tier progression — from New to Elite. See requirements for the next level, perks you've unlocked, and what you need to achieve to rank up.",
    demoSteps: [
      { label: "Current: Regular Grinder tier", icon: Crown, color: "text-blue-400" },
      { label: "Next: Veteran — need 25 orders", icon: TrendingUp, color: "text-cyan-400" },
      { label: "Elite perks: priority queue, +10% pay", icon: Star, color: "text-yellow-400" },
      { label: "Track progress toward each requirement", icon: BarChart3, color: "text-green-400" },
    ],
  },
  "/grinder/strikes": {
    description: "Your compliance record — view any strikes, fines, and policy violations. Appeal strikes, submit fine payment proofs, and understand the policy rules.",
    demoSteps: [
      { label: "Clean record: no active strikes", icon: Shield, color: "text-green-400" },
      { label: "Strike for late delivery → appeal it", icon: AlertTriangle, color: "text-orange-400" },
      { label: "Fine issued → submit payment proof", icon: Upload, color: "text-blue-400" },
      { label: "Policy guide explains all rules", icon: BookOpen, color: "text-cyan-400" },
    ],
  },
  "/grinder/payouts": {
    description: "Your earnings hub — request payouts via Zelle, PayPal, Cash App, and more. Track status from request to paid.",
    mockupId: "grinder-payouts",
    demoSteps: [
      { label: "Total earned: $1,250 this month", icon: DollarSign, color: "text-emerald-400" },
      { label: "Request payout: $200 via Cash App", icon: Banknote, color: "text-green-400" },
      { label: "Staff reviews and approves request", icon: UserCheck, color: "text-blue-400" },
      { label: "Paid! Funds sent to your account", icon: CheckCircle2, color: "text-yellow-400" },
    ],
  },
  "/grinder/reviews": {
    description: "Your customer reviews — see ratings and feedback from customers. Generate access codes for customers to leave reviews, and approve reviews before they go public.",
    demoSteps: [
      { label: "Customer leaves 5-star review", icon: Star, color: "text-yellow-400" },
      { label: "Generate review access code", icon: Shield, color: "text-blue-400" },
      { label: "Approve or flag before public", icon: Eye, color: "text-cyan-400" },
      { label: "Reviews boost your queue ranking", icon: TrendingUp, color: "text-green-400" },
    ],
  },
  "/grinder/calendar": {
    description: "Your schedule — order deadlines, completed assignments, upcoming milestones, and event dates. Never miss a deadline.",
    demoSteps: [
      { label: "Your deadlines highlighted on calendar", icon: CalendarDays, color: "text-blue-400" },
      { label: "Completed orders show as checkmarks", icon: CheckCircle2, color: "text-green-400" },
      { label: "Upcoming events and promos shown", icon: Calendar, color: "text-purple-400" },
      { label: "Plan your work week at a glance", icon: Eye, color: "text-cyan-400" },
    ],
  },
  "/grinder/events": {
    description: "Community events and promos — double-payout weekends, bonus challenges, and platform-wide competitions. Participate to earn extra rewards.",
    demoSteps: [
      { label: "Double Payout Weekend: Fri-Sun", icon: Calendar, color: "text-blue-400" },
      { label: "Speed Challenge: fastest completion", icon: Zap, color: "text-yellow-400" },
      { label: "Participate to earn bonus rewards", icon: Star, color: "text-purple-400" },
      { label: "Leaderboard tracks top performers", icon: TrendingUp, color: "text-cyan-400" },
    ],
  },
  "/grinder/patch-notes": {
    description: "Platform updates — read about new features, bug fixes, and changes that affect your workflow. Stay informed about what's new.",
    demoSteps: [
      { label: "Latest platform updates posted", icon: Newspaper, color: "text-blue-400" },
      { label: "New features and improvements", icon: Star, color: "text-yellow-400" },
      { label: "Bug fixes that affect your workflow", icon: Wrench, color: "text-orange-400" },
      { label: "Stay ahead of platform changes", icon: Eye, color: "text-cyan-400" },
    ],
  },
};

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: any;
  targetSelector?: string;
  targetArea?: "sidebar" | "header" | "main" | "full";
  demoSteps?: DemoStep[];
  mockupId?: string;
  position?: "center" | "right" | "bottom";
  pageUrl?: string;
}

function buildTutorialSteps(
  navItems: typeof staffNavItems,
  pageDescriptions: Record<string, PageMeta>,
  isStaff: boolean
): TutorialStep[] {
  const steps: TutorialStep[] = [];

  steps.push({
    id: "welcome",
    title: isStaff ? "Welcome to GrindOps Command Center" : "Welcome to GrindOps",
    description: isStaff
      ? "Your centralized dashboard for managing the entire gaming service operation. This tour will walk you through every tool at your disposal. Use arrow keys or the buttons to navigate."
      : "Your command center for managing gaming service orders. This quick tour will show you how everything works so you can start earning right away. Use arrow keys or buttons to navigate.",
    icon: isStaff ? Crown : Sparkles,
    targetArea: "full",
    position: "center",
  });

  steps.push({
    id: "sidebar-nav",
    title: "Navigation Sidebar",
    description: "This is your navigation hub. Every page in the system is accessible from here. Click the menu icon to collapse it on mobile. New pages added to the sidebar will automatically appear in this tutorial.",
    icon: LayoutDashboard,
    targetSelector: "[data-sidebar]",
    targetArea: "sidebar",
    position: "right",
  });

  for (const item of navItems) {
    const meta = pageDescriptions[item.url];

    steps.push({
      id: `page-${item.url}`,
      title: item.title,
      description: meta?.description || `The ${item.title} page — explore this section to learn more about its features and capabilities.`,
      icon: item.icon,
      targetSelector: `[data-nav-url="${item.url}"]`,
      targetArea: "sidebar",
      position: "right",
      demoSteps: meta?.demoSteps,
      mockupId: meta?.mockupId,
      pageUrl: item.url,
    });
  }

  steps.push({
    id: "notifications-header",
    title: "Quick Notifications",
    description: "The bell icon in the header shows a quick preview of your latest notifications. Tap it for instant access without leaving your current page.",
    icon: Bell,
    targetSelector: '[data-testid="button-notifications"]',
    targetArea: "header",
    position: "bottom",
    demoSteps: [
      { label: "Unread count badge appears on bell", icon: Bell, color: "text-yellow-400" },
      { label: "Click to expand notification panel", icon: Eye, color: "text-blue-400" },
      { label: "Quick-read without leaving your page", icon: CheckCircle2, color: "text-green-400" },
      { label: "Sound alerts for urgent notifications", icon: Zap, color: "text-purple-400" },
    ],
  });

  steps.push({
    id: "chat-header",
    title: "Team Chat",
    description: "Use the chat icon to communicate with " + (isStaff ? "grinders and other staff" : "staff") + " directly. Ask questions, report issues, or discuss orders — all within the dashboard.",
    icon: MessageCircle,
    targetSelector: '[data-testid="button-open-chat"]',
    targetArea: "header",
    position: "bottom",
    demoSteps: [
      { label: "Open chat drawer from any page", icon: MessageCircle, color: "text-blue-400" },
      { label: "Direct messages and group threads", icon: Users, color: "text-cyan-400" },
      { label: "File attachments and @mentions", icon: Upload, color: "text-purple-400" },
      { label: "Unread indicator on chat icon", icon: Bell, color: "text-yellow-400" },
    ],
  });

  steps.push({
    id: "complete",
    title: isStaff ? "You're All Set!" : "You're Ready to Grind!",
    description: isStaff
      ? "You've seen every tool in your arsenal. Dive into the Command Center and start managing operations. Check the Operations Guide for detailed workflows!"
      : "That covers every page! Check Available Orders to find your first job, or explore the Operations Guide for detailed tips. Good luck out there!",
    icon: Rocket,
    targetArea: "full",
    position: "center",
  });

  return steps;
}

function DemoAnimation({ demoSteps }: { demoSteps: DemoStep[] }) {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    setFrame(0);
    const interval = setInterval(() => {
      setFrame(f => f + 1);
    }, 1200);
    return () => clearInterval(interval);
  }, [demoSteps]);

  const currentFrame = frame % demoSteps.length;

  return (
    <div className="mt-3 space-y-1.5" aria-live="polite">
      {demoSteps.map((step, i) => {
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
    return <div className="fixed inset-0 z-[9998] bg-black/70 backdrop-blur-sm transition-all duration-500" aria-hidden="true" />;
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
    return <div className="fixed inset-0 z-[9998] bg-black/50 backdrop-blur-[2px] transition-all duration-500" aria-hidden="true" />;
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
        <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.75)" mask="url(#spotlight-mask)" />
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

const SESSION_KEY = "grindops-tutorial-session";

function getTutorialSession(): { isOpen: boolean; step: number; returnPath: string } | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setTutorialSession(isOpen: boolean, step: number, returnPath?: string) {
  const existing = getTutorialSession();
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    isOpen,
    step,
    returnPath: returnPath ?? existing?.returnPath ?? "/",
  }));
}

function clearTutorialSession() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function InteractiveTutorial() {
  const { user } = useAuth();
  const [location, navigate] = useLocation();
  const isStaff = user?.role === "staff" || user?.role === "owner";
  const dialogRef = useRef<HTMLDivElement>(null);
  const hasNavigatedRef = useRef(false);

  const userId = (user as any)?.discordId || user?.id || "";
  const isOwner = user?.role === "owner";

  const steps = useMemo(
    () => buildTutorialSteps(
      isStaff ? getFilteredStaffNavItems(isOwner, userId) : grinderNavItems,
      isStaff ? staffPageDescriptions : grinderPageDescriptions,
      isStaff
    ),
    [isStaff, isOwner, userId]
  );

  const storageKey = `grindops-tutorial-${isStaff ? "staff" : "grinder"}-v2-completed`;

  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(true);

  useEffect(() => {
    const session = getTutorialSession();
    if (session?.isOpen) {
      setIsOpen(true);
      setCurrentStep(session.step);
    }
  }, []);

  useEffect(() => {
    const seen = localStorage.getItem(storageKey);
    const session = getTutorialSession();
    if (!seen && !session?.isOpen) {
      setHasSeenTutorial(false);
      const timer = setTimeout(() => {
        setTutorialSession(true, 0, window.location.pathname);
        setIsOpen(true);
        setCurrentStep(0);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!isOpen) return;
    const step = steps[currentStep];
    if (step?.pageUrl && location !== step.pageUrl) {
      hasNavigatedRef.current = true;
      navigate(step.pageUrl);
    }
  }, [isOpen, currentStep, steps]);

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

  const wrappedSetStep = useCallback((step: number) => {
    setCurrentStep(step);
    setTutorialSession(true, step);
  }, []);

  const handleClose = useCallback(() => {
    const returnPath = getTutorialSession()?.returnPath ?? "/";
    setIsOpen(false);
    setCurrentStep(0);
    clearTutorialSession();
    localStorage.setItem(storageKey, "true"); window.dispatchEvent(new Event("storage"));
    setHasSeenTutorial(true);
    if (hasNavigatedRef.current) {
      hasNavigatedRef.current = false;
      navigate(returnPath);
    }
  }, [storageKey, navigate]);

  const handleNext = useCallback(() => {
    if (currentStep < steps.length - 1) {
      const next = currentStep + 1;
      wrappedSetStep(next);
    } else {
      setIsOpen(false);
      setCurrentStep(0);
      clearTutorialSession();
      localStorage.setItem(storageKey, "true"); window.dispatchEvent(new Event("storage"));
      setHasSeenTutorial(true);
      hasNavigatedRef.current = false;
      navigate("/");
    }
  }, [currentStep, steps.length, storageKey, navigate, wrappedSetStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      wrappedSetStep(currentStep - 1);
    }
  }, [currentStep, wrappedSetStep]);

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
        onClick={() => { setTutorialSession(true, 0, window.location.pathname); setIsOpen(true); setCurrentStep(0); }}
        className="fixed bottom-24 right-4 z-[100] group"
        data-testid="button-start-tutorial"
        aria-label={hasSeenTutorial ? "Replay Tutorial" : "Start Tutorial"}
      >
        <div className={`w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/25 transition-all hover:scale-110 ${!hasSeenTutorial ? "animate-bounce" : ""}`}>
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <span className="absolute right-14 top-1/2 -translate-y-1/2 bg-card border border-border px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity md:pointer-events-none shadow-xl" aria-hidden="true">
          {hasSeenTutorial ? "Replay Tutorial" : "Start Tutorial"}
        </span>
      </button>
    );
  }

  const hasMockup = !!step.mockupId;

  const positionClass = "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";

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
        <div className={`${hasMockup ? "w-[440px]" : "w-[400px]"} max-w-[92vw] max-h-[85vh] overflow-y-auto bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-2xl shadow-black/50 animate-in fade-in zoom-in-95 duration-300`}>
          <div className="h-1 bg-muted" aria-hidden="true">
            <div
              className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="p-3 sm:p-5">
            <div className="flex items-start justify-between mb-2 sm:mb-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0" aria-hidden="true">
                  <StepIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <div>
                  <h3 id="tutorial-title" className="font-display font-bold text-sm sm:text-base leading-tight">{step.title}</h3>
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
                className="w-7 h-7 shrink-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <p id="tutorial-desc" className="text-xs sm:text-sm text-muted-foreground leading-relaxed mb-1">
              {step.description}
            </p>

            {hasMockup ? (
              <InteractiveMockup mockupId={step.mockupId!} isStaff={isStaff} />
            ) : step.demoSteps && step.demoSteps.length > 0 ? (
              <DemoAnimation demoSteps={step.demoSteps} />
            ) : null}

            <div className="flex items-center justify-between mt-3 sm:mt-4 pt-2 sm:pt-3 border-t border-border/50">
              <div className="hidden sm:flex gap-0.5 max-w-[140px] flex-wrap" aria-label={`Step ${currentStep + 1} of ${steps.length}`} role="tablist">
                {steps.map((_, i) => (
                  <button
                    key={i}
                    role="tab"
                    aria-selected={i === currentStep}
                    aria-label={`Go to step ${i + 1}`}
                    onClick={() => wrappedSetStep(i)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === currentStep ? "bg-primary w-4" : i < currentStep ? "bg-primary/40 w-1.5" : "bg-white/10 w-1.5"
                    }`}
                    data-testid={`tutorial-dot-${i}`}
                  />
                ))}
              </div>
              <span className="sm:hidden text-[10px] text-muted-foreground">{currentStep + 1}/{steps.length}</span>
              <div className="flex items-center gap-1.5 sm:gap-2">
                {!isFirst && (
                  <Button size="sm" variant="ghost" onClick={handlePrev} data-testid="button-tutorial-prev" className="h-8 px-2 sm:px-3 text-xs sm:text-sm">
                    <ChevronLeft className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Back</span>
                  </Button>
                )}
                {isFirst && (
                  <Button size="sm" variant="ghost" onClick={handleClose} data-testid="button-tutorial-skip" className="text-muted-foreground h-8 px-2 sm:px-3 text-xs sm:text-sm">
                    Skip
                  </Button>
                )}
                <Button size="sm" onClick={handleNext} data-testid="button-tutorial-next" className="h-8 px-2.5 sm:px-3 text-xs sm:text-sm">
                  {isLast ? "Get Started" : "Next"}
                  {isLast ? <Rocket className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </div>
          </div>

          <div className="hidden sm:block px-5 pb-3" aria-hidden="true">
            <p className="text-[10px] text-muted-foreground/60 text-center">
              Use arrow keys to navigate · Press Esc to close
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
