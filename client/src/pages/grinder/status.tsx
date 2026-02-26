import { useState } from "react";
import { useGrinderData } from "@/hooks/use-grinder-data";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, Crown, Sparkles, Lightbulb, ArrowUpCircle, Tv, ExternalLink, Info, Shield
} from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";

export default function GrinderStatus() {
  const {
    grinder, isElite, eliteRequests, eliteCoaching,
    eliteGradient, eliteAccent,
    eliteRequestMutation,
  } = useGrinderData();

  if (!grinder) return null;

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp delay={0}>
        <div className="flex items-center gap-3">
          <Crown className={`w-7 h-7 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight">Grinder Status</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Your role, elite progress, and integrations
            </p>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp delay={0.05}>
        <Card className={`border-0 overflow-hidden relative ${isElite ? "bg-gradient-to-br from-cyan-500/[0.08] via-background to-teal-500/[0.04]" : `bg-gradient-to-br ${eliteGradient}`}`}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/[0.02] -translate-y-12 translate-x-12" />
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg ${isElite ? "bg-cyan-500/15" : "bg-amber-500/15"} flex items-center justify-center`}>
                <Crown className={`w-4 h-4 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
              </div>
              {isElite ? "Elite Status" : "Path to Elite"}
              {isElite && (
                <Badge className="bg-cyan-500/15 text-cyan-400 border border-cyan-500/20 ml-auto text-xs">
                  Active
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 relative">
            {isElite ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/20">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center shrink-0">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-cyan-300 text-lg">Elite Status Active</p>
                  <p className="text-sm text-muted-foreground">You have access to elite-tier orders and priority bidding.</p>
                </div>
                <Sparkles className="w-6 h-6 text-cyan-400 ml-auto animate-pulse shrink-0" />
              </div>
            ) : (
              <>
                {eliteCoaching && (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={
                        eliteCoaching.readiness === "ready" ? "bg-green-500/20 text-green-400" :
                        eliteCoaching.readiness === "close" ? "bg-yellow-500/20 text-yellow-400" :
                        "bg-blue-500/20 text-blue-400"
                      } data-testid="badge-readiness">
                        {eliteCoaching.readiness === "ready" ? "Ready for Elite" :
                         eliteCoaching.readiness === "close" ? "Almost There" :
                         "Developing"}
                      </Badge>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border/50">
                            <th className="text-left py-2 text-muted-foreground font-medium">Metric</th>
                            <th className="text-right py-2 text-muted-foreground font-medium">Yours</th>
                            <th className="text-right py-2 text-muted-foreground font-medium">Elite Avg</th>
                          </tr>
                        </thead>
                        <tbody>
                          {[
                            { label: "Win Rate", yours: `${Number(eliteCoaching.yourMetrics.winRate).toFixed(1)}%`, elite: `${Number(eliteCoaching.eliteAverages.winRate).toFixed(1)}%`, good: eliteCoaching.yourMetrics.winRate >= eliteCoaching.eliteAverages.winRate },
                            { label: "Quality", yours: `${(Number(eliteCoaching.yourMetrics.quality) / 20).toFixed(1)}/5`, elite: `${(Number(eliteCoaching.eliteAverages.quality) / 20).toFixed(1)}/5`, good: eliteCoaching.yourMetrics.quality >= eliteCoaching.eliteAverages.quality },
                            { label: "On-Time", yours: `${Number(eliteCoaching.yourMetrics.onTime).toFixed(0)}%`, elite: `${Number(eliteCoaching.eliteAverages.onTime).toFixed(0)}%`, good: eliteCoaching.yourMetrics.onTime >= eliteCoaching.eliteAverages.onTime },
                            { label: "Completion", yours: `${Number(eliteCoaching.yourMetrics.completion).toFixed(0)}%`, elite: `${Number(eliteCoaching.eliteAverages.completion).toFixed(0)}%`, good: eliteCoaching.yourMetrics.completion >= eliteCoaching.eliteAverages.completion },
                            { label: "Turnaround", yours: `${Number(eliteCoaching.yourMetrics.turnaround).toFixed(1)}h`, elite: `${Number(eliteCoaching.eliteAverages.turnaround).toFixed(1)}h`, good: eliteCoaching.yourMetrics.turnaround <= eliteCoaching.eliteAverages.turnaround },
                            { label: "Completed", yours: String(eliteCoaching.yourMetrics.completed), elite: String(eliteCoaching.eliteAverages.completed), good: eliteCoaching.yourMetrics.completed >= eliteCoaching.eliteAverages.completed },
                            { label: "Strikes", yours: String(eliteCoaching.yourMetrics.strikes), elite: "0", good: eliteCoaching.yourMetrics.strikes === 0 },
                          ].map((row) => (
                            <tr key={row.label} className="border-b border-border/30">
                              <td className="py-2">{row.label}</td>
                              <td className={`py-2 text-right font-medium ${row.good ? "text-green-400" : "text-red-400"}`}>{row.yours}</td>
                              <td className="py-2 text-right text-muted-foreground">{row.elite}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {eliteCoaching.tips.length > 0 && (
                      <div className="space-y-2 mt-4">
                        <p className="text-sm font-medium flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-blue-400" /> Tips to Reach Elite
                        </p>
                        {eliteCoaching.tips.map((tip: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground" data-testid={`text-elite-tip-${i}`}>
                            <ArrowUpCircle className="w-4 h-4 mt-0.5 shrink-0 text-blue-500" />
                            <span>{tip}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl border border-amber-500/25 bg-amber-500/[0.06]" data-testid="banner-elite-disclaimer">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <p className="text-xs text-amber-300/90">
                    Staff will review elite applications on a case-by-case basis. The metrics shown above are not the sole factor in the decision. If denied, you can re-apply at any time.
                  </p>
                </div>
                <Button
                  className="w-full gap-2 justify-center bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"
                  disabled={eliteRequestMutation.isPending || eliteRequests.some((r: any) => r.status === "Pending")}
                  onClick={() => eliteRequestMutation.mutate()}
                  data-testid="button-request-elite"
                >
                  {eliteRequestMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Crown className="w-4 h-4" />
                  )}
                  {eliteRequests.some((r: any) => r.status === "Pending") ? "Elite Request Pending" : "Request Elite Status"}
                </Button>
              </>
            )}

            {eliteRequests.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium mb-2 text-muted-foreground">Request History</p>
                <div className="space-y-2">
                  {eliteRequests.map((req: any) => (
                    <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]" data-testid={`card-elite-request-${req.id}`}>
                      <div>
                        <p className="text-sm">{new Date(req.requestedAt).toLocaleDateString()}</p>
                        {req.decisionNotes && <p className="text-xs text-muted-foreground mt-1">{req.decisionNotes}</p>}
                      </div>
                      <Badge className={
                        req.status === "Approved" ? "bg-green-500/20 text-green-400" :
                        req.status === "Denied" ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }>
                        {req.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeInUp>

      <FadeInUp delay={0.1}>
        <TwitchLinkSection grinderId={grinder.id} currentUsername={(grinder as any).twitchUsername} isElite={isElite} />
      </FadeInUp>
    </AnimatedPage>
  );
}

function TwitchLinkSection({ grinderId, currentUsername, isElite }: { grinderId: string; currentUsername: string | null; isElite: boolean }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(currentUsername || "");

  const updateMutation = useMutation({
    mutationFn: async (twitchUsername: string) => {
      const res = await apiRequest("PATCH", `/api/grinder/me/twitch`, { twitchUsername: twitchUsername || null });
      return res.json();
    },
    onSuccess: (_: any, twitchUsername: string) => {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/grinder/me"] });
      toast({ title: twitchUsername ? "Twitch account linked" : "Twitch account unlinked" });
    },
    onError: (e: any) => {
      toast({ title: "Failed to update Twitch", description: e.message, variant: "destructive" });
    },
  });

  return (
    <Card className="border-0 bg-gradient-to-br from-purple-500/[0.06] via-background to-purple-900/[0.03] overflow-hidden relative">
      <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-purple-500/[0.03] -translate-y-12 translate-x-12" />
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/15 flex items-center justify-center">
            <Tv className="w-4 h-4 text-purple-400" />
          </div>
          Twitch Integration
          {currentUsername && (
            <Badge className="bg-purple-500/15 text-purple-400 border border-purple-500/20 ml-auto text-xs">
              Linked
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">Link your Twitch account so staff can watch your streams on the Streams page.</p>
        {currentUsername && !editing ? (
          <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/[0.06] border border-purple-500/20">
            <div className="flex items-center gap-2">
              <Tv className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium">{currentUsername}</span>
              <a href={`https://twitch.tv/${currentUsername}`} target="_blank" rel="noopener noreferrer" className="text-purple-400 hover:text-purple-300">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { setEditing(true); setUsername(currentUsername); }} className="text-xs" data-testid="button-edit-twitch">
                Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={() => updateMutation.mutate("")} className="text-xs text-destructive hover:text-destructive" data-testid="button-unlink-twitch">
                Unlink
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Your Twitch username"
              className="bg-background/50"
              data-testid="input-twitch-username"
            />
            <Button
              onClick={() => updateMutation.mutate(username.trim())}
              disabled={!username.trim() || updateMutation.isPending}
              data-testid="button-link-twitch"
              className="bg-purple-600 hover:bg-purple-700"
            >
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Link"}
            </Button>
            {editing && (
              <Button variant="ghost" onClick={() => setEditing(false)} data-testid="button-cancel-twitch">Cancel</Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
