import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { CustomerReview } from "@shared/schema";
import {
  Star, Check, X, Send, MessageSquare, User, ExternalLink
} from "lucide-react";

function StatusBadge({ status }: { status: string }) {
  if (status === "approved") return <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Approved</Badge>;
  if (status === "rejected") return <Badge className="bg-red-500/20 text-red-400 border-0">Rejected</Badge>;
  return <Badge className="bg-amber-500/20 text-amber-400 border-0">Pending</Badge>;
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
  const isElite = (user as any)?.discordRoles?.includes?.("1466370965016412316");

  const { data: reviews = [], isLoading } = useQuery<CustomerReview[]>({
    queryKey: ["/api/reviews"],
  });

  const [orderId, setOrderId] = useState("");
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [proofLinks, setProofLinks] = useState("");
  const [proofNotes, setProofNotes] = useState("");

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

  const handleSubmit = () => {
    if (!rating || !title.trim() || !body.trim()) {
      toast({ title: "Please fill in rating, title, and body", variant: "destructive" });
      return;
    }
    const links = proofLinks.split(",").map(l => l.trim()).filter(Boolean);
    submitMutation.mutate({
      grinderId: (user as any)?.grinderId || (user as any)?.id || "",
      orderId: orderId.trim() || undefined,
      rating,
      title: title.trim(),
      body: body.trim(),
      proofLinks: links.length > 0 ? links : [],
      proofNotes: proofNotes.trim() || undefined,
    });
  };

  const accentColor = isElite ? "cyan" : "amber";

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-amber-500/15"} flex items-center justify-center`}>
            <Star className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold" data-testid="text-reviews-title">Customer Reviews</h2>
            <p className="text-sm text-muted-foreground">Submit and track your customer reviews</p>
          </div>
        </div>
      </FadeInUp>

      <FadeInUp>
        <Card className={`border-0 ${isElite ? "bg-gradient-to-br from-cyan-500/[0.06] to-transparent" : "bg-gradient-to-br from-amber-500/[0.06] to-transparent"}`}>
          <CardContent className="p-5 space-y-4">
            <h3 className="font-bold text-lg flex items-center gap-2">
              <Send className={`w-4 h-4 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
              Submit a Review
            </h3>

            <div>
              <label className="text-sm font-medium mb-1 block">Order ID (optional)</label>
              <Input
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g., ORD-12345"
                className="bg-background/50 border-white/10"
                data-testid="input-order-id"
              />
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
              <p className="text-sm text-white/25 mt-1">Submit your first customer review above</p>
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
                      </div>

                      <h4 className="font-bold text-base mb-1" data-testid={`text-review-title-${review.id}`}>{review.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2" data-testid={`text-review-body-${review.id}`}>{review.body}</p>

                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
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
