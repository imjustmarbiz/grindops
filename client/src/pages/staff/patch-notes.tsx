import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { PatchNote } from "@shared/schema";
import {
  Newspaper, Plus, Sparkles, Pencil, Trash2, Send, Eye, EyeOff
} from "lucide-react";

export default function StaffPatchNotes() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: patchNotes = [], isLoading } = useQuery<PatchNote[]>({ queryKey: ["/api/patch-notes"] });
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newRawText, setNewRawText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editRawText, setEditRawText] = useState("");
  const [editPolishedText, setEditPolishedText] = useState("");

  const createMutation = useMutation({
    mutationFn: async (data: { title: string; rawText: string }) => {
      const res = await apiRequest("POST", "/api/patch-notes", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patch-notes"] });
      toast({ title: "Patch note created" });
      setCreateOpen(false);
      setNewTitle("");
      setNewRawText("");
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await apiRequest("PATCH", `/api/patch-notes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patch-notes"] });
      toast({ title: "Patch note updated" });
      setEditingId(null);
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/patch-notes/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patch-notes"] });
      toast({ title: "Patch note deleted" });
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const aiRewriteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("POST", `/api/patch-notes/${id}/ai-rewrite`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patch-notes"] });
      toast({ title: "AI rewrite complete" });
    },
    onError: (err: Error) => {
      toast({ title: "AI rewrite failed", description: err.message, variant: "destructive" });
    },
  });

  const handleCreate = () => {
    if (!newTitle.trim() || !newRawText.trim()) {
      toast({ title: "Please fill in title and raw text", variant: "destructive" });
      return;
    }
    createMutation.mutate({ title: newTitle.trim(), rawText: newRawText.trim() });
  };

  const startEditing = (note: PatchNote) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditRawText(note.rawText);
    setEditPolishedText(note.polishedText || "");
  };

  const saveEdit = (id: string) => {
    updateMutation.mutate({
      id,
      data: {
        title: editTitle.trim(),
        rawText: editRawText.trim(),
        polishedText: editPolishedText.trim() || null,
      },
    });
  };

  const togglePublish = (note: PatchNote) => {
    const newStatus = note.status === "published" ? "draft" : "published";
    updateMutation.mutate({ id: note.id, data: { status: newStatus } });
  };

  const renderPolishedContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (line.startsWith("### ")) {
        return <h3 key={i} className="text-base font-bold mt-3 mb-1">{line.slice(4)}</h3>;
      }
      if (line.startsWith("## ")) {
        return <h2 key={i} className="text-lg font-bold mt-4 mb-1">{line.slice(3)}</h2>;
      }
      if (line.startsWith("# ")) {
        return <h1 key={i} className="text-xl font-bold mt-4 mb-2">{line.slice(2)}</h1>;
      }
      if (line.startsWith("- ")) {
        return <li key={i} className="ml-4 text-sm text-white/70">{line.slice(2)}</li>;
      }
      if (line.trim() === "") {
        return <br key={i} />;
      }
      const formatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
      return <p key={i} className="text-sm text-white/70" dangerouslySetInnerHTML={{ __html: formatted }} />;
    });
  };

  const published = patchNotes.filter(n => n.status === "published");
  const drafts = patchNotes.filter(n => n.status !== "published");

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Newspaper className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight" data-testid="text-patch-notes-title">
                Staff Notes
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Create, polish, and publish staff notes for grinders</p>
            </div>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20" data-testid="button-create-patch-note">
                <Plus className="w-4 h-4" /> New Patch Note
              </Button>
            </DialogTrigger>
            <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Create Patch Note</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Title</label>
                  <Input
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g., v2.5 - Queue System Improvements"
                    className="bg-background/50 border-white/10"
                    data-testid="input-patch-note-title"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Raw Text</label>
                  <Textarea
                    value={newRawText}
                    onChange={(e) => setNewRawText(e.target.value)}
                    placeholder="Write your raw patch notes here... bullet points, rough notes, etc."
                    className="bg-background/50 border-white/10 min-h-[150px]"
                    data-testid="input-patch-note-raw-text"
                  />
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={createMutation.isPending}
                  className="w-full bg-gradient-to-r from-primary to-primary/80"
                  data-testid="button-save-patch-note"
                >
                  {createMutation.isPending ? "Creating..." : "Create Patch Note"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </FadeInUp>

      <FadeInUp>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border-0 bg-gradient-to-br from-blue-500/[0.08] to-transparent">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Newspaper className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-blue-400" data-testid="text-total-count">{patchNotes.length}</p>
                <p className="text-xs text-muted-foreground">Total Notes</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-emerald-500/[0.08] to-transparent">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <Send className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-400" data-testid="text-published-count">{published.length}</p>
                <p className="text-xs text-muted-foreground">Published</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-amber-500/[0.08] to-transparent">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Pencil className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-amber-400" data-testid="text-draft-count">{drafts.length}</p>
                <p className="text-xs text-muted-foreground">Drafts</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeInUp>

      {isLoading ? (
        <FadeInUp>
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Card key={i} className="bg-card/50 border-border/50 animate-pulse h-24" />)}
          </div>
        </FadeInUp>
      ) : patchNotes.length === 0 ? (
        <FadeInUp>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Newspaper className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">No patch notes yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Create one to keep grinders informed about updates</p>
            </CardContent>
          </Card>
        </FadeInUp>
      ) : (
        <>
          {published.length > 0 && (
            <FadeInUp>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Published ({published.length})
                </h3>
                {published.map(note => (
                  <PatchNoteCard
                    key={note.id}
                    note={note}
                    editingId={editingId}
                    editTitle={editTitle}
                    editRawText={editRawText}
                    editPolishedText={editPolishedText}
                    setEditTitle={setEditTitle}
                    setEditRawText={setEditRawText}
                    setEditPolishedText={setEditPolishedText}
                    onStartEdit={startEditing}
                    onSaveEdit={saveEdit}
                    onCancelEdit={() => setEditingId(null)}
                    onTogglePublish={togglePublish}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onAiRewrite={(id) => aiRewriteMutation.mutate(id)}
                    aiRewriteLoading={aiRewriteMutation.isPending}
                    aiRewriteTargetId={aiRewriteMutation.variables}
                    updatePending={updateMutation.isPending}
                    renderPolishedContent={renderPolishedContent}
                  />
                ))}
              </div>
            </FadeInUp>
          )}

          {drafts.length > 0 && (
            <FadeInUp>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <EyeOff className="w-4 h-4" /> Drafts ({drafts.length})
                </h3>
                {drafts.map(note => (
                  <PatchNoteCard
                    key={note.id}
                    note={note}
                    editingId={editingId}
                    editTitle={editTitle}
                    editRawText={editRawText}
                    editPolishedText={editPolishedText}
                    setEditTitle={setEditTitle}
                    setEditRawText={setEditRawText}
                    setEditPolishedText={setEditPolishedText}
                    onStartEdit={startEditing}
                    onSaveEdit={saveEdit}
                    onCancelEdit={() => setEditingId(null)}
                    onTogglePublish={togglePublish}
                    onDelete={(id) => deleteMutation.mutate(id)}
                    onAiRewrite={(id) => aiRewriteMutation.mutate(id)}
                    aiRewriteLoading={aiRewriteMutation.isPending}
                    aiRewriteTargetId={aiRewriteMutation.variables}
                    updatePending={updateMutation.isPending}
                    renderPolishedContent={renderPolishedContent}
                  />
                ))}
              </div>
            </FadeInUp>
          )}
        </>
      )}
    </AnimatedPage>
  );
}

function PatchNoteCard({
  note,
  editingId,
  editTitle,
  editRawText,
  editPolishedText,
  setEditTitle,
  setEditRawText,
  setEditPolishedText,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onTogglePublish,
  onDelete,
  onAiRewrite,
  aiRewriteLoading,
  aiRewriteTargetId,
  updatePending,
  renderPolishedContent,
}: {
  note: PatchNote;
  editingId: string | null;
  editTitle: string;
  editRawText: string;
  editPolishedText: string;
  setEditTitle: (v: string) => void;
  setEditRawText: (v: string) => void;
  setEditPolishedText: (v: string) => void;
  onStartEdit: (note: PatchNote) => void;
  onSaveEdit: (id: string) => void;
  onCancelEdit: () => void;
  onTogglePublish: (note: PatchNote) => void;
  onDelete: (id: string) => void;
  onAiRewrite: (id: string) => void;
  aiRewriteLoading: boolean;
  aiRewriteTargetId: string | undefined;
  updatePending: boolean;
  renderPolishedContent: (text: string) => JSX.Element[];
}) {
  const isEditing = editingId === note.id;
  const isRewriting = aiRewriteLoading && aiRewriteTargetId === note.id;

  return (
    <Card className="border-0 bg-white/[0.03] hover:bg-white/[0.05] transition-colors" data-testid={`card-patch-note-${note.id}`}>
      <CardContent className="p-4">
        {isEditing ? (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium mb-1 block">Title</label>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="bg-background/50 border-white/10"
                data-testid={`input-edit-title-${note.id}`}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Raw Text</label>
              <Textarea
                value={editRawText}
                onChange={(e) => setEditRawText(e.target.value)}
                className="bg-background/50 border-white/10 min-h-[100px]"
                data-testid={`input-edit-raw-text-${note.id}`}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Polished Text</label>
              <Textarea
                value={editPolishedText}
                onChange={(e) => setEditPolishedText(e.target.value)}
                className="bg-background/50 border-white/10 min-h-[120px]"
                data-testid={`input-edit-polished-text-${note.id}`}
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={() => onSaveEdit(note.id)}
                disabled={updatePending}
                className="bg-gradient-to-r from-primary to-primary/80"
                data-testid={`button-save-edit-${note.id}`}
              >
                {updatePending ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="ghost"
                onClick={onCancelEdit}
                data-testid={`button-cancel-edit-${note.id}`}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Newspaper className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-lg" data-testid={`text-patch-note-title-${note.id}`}>{note.title}</span>
                  <Badge className={`border-0 text-[10px] ${note.status === "published" ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`} data-testid={`badge-status-${note.id}`}>
                    {note.status === "published" ? "Published" : "Draft"}
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                  <span>By: {note.createdByName}</span>
                  <span>Created: {new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  {note.publishedAt && (
                    <span>Published: {new Date(note.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onAiRewrite(note.id)}
                  disabled={isRewriting}
                  data-testid={`button-ai-rewrite-${note.id}`}
                >
                  <Sparkles className={`w-4 h-4 ${isRewriting ? "animate-spin text-amber-400" : "text-muted-foreground"}`} />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onStartEdit(note)}
                  data-testid={`button-edit-patch-note-${note.id}`}
                >
                  <Pencil className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onTogglePublish(note)}
                  data-testid={`button-toggle-publish-${note.id}`}
                >
                  {note.status === "published" ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => onDelete(note.id)}
                  data-testid={`button-delete-patch-note-${note.id}`}
                >
                  <Trash2 className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Raw Text</p>
                <div className="bg-white/[0.03] rounded-md p-3">
                  <p className="text-sm text-white/60 whitespace-pre-wrap" data-testid={`text-raw-${note.id}`}>{note.rawText}</p>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">Polished Preview</p>
                <div className="bg-white/[0.03] rounded-md p-3">
                  {note.polishedText ? (
                    <div data-testid={`text-polished-${note.id}`}>
                      {renderPolishedContent(note.polishedText)}
                    </div>
                  ) : (
                    <p className="text-sm text-white/30 italic" data-testid={`text-no-polished-${note.id}`}>
                      No polished text yet. Click the sparkle icon to generate with AI.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
