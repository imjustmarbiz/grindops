import { useQuery } from "@tanstack/react-query";
import { useGrinderData } from "@/hooks/use-grinder-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ClipboardCheck, Star, Clock, CheckCircle, Trophy, CalendarCheck,
  BarChart3, FileText, MessageSquare, LogIn, AlertTriangle, Send,
  ScrollText, CheckSquare, ExternalLink
} from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { HelpTip } from "@/components/help-tip";
import type { CustomerReview } from "@shared/schema";

function getGradeLetter(score: number): { letter: string; color: string } {
  if (score >= 90) return { letter: "A", color: "text-emerald-400" };
  if (score >= 75) return { letter: "B", color: "text-blue-400" };
  if (score >= 60) return { letter: "C", color: "text-yellow-400" };
  if (score >= 40) return { letter: "D", color: "text-orange-400" };
  return { letter: "F", color: "text-red-400" };
}

export default function GrinderScorecard() {
  const {
    grinder, isElite, isLoading: profileLoading,
    eliteAccent, eliteGradient, eliteBorder, eliteGlow,
  } = useGrinderData();

  const { data: scorecardData, isLoading: scorecardLoading } = useQuery<any>({
    queryKey: ["/api/grinder/me/scorecard"],
  });

  const { data: performanceReports, isLoading: reportsLoading } = useQuery<any[]>({
    queryKey: ["/api/grinder/me/performance-reports"],
  });

  const { data: customerReviews = [] } = useQuery<CustomerReview[]>({
    queryKey: ["/api/reviews"],
  });

  const approvedReviews = customerReviews.filter(r => r.status === "approved");

  const isLoading = profileLoading || scorecardLoading || reportsLoading;

  if (isLoading) {
    return (
      <div className="space-y-6" data-testid="scorecard-loading">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-48 w-full" />
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!grinder) return null;

  const checkpointStats = scorecardData?.checkpointCompliance || scorecardData?.checkpointStats;
  const reports = performanceReports || [];
  const orderLogs: any[] = scorecardData?.orderLogs || [];

  const qualityScore = grinder.avgQualityRating != null ? Number(grinder.avgQualityRating) : 0;
  const onTimeRate = grinder.onTimeRate != null ? Number(grinder.onTimeRate) : 0;
  const completionRate = grinder.completionRate != null ? Number(grinder.completionRate) : 0;
  const winRate = grinder.winRate != null ? Number(grinder.winRate) : 0;
  const dailyUpdateCompliance = grinder.dailyUpdateCompliance != null ? Number(grinder.dailyUpdateCompliance) : 0;

  const grade = getGradeLetter(qualityScore);

  const metrics = [
    { label: "On-Time Rate", value: onTimeRate, icon: Clock, gradient: "bg-gradient-to-br from-blue-500/[0.08] via-background to-blue-500/[0.04]", iconBg: "bg-blue-500/15", textColor: "text-blue-400" },
    { label: "Completion Rate", value: completionRate, icon: CheckCircle, gradient: "bg-gradient-to-br from-emerald-500/[0.08] via-background to-emerald-500/[0.04]", iconBg: "bg-emerald-500/15", textColor: "text-emerald-400" },
    { label: "Win Rate", value: winRate, icon: Trophy, gradient: "bg-gradient-to-br from-purple-500/[0.08] via-background to-purple-500/[0.04]", iconBg: "bg-purple-500/15", textColor: "text-purple-400" },
    { label: "Daily Update Compliance", value: dailyUpdateCompliance, icon: CalendarCheck, gradient: "bg-gradient-to-br from-yellow-500/[0.08] via-background to-yellow-500/[0.04]", iconBg: "bg-yellow-500/15", textColor: "text-yellow-400" },
  ];

  return (
    <AnimatedPage className="space-y-6" data-testid="scorecard-page">
      <FadeInUp>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15"} flex items-center justify-center`}>
          <ClipboardCheck className={`w-5 h-5 ${eliteAccent}`} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2" data-testid="text-scorecard-header">My Scorecard <HelpTip text="Your performance profile — quality score, completion rate, and customer reviews." /></h1>
      </div>
      </FadeInUp>

      <FadeInUp>
      <Card className={`border-0 overflow-hidden relative bg-gradient-to-r ${eliteGradient} border ${eliteBorder} ${eliteGlow}`} data-testid="card-quality-score">
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white/[0.02] -translate-y-12 translate-x-12" />
        <CardContent className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="flex flex-col items-center gap-2">
              <div className={`w-24 h-24 rounded-2xl ${isElite ? "bg-cyan-500/10 border border-cyan-500/20" : "bg-[#5865F2]/10 border border-[#5865F2]/20"} flex items-center justify-center`}>
                <span className={`text-5xl font-bold ${grade.color}`} data-testid="text-grade-letter">{grade.letter}</span>
              </div>
              <p className="text-xs font-medium uppercase tracking-wider text-white/40">Overall Grade</p>
            </div>
            <div className="flex-1 w-full space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Star className={`w-5 h-5 ${eliteAccent}`} />
                  <span className="text-sm font-medium text-muted-foreground">Quality Score</span>
                </div>
                <span className="text-2xl font-bold" data-testid="text-quality-score">{qualityScore.toFixed(0)}%</span>
              </div>
              <Progress value={qualityScore} className={`h-3 ${isElite ? "[&>div]:bg-cyan-500" : ""}`} />
              <p className="text-xs text-white/40">
                {qualityScore >= 90 ? "Excellent performance" : qualityScore >= 75 ? "Good performance" : qualityScore >= 60 ? "Average performance" : qualityScore >= 40 ? "Below average" : "Needs improvement"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      </FadeInUp>

      <FadeInUp>
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {metrics.map((metric, i) => (
          <Card key={i} className={`${metric.gradient} border-0 overflow-hidden relative`} data-testid={`card-metric-${metric.label.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/[0.02] -translate-y-6 translate-x-6" />
            <CardContent className="p-4 sm:p-5">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1">
                  <p className={`text-xl sm:text-2xl font-bold ${metric.textColor} tracking-tight`} data-testid={`text-metric-${metric.label.toLowerCase().replace(/\s/g, '-')}`}>{metric.value.toFixed(0)}%</p>
                  <p className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-white/40">{metric.label}</p>
                </div>
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${metric.iconBg} flex items-center justify-center backdrop-blur-sm shrink-0`}>
                  <metric.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${metric.textColor}`} />
                </div>
              </div>
              <Progress value={metric.value} className="h-1.5 mt-3" />
            </CardContent>
          </Card>
        ))}
      </div>
      </FadeInUp>

      <FadeInUp>
      <Card className="border-0 bg-white/[0.03] overflow-hidden relative" data-testid="card-performance-reports">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15"} flex items-center justify-center`}>
              <FileText className={`w-5 h-5 ${eliteAccent}`} />
            </div>
            Performance Reports
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6 text-white/20" />
              </div>
              <p className="text-white/40 text-sm" data-testid="text-no-reports">No performance reports yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((report: any, idx: number) => {
                const reportGrade = report.overallGrade || "N/A";
                return (
                  <div key={report.id || idx} className={`p-4 rounded-lg bg-white/[0.03] border border-white/[0.06] ${isElite ? "hover:border-cyan-500/20" : "hover:border-[#5865F2]/20"} transition-all duration-200`} data-testid={`card-report-${report.id || idx}`}>
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15"} flex items-center justify-center`}>
                          <BarChart3 className={`w-4 h-4 ${eliteAccent}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium" data-testid={`text-report-assignment-${report.id || idx}`}>Assignment {report.assignmentId || "N/A"}</p>
                          <p className="text-xs text-white/40">
                            Created: {report.createdAt ? new Date(report.createdAt).toLocaleDateString() : "N/A"}
                            {report.approvedAt && (
                              <span className="ml-2">Approved: {new Date(report.approvedAt).toLocaleDateString()}</span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`border-0 ${reportGrade === "A" ? "bg-emerald-500/20 text-emerald-400" : reportGrade === "B" ? "bg-blue-500/20 text-blue-400" : reportGrade === "C" ? "bg-yellow-500/20 text-yellow-400" : reportGrade === "D" ? "bg-orange-500/20 text-orange-400" : "bg-red-500/20 text-red-400"}`} data-testid={`badge-grade-${report.id || idx}`}>
                          Grade: {reportGrade}
                        </Badge>
                        {report.dailyUpdateCompliance != null && (
                          <Badge className="border-0 bg-white/[0.06] text-white/60" data-testid={`badge-compliance-${report.id || idx}`}>
                            Updates: {Number(report.dailyUpdateCompliance).toFixed(0)}%
                          </Badge>
                        )}
                      </div>
                    </div>

                    {report.metricsSnapshot && (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                        {[
                          { label: "Quality", value: report.metricsSnapshot.qualityScore },
                          { label: "Completion", value: report.metricsSnapshot.completionRate },
                          { label: "Win Rate", value: report.metricsSnapshot.winRate },
                          { label: "On-Time", value: report.metricsSnapshot.onTimeRate },
                        ].map((m, mi) => (
                          <div key={mi} className="p-2 rounded-md bg-white/[0.03] border border-white/[0.04]">
                            <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">{m.label}</p>
                            <p className="text-sm font-semibold" data-testid={`text-snapshot-${m.label.toLowerCase().replace(/\s/g, '-')}-${report.id || idx}`}>{m.value != null ? `${Number(m.value).toFixed(0)}%` : "N/A"}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {report.staffNotes && (
                      <div className="mt-3 p-3 rounded-md bg-white/[0.03] border border-white/[0.04]">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageSquare className="w-3.5 h-3.5 text-white/30" />
                          <p className="text-[10px] font-medium uppercase tracking-wider text-white/30">Staff Notes</p>
                        </div>
                        <p className="text-sm text-white/60" data-testid={`text-staff-notes-${report.id || idx}`}>{report.staffNotes}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      </FadeInUp>

      <FadeInUp>
      <Card className="border-0 bg-white/[0.03] overflow-hidden relative" data-testid="card-order-logs">
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15"} flex items-center justify-center`}>
              <ScrollText className={`w-5 h-5 ${eliteAccent}`} />
            </div>
            Order Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {orderLogs.length === 0 ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-3">
                <ScrollText className="w-6 h-6 text-white/20" />
              </div>
              <p className="text-white/40 text-sm" data-testid="text-no-order-logs">No order logs yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orderLogs.map((log: any, idx: number) => (
                <div key={log.id || idx} className={`p-4 rounded-lg bg-white/[0.03] border border-white/[0.06] ${isElite ? "hover:border-cyan-500/20" : "hover:border-[#5865F2]/20"} transition-all duration-200`} data-testid={`card-order-log-${log.id || idx}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg ${log.updateType === "progress" ? "bg-blue-500/15" : log.updateType === "completion" ? "bg-emerald-500/15" : "bg-yellow-500/15"} flex items-center justify-center shrink-0 mt-0.5`}>
                        {log.updateType === "completion" ? (
                          <CheckSquare className={`w-4 h-4 ${log.updateType === "completion" ? "text-emerald-400" : "text-blue-400"}`} />
                        ) : (
                          <Send className={`w-4 h-4 ${log.updateType === "progress" ? "text-blue-400" : "text-yellow-400"}`} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" data-testid={`text-order-log-title-${log.id || idx}`}>{log.orderTitle}</p>
                        <p className="text-xs text-white/40 mt-0.5">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString() : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                      <Badge className={`border-0 text-[10px] ${log.updateType === "progress" ? "bg-blue-500/20 text-blue-400" : log.updateType === "completion" ? "bg-emerald-500/20 text-emerald-400" : "bg-yellow-500/20 text-yellow-400"}`} data-testid={`badge-update-type-${log.id || idx}`}>
                        {log.updateType === "progress" ? "Progress" : log.updateType === "completion" ? "Completion" : log.updateType}
                      </Badge>
                      {log.acknowledgedAt && (
                        <Badge className="border-0 text-[10px] bg-emerald-500/10 text-emerald-400" data-testid={`badge-ack-${log.id || idx}`}>
                          Acknowledged
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 ml-11">
                    <p className="text-sm text-white/60 whitespace-pre-wrap" data-testid={`text-order-log-message-${log.id || idx}`}>{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      </FadeInUp>

      {checkpointStats && (
        <FadeInUp>
        <Card className="border-0 bg-white/[0.03] overflow-hidden relative" data-testid="card-activity-summary">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15"} flex items-center justify-center`}>
                <BarChart3 className={`w-5 h-5 ${eliteAccent}`} />
              </div>
              Activity Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 grid-cols-1 sm:grid-cols-3">
              {[
                { label: "Total Logins", value: checkpointStats.totalLogins ?? 0, icon: LogIn, color: "text-blue-400", bg: "bg-blue-500/15" },
                { label: "Issues Reported", value: checkpointStats.issuesReported ?? 0, icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/15" },
                { label: "Updates Submitted", value: checkpointStats.updatesSubmitted ?? 0, icon: Send, color: "text-emerald-400", bg: "bg-emerald-500/15" },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]" data-testid={`card-activity-${item.label.toLowerCase().replace(/\s/g, '-')}`}>
                  <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                    <item.icon className={`w-5 h-5 ${item.color}`} />
                  </div>
                  <div>
                    <p className="text-xl font-bold" data-testid={`text-activity-${item.label.toLowerCase().replace(/\s/g, '-')}`}>{item.value}</p>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-white/40">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </FadeInUp>
      )}

      {approvedReviews.length > 0 && (
        <FadeInUp>
        <Card className="border-0 bg-white/[0.03] overflow-hidden relative" data-testid="card-customer-reviews">
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-white/[0.02] -translate-y-8 translate-x-8" />
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-3 text-lg">
              <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-[#5865F2]/15"} flex items-center justify-center`}>
                <Star className={`w-5 h-5 ${eliteAccent}`} />
              </div>
              Customer Reviews
              <Badge className={`${isElite ? "bg-cyan-500/20 text-cyan-400" : "bg-[#5865F2]/20 text-[#5865F2]"} border-0 text-xs`}>
                {approvedReviews.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {approvedReviews.map((review) => (
                <div key={review.id} className="p-4 rounded-lg bg-white/[0.03] border border-white/[0.06]" data-testid={`card-review-${review.id}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm truncate" data-testid={`text-review-title-${review.id}`}>{review.title}</h4>
                        <div className="flex items-center gap-0.5 shrink-0">
                          {[1, 2, 3, 4, 5].map(s => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? "text-amber-400 fill-amber-400" : "text-white/10"}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-white/60 line-clamp-2" data-testid={`text-review-body-${review.id}`}>{review.body}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[10px] text-white/30">By {review.reviewerName}</span>
                        <span className="text-[10px] text-white/30">{new Date(review.createdAt).toLocaleDateString()}</span>
                        {review.proofLinks && (review.proofLinks as string[]).length > 0 && (
                          <span className="text-[10px] text-white/30 flex items-center gap-1">
                            <ExternalLink className="w-3 h-3" />
                            {(review.proofLinks as string[]).length} proof{(review.proofLinks as string[]).length > 1 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </FadeInUp>
      )}
    </AnimatedPage>
  );
}