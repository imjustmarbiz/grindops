import { useState } from "react";
import { useGrinderData } from "@/hooks/use-grinder-data";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Loader2, Bell, AlertOctagon, Crown, CheckCircle, DollarSign,
  Eye, Sparkles, Lightbulb, ArrowUpCircle, Tv, ExternalLink
} from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";

export default function GrinderStatus() {
  const {
    grinder, isElite, strikeLogs, alerts, eliteRequests, eliteCoaching,
    unreadAlertCount, eliteAccent,
    markAlertReadMutation, ackStrikeMutation, eliteRequestMutation,
  } = useGrinderData();

  if (!grinder) return null;

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
      <Card className="border-0 bg-white/[0.03] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-blue-500/15"} flex items-center justify-center`}>
              <Bell className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-blue-400"}`} />
            </div>
            Alerts Inbox
            {unreadAlertCount > 0 && (
              <Badge className="bg-blue-500/20 text-blue-400 border-0 ml-2">{unreadAlertCount} unread</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-white/20" />
              </div>
              <p className="text-white/40 text-sm">No alerts yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert: any) => {
                const severityColors: Record<string, string> = {
                  info: "text-blue-400 bg-blue-500/10 border-blue-500/20",
                  warning: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
                  success: "text-green-400 bg-green-500/10 border-green-500/20",
                  danger: "text-red-400 bg-red-500/10 border-red-500/20",
                };
                const colors = severityColors[alert.severity] || severityColors.info;
                return (
                  <div
                    key={alert.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border ${colors} cursor-pointer transition-opacity ${alert.isRead ? "opacity-60" : ""}`}
                    onClick={() => { if (!alert.isRead) markAlertReadMutation.mutate(alert.id); }}
                    data-testid={`card-alert-${alert.id}`}
                  >
                    {!alert.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 mt-2 shrink-0" />}
                    {alert.isRead && <Eye className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{alert.title}</span>
                        <Badge variant="outline" className={`text-xs ${colors}`}>{alert.severity}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(alert.createdAt).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </FadeInUp>

      <FadeInUp>
      <Card className="border-0 bg-white/[0.03] overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className={`w-9 h-9 rounded-xl ${grinder.strikes > 0 ? "bg-red-500/15" : isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15"} flex items-center justify-center`}>
              <AlertOctagon className={`w-5 h-5 ${grinder.strikes > 0 ? "text-red-400" : eliteAccent}`} />
            </div>
            Strike History
            <div className="flex items-center gap-1 ml-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <span
                  key={i}
                  className={`w-3 h-3 rounded-full ${i < (grinder.strikes || 0) ? "bg-red-500" : "bg-white/[0.1]"}`}
                />
              ))}
            </div>
            <span className="text-sm text-white/40 ml-1">({grinder.strikes || 0}/3)</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {strikeLogs.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="w-6 h-6 text-emerald-400/40" />
              </div>
              <p className="text-white/40 text-sm">No strike history. Keep it up!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {strikeLogs.map((log: any) => (
                <div key={log.id} className={`flex items-start justify-between gap-3 p-3 rounded-lg border ${log.delta > 0 ? "bg-red-500/5 border-red-500/20" : "bg-green-500/5 border-green-500/20"}`} data-testid={`card-strike-${log.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={log.delta > 0 ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"}>
                        {log.action} ({log.delta > 0 ? "+" : ""}{log.delta})
                      </Badge>
                      {!log.acknowledgedAt && (
                        <Badge className="bg-orange-500/20 text-orange-400">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{log.reason}</p>
                    {parseFloat(log.fineAmount || "0") > 0 && (
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={log.finePaid ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}>
                          <DollarSign className="w-3 h-3 mr-0.5" />
                          {log.finePaid ? "Paid" : "Unpaid"}: ${parseFloat(log.fineAmount).toFixed(2)}
                        </Badge>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(log.createdAt).toLocaleString()} — Resulting strikes: {log.resultingStrikes}
                    </p>
                  </div>
                  {!log.acknowledgedAt && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="shrink-0 gap-1"
                      disabled={ackStrikeMutation.isPending}
                      onClick={() => ackStrikeMutation.mutate(log.id)}
                      data-testid={`button-ack-strike-${log.id}`}
                    >
                      <CheckCircle className="w-3 h-3" /> Acknowledge
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </FadeInUp>

      <FadeInUp>
      <Card className={`border-0 overflow-hidden relative ${isElite ? "bg-gradient-to-r from-cyan-500/[0.08] via-background to-teal-500/[0.04]" : "bg-white/[0.03]"}`}>
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-amber-500/15"} flex items-center justify-center`}>
              <Crown className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
            </div>
            {isElite ? "Elite Status" : "Elite Grinder Role"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isElite ? (
            <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/20">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center">
                <Crown className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-bold text-cyan-300 text-lg">Elite Status Active</p>
                <p className="text-sm text-muted-foreground">You have access to elite-tier orders and priority bidding.</p>
              </div>
              <Sparkles className="w-6 h-6 text-cyan-400 ml-auto animate-pulse" />
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
                          { label: "Win Rate", yours: `${eliteCoaching.yourMetrics.winRate}%`, elite: `${eliteCoaching.eliteAverages.winRate}%`, good: eliteCoaching.yourMetrics.winRate >= eliteCoaching.eliteAverages.winRate },
                          { label: "Quality", yours: `${(Number(eliteCoaching.yourMetrics.quality) / 20).toFixed(1)}/5`, elite: `${(Number(eliteCoaching.eliteAverages.quality) / 20).toFixed(1)}/5`, good: eliteCoaching.yourMetrics.quality >= eliteCoaching.eliteAverages.quality },
                          { label: "On-Time", yours: `${Number(eliteCoaching.yourMetrics.onTime).toFixed(0)}%`, elite: `${Number(eliteCoaching.eliteAverages.onTime).toFixed(0)}%`, good: eliteCoaching.yourMetrics.onTime >= eliteCoaching.eliteAverages.onTime },
                          { label: "Completion", yours: `${Number(eliteCoaching.yourMetrics.completion).toFixed(0)}%`, elite: `${Number(eliteCoaching.eliteAverages.completion).toFixed(0)}%`, good: eliteCoaching.yourMetrics.completion >= eliteCoaching.eliteAverages.completion },
                          { label: "Turnaround", yours: `${eliteCoaching.yourMetrics.turnaround}h`, elite: `${eliteCoaching.eliteAverages.turnaround}h`, good: eliteCoaching.yourMetrics.turnaround <= eliteCoaching.eliteAverages.turnaround },
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
              <Button
                className={`w-full gap-2 ${isElite ? "" : "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white"}`}
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
            <div className="mt-4">
              <p className="text-sm font-medium mb-2 text-muted-foreground">Request History</p>
              <div className="space-y-2">
                {eliteRequests.map((req: any) => (
                  <div key={req.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10" data-testid={`card-elite-request-${req.id}`}>
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

      <FadeInUp>
        <TwitchLinkSection grinderId={grinder.id} currentUsername={(grinder as any).twitchUsername} isElite={isElite} />
      </FadeInUp>
    </AnimatedPage>
  );
}

function TwitchLinkSection({ grinderId, currentUsername, isElite }: { grinderId: string; currentUsername: string | null; isElite: boolean }) {
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState(currentUsername || "");

  const updateMutation = useMutation({
    mutationFn: async (twitchUsername: string) => {
      const res = await apiRequest("PATCH", `/api/grinders/${grinderId}/twitch`, { twitchUsername: twitchUsername || null });
      return res.json();
    },
    onSuccess: () => {
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ["/api/grinder/me"] });
    },
  });

  return (
    <Card className="border-0 bg-white/[0.03] overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-purple-500/[0.03] -translate-y-8 translate-x-8" />
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className={`w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center`}>
            <Tv className="w-5 h-5 text-purple-400" />
          </div>
          Twitch Integration
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4">Link your Twitch account so staff can watch your streams on the Content Multiplayer page.</p>
        {currentUsername && !editing ? (
          <div className="flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
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
