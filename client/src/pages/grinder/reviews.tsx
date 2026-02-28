import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { HelpTip } from "@/components/help-tip";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CustomerReview, ReviewAccessCode } from "@shared/schema";
import {
  Star, Check, X, Send, MessageSquare, ExternalLink,
  Lock, Copy, Clock, CheckCircle, Shield, Key, Link2
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-red-500/20 text-red-400 border-0">Rejected</Badge>;
  return <Badge className="bg-amber-500/20 text-amber-400 border-0">Pending</Badge>;
}

function AccessStatusBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Approved</Badge>;
  if (status === "denied") return <Badge className="bg-red-500/20 text-red-400 border-0">Denied</Badge>;
  if (status === "pending_approval") return <Badge className="bg-amber-500/20 text-amber-400 border-0">Waiting</Badge>;
  if (status === "used") return <Badge className="bg-blue-500/20 text-blue-400 border-0">Used</Badge>;
  if (status === "unused") return <Badge className="bg-white/10 text-muted-foreground border-0">Unused</Badge>;
  return <Badge className="bg-white/10 text-muted-foreground border-0">{status}</Badge>;
}

function StarPicker({ value, onChange, isElite }: { value: number; onChange: (v: number) => void; isElite: boolean }) {
  return (
    <div className="flex items-center gap-1" data-testid="input-star-picker">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className="focus:outline-none"
          data-testid={`button-star-${i}`}
        >
          <Star
            className={`w-7 h-7 transition-colors ${
              i <= value
                ? isElite ? "text-cyan-400 fill-cyan-400" : "text-amber-400 fill-amber-400"
                : "text-white/15 hover:text-white/30"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function GrinderReviews() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: grinderProfile } = useQuery<any>({ queryKey: ["/api/grinder/me"], refetchInterval: 30000 });
  const isElite = grinderProfile?.isElite || (user as any)?.discordRoles?.includes?.("1466370965016412316");

  const { data: reviews = [], isLoading } = useQuery<CustomerReview[]>({
    queryKey: ["/api/reviews"],
    refetchInterval: 15000,
  });

  const { data: accessCodes = [] } = useQuery<ReviewAccessCode[]>({
    queryKey: ["/api/review-access/codes"],
    refetchInterval: 15000,
  });

  const assignments: any[] = grinderProfile?.assignments || [];

  const orderOptions = useMemo(() => {
    const reviewedOrderIds = new Set(reviews.map((r: any) => r.orderId).filter(Boolean));
    return assignments.map((a: any) => {
      const isCompleted = a.status === "Completed";
      const hasReview = reviewedOrderIds.has(a.orderId);
      let eligible = true;
      let reason = "";
      if (hasReview) {
        eligible = false;
        reason = "Review already submitted";
      } else if (!isCompleted) {
        eligible = false;
        reason = a.status === "Active" ? "Order not completed" : `Status: ${a.status}`;
      }
      return { orderId: a.orderId, eligible, reason };
    });
  }, [assignments, reviews]);

  const [orderId, setOrderId] = useState("");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [proofLinks, setProofLinks] = useState("");
  const [proofNotes, setProofNotes] = useState("");
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [generateOrderId, setGenerateOrderId] = useState("");
  const [activeTab, setActiveTab] = useState<"submit" | "invite" | "requests">("invite");

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/reviews", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({ title: "Review submitted", description: "Your review is pending approval" });
      setOrderId("");
      setRating(0);
      setTitle("");
      setBody("");
      setProofLinks("");
      setProofNotes("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/review-access/generate", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/review-access/codes"] });
      setGeneratedCode(data.accessCode);
      setGenerateOrderId("none");
      toast({ title: "Access code generated", description: "Share the code and link with your customer" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/review-access/${id}/approve`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/review-access/codes"] });
      toast({ title: "Access approved", description: "The customer can now submit their review" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const denyMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("PATCH", `/api/review-access/${id}/deny`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/review-access/codes"] });
      toast({ title: "Access denied" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!rating || !title.trim() || !body.trim()) {
      toast({ title: "Please fill in rating, title, and body", variant: "destructive" });
      return;
    }
    const links = proofLinks.split(",").map(l => l.trim()).filter(Boolean);
    const selectedOrder = orderId && orderId !== "none" ? orderId : undefined;
    submitMutation.mutate({
      grinderId: (user as any)?.grinderId || (user as any)?.id || "",
      orderId: selectedOrder,
      rating,
      title: title.trim(),
      body: body.trim(),
      proofLinks: links.length > 0 ? links : [],
      proofNotes: proofNotes.trim() || undefined,
    });
  };

  const handleGenerate = () => {
    const selectedOrder = generateOrderId && generateOrderId !== "none" ? generateOrderId : undefined;
    generateMutation.mutate({ orderId: selectedOrder });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const pendingRequests = accessCodes.filter(c => c.status === "pending_approval");
  const reviewPageUrl = `${window.location.origin}/customer-review`;

  const tabs = [
    { id: "invite" as const, label: "Invite Customer", icon: Key },
    { id: "submit" as const, label: "Submit Review", icon: Send },
    { id: "requests" as const, label: `Requests${pendingRequests.length > 0 ? ` (${pendingRequests.length})` : ""}`, icon: Shield },
  ];

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <div className="flex items-center gap-3">
          <Star className={`w-7 h-7 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold font-display tracking-tight" data-testid="text-reviews-title">Customer Reviews</h2>
              <HelpTip text="Positive reviews boost your quality score and help you climb the queue rankings. Generate an access code to let customers submit a review, or submit one yourself with proof for staff approval." />
            </div>
            <p className="text-sm text-muted-foreground">Invite customers to review, submit reviews, and manage access</p>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <div className="flex items-center gap-2 flex-wrap">
          {tabs.map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab(tab.id)}
              className="gap-1.5"
              data-testid={`button-tab-${tab.id}`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </Button>
          ))}
        </div>
      </FadeInUp>

      {activeTab === "invite" && (
        <FadeInUp>
          <Card className={`border-0 ${isElite ? "bg-gradient-to-br from-cyan-500/[0.06] to-transparent" : "bg-gradient-to-br from-primary/[0.06] to-transparent"}`}>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Key className={`w-4 h-4 ${isElite ? "text-cyan-400" : "text-primary"}`} />
                Generate Customer Access Code
              </h3>
              <p className="text-sm text-muted-foreground">
                Generate a secure access code for your customer. They'll enter it on the review page, and you'll need to approve their access before they can submit.
              </p>

              <div>
                <label className="text-sm font-medium mb-1 block">Select Order</label>
                {orderOptions.length > 0 ? (
                  <Select value={generateOrderId} onValueChange={setGenerateOrderId}>
                    <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-generate-order-id">
                      <SelectValue placeholder="Select an order..." />
                    </SelectTrigger>
                    <SelectContent>
                      {orderOptions.map((opt) => (
                        <SelectItem
                          key={opt.orderId}
                          value={opt.orderId}
                          disabled={!opt.eligible}
                          className={opt.eligible ? "text-purple-400" : "text-muted-foreground/50"}
                        >
                          <span className={opt.eligible ? "text-purple-400 font-medium" : "text-muted-foreground/60"}>
                            {opt.orderId}
                            {!opt.eligible && <span className="ml-1 text-[11px]">({opt.reason})</span>}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground/60 py-2">No assignments found</p>
                )}
              </div>

              <Button
                onClick={handleGenerate}
                disabled={generateMutation.isPending}
                className={`w-full gap-2 ${isElite ? "bg-gradient-to-r from-cyan-600 to-cyan-500" : "bg-gradient-to-r from-primary to-primary/80"}`}
                data-testid="button-generate-code"
              >
                <Lock className="w-4 h-4" />
                {generateMutation.isPending ? "Generating..." : "Generate Access Code"}
              </Button>

              {generatedCode && (
                <div className="p-4 rounded-xl bg-white/[0.05] border border-white/[0.1] space-y-3" data-testid="card-generated-code">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-2">Customer Access Code</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="font-mono text-2xl font-bold tracking-[0.3em] text-primary" data-testid="text-access-code">
                        {generatedCode}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(generatedCode)}
                        data-testid="button-copy-code"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="border-t border-white/[0.06] pt-3">
                    <p className="text-xs text-muted-foreground mb-2">Review Page Link</p>
                    <div className="flex items-center gap-2">
                      <Input
                        value={reviewPageUrl}
                        readOnly
                        className="bg-white/[0.03] border-white/[0.06] text-xs font-mono"
                        data-testid="input-review-url"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyToClipboard(reviewPageUrl)}
                        data-testid="button-copy-url"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/[0.08] border border-amber-500/[0.12]">
                    <Shield className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                    <p className="text-[11px] text-amber-300/80 leading-relaxed">
                      Share both the access code and the review page link with your customer. When they enter the code, you'll see an approval request in the "Requests" tab. Code expires in 7 days.
                    </p>
                  </div>
                </div>
              )}

              {accessCodes.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Access Codes</h4>
                  {accessCodes.slice(0, 10).map(code => (
                    <div
                      key={code.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                      data-testid={`card-access-code-${code.id}`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-sm font-medium tracking-wider">{code.accessCode}</span>
                        <AccessStatusBadge status={code.status} />
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
                        {code.customerName && <span>{code.customerName}</span>}
                        {code.orderId && <span>#{code.orderId}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      {activeTab === "requests" && (
        <FadeInUp>
          <Card className="border-0 bg-white/[0.03]">
            <CardContent className="p-5 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Shield className={`w-4 h-4 ${isElite ? "text-cyan-400" : "text-primary"}`} />
                Pending Access Requests
              </h3>
              <p className="text-sm text-muted-foreground">
                Customers who entered your access code will appear here. Approve to let them submit their review.
              </p>

              {pendingRequests.length === 0 ? (
                <div className="text-center py-10">
                  <Clock className="w-10 h-10 text-white/10 mx-auto mb-3" />
                  <p className="text-muted-foreground text-sm" data-testid="text-no-pending">No pending requests</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">When a customer enters your access code, their request will show here</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map(code => (
                    <div
                      key={code.id}
                      className="p-4 rounded-xl bg-amber-500/[0.05] border border-amber-500/[0.12]"
                      data-testid={`card-pending-request-${code.id}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-sm">{code.customerName || "Unknown Customer"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Code: <span className="font-mono">{code.accessCode}</span>
                            {code.orderId && <> · Order: {code.orderId}</>}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Requested: {new Date(code.usedAt || code.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-emerald-400 hover:bg-emerald-500/10 gap-1"
                            onClick={() => approveMutation.mutate(code.id)}
                            disabled={approveMutation.isPending}
                            data-testid={`button-approve-${code.id}`}
                          >
                            <Check className="w-4 h-4" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-400 hover:bg-red-500/10 gap-1"
                            onClick={() => denyMutation.mutate(code.id)}
                            disabled={denyMutation.isPending}
                            data-testid={`button-deny-${code.id}`}
                          >
                            <X className="w-4 h-4" />
                            Deny
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      {activeTab === "submit" && (
        <FadeInUp>
          <Card className={`border-0 ${isElite ? "bg-gradient-to-br from-cyan-500/[0.06] to-transparent" : "bg-gradient-to-br from-amber-500/[0.06] to-transparent"}`}>
            <CardContent className="p-5 space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Send className={`w-4 h-4 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
                Submit a Review Directly
              </h3>
              <p className="text-sm text-muted-foreground">
                Submit a customer review on behalf of your customer. This still requires staff approval.
              </p>

              <div>
                <label className="text-sm font-medium mb-1 block">Select Order</label>
                {orderOptions.length > 0 ? (
                  <Select value={orderId} onValueChange={setOrderId}>
                    <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-order-id">
                      <SelectValue placeholder="Select an order..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-muted-foreground">No order (general review)</SelectItem>
                      {orderOptions.map((opt) => (
                        <SelectItem
                          key={opt.orderId}
                          value={opt.orderId}
                          disabled={!opt.eligible}
                          className={opt.eligible ? "text-purple-400" : "text-muted-foreground/50"}
                        >
                          <span className={opt.eligible ? "text-purple-400 font-medium" : "text-muted-foreground/60"}>
                            {opt.orderId}
                            {!opt.eligible && <span className="ml-1 text-[11px]">({opt.reason})</span>}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <p className="text-sm text-muted-foreground/60 py-2">No assignments found</p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Rating</label>
                <StarPicker value={rating} onChange={setRating} isElite={isElite} />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of the review"
                  className="bg-background/50 border-white/10"
                  data-testid="input-review-title"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Body</label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Detailed customer feedback..."
                  className="bg-background/50 border-white/10 min-h-[100px]"
                  data-testid="input-review-body"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Proof Links (comma separated)</label>
                <Input
                  value={proofLinks}
                  onChange={(e) => setProofLinks(e.target.value)}
                  placeholder="e.g., https://imgur.com/abc, https://imgur.com/def"
                  className="bg-background/50 border-white/10"
                  data-testid="input-proof-links"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">Proof Notes (optional)</label>
                <Input
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  placeholder="Additional context about the proof"
                  className="bg-background/50 border-white/10"
                  data-testid="input-proof-notes"
                />
              </div>

              <Button
                onClick={handleSubmit}
                disabled={submitMutation.isPending}
                className={`w-full gap-2 ${isElite ? "bg-gradient-to-r from-cyan-600 to-cyan-500" : "bg-gradient-to-r from-primary to-primary/80"}`}
                data-testid="button-submit-review"
              >
                <Send className="w-4 h-4" />
                {submitMutation.isPending ? "Submitting..." : "Submit Review"}
              </Button>
            </CardContent>
          </Card>
        </FadeInUp>
      )}

      <FadeInUp>
        <h3 className={`text-sm font-medium uppercase tracking-wider flex items-center gap-2 ${isElite ? "text-cyan-400" : "text-amber-400"}`}>
          <MessageSquare className="w-4 h-4" /> Your Reviews ({reviews.length})
        </h3>
      </FadeInUp>

      {isLoading ? (
        <FadeInUp>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Card key={i} className="border-0 bg-white/[0.03] animate-pulse h-24" />)}
          </div>
        </FadeInUp>
      ) : reviews.length === 0 ? (
        <FadeInUp>
          <Card className="border-0 bg-white/[0.03]">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MessageSquare className={`w-14 h-14 mb-4 ${isElite ? "text-cyan-400/20" : "text-white/10"}`} />
              <p className="text-white/40 font-medium" data-testid="text-empty-reviews">No reviews submitted yet</p>
              <p className="text-sm text-white/25 mt-1">Generate an access code to invite your customer to leave a review</p>
            </CardContent>
          </Card>
        </FadeInUp>
      ) : (
        <FadeInUp>
          <div className="space-y-3">
            {reviews.map(review => (
              <Card
                key={review.id}
                className={`border-0 bg-white/[0.03] ${isElite ? "hover:bg-cyan-500/[0.05]" : "hover:bg-amber-500/[0.05]"} transition-all duration-300`}
                data-testid={`card-review-${review.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i <= review.rating ? isElite ? "text-cyan-400 fill-cyan-400" : "text-amber-400 fill-amber-400" : "text-white/10"}`}
                            />
                          ))}
                        </div>
                        <StatusBadge status={review.status} />
                        {review.reviewerRole === "customer" && (
                          <Badge className="bg-blue-500/15 text-blue-400 border-0 text-[10px]">Customer</Badge>
                        )}
                      </div>

                      <h4 className="font-bold text-base mb-1" data-testid={`text-review-title-${review.id}`}>{review.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2" data-testid={`text-review-body-${review.id}`}>{review.body}</p>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                        {review.reviewerName && <span>By: {review.reviewerName}</span>}
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
                              className={`flex items-center gap-1 text-xs ${isElite ? "text-cyan-400 hover:text-cyan-300" : "text-blue-400 hover:text-blue-300"}`}
                              data-testid={`link-proof-${review.id}-${idx}`}
                            >
                              <ExternalLink className="w-3 h-3" />
                              Proof {idx + 1}
                            </a>
                          ))}
                        </div>
                      )}

                      {review.decisionNote && (
                        <div className="mt-2 text-xs text-muted-foreground/70 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          Staff note: {review.decisionNote}
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
    </AnimatedPage>
  );
}