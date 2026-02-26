import { useState } from "react";
import { useGrinderData } from "@/hooks/use-grinder-data";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Loader2, Gavel, X, Edit3, ExternalLink, FileCheck
} from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { Link } from "wouter";

export default function GrinderBids() {
  const {
    grinder, isElite, bids, lostBids, editBidMutation, toast,
  } = useGrinderData();

  const [editBidDialog, setEditBidDialog] = useState<any>(null);
  const [joiningTicket, setJoiningTicket] = useState<string | null>(null);
  const [editBidAmount, setEditBidAmount] = useState("");
  const [editTimeline, setEditTimeline] = useState("");
  const [editCanStart, setEditCanStart] = useState("");

  const [bidFilter, setBidFilter] = useState<string>("all");

  if (!grinder) return null;

  const allBids = bids as any[];
  const filterCounts = {
    all: allBids.length,
    pending: allBids.filter((b: any) => b.status === "Pending" && !lostBids.find((lb: any) => lb.id === b.id)).length,
    accepted: allBids.filter((b: any) => b.status === "Accepted").length,
    lost: allBids.filter((b: any) => b.status === "Denied" || b.status === "Order Assigned" || !!lostBids.find((lb: any) => lb.id === b.id)).length,
  };

  const filteredBids = allBids.filter((b: any) => {
    if (bidFilter === "all") return true;
    const isLost = lostBids.find((lb: any) => lb.id === b.id);
    if (bidFilter === "pending") return b.status === "Pending" && !isLost;
    if (bidFilter === "accepted") return b.status === "Accepted";
    if (bidFilter === "lost") return b.status === "Denied" || b.status === "Order Assigned" || !!isLost;
    return true;
  });

  const bidFilters = [
    { key: "all", label: "All", color: "bg-white/[0.06] text-white/60" },
    { key: "pending", label: "Pending", color: "bg-yellow-500/15 text-yellow-400 border-yellow-500/20" },
    { key: "accepted", label: "Accepted", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" },
    { key: "lost", label: "Lost / Denied", color: "bg-red-500/15 text-red-400 border-red-500/20" },
  ];

  return (
    <AnimatedPage className="space-y-4">
      <FadeInUp>
      <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
        <Gavel className={`w-7 h-7 ${isElite ? "text-cyan-400" : "text-purple-400"}`} />
        My Bids
        <Badge className="border-0 bg-white/[0.06] text-white/60 text-xs">{allBids.length}</Badge>
      </h2>
      <p className="text-sm text-muted-foreground mt-1">Track your bid submissions, outcomes, and edit pending bids</p>
      </FadeInUp>
      {allBids.length > 0 && (
        <FadeInUp>
          <div className="flex items-center gap-2 flex-wrap" data-testid="filter-bid-status">
            {bidFilters.map((f) => {
              const count = filterCounts[f.key as keyof typeof filterCounts];
              const isActive = bidFilter === f.key;
              return (
                <Button
                  key={f.key}
                  size="sm"
                  variant="outline"
                  className={`text-xs h-8 gap-1.5 transition-all ${
                    isActive
                      ? `${f.color} border shadow-sm`
                      : "bg-transparent border-white/[0.06] text-muted-foreground hover:bg-white/[0.04]"
                  }`}
                  onClick={() => setBidFilter(f.key)}
                  data-testid={`button-filter-bid-${f.key}`}
                >
                  {f.label}
                  {count > 0 && (
                    <span className={`text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center ${
                      isActive ? "bg-white/10" : "bg-white/[0.06]"
                    }`}>{count}</span>
                  )}
                </Button>
              );
            })}
          </div>
        </FadeInUp>
      )}
      <FadeInUp>
      {allBids.length === 0 ? (
        <Card className="border-0 bg-white/[0.03]">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
              <Gavel className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/40">No bids yet. Check available orders to start bidding!</p>
          </CardContent>
        </Card>
      ) : filteredBids.length === 0 ? (
        <Card className="border-0 bg-white/[0.03]">
          <CardContent className="p-8 text-center">
            <p className="text-white/40 text-sm">No bids match this filter.</p>
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 text-xs text-muted-foreground"
              onClick={() => setBidFilter("all")}
              data-testid="button-clear-bid-filter"
            >
              Show all bids
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredBids.map((b: any) => {
            const isLost = lostBids.find((lb: any) => lb.id === b.id);
            return (
              <Card key={b.id} className={`border-0 ${isLost ? "bg-gradient-to-r from-red-500/[0.04] to-transparent" : "bg-white/[0.03]"} sm:hover:bg-white/[0.05] transition-all duration-200`} data-testid={`card-bid-${b.id}`}>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {isLost && (
                        <div className="w-7 h-7 rounded-lg bg-red-500/15 flex items-center justify-center">
                          <X className="w-4 h-4 text-red-400" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">Order {b.orderId}</p>
                        <div className="flex items-center gap-3 text-sm text-white/40 mt-1 flex-wrap">
                          <span className="font-medium text-white/60">Bid: ${b.bidAmount}</span>
                          {b.timeline && <span>Timeline: {b.timeline}</span>}
                          {b.canStart && <span>Can Start: {b.canStart}</span>}
                          <span>{b.bidTime ? new Date(b.bidTime).toLocaleDateString() : ""}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge className={`border-0 ${
                        b.status === "Accepted" ? "bg-emerald-500/20 text-emerald-400" :
                        b.status === "Denied" ? "bg-red-500/20 text-red-400" :
                        b.status === "Order Assigned" ? "bg-red-500/20 text-red-400" :
                        isLost ? "bg-red-500/20 text-red-400" :
                        "bg-yellow-500/20 text-yellow-400"
                      }`}>
                        {b.status === "Order Assigned" ? "Order Assigned" : isLost ? "Not Selected" : b.status}
                      </Badge>
                      {b.status === "Pending" && !isLost && (() => {
                        const biddingOpen = !b.biddingClosesAt || new Date(b.biddingClosesAt) > new Date();
                        return biddingOpen ? (
                          <Button size="sm" variant="ghost" className="gap-1 text-xs" data-testid={`button-edit-bid-${b.id}`}
                            onClick={() => {
                              setEditBidDialog(b);
                              setEditBidAmount(b.bidAmount || "");
                              setEditTimeline(b.timeline || "");
                              setEditCanStart(b.canStart || "");
                            }}>
                            <Edit3 className="w-3 h-3" /> Edit
                          </Button>
                        ) : (
                          <Badge className="bg-white/[0.06] text-white/40 border-0 text-[10px]" data-testid={`badge-bidding-closed-${b.id}`}>
                            Bidding Closed
                          </Badge>
                        );
                      })()}
                      {b.status === "Accepted" && (
                        <>
                          <Link href="/grinder/assignments">
                            <Button size="sm" variant="outline" className="gap-1 text-xs bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" data-testid={`button-view-order-${b.id}`}>
                              <FileCheck className="w-3 h-3" /> View Order
                            </Button>
                          </Link>
                          {b.hasTicket && (
                            <Button size="sm" variant="outline"
                              className="gap-1 text-xs bg-purple-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20"
                              data-testid={`button-join-ticket-${b.id}`}
                              disabled={joiningTicket === b.orderId}
                              onClick={async () => {
                                setJoiningTicket(b.orderId);
                                try {
                                  const res = await apiRequest("POST", `/api/orders/${b.orderId}/ticket-invite`);
                                  const data = await res.json();
                                  if (data.inviteUrl) window.open(data.inviteUrl, '_blank');
                                  else if (data.channelUrl) window.open(data.channelUrl, '_blank');
                                  toast({ title: "Ticket opened" });
                                } catch (err: any) {
                                  toast({ title: "Could not join ticket", description: err.message || "The bot may not have access.", variant: "destructive" });
                                } finally {
                                  setJoiningTicket(null);
                                }
                              }}
                            >
                              {joiningTicket === b.orderId ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />} Join Ticket
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      </FadeInUp>

      <Dialog open={!!editBidDialog} onOpenChange={(open) => !open && setEditBidDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bid - Order {editBidDialog?.orderId}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Bid Amount ($)</label>
              <Input type="number" value={editBidAmount} onChange={(e) => setEditBidAmount(e.target.value)} data-testid="input-edit-bid-amount" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Timeline</label>
              <Input value={editTimeline} onChange={(e) => setEditTimeline(e.target.value)} placeholder="e.g., 3 days" data-testid="input-edit-timeline" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Can Start</label>
              <Input value={editCanStart} onChange={(e) => setEditCanStart(e.target.value)} placeholder="e.g., Immediately" data-testid="input-edit-can-start" />
            </div>
            <Button className="w-full" data-testid="button-save-bid"
              disabled={editBidMutation.isPending}
              onClick={() => {
                const data: any = {};
                if (editBidAmount) data.bidAmount = editBidAmount;
                if (editTimeline) data.timeline = editTimeline;
                if (editCanStart) data.canStart = editCanStart;
                editBidMutation.mutate({ bidId: editBidDialog.id, data });
                setEditBidDialog(null);
              }}>
              {editBidMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Edit3 className="w-4 h-4 mr-2" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  );
}
