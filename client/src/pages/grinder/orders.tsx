import { useState } from "react";
import { useGrinderData, getDiscordMessageLink, getBidWarLink, BID_WAR_CHANNEL_ID } from "@/hooks/use-grinder-data";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InlineCountdown } from "@/components/bidding-countdown";
import {
  Loader2, Gavel, Zap, Target, ExternalLink, Sparkles
} from "lucide-react";

export default function GrinderOrders() {
  const {
    grinder, isElite, availableOrders, serviceName, placeBidMutation,
  } = useGrinderData();

  const [placeBidDialog, setPlaceBidDialog] = useState<any>(null);
  const [placeBidAmount, setPlaceBidAmount] = useState("");
  const [placeBidTimeline, setPlaceBidTimeline] = useState("");
  const [placeBidCanStart, setPlaceBidCanStart] = useState("");

  if (!grinder) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-amber-500/15"} flex items-center justify-center`}>
            <Zap className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
          </div>
          Available Orders
          <Badge className="border-0 bg-white/[0.06] text-white/60 text-xs">{availableOrders.length}</Badge>
        </h2>
      </div>
      {availableOrders.length === 0 ? (
        <Card className="border-0 bg-white/[0.03]">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
              <Target className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/40">No open orders right now. Check back soon!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {availableOrders.map((order: any) => (
            <Card key={order.id} className={`border-0 bg-white/[0.03] ${isElite ? "sm:hover:bg-cyan-500/[0.05]" : "sm:hover:bg-[#5865F2]/[0.05]"} transition-all duration-200`} data-testid={`card-order-${order.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="font-bold text-lg">
                        {order.mgtOrderNumber ? `Order #${order.mgtOrderNumber}` : order.id}
                      </span>
                      <InlineCountdown biddingClosesAt={order.biddingClosesAt} />
                      {order.elitePriority && isElite && <Badge className="bg-cyan-500/20 text-cyan-400 border-cyan-500/30"><Sparkles className="w-3 h-3 mr-0.5" />Elite Early Access</Badge>}
                      {order.isManual && <Badge className="bg-amber-500/20 text-amber-400">Dashboard</Badge>}
                      {order.isEmergency && <Badge className="bg-red-500/20 text-red-400">EMERGENCY</Badge>}
                      {order.isRush && <Badge className="bg-orange-500/20 text-orange-400">RUSH</Badge>}
                      <Badge variant="outline" className="text-muted-foreground">{serviceName(order.serviceId)}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      {order.platform && <span>Platform: {order.platform}</span>}
                      {order.gamertag && <span>GT: {order.gamertag}</span>}
                      <span>Due: {new Date(order.orderDueDate).toLocaleDateString()}</span>
                      <span>Complexity: {order.complexity}/5</span>
                      <span>{order.totalBids} bid{order.totalBids !== 1 ? "s" : ""}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-0 sm:ml-4">
                    {order.hasBid ? (
                      <div className="flex items-center gap-2">
                        <Badge className="bg-blue-500/20 text-blue-400">
                          Bid: ${order.myBidAmount}
                        </Badge>
                        {order.myBidStatus === "Pending" && (
                          <Badge variant="outline" className="text-yellow-400 border-yellow-500/30">Pending</Badge>
                        )}
                      </div>
                    ) : order.isManual ? (
                      <Button
                        size="sm"
                        className={`gap-2 ${isElite ? "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white" : ""}`}
                        data-testid={`button-bid-${order.id}`}
                        onClick={() => {
                          setPlaceBidDialog(order);
                          setPlaceBidAmount("");
                          setPlaceBidTimeline("");
                          setPlaceBidCanStart("");
                        }}
                      >
                        <Gavel className="w-4 h-4" />
                        Place Bid
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className={`gap-2 ${isElite ? "bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-600 hover:to-teal-600 text-white" : ""}`}
                        data-testid={`button-bid-${order.id}`}
                        onClick={() => {
                          const link = order.discordMessageId
                            ? getDiscordMessageLink(BID_WAR_CHANNEL_ID, order.discordMessageId)
                            : getBidWarLink();
                          window.open(link, "_blank");
                        }}
                      >
                        <Gavel className="w-4 h-4" />
                        Place Bid
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!placeBidDialog} onOpenChange={(open) => !open && setPlaceBidDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Place Bid - {placeBidDialog?.mgtOrderNumber ? `Order #${placeBidDialog.mgtOrderNumber}` : placeBidDialog?.id}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-white/5 border border-white/10 space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Service:</span>
                <span className="font-medium">{serviceName(placeBidDialog?.serviceId)}</span>
              </div>
              {placeBidDialog?.platform && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Platform:</span>
                  <span>{placeBidDialog.platform}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Due:</span>
                <span>{placeBidDialog?.orderDueDate ? new Date(placeBidDialog.orderDueDate).toLocaleDateString() : "N/A"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Complexity:</span>
                <span>{placeBidDialog?.complexity}/5</span>
              </div>
              <Badge className="bg-amber-500/20 text-amber-400 mt-1">Dashboard Order</Badge>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Your Bid Amount ($)</label>
              <Input type="number" step="0.01" min="0" value={placeBidAmount} onChange={(e) => setPlaceBidAmount(e.target.value)} placeholder="Enter your price" data-testid="input-place-bid-amount" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Timeline</label>
              <Input value={placeBidTimeline} onChange={(e) => setPlaceBidTimeline(e.target.value)} placeholder="e.g., 2 hours, 1 day" data-testid="input-place-bid-timeline" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Can Start</label>
              <Input value={placeBidCanStart} onChange={(e) => setPlaceBidCanStart(e.target.value)} placeholder="e.g., Immediately, 3:00 PM" data-testid="input-place-bid-can-start" />
            </div>
            <Button
              className={`w-full ${isElite ? "bg-gradient-to-r from-cyan-500 to-teal-500" : ""}`}
              disabled={!placeBidAmount || placeBidMutation.isPending}
              data-testid="button-submit-bid"
              onClick={() => {
                placeBidMutation.mutate({
                  orderId: placeBidDialog.id,
                  bidAmount: placeBidAmount,
                  timeline: placeBidTimeline || undefined,
                  canStart: placeBidCanStart || undefined,
                });
                setPlaceBidDialog(null);
                setPlaceBidAmount("");
                setPlaceBidTimeline("");
                setPlaceBidCanStart("");
              }}
            >
              {placeBidMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Gavel className="w-4 h-4 mr-2" />}
              Submit Bid
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
