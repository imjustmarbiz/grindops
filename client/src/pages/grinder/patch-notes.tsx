import { useQuery } from "@tanstack/react-query";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import type { PatchNote } from "@shared/schema";
import { Newspaper, Clock, Sparkles } from "lucide-react";

function renderPolishedText(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const trimmed = line.trim();
    if (!trimmed) return <br key={i} />;
    if (trimmed.startsWith("### ")) {
      return <h4 key={i} className="font-semibold text-sm mt-3 mb-1">{trimmed.slice(4)}</h4>;
    }
    if (trimmed.startsWith("## ")) {
      return <h3 key={i} className="font-bold text-base mt-4 mb-1">{trimmed.slice(3)}</h3>;
    }
    if (trimmed.startsWith("# ")) {
      return <h2 key={i} className="font-bold text-lg mt-4 mb-2">{trimmed.slice(2)}</h2>;
    }
    if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
      return (
        <div key={i} className="flex items-start gap-2 text-sm text-muted-foreground ml-2">
          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-current shrink-0" />
          <span>{trimmed.slice(2)}</span>
        </div>
      );
    }
    return <p key={i} className="text-sm text-muted-foreground">{trimmed}</p>;
  });
}

export default function GrinderPatchNotes() {
  const { user } = useAuth();
  const { data: grinderProfile } = useQuery<any>({ queryKey: ["/api/grinder/me"] });
  const isElite = grinderProfile?.isElite || (user as any)?.discordRoles?.includes?.("1466370965016412316");
  const { data: notes = [], isLoading } = useQuery<PatchNote[]>({ queryKey: ["/api/patch-notes"] });

  const accentColor = isElite ? "cyan" : "amber";

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-amber-500/15"} flex items-center justify-center`}>
            <Newspaper className={`w-5 h-5 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold" data-testid="text-patch-notes-title">Patch Notes</h2>
            <p className="text-sm text-muted-foreground">Latest updates and changes to the platform</p>
          </div>
        </div>
      </FadeInUp>

      {isLoading ? (
        <FadeInUp>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Card key={i} className="border-0 bg-white/[0.03] animate-pulse h-28" />)}
          </div>
        </FadeInUp>
      ) : notes.length === 0 ? (
        <FadeInUp>
          <Card className="border-0 bg-white/[0.03]">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Newspaper className={`w-14 h-14 mb-4 ${isElite ? "text-cyan-400/20" : "text-white/10"}`} />
              <p className="text-white/40 font-medium" data-testid="text-patch-notes-empty">No patch notes available yet</p>
              <p className="text-sm text-white/25 mt-1">Check back later for updates!</p>
            </CardContent>
          </Card>
        </FadeInUp>
      ) : (
        <div className="space-y-4">
          {notes.map(note => (
            <FadeInUp key={note.id}>
              <Card
                className={`border-0 bg-white/[0.03] ${isElite ? "hover:bg-cyan-500/[0.05]" : "hover:bg-amber-500/[0.05]"} transition-all duration-300`}
                data-testid={`card-patch-note-${note.id}`}
              >
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${isElite ? "bg-cyan-500/15" : "bg-amber-500/15"} flex items-center justify-center shrink-0`}>
                      <Sparkles className={`w-6 h-6 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-bold text-lg" data-testid={`text-patch-note-title-${note.id}`}>{note.title}</span>
                        <Badge className={`${isElite ? "bg-cyan-500/20 text-cyan-400" : "bg-amber-500/20 text-amber-400"} border-0 text-[10px]`}>
                          Update
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {note.publishedAt
                            ? new Date(note.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
                            : new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })
                          }
                        </span>
                      </div>
                      <div className="space-y-1" data-testid={`text-patch-note-content-${note.id}`}>
                        {renderPolishedText(note.polishedText || note.rawText)}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </FadeInUp>
          ))}
        </div>
      )}
    </AnimatedPage>
  );
}
