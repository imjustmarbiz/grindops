import { useGrinderData } from "@/hooks/use-grinder-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Eye, Gavel, Clock, FileCheck, DollarSign, Signal, Bell, Crown,
  Target, Lightbulb, TrendingUp, CalendarClock, Send, Star, Zap, ArrowUpCircle
} from "lucide-react";

export default function GrinderGuide() {
  const { grinder, isElite, eliteAccent } = useGrinderData();

  if (!grinder) return null;

  return (
    <div className="space-y-4">
      <Card className="border-0 bg-white/[0.03] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15"} flex items-center justify-center`}>
              <Target className={`w-5 h-5 ${eliteAccent}`} />
            </div>
            How to Use Your Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[
            { step: 1, icon: Eye, title: "Check Available Orders", desc: "Go to the 'Available Orders' page to see all open orders you can bid on. Each card shows the service type, platform, and when bidding closes." },
            { step: 2, icon: Gavel, title: "Place Your Bids", desc: "Click 'Place Bid' on any available order. Enter your bid amount, timeline, and when you can start. Lower bids with faster timelines tend to win." },
            { step: 3, icon: Clock, title: "Watch the Countdown", desc: "Once the first bid is placed, a 10-minute countdown begins. You can edit your bid before time runs out. After the timer expires, bidding closes." },
            { step: 4, icon: FileCheck, title: "Manage Your Work", desc: "When your bid is accepted, the order appears in 'My Work'. Send progress updates to staff, update deadlines, and mark orders complete when finished." },
            { step: 5, icon: DollarSign, title: "Request Payouts", desc: "After completing an order, go to 'Payouts' to request payment. Enter the amount and any notes. Staff will review and process your payout." },
            { step: 6, icon: Signal, title: "Set Your Availability", desc: "Use the availability dropdown at the top of your dashboard to let staff know when you're available, busy, away, or offline." },
            { step: 7, icon: Bell, title: "Check Alerts & Strikes", desc: "The 'Status' page shows your alerts from staff and any strikes. Make sure to acknowledge new strikes and read important alerts." },
            { step: 8, icon: Crown, title: "Aim for Elite Status", desc: "In the Status page, you can request Elite status. Elite grinders get a higher order limit (5 vs 3), a special cyan theme, and priority consideration." },
          ].map(({ step, icon: StepIcon, title, desc }) => (
            <div key={step} className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06] sm:hover:bg-white/[0.05] transition-all duration-200" data-testid={`guide-step-${step}`}>
              <div className={`w-7 h-7 rounded-full ${isElite ? "bg-cyan-500/20 text-cyan-400" : "bg-[#5865F2]/20 text-[#5865F2]"} flex items-center justify-center flex-shrink-0 text-sm font-bold`}>{step}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <StepIcon className={`w-4 h-4 ${eliteAccent} flex-shrink-0`} />
                  <span className="font-semibold text-sm">{title}</span>
                </div>
                <p className="text-xs text-white/40 mt-1">{desc}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-0 bg-white/[0.03] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-amber-500/15"} flex items-center justify-center`}>
              <Lightbulb className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
            </div>
            Tips for Success
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { icon: TrendingUp, tip: "Maintain a high completion rate to build your reputation and win more bids." },
              { icon: CalendarClock, tip: "Submit realistic timelines. Missing deadlines can result in strikes." },
              { icon: Send, tip: "Send regular progress updates on active orders to keep staff informed." },
              { icon: Star, tip: "Quality matters. Consistently great work is the fastest path to Elite status." },
              { icon: Zap, tip: "Bid quickly when new orders drop. The 10-minute countdown starts with the first bid." },
              { icon: ArrowUpCircle, tip: "Keep your availability status updated so you get considered for direct assignments." },
            ].map(({ icon: TipIcon, tip }, i) => (
              <div key={i} className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]" data-testid={`tip-${i}`}>
                <TipIcon className={`w-4 h-4 mt-0.5 ${eliteAccent} flex-shrink-0`} />
                <p className="text-xs text-white/40">{tip}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
