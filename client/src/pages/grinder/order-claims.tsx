import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import type { OrderClaimRequest } from "@shared/schema";
import {
  LinkIcon, Send, FileText, ExternalLink, Clock
} from "lucide-react";

function statusBadge(status: string) {
  if (status === "pending") return <Badge className="bg-amber-500/20 text-amber-400 border-0">Pending</Badge>;
  if (status === "approved") return <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-red-500/20 text-red-400 border-0">Rejected</Badge>;
  return <Badge className="border-0">{status}</Badge>;
}

export default function GrinderOrderClaims() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { data: grinderProfile } = useQuery<any>({ queryKey: ["/api/grinder/me"] });
  const isElite = grinderProfile?.isElite || (user as any)?.discordRoles?.includes?.("1466370965016412316");

  const [orderId, setOrderId] = useState("");
  const [ticketName, setTicketName] = useState("");
  const [proofLinks, setProofLinks] = useState("");
  const [proofNotes, setProofNotes] = useState("");

  const { data: claims = [], isLoading } = useQuery<OrderClaimRequest[]>({
    queryKey: ["/api/order-claims"],
  });

  const submitMutation = useMutation({
    mutationFn: async (data: { orderId: string; ticketName?: string; proofLinks: string[]; proofNotes: string }) => {
      const res = await apiRequest("POST", "/api/order-claims", data);
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/order-claims"] });
      toast({ title: "Claim submitted successfully" });
      setOrderId("");
      setTicketName("");
      setProofLinks("");
      setProofNotes("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!orderId.trim()) {
      toast({ title: "Please enter an Order ID", variant: "destructive" });
      return;
    }
    const links = proofLinks.split(",").map(l => l.trim()).filter(Boolean);
    submitMutation.mutate({
      orderId: orderId.trim(),
      ticketName: ticketName.trim() || undefined,
      proofLinks: links,
      proofNotes: proofNotes.trim(),
    });
  };

  const accentColor = isElite ? "cyan" : "amber";

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-amber-500/15"} flex items-center justify-center`}>
            <FileText className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold" data-testid="text-order-claims-title">Claim an Order</h2>
            <p className="text-sm text-muted-foreground">Submit proof to claim an order or view your claim history</p>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <Card className="border-0 bg-white/[0.03]">
          <CardContent className="p-5 space-y-4">
            <h3 className={`text-sm font-medium uppercase tracking-wider ${isElite ? "text-cyan-400" : "text-amber-400"}`}>
              New Claim Request
            </h3>
            <div>
              <label className="text-sm font-medium mb-1 block">Order ID</label>
              <Input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Enter the order ID"
                className="bg-white/[0.03] border-white/10"
                data-testid="input-claim-order-id"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Ticket Name <span className="text-muted-foreground font-normal">(optional)</span></label>
              <Input
                value={ticketName}
                onChange={(e) => setTicketName(e.target.value)}
                placeholder="e.g. ticket-12345 or the Discord channel name"
                className="bg-white/[0.03] border-white/10"
                data-testid="input-claim-ticket-name"
              />
              <p className="text-xs text-muted-foreground mt-1">If you don't have the ticket ID, type the ticket name so staff can find it</p>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Proof Links (comma separated)</label>
              <Input
                value={proofLinks}
                onChange={(e) => setProofLinks(e.target.value)}
                placeholder="https://link1.com, https://link2.com"
                className="bg-white/[0.03] border-white/10"
                data-testid="input-claim-proof-links"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Proof Notes</label>
              <Textarea
                value={proofNotes}
                onChange={(e) => setProofNotes(e.target.value)}
                placeholder="Describe the proof or additional context..."
                className="bg-white/[0.03] border-white/10 min-h-[80px]"
                data-testid="input-claim-proof-notes"
              />
            </div>
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className={`w-full gap-2 ${isElite ? "bg-gradient-to-r from-cyan-600 to-cyan-500" : "bg-gradient-to-r from-primary to-primary/80"} text-white`}
              data-testid="button-submit-claim"
            >
              <Send className="w-4 h-4" />
              {submitMutation.isPending ? "Submitting..." : "Submit Claim"}
            </Button>
          </CardContent>
        </Card>
      </FadeInUp>

      <FadeInUp>
        <h3 className={`text-sm font-medium uppercase tracking-wider flex items-center gap-2 ${isElite ? "text-cyan-400" : "text-amber-400"}`}>
          <FileText className="w-4 h-4" /> Your Claims
        </h3>
      </FadeInUp>

      {isLoading ? (
        <FadeInUp>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Card key={i} className="border-0 bg-white/[0.03] animate-pulse h-24" />)}
          </div>
        </FadeInUp>
      ) : claims.length === 0 ? (
        <FadeInUp>
          <Card className="border-0 bg-white/[0.03]">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className={`w-14 h-14 mb-4 ${isElite ? "text-cyan-400/20" : "text-white/10"}`} />
              <p className="text-white/40 font-medium">No claims submitted yet</p>
              <p className="text-sm text-white/25 mt-1">Use the form above to submit your first claim</p>
            </CardContent>
          </Card>
        </FadeInUp>
      ) : (
        <FadeInUp>
          <div className="space-y-3">
            {claims.map(claim => (
              <Card key={claim.id} className="border-0 bg-white/[0.03]" data-testid={`card-claim-${claim.id}`}>
                <CardContent className="p-5 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {statusBadge(claim.status)}
                    <span className="text-sm text-muted-foreground" data-testid={`text-claim-order-${claim.id}`}>
                      Order: <span className="text-foreground font-medium">{claim.orderId}</span>
                    </span>
                    {claim.ticketName && (
                      <span className="text-sm text-muted-foreground" data-testid={`text-claim-ticket-${claim.id}`}>
                        Ticket: <span className="text-foreground font-medium">{claim.ticketName}</span>
                      </span>
                    )}
                  </div>

                  {(claim.proofLinks || []).length > 0 && (
                    <div className="flex items-start gap-2 flex-wrap">
                      <LinkIcon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex flex-col gap-1">
                        {(claim.proofLinks || []).map((link, idx) => (
                          <a
                            key={idx}
                            href={link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 underline"
                            data-testid={`link-proof-${claim.id}-${idx}`}
                          >
                            {link} <ExternalLink className="w-3 h-3" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {claim.proofNotes && (
                    <p className="text-sm text-muted-foreground" data-testid={`text-proof-notes-${claim.id}`}>
                      {claim.proofNotes}
                    </p>
                  )}

                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    <span data-testid={`text-claim-date-${claim.id}`}>
                      {new Date(claim.requestedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>

                  {claim.decisionNote && (
                    <p className="text-xs text-muted-foreground/70 italic">Staff note: {claim.decisionNote}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </FadeInUp>
      )}
    </AnimatedPage>
  );
}
