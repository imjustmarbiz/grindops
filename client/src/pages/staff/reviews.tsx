import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CustomerReview, Grinder, Order, Service, ReviewAccessCode } from "@shared/schema";
import {
  Star, Check, X, MessageSquare, User, ExternalLink, Filter, Shield, Clock
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

function ReviewCard({ review, onAction, grinderName }: { review: CustomerReview; onAction: (id: string, status: string, note: string) => void; grinderName?: string }) {
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
              <span data-testid={`text-grinder-id-${review.id}`}>Grinder: {grinderName || review.grinderId}</span>
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
  const [grinderFilter, setGrinderFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");

  const { data: reviews = [], isLoading } = useQuery<CustomerReview[]>({
    queryKey: ["/api/reviews", statusFilter],
    queryFn: async () => {
      const url = statusFilter === "all" ? "/api/reviews" : `/api/reviews?status=${statusFilter}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json();
    },
  });

  const { data: grinders = [] } = useQuery<Grinder[]>({ queryKey: ["/api/grinders"] });
  const { data: orders = [] } = useQuery<Order[]>({ queryKey: ["/api/orders"] });
  const { data: services = [] } = useQuery<Service[]>({ queryKey: ["/api/services"] });
  const { data: accessCodes = [] } = useQuery<ReviewAccessCode[]>({ queryKey: ["/api/review-access/codes"] });

  const pendingAccessRequests = useMemo(() => accessCodes.filter(c => c.status === "pending_approval"), [accessCodes]);

  const approveAccessMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/review-access/${id}/approve`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/review-access/codes"] });
      toast({ title: "Access approved" });
    },
  });

  const denyAccessMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/review-access/${id}/deny`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/review-access/codes"] });
      toast({ title: "Access denied" });
    },
  });

  const grinderMap = useMemo(() => {
    const map = new Map<string, string>();
    grinders.forEach(g => map.set(g.id, g.name));
    return map;
  }, [grinders]);

  const orderServiceMap = useMemo(() => {
    const map = new Map<string, string>();
    orders.forEach(o => map.set(o.id, o.serviceId));
    return map;
  }, [orders]);

  const reviewGrinders = useMemo(() => {
    const ids = new Set(reviews.map(r => r.grinderId));
    return Array.from(ids).map(id => ({ id, name: grinderMap.get(id) || id })).sort((a, b) => a.name.localeCompare(b.name));
  }, [reviews, grinderMap]);

  const reviewServices = useMemo(() => {
    const svcIds = new Set<string>();
    reviews.forEach(r => {
      if (r.orderId) {
        const svcId = orderServiceMap.get(r.orderId);
        if (svcId) svcIds.add(svcId);
      }
    });
    return Array.from(svcIds).map(id => {
      const svc = services.find(s => s.id === id);
      return { id, name: svc?.name || id };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [reviews, orderServiceMap, services]);

  const filteredReviews = useMemo(() => {
    return reviews.filter(r => {
      if (grinderFilter !== "all" && r.grinderId !== grinderFilter) return false;
      if (serviceFilter !== "all") {
        if (!r.orderId) return false;
        const svcId = orderServiceMap.get(r.orderId);
        if (svcId !== serviceFilter) return false;
      }
      return true;
    });
  }, [reviews, grinderFilter, serviceFilter, orderServiceMap]);

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

  const pendingCount = filteredReviews.filter(r => r.status === "pending").length;
  const approvedCount = filteredReviews.filter(r => r.status === "approved").length;
  const rejectedCount = filteredReviews.filter(r => r.status === "rejected").length;
  const hasActiveFilters = grinderFilter !== "all" || serviceFilter !== "all";

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
            <Star className="w-7 h-7 text-amber-400" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight" data-testid="text-reviews-title">
                Customer Reviews
              </h1>
              <p className="text-sm text-muted-foreground">Review and moderate submitted customer reviews</p>
            </div>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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

      {pendingAccessRequests.length > 0 && (
        <FadeInUp>
          <Card className="border-0 bg-gradient-to-br from-amber-500/[0.06] to-transparent" data-testid="card-pending-access">
            <CardContent className="p-5 space-y-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" />
                Pending Customer Access Requests ({pendingAccessRequests.length})
              </h3>
              <p className="text-xs text-muted-foreground">Customers who entered a review access code and are waiting for approval.</p>
              <div className="space-y-2">
                {pendingAccessRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/[0.03] border border-amber-500/[0.12]" data-testid={`card-access-request-${req.id}`}>
                    <div className="min-w-0">
                      <p className="font-medium text-sm">{req.customerName || "Unknown"}</p>
                      <p className="text-xs text-muted-foreground">
                        Code: <span className="font-mono">{req.accessCode}</span>
                        {" · "}Grinder: {grinderMap.get(req.grinderId) || req.grinderId}
                        {req.orderId && <> · Order: {req.orderId}</>}
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button size="sm" variant="ghost" className="text-emerald-400 gap-1" onClick={() => approveAccessMutation.mutate(req.id)} data-testid={`button-approve-access-${req.id}`}>
                        <Check className="w-3.5 h-3.5" /> Approve
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-400 gap-1" onClick={() => denyAccessMutation.mutate(req.id)} data-testid={`button-deny-access-${req.id}`}>
                        <X className="w-3.5 h-3.5" /> Deny
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      <FadeInUp>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex items-center gap-2 flex-wrap">
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
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Filter className="w-3.5 h-3.5" />
            </div>
            <Select value={grinderFilter} onValueChange={setGrinderFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs bg-white/[0.03] border-white/[0.08]" data-testid="select-filter-grinder">
                <SelectValue placeholder="All Grinders" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0f] border-white/[0.08]">
                <SelectItem value="all" data-testid="select-grinder-all">All Grinders</SelectItem>
                {reviewGrinders.map(g => (
                  <SelectItem key={g.id} value={g.id} data-testid={`select-grinder-${g.id}`}>{g.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={serviceFilter} onValueChange={setServiceFilter}>
              <SelectTrigger className="w-[160px] h-8 text-xs bg-white/[0.03] border-white/[0.08]" data-testid="select-filter-service">
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent className="bg-[#0a0a0f] border-white/[0.08]">
                <SelectItem value="all" data-testid="select-service-all">All Services</SelectItem>
                {reviewServices.map(s => (
                  <SelectItem key={s.id} value={s.id} data-testid={`select-service-${s.id}`}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs text-muted-foreground"
                onClick={() => { setGrinderFilter("all"); setServiceFilter("all"); }}
                data-testid="button-clear-filters"
              >
                Clear
              </Button>
            )}
          </div>
        </div>
      </FadeInUp>

      {isLoading ? (
        <FadeInUp>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Card key={i} className="border-0 bg-white/[0.03] animate-pulse h-32" />)}
          </div>
        </FadeInUp>
      ) : filteredReviews.length === 0 ? (
        <FadeInUp>
          <Card className="border-0 bg-white/[0.03]">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MessageSquare className="w-14 h-14 text-white/10 mb-4" />
              <p className="text-muted-foreground font-medium" data-testid="text-empty-reviews">No reviews found</p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                {hasActiveFilters ? "No reviews match your filters" : statusFilter !== "all" ? `No ${statusFilter} reviews` : "No reviews have been submitted yet"}
              </p>
            </CardContent>
          </Card>
        </FadeInUp>
      ) : (
        <FadeInUp>
          <div className="space-y-3">
            {filteredReviews.map(review => (
              <ReviewCard
                key={review.id}
                review={review}
                onAction={handleAction}
                grinderName={grinderMap.get(review.grinderId)}
              />
            ))}
          </div>
        </FadeInUp>
      )}
    </AnimatedPage>
  );
}
