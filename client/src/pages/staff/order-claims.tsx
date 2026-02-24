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
import type { OrderClaimRequest } from "@shared/schema";
import {
  LinkIcon, Check, X, FileText, ExternalLink, Clock
} from "lucide-react";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

function statusBadge(status: string) {
  if (status === "pending") return <Badge className="bg-amber-500/20 text-amber-400 border-0">Pending</Badge>;
  if (status === "approved") return <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-red-500/20 text-red-400 border-0">Rejected</Badge>;
  return <Badge className="border-0">{status}</Badge>;
}

export default function StaffOrderClaims() {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [filter, setFilter] = useState<StatusFilter>("pending");
  const [decisionNotes, setDecisionNotes] = useState<Record<string, string>>({});

  const queryUrl = filter === "all" ? "/api/order-claims" : `/api/order-claims?status=${filter}`;
  const { data: claims = [], isLoading } = useQuery<OrderClaimRequest[]>({
    queryKey: ["/api/order-claims", filter],
    queryFn: async () => {
      const res = await fetch(queryUrl, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch claims");
      return res.json();
    },
  });

  const decideMutation = useMutation({
    mutationFn: async ({ id, status, decisionNote }: { id: string; status: "approved" | "rejected"; decisionNote?: string }) => {
      const res = await apiRequest("PATCH", `/api/order-claims/${id}`, { status, decisionNote });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/order-claims"] });
      toast({ title: "Claim updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleDecision = (id: string, status: "approved" | "rejected") => {
    decideMutation.mutate({ id, status, decisionNote: decisionNotes[id] || undefined });
  };

  const filters: { label: string; value: StatusFilter }[] = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
            <FileText className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-order-claims-title">
              Order Claim Requests
            </h1>
            <p className="text-sm text-muted-foreground">Review and approve grinder order claim requests</p>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <div className="flex items-center gap-2 flex-wrap">
          {filters.map(f => (
            <Button
              key={f.value}
              variant={filter === f.value ? "default" : "outline"}
              className={filter === f.value ? "" : "border-white/10"}
              onClick={() => setFilter(f.value)}
              data-testid={`button-filter-${f.value}`}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </FadeInUp>

      {isLoading ? (
        <FadeInUp>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Card key={i} className="border-0 bg-white/[0.03] animate-pulse h-32" />)}
          </div>
        </FadeInUp>
      ) : claims.length === 0 ? (
        <FadeInUp>
          <Card className="border-0 bg-white/[0.03]">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-14 h-14 text-white/10 mb-4" />
              <p className="text-white/40 font-medium">No claim requests found</p>
              <p className="text-sm text-white/25 mt-1">
                {filter === "pending" ? "No pending claims to review" : "No claims match this filter"}
              </p>
            </CardContent>
          </Card>
        </FadeInUp>
      ) : (
        <FadeInUp>
          <div className="space-y-3">
            {claims.map(claim => (
              <Card key={claim.id} className="border-0 bg-white/[0.03]" data-testid={`card-claim-${claim.id}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {statusBadge(claim.status)}
                        <span className="text-sm text-muted-foreground" data-testid={`text-claim-grinder-${claim.id}`}>
                          Grinder: <span className="text-foreground font-medium">{claim.grinderId}</span>
                        </span>
                        <span className="text-sm text-muted-foreground" data-testid={`text-claim-order-${claim.id}`}>
                          Order: <span className="text-foreground font-medium">{claim.orderId}</span>
                        </span>
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
                        <p className="text-xs text-muted-foreground/70 italic">Decision note: {claim.decisionNote}</p>
                      )}
                    </div>

                    {claim.status === "pending" && (
                      <div className="flex flex-col gap-2 shrink-0 w-64">
                        <Input
                          placeholder="Decision note (optional)"
                          value={decisionNotes[claim.id] || ""}
                          onChange={(e) => setDecisionNotes(prev => ({ ...prev, [claim.id]: e.target.value }))}
                          className="bg-white/[0.03] border-white/10 text-sm"
                          data-testid={`input-decision-note-${claim.id}`}
                        />
                        <div className="flex items-center gap-2">
                          <Button
                            className="flex-1 gap-1 bg-emerald-600 text-white"
                            onClick={() => handleDecision(claim.id, "approved")}
                            disabled={decideMutation.isPending}
                            data-testid={`button-approve-${claim.id}`}
                          >
                            <Check className="w-4 h-4" /> Approve
                          </Button>
                          <Button
                            variant="outline"
                            className="flex-1 gap-1 border-red-500/30 text-red-400"
                            onClick={() => handleDecision(claim.id, "rejected")}
                            disabled={decideMutation.isPending}
                            data-testid={`button-reject-${claim.id}`}
                          >
                            <X className="w-4 h-4" /> Reject
                          </Button>
                        </div>
                      </div>
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
