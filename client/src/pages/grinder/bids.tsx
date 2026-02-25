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

  if (!grinder) return null;

  return (
    <AnimatedPage className="space-y-4">
      <FadeInUp>
      <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-3">
        <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-purple-500/15"} flex items-center justify-center`}>
          <Gavel className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-purple-400"}`} />
        </div>
        My Bids
        <Badge className="border-0 bg-white/[0.06] text-white/60 text-xs">{bids.length}</Badge>
      </h2>
      </FadeInUp>
      <FadeInUp>
      {bids.length === 0 ? (
        <Card className="border-0 bg-white/[0.03]">
          <CardContent className="p-8 sm:p-12 text-center">
            <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center mx-auto mb-4">
              <Gavel className="w-7 h-7 text-white/20" />
            </div>
            <p className="text-white/40">No bids yet. Check available orders to start bidding!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {bids.map((b: any) => {
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
                      {b.status === "Pending" && !isLost && (
                        <Button size="sm" variant="ghost" className="gap-1 text-xs" data-testid={`button-edit-bid-${b.id}`}
                          onClick={() => {
                            setEditBidDialog(b);
                            setEditBidAmount(b.bidAmount || "");
                            setEditTimeline(b.timeline || "");
                            setEditCanStart(b.canStart || "");
                          }}>
                          <Edit3 className="w-3 h-3" /> Edit
                        </Button>
                      )}
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
