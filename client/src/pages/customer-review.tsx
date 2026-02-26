import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Star, Shield, Lock, CheckCircle, Clock, Send, XCircle, Loader2, ExternalLink
} from "lucide-react";
import spLogo from "@assets/image_1771930905137.png";

type Step = "enter_code" | "pending_approval" | "approved" | "submit_review" | "submitted" | "denied" | "expired" | "error";

export default function CustomerReviewPage() {
  const [step, setStep] = useState<Step>("enter_code");
  const [accessCode, setAccessCode] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [accessId, setAccessId] = useState("");
  const [sessionToken, setSessionToken] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [proofLinks, setProofLinks] = useState("");
  const [proofNotes, setProofNotes] = useState("");

  const handleVerify = async () => {
    if (!accessCode.trim() || !customerName.trim()) {
      setErrorMsg("Please enter both your name and the access code.");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/public/review-access/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessCode: accessCode.trim(), customerName: customerName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 410) {
          setStep("expired");
        } else if (res.status === 403) {
          setStep("denied");
        } else {
          setErrorMsg(data.error || "Invalid access code");
        }
        return;
      }
      if (data.status === "approved" && data.sessionToken) {
        setSessionToken(data.sessionToken);
        setStep("submit_review");
      } else {
        setAccessId(data.accessId);
        setStep("pending_approval");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (step !== "pending_approval" || !accessId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/public/review-access/${accessId}/status`);
        const data = await res.json();
        if (data.status === "approved" && data.sessionToken) {
          setSessionToken(data.sessionToken);
          setStep("submit_review");
        } else if (data.status === "denied") {
          setStep("denied");
        }
      } catch {}
    }, 3000);
    return () => clearInterval(interval);
  }, [step, accessId]);

  const handleSubmitReview = async () => {
    if (!rating || !title.trim() || !body.trim()) {
      setErrorMsg("Please fill in the rating, title, and your review.");
      return;
    }
    setIsLoading(true);
    setErrorMsg("");
    try {
      const links = proofLinks.split(",").map(l => l.trim()).filter(Boolean);
      const res = await fetch("/api/public/review/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionToken,
          rating,
          title: title.trim(),
          body: body.trim(),
          proofLinks: links.length > 0 ? links : [],
          proofNotes: proofNotes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Failed to submit review");
        return;
      }
      setStep("submitted");
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (step === "submitted") {
      const timer = setTimeout(() => {
        window.location.href = "https://discord.gg/2kservices";
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  return (
    <div className="min-h-screen bg-[#07070b] text-foreground flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img src={spLogo} alt="Logo" className="w-8 h-8 object-contain" />
          <span className="font-bold text-lg tracking-tight text-white">GrindOps</span>
        </div>

        {step === "enter_code" && (
          <Card className="border-0 bg-white/[0.04] backdrop-blur-xl" data-testid="card-enter-code">
            <CardContent className="p-6 space-y-5">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto">
                  <Lock className="w-7 h-7 text-primary" />
                </div>
                <h1 className="text-xl font-bold" data-testid="text-review-heading">Submit a Review</h1>
                <p className="text-sm text-muted-foreground">
                  Enter the access code provided to you and your name to get started.
                </p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Your Name</label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-white/[0.05] border-white/10"
                  data-testid="input-customer-name"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Access Code</label>
                <Input
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="e.g., AB3K7FMN"
                  className="bg-white/[0.05] border-white/10 font-mono tracking-widest text-center text-lg"
                  maxLength={8}
                  data-testid="input-access-code"
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400" data-testid="text-error">{errorMsg}</p>
                </div>
              )}

              <Button
                onClick={handleVerify}
                disabled={isLoading}
                className="w-full gap-2 bg-gradient-to-r from-primary to-primary/80"
                data-testid="button-verify-code"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                {isLoading ? "Verifying..." : "Verify Access Code"}
              </Button>

              <div className="flex items-center gap-2 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]">
                <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your review will be verified and approved before being published. This ensures authenticity and quality.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {step === "pending_approval" && (
          <Card className="border-0 bg-white/[0.04] backdrop-blur-xl" data-testid="card-pending-approval">
            <CardContent className="p-6 space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7 text-amber-400 animate-pulse" />
              </div>
              <h2 className="text-xl font-bold">Waiting for Approval</h2>
              <p className="text-sm text-muted-foreground">
                Your access code has been verified. A team member needs to approve your access before you can submit your review.
              </p>
              <div className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                <span className="text-xs text-amber-400">Checking approval status...</span>
              </div>
              <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/20">
                This page will automatically update when approved
              </Badge>
            </CardContent>
          </Card>
        )}

        {step === "submit_review" && (
          <Card className="border-0 bg-white/[0.04] backdrop-blur-xl" data-testid="card-submit-review">
            <CardContent className="p-6 space-y-5">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-7 h-7 text-emerald-400" />
                </div>
                <h2 className="text-xl font-bold">Access Approved</h2>
                <p className="text-sm text-muted-foreground">You're now able to submit your review.</p>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Rating</label>
                <div className="flex items-center gap-1.5 justify-center" data-testid="input-rating-stars">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRating(i)}
                      className="focus:outline-none"
                      data-testid={`button-star-${i}`}
                    >
                      <Star
                        className={`w-8 h-8 transition-colors ${
                          i <= rating ? "text-amber-400 fill-amber-400" : "text-white/15 hover:text-white/30"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Title</label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Brief summary of your experience"
                  className="bg-white/[0.05] border-white/10"
                  data-testid="input-review-title"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Your Review</label>
                <Textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Tell us about your experience..."
                  className="bg-white/[0.05] border-white/10 min-h-[120px]"
                  data-testid="input-review-body"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Proof Links (optional, comma separated)</label>
                <Input
                  value={proofLinks}
                  onChange={(e) => setProofLinks(e.target.value)}
                  placeholder="e.g., https://imgur.com/abc"
                  className="bg-white/[0.05] border-white/10"
                  data-testid="input-proof-links"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1.5 block">Additional Notes (optional)</label>
                <Input
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  placeholder="Any extra context"
                  className="bg-white/[0.05] border-white/10"
                  data-testid="input-proof-notes"
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <p className="text-xs text-red-400" data-testid="text-error">{errorMsg}</p>
                </div>
              )}

              <Button
                onClick={handleSubmitReview}
                disabled={isLoading}
                className="w-full gap-2 bg-gradient-to-r from-emerald-600 to-emerald-500"
                data-testid="button-submit-review"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {isLoading ? "Submitting..." : "Submit Review"}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === "submitted" && (
          <Card className="border-0 bg-white/[0.04] backdrop-blur-xl" data-testid="card-submitted">
            <CardContent className="p-6 space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 flex items-center justify-center mx-auto">
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-emerald-400">Review Submitted!</h2>
              <p className="text-sm text-muted-foreground">
                Thank you for your feedback! Your review has been submitted and will be reviewed by the team before being published.
              </p>
              <p className="text-sm text-muted-foreground">
                Redirecting you to our Discord...
              </p>
              <a
                href="https://discord.gg/2kservices"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#5865F2] hover:bg-[#4752C4] text-white font-medium transition-colors"
                data-testid="link-discord-redirect"
              >
                Join our Discord
              </a>
            </CardContent>
          </Card>
        )}

        {step === "denied" && (
          <Card className="border-0 bg-white/[0.04] backdrop-blur-xl" data-testid="card-denied">
            <CardContent className="p-6 space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center mx-auto">
                <XCircle className="w-7 h-7 text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-red-400">Access Denied</h2>
              <p className="text-sm text-muted-foreground">
                Your access request was denied. If you believe this is a mistake, please contact the person who shared this link with you.
              </p>
            </CardContent>
          </Card>
        )}

        {step === "expired" && (
          <Card className="border-0 bg-white/[0.04] backdrop-blur-xl" data-testid="card-expired">
            <CardContent className="p-6 space-y-5 text-center">
              <div className="w-14 h-14 rounded-2xl bg-orange-500/15 flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7 text-orange-400" />
              </div>
              <h2 className="text-xl font-bold text-orange-400">Code Expired</h2>
              <p className="text-sm text-muted-foreground">
                This access code has expired. Please request a new code from your service provider.
              </p>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-[10px] text-muted-foreground/50">
          Powered by GrindOps
        </p>
      </div>
    </div>
  );
}