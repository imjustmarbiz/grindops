import { useQuery } from "@tanstack/react-query";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tv, Radio, Users, ExternalLink, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import spLogo from "@assets/image_1771930905137.png";

type StreamGrinder = {
  id: string;
  name: string;
  twitchUsername: string;
  tier: string;
  avatarUrl?: string;
  roles?: string[];
  isLive?: boolean;
  activeOrders: { orderId: string; serviceId: string; platform: string; ticketLink: string }[];
};

export default function StaffStreams() {
  const { data: streamers = [], isLoading } = useQuery<StreamGrinder[]>({
    queryKey: ["/api/grinders/live-streams"],
    refetchInterval: 30000,
  });

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <div className="flex items-center gap-3 mb-2">
          <img src={spLogo} alt="SP" className="w-10 h-10 object-contain drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]" />
          <div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold tracking-tight text-glow" data-testid="text-streams-title">
              Content Multiplayer
            </h1>
            <p className="text-sm text-muted-foreground">Watch grinder live streams together</p>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <div className="flex items-center gap-3 p-4 rounded-xl border border-purple-500/20 bg-purple-500/5">
          <Radio className="w-5 h-5 text-purple-400 animate-pulse" />
          <span className="text-sm font-medium">
            {streamers.length} grinder{streamers.length !== 1 ? "s" : ""} with Twitch linked
            {streamers.some(s => s.isLive) && (
              <span className="ml-2 text-red-400">
                · {streamers.filter(s => s.isLive).length} live now
              </span>
            )}
          </span>
        </div>
      </FadeInUp>

      {isLoading ? (
        <FadeInUp>
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => (
              <Card key={i} className="bg-card/50 border-border/50 animate-pulse h-64" />
            ))}
          </div>
        </FadeInUp>
      ) : streamers.length === 0 ? (
        <FadeInUp>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Tv className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">No grinders have linked Twitch yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Grinders can link their Twitch accounts from their Status page</p>
            </CardContent>
          </Card>
        </FadeInUp>
      ) : (
        <FadeInUp>
          <div className="grid gap-4 md:grid-cols-2">
            {[...streamers].sort((a, b) => (b.isLive ? 1 : 0) - (a.isLive ? 1 : 0)).map(streamer => (
              <Card key={streamer.id} className={`bg-card/50 overflow-hidden group ${streamer.isLive ? "border-red-500/30 ring-1 ring-red-500/10" : "border-border/50"}`} data-testid={`card-stream-${streamer.id}`}>
                <div className="aspect-video bg-black/80 relative">
                  {streamer.isLive && (
                    <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600/90 text-white text-[10px] font-bold uppercase">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                      </span>
                      LIVE
                    </div>
                  )}
                  <iframe
                    src={`https://player.twitch.tv/?channel=${streamer.twitchUsername}&parent=${window.location.hostname}&muted=true`}
                    height="100%"
                    width="100%"
                    allowFullScreen
                    className="absolute inset-0"
                    title={`${streamer.name}'s Twitch Stream`}
                  />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9 border border-purple-500/20">
                        <AvatarImage src={streamer.avatarUrl} />
                        <AvatarFallback className="bg-purple-500/20 text-purple-300 text-sm">{streamer.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{streamer.name}</p>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-purple-500/10 text-purple-300 border-purple-500/20">
                            {streamer.tier}
                          </Badge>
                          {streamer.roles?.map(role => (
                            <Badge key={role} variant="outline" className="text-[9px] px-1 py-0">{role}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <a
                      href={`https://twitch.tv/${streamer.twitchUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-purple-400 transition-colors"
                      data-testid={`link-twitch-${streamer.id}`}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/30" data-testid={`section-active-orders-${streamer.id}`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Package className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium text-muted-foreground">Active Orders</span>
                    </div>
                    {streamer.activeOrders && streamer.activeOrders.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {streamer.activeOrders.map(order => {
                          const content = (
                            <>
                              {order.orderId}
                              {order.serviceId && <span className="ml-1 opacity-70">· {order.serviceId}</span>}
                              {order.platform && <span className="ml-1 opacity-70">· {order.platform}</span>}
                            </>
                          );
                          return order.ticketLink ? (
                            <a key={order.orderId} href={order.ticketLink} target="_blank" rel="noopener noreferrer" data-testid={`link-order-${order.orderId}`}>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 cursor-pointer hover:bg-primary/20 hover:text-primary transition-colors">
                                {content}
                                <ExternalLink className="w-2.5 h-2.5 ml-1 opacity-60" />
                              </Badge>
                            </a>
                          ) : (
                            <Badge key={order.orderId} variant="secondary" className="text-[10px] px-1.5 py-0" data-testid={`badge-order-${order.orderId}`}>
                              {content}
                            </Badge>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground/60" data-testid={`text-no-orders-${streamer.id}`}>No active orders</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </FadeInUp>
      )}
    </AnimatedPage>
  );
}
