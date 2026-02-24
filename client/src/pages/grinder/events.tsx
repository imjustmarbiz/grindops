import { useQuery } from "@tanstack/react-query";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import type { Event } from "@shared/schema";
import {
  Calendar, Percent, Tag, Megaphone, Gamepad2, Star, AlertTriangle, Clock, Sparkles
} from "lucide-react";

export default function GrinderEvents() {
  const { user } = useAuth();
  const isElite = (user as any)?.discordRoles?.includes?.("1466370965016412316");
  const { data: events = [], isLoading } = useQuery<Event[]>({ queryKey: ["/api/events"] });

  const activeEvents = events.filter(e => e.isActive);
  const promos = activeEvents.filter(e => e.type === "promo");
  const gameEvents = activeEvents.filter(e => e.type === "event");
  const announcements = activeEvents.filter(e => e.type === "announcement");

  const accentColor = isElite ? "cyan" : "amber";

  const typeIcon = (type: string) => {
    if (type === "promo") return <Percent className="w-5 h-5 text-emerald-400" />;
    if (type === "announcement") return <Megaphone className="w-5 h-5 text-blue-400" />;
    return <Gamepad2 className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />;
  };

  const priorityBadge = (p: string) => {
    if (p === "urgent") return <Badge className="bg-red-500/20 text-red-400 border-0 text-[10px]"><AlertTriangle className="w-3 h-3 mr-0.5" />Urgent</Badge>;
    if (p === "high") return <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[10px]"><Star className="w-3 h-3 mr-0.5" />High Priority</Badge>;
    return null;
  };

  const isUpcoming = (event: Event) => new Date(event.startDate) > new Date();
  const isActive = (event: Event) => {
    const now = new Date();
    const start = new Date(event.startDate);
    if (event.endDate) {
      return start <= now && new Date(event.endDate) >= now;
    }
    return start <= now;
  };

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-amber-500/15"} flex items-center justify-center`}>
            <Calendar className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold" data-testid="text-events-title">Events & Promos</h2>
            <p className="text-sm text-muted-foreground">Stay up to date with upcoming events and promotions</p>
          </div>
        </div>
      </FadeInUp>

      {isLoading ? (
        <FadeInUp>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Card key={i} className="border-0 bg-white/[0.03] animate-pulse h-28" />)}
          </div>
        </FadeInUp>
      ) : activeEvents.length === 0 ? (
        <FadeInUp>
          <Card className="border-0 bg-white/[0.03]">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className={`w-14 h-14 mb-4 ${isElite ? "text-cyan-400/20" : "text-white/10"}`} />
              <p className="text-white/40 font-medium">No upcoming events or promos right now</p>
              <p className="text-sm text-white/25 mt-1">Check back later for new opportunities!</p>
            </CardContent>
          </Card>
        </FadeInUp>
      ) : (
        <>
          {promos.length > 0 && (
            <FadeInUp>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> Active Promotions
                </h3>
                {promos.map(event => (
                  <Card key={event.id} className="border-0 bg-gradient-to-r from-emerald-500/[0.06] to-transparent hover:from-emerald-500/[0.1] transition-all duration-300" data-testid={`card-promo-${event.id}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                          {event.discountPercent ? (
                            <span className="text-emerald-400 font-bold text-lg">{event.discountPercent}%</span>
                          ) : (
                            <Percent className="w-6 h-6 text-emerald-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-lg">{event.title}</span>
                            {event.discountPercent && <Badge className="bg-emerald-500/20 text-emerald-400 border-0">{event.discountPercent}% OFF</Badge>}
                            {priorityBadge(event.priority)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{isUpcoming(event) ? "Starts" : "Started"}: {new Date(event.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                            {event.endDate && <span>Ends: {new Date(event.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>}
                          </div>
                          {(event.tags || []).length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {(event.tags || []).map(tag => (
                                <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-500/20 text-emerald-300/70"><Tag className="w-2.5 h-2.5 mr-0.5" />{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </FadeInUp>
          )}

          {gameEvents.length > 0 && (
            <FadeInUp>
              <div className="space-y-3">
                <h3 className={`text-sm font-medium uppercase tracking-wider flex items-center gap-2 ${isElite ? "text-cyan-400" : "text-amber-400"}`}>
                  <Gamepad2 className="w-4 h-4" /> In-Game Events
                </h3>
                {gameEvents.map(event => (
                  <Card key={event.id} className={`border-0 bg-white/[0.03] ${isElite ? "hover:bg-cyan-500/[0.05]" : "hover:bg-amber-500/[0.05]"} transition-all duration-300`} data-testid={`card-event-${event.id}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-amber-500/15"} flex items-center justify-center shrink-0`}>
                          <Gamepad2 className={`w-6 h-6 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-lg">{event.title}</span>
                            {isUpcoming(event) && <Badge className={`${isElite ? "bg-cyan-500/20 text-cyan-400" : "bg-amber-500/20 text-amber-400"} border-0 text-[10px]`}>Upcoming</Badge>}
                            {isActive(event) && <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-[10px]">Live Now</Badge>}
                            {priorityBadge(event.priority)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(event.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                            {event.endDate && <span>Until: {new Date(event.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>}
                          </div>
                          {(event.tags || []).length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {(event.tags || []).map(tag => (
                                <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0"><Tag className="w-2.5 h-2.5 mr-0.5" />{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </FadeInUp>
          )}

          {announcements.length > 0 && (
            <FadeInUp>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-blue-400 uppercase tracking-wider flex items-center gap-2">
                  <Megaphone className="w-4 h-4" /> Announcements
                </h3>
                {announcements.map(event => (
                  <Card key={event.id} className="border-0 bg-white/[0.03] hover:bg-blue-500/[0.05] transition-all duration-300" data-testid={`card-announcement-${event.id}`}>
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
                          <Megaphone className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-bold text-lg">{event.title}</span>
                            {priorityBadge(event.priority)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{event.description}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(event.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </FadeInUp>
          )}
        </>
      )}
    </AnimatedPage>
  );
}
