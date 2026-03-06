import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Megaphone, Copy, Link2, ExternalLink, Pencil, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { copyToClipboard as copyText } from "@/lib/utils";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { SiYoutube, SiTwitch, SiTiktok, SiInstagram } from "react-icons/si";
import { FaXTwitter } from "react-icons/fa6";

const CARD_GRADIENT = "border-0 bg-gradient-to-br from-emerald-500/[0.08] via-background to-emerald-900/[0.04] overflow-hidden relative shadow-xl shadow-black/20";
const ICON_BG = "bg-emerald-500/15";
const ACCENT_TEXT = "text-emerald-400";

const SOCIAL_PLATFORMS = [
  { key: "youtubeUrl" as const, label: "YouTube", icon: SiYoutube, color: "text-red-400", unlinkedBg: "bg-[#FF0000]", unlinkedIcon: "text-white", pattern: /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/i, example: "https://youtube.com/@yourchannel" },
  { key: "twitchUrl" as const, label: "Twitch", icon: SiTwitch, color: "text-purple-400", unlinkedBg: "bg-[#9146FF]", unlinkedIcon: "text-white", pattern: /^(https?:\/\/)?(www\.)?twitch\.tv\/.+$/i, example: "https://twitch.tv/yourchannel" },
  { key: "tiktokUrl" as const, label: "TikTok", icon: SiTiktok, color: "text-pink-400", unlinkedBg: "bg-black", unlinkedIcon: "text-white", pattern: /^(https?:\/\/)?(www\.)?(tiktok\.com|vm\.tiktok\.com)\/.+$/i, example: "https://tiktok.com/@yourhandle" },
  { key: "instagramUrl" as const, label: "Instagram", icon: SiInstagram, color: "text-rose-400", unlinkedBg: "bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737]", unlinkedIcon: "text-white", pattern: /^(https?:\/\/)?(www\.)?instagram\.com\/.+$/i, example: "https://instagram.com/yourhandle" },
  { key: "xUrl" as const, label: "X", icon: FaXTwitter, color: "text-foreground", unlinkedBg: "bg-black", unlinkedIcon: "text-white", pattern: /^(https?:\/\/)?(www\.)?(x\.com|twitter\.com)\/.+$/i, example: "https://x.com/yourhandle" },
] as const;

function validateSocialUrl(key: typeof SOCIAL_PLATFORMS[number]["key"], value: string): { valid: boolean; message?: string; normalized?: string } {
  const trimmed = value.trim();
  if (!trimmed) return { valid: true };
  const platform = SOCIAL_PLATFORMS.find((p) => p.key === key);
  if (!platform?.pattern) return { valid: true };
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    new URL(normalized);
  } catch {
    return { valid: false, message: "Enter a valid URL" };
  }
  if (!platform.pattern.test(normalized)) {
    return { valid: false, message: `URL must be a valid ${platform.label} link (e.g. ${platform.example})` };
  }
  return { valid: true, normalized };
}

export default function CreatorPromote() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [socialDialog, setSocialDialog] = useState<{ key: typeof SOCIAL_PLATFORMS[number]["key"]; label: string } | null>(null);
  const [socialUrlInput, setSocialUrlInput] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const { data, isLoading, error } = useQuery<{
    creator: { code: string; displayName: string; youtubeUrl?: string | null; twitchUrl?: string | null; tiktokUrl?: string | null; instagramUrl?: string | null; xUrl?: string | null };
  }>({ queryKey: ["/api/creator/me"] });

  const updateSocialMutation = useMutation({
    mutationFn: async ({ key, url }: { key: typeof SOCIAL_PLATFORMS[number]["key"]; url: string | null }) => {
      const res = await apiRequest("PATCH", "/api/creator/me", { [key]: url || null });
      return res.json();
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/creator/me"] });
      setSocialDialog(null);
      setSocialUrlInput("");
      setValidationError(null);
      toast({ title: variables.url ? "Link saved" : "Link removed" });
    },
    onError: (e: any) => toast({ title: "Failed to save", description: e?.message, variant: "destructive" }),
  });

  const openSocialDialog = (platform: typeof SOCIAL_PLATFORMS[number], currentUrl: string | null) => {
    setSocialDialog({ key: platform.key, label: platform.label });
    setSocialUrlInput(currentUrl || "");
    setValidationError(null);
  };

  const saveSocialUrl = () => {
    if (!socialDialog) return;
    const trimmed = socialUrlInput.trim();
    if (!trimmed) {
      updateSocialMutation.mutate({ key: socialDialog.key, url: null });
      return;
    }
    const result = validateSocialUrl(socialDialog.key, socialUrlInput);
    if (!result.valid) {
      setValidationError(result.message || "Invalid URL");
      return;
    }
    setValidationError(null);
    updateSocialMutation.mutate({ key: socialDialog.key, url: result.normalized ?? trimmed });
  };

  const copyToClipboard = (text: string, label: string) => {
    copyText(text).then((ok) => {
      if (ok) {
        if (label === "Code") {
          setCodeCopied(true);
          window.setTimeout(() => setCodeCopied(false), 2500);
        } else {
          toast({ title: `${label} copied`, description: "Copied to clipboard" });
        }
      } else {
        toast({ title: "Copy failed", description: "Try again or copy manually", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return (
      <AnimatedPage className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin w-10 h-10 border-2 border-white/20 border-t-white/60 rounded-full" />
      </AnimatedPage>
    );
  }

  if (error || !data?.creator) {
    return (
      <AnimatedPage>
        <Card className="border-0 bg-gradient-to-br from-emerald-500/[0.08] via-background to-emerald-900/[0.04] overflow-hidden shadow-xl shadow-black/20">
          <CardContent className="p-8 text-center text-white/70">Unable to load creator profile.</CardContent>
        </Card>
      </AnimatedPage>
    );
  }

  const creator = data.creator;

  return (
    <AnimatedPage className="space-y-4 sm:space-y-6">
      {/* Hero */}
      <FadeInUp>
        <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/40 via-emerald-900/20 to-green-950/30 p-5 sm:p-6">
          <div
            className="absolute top-0 right-0 w-64 h-64 -translate-y-12 translate-x-8 rounded-full overflow-hidden [mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [-webkit-mask-image:linear-gradient(to_bottom,black_45%,transparent_100%)] [mask-size:100%_100%] [mask-position:center]"
          >
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 flex items-center justify-center opacity-30">
              <Megaphone className="w-32 h-32 text-emerald-400" />
            </div>
          </div>
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shrink-0">
                <Megaphone className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold font-display tracking-tight text-white">
                  Promote
                </h1>
                <p className="text-sm text-white/80 mt-0.5">
                  Share your creator code and link your channels. Use valid profile URLs for each platform.
                </p>
              </div>
            </div>
            {creator && (() => {
              const linkedCount = SOCIAL_PLATFORMS.filter(p => !!((creator as any)[p.key] as string)?.trim()).length;
              if (linkedCount > 0) {
                return (
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 shrink-0">
                    {linkedCount} social{linkedCount !== 1 ? "s" : ""} linked
                  </Badge>
                );
              }
              return null;
            })()}
          </div>
        </div>
      </FadeInUp>

      {/* Your code */}
      <FadeInUp>
        <Card className={`${CARD_GRADIENT} relative`}>
          <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-emerald-500/[0.05] -translate-y-8 translate-x-8" />
          <CardHeader className="p-4 sm:p-6 pb-2 relative">
            <CardTitle className="text-lg font-display tracking-tight text-white flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg ${ICON_BG} flex items-center justify-center`}>
                <Copy className={`w-4 h-4 ${ACCENT_TEXT}`} />
              </div>
              Your creator code
            </CardTitle>
            <p className="text-xs text-white/60 mt-0.5">Share this at checkout so you earn commission.</p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 relative">
            <div className="flex flex-col sm:flex-row gap-3 min-w-0">
              <code className={`flex-1 min-w-0 px-3 py-2.5 sm:py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/25 font-mono italic text-base sm:text-lg font-bold ${ACCENT_TEXT} truncate`}>
                {creator.code}
              </code>
              <Button
                size="sm"
                variant="outline"
                className={
                  codeCopied
                    ? "shrink-0 min-h-11 sm:min-h-8 w-full sm:w-auto bg-white text-black border-white hover:bg-white hover:text-black"
                    : "!border-emerald-500/20 text-white/90 hover:bg-emerald-500/15 shrink-0 min-h-11 sm:min-h-8 w-full sm:w-auto"
                }
                onClick={() => copyToClipboard(creator.code, "Code")}
              >
                {codeCopied ? (
                  <>
                    <Check className="w-4 h-4 sm:mr-1" />
                    Code Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 sm:mr-1" />
                    <span>Copy</span>
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </FadeInUp>

      {/* Link Your Socials */}
      <FadeInUp>
        <Card className={`${CARD_GRADIENT} relative`}>
          <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-emerald-500/[0.04] -translate-y-10 translate-x-10" />
          <CardHeader className="p-4 sm:p-6 pb-2 relative">
            <CardTitle className="text-lg font-display tracking-tight text-white flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg ${ICON_BG} flex items-center justify-center`}>
                <Link2 className={`w-4 h-4 ${ACCENT_TEXT}`} />
              </div>
              Link Your Socials
            </CardTitle>
            <p className="text-xs text-white/60 mt-0.5">Connect your channels. Staff use these for attribution in Admin.</p>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 relative">
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
              {SOCIAL_PLATFORMS.map((platform) => {
                const Icon = platform.icon;
                const url = (creator as any)[platform.key] as string | null;
                const isLinked = !!url?.trim();
                return (
                  <div
                    key={platform.key}
                    className={`group relative flex flex-row sm:flex-col items-center gap-3 py-3 px-3 sm:p-5 rounded-xl border transition-all duration-300 hover:shadow-lg hover:shadow-black/20
                      ${isLinked
                        ? "bg-white/[0.06] border-white/10 shadow-md"
                        : "bg-white/[0.03] border-white/10 hover:bg-white/[0.05]"
                      }`}
                  >
                    {isLinked && (
                      <div className="absolute inset-0 rounded-xl bg-emerald-500/[0.02] pointer-events-none" />
                    )}
                    <div
                      className={`relative w-14 h-14 sm:w-12 sm:h-12 shrink-0 rounded-xl flex items-center justify-center sm:mb-2 transition-transform duration-300 group-hover:scale-110
                        ${isLinked ? "bg-emerald-500/15 " + platform.color : platform.unlinkedBg + " " + platform.unlinkedIcon}`}
                    >
                      <Icon className="w-7 h-7 sm:w-6 sm:h-6" />
                    </div>
                    <span className="flex-1 min-w-0 text-left sm:text-center text-sm sm:text-xs font-medium text-white/90 sm:mb-2">{platform.label}</span>
                    {isLinked ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <a href={url!} target="_blank" rel="noopener noreferrer" className="text-[11px] sm:text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium transition-colors">
                          <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Linked
                        </a>
                        <Button variant="ghost" size="sm" className="h-5 w-5 sm:h-6 sm:w-6 p-0 rounded-md hover:bg-white/10" onClick={() => openSocialDialog(platform, url)}>
                          <Pencil className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/50 hover:text-white/90" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 sm:h-7 text-xs border-emerald-500/30 text-white/90 hover:bg-emerald-500/15 transition-all shrink-0"
                        onClick={() => openSocialDialog(platform, null)}
                      >
                        Connect
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </FadeInUp>

      <Dialog open={!!socialDialog} onOpenChange={(open) => !open && setSocialDialog(null)}>
        <DialogContent className="border-border bg-background/95 backdrop-blur-xl sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{socialDialog ? `Link ${socialDialog.label}` : ""}</DialogTitle>
          </DialogHeader>
          {socialDialog && (
            <div className="space-y-4">
              <div>
                <Input
                  placeholder={SOCIAL_PLATFORMS.find((p) => p.key === socialDialog.key)?.example || "https://"}
                  value={socialUrlInput}
                  onChange={(e) => {
                    setSocialUrlInput(e.target.value);
                    setValidationError(null);
                  }}
                  className="font-mono text-sm"
                />
                {validationError && <p className="text-xs text-destructive mt-1">{validationError}</p>}
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setSocialDialog(null)}>Cancel</Button>
                <Button variant="outline" onClick={saveSocialUrl} disabled={updateSocialMutation.isPending}>
                  {updateSocialMutation.isPending ? "Saving…" : "Save"}
                </Button>
                {(creator as any)[socialDialog.key] && (
                  <Button variant="destructive" onClick={() => updateSocialMutation.mutate({ key: socialDialog.key, url: null })} disabled={updateSocialMutation.isPending}>
                    Remove
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  );
}
