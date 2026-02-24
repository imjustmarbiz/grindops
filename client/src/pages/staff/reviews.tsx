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
import type { CustomerReview } from "@shared/schema";
import {
  Star, Check, X, MessageSquare, User, ExternalLink
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge className="bg-emerald-500/20 text-emerald-400 border-0" data-testid="badge-status-approved">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-red-500/20 text-red-400 border-0" data-testid="badge-status-rejected">Rejected</Badge>;
  return <Badge className="bg-amber-500/20 text-amber-400 border-0" data-testid="badge-status-pending">Pending</Badge>;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5" data-testid="display-star-rating">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-4 h-4 ${i <= rating ? "text-amber-400 fill-amber-400" : "text-white/10"}`}
        />
      ))}
    </div>
  );
}

function ReviewCard({ review, onAction }: { review: CustomerReview; onAction: (id: string, status: string, note: string) => void }) {
  const [decisionNote, setDecisionNote] = useState("");
  const [showNote, setShowNote] = useState(false);

  return (
    <Card className="border-0 bg-white/[0.03]" data-testid={`card-review-${review.id}`}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium" data-testid={`text-reviewer-name-${review.id}`}>{review.reviewerName}</span>
              </div>
              <Badge variant="outline" className="text-[10px] border-white/10" data-testid={`badge-reviewer-role-${review.id}`}>{review.reviewerRole}</Badge>
              <StatusBadge status={review.status} />
            </div>

            <div className="mb-2">
              <StarRating rating={review.rating} />
            </div>

            <h4 className="font-bold text-base mb-1" data-testid={`text-review-title-${review.id}`}>{review.title}</h4>
            <p className="text-sm text-muted-foreground mb-3" data-testid={`text-review-body-${review.id}`}>{review.body}</p>

            <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
              <span data-testid={`text-grinder-id-${review.id}`}>Grinder: {review.grinderId}</span>
              {review.orderId && <span>Order: {review.orderId}</span>}
              <span>{new Date(review.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>

            {(review.proofLinks || []).length > 0 && (
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {(review.proofLinks || []).map((link, idx) => (
                  <a
                    key={idx}
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
                    data-testid={`link-proof-${review.id}-${idx}`}
                  >
                    <ExternalLink className="w-3 h-3" />
                    Proof {idx + 1}
                  </a>
                ))}
              </div>
            )}

            {review.proofNotes && (
              <p className="text-xs text-muted-foreground/70 mt-1 italic">Note: {review.proofNotes}</p>
            )}

            {review.decisionNote && (
              <div className="mt-2 text-xs text-muted-foreground/70 flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                Decision: {review.decisionNote}
              </div>
            )}
          </div>

          {review.status === "pending" && (
            <div className="flex flex-col gap-2 shrink-0">
              {showNote && (
                <Input
                  placeholder="Decision note (optional)"
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  className="bg-background/50 border-white/10 text-xs"
                  data-testid={`input-decision-note-${review.id}`}
                />
              )}
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-muted-foreground"
                  onClick={() => setShowNote(!showNote)}
                  data-testid={`button-toggle-note-${review.id}`}
                >
                  <MessageSquare className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-emerald-400"
                  onClick={() => onAction(review.id, "approved", decisionNote)}
                  data-testid={`button-approve-review-${review.id}`}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-red-400"
                  onClick={() => onAction(review.id, "rejected", decisionNote)}
                  data-testid={`button-reject-review-${review.id}`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function StaffReviews() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState("all");

  const queryKey = statusFilter === "all"
    ? ["/api/reviews"]
    : ["/api/reviews", `?status=${statusFilter}`];

  const { data: reviews = [], isLoading } = useQuery<CustomerReview[]>({
    queryKey: ["/api/reviews", statusFilter],
    queryFn: async () => {
      const url = statusFilter === "all" ? "/api/reviews" : `/api/reviews?status=${statusFilter}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, status, decisionNote }: { id: string; status: string; decisionNote: string }) => {
      const res = await apiRequest("PATCH", `/api/reviews/${id}`, { status, decisionNote: decisionNote || undefined });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({ title: "Review updated" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleAction = (id: string, status: string, note: string) => {
    actionMutation.mutate({ id, status, decisionNote: note });
  };

  const pendingCount = reviews.filter(r => r.status === "pending").length;
  const approvedCount = reviews.filter(r => r.status === "approved").length;
  const rejectedCount = reviews.filter(r => r.status === "rejected").length;

  const filters = [
    { label: "All", value: "all" },
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
  ];

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center">
              <Star className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight" data-testid="text-reviews-title">
                Customer Reviews
              </h1>
              <p className="text-sm text-muted-foreground">Review and moderate submitted customer reviews</p>
            </div>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <div className="grid grid-cols-3 gap-3">
          <Card className="border-0 bg-gradient-to-br from-amber-500/[0.08] to-transparent">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-amber-400" data-testid="text-pending-count">{pendingCount}</p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-emerald-500/[0.08] to-transparent">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <Check className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-400" data-testid="text-approved-count">{approvedCount}</p>
                <p className="text-xs text-muted-foreground">Approved</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-red-500/[0.08] to-transparent">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                <X className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-red-400" data-testid="text-rejected-count">{rejectedCount}</p>
                <p className="text-xs text-muted-foreground">Rejected</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeInUp>

      <FadeInUp>
        <div className="flex items-center gap-2">
          {filters.map(f => (
            <Button
              key={f.value}
              variant={statusFilter === f.value ? "default" : "ghost"}
              size="sm"
              onClick={() => setStatusFilter(f.value)}
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
      ) : reviews.length === 0 ? (
        <FadeInUp>
          <Card className="border-0 bg-white/[0.03]">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MessageSquare className="w-14 h-14 text-white/10 mb-4" />
              <p className="text-muted-foreground font-medium" data-testid="text-empty-reviews">No reviews found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {statusFilter !== "all" ? `No ${statusFilter} reviews` : "No reviews have been submitted yet"}
              </p>
            </CardContent>
          </Card>
        </FadeInUp>
      ) : (
        <FadeInUp>
          <div className="space-y-3">
            {reviews.map(review => (
              <ReviewCard
                key={review.id}
                review={review}
                onAction={handleAction}
              />
            ))}
          </div>
        </FadeInUp>
      )}
    </AnimatedPage>
  );
}
