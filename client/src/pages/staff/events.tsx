import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Event } from "@shared/schema";
import {
  Calendar, Plus, Percent, Tag, Megaphone, Gamepad2, Pencil, Trash2, Star, AlertTriangle, Clock, Eye, EyeOff
} from "lucide-react";

function EventForm({ event, onClose, onSaved }: { event?: Event | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [type, setType] = useState(event?.type || "event");
  const [title, setTitle] = useState(event?.title || "");
  const [description, setDescription] = useState(event?.description || "");
  const [startDate, setStartDate] = useState(event?.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : "");
  const [endDate, setEndDate] = useState(event?.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "");
  const [discountPercent, setDiscountPercent] = useState(event?.discountPercent?.toString() || "");
  const [priority, setPriority] = useState(event?.priority || "normal");
  const [tags, setTags] = useState((event?.tags || []).join(", "));
  const [isActive, setIsActive] = useState(event?.isActive ?? true);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (event) {
        const res = await apiRequest("PATCH", `/api/events/${event.id}`, data);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/events", data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: event ? "Event updated" : "Event created" });
      onSaved();
      onClose();
    },
    onError: (err: Error) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleSubmit = () => {
    if (!title.trim() || !description.trim() || !startDate) {
      toast({ title: "Please fill in title, description, and start date", variant: "destructive" });
      return;
    }
    mutation.mutate({
      type,
      title: title.trim(),
      description: description.trim(),
      startDate,
      endDate: endDate || null,
      discountPercent: discountPercent ? parseInt(discountPercent) : null,
      priority,
      tags: tags.split(",").map(t => t.trim()).filter(Boolean),
      isActive,
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Type</label>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-event-type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="event">In-Game Event</SelectItem>
              <SelectItem value="promo">Promotion / Discount</SelectItem>
              <SelectItem value="announcement">Announcement</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">Priority</label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger className="bg-background/50 border-white/10" data-testid="select-event-priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Title</label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., 2K Season 5 Drop" className="bg-background/50 border-white/10" data-testid="input-event-title" />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Description</label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Details about the event or promo..." className="bg-background/50 border-white/10 min-h-[100px]" data-testid="input-event-description" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium mb-1 block">Start Date</label>
          <Input type="datetime-local" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-background/50 border-white/10" data-testid="input-event-start" />
        </div>
        <div>
          <label className="text-sm font-medium mb-1 block">End Date (optional)</label>
          <Input type="datetime-local" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-background/50 border-white/10" data-testid="input-event-end" />
        </div>
      </div>
      {type === "promo" && (
        <div>
          <label className="text-sm font-medium mb-1 block">Discount Percentage</label>
          <Input type="number" min="0" max="100" value={discountPercent} onChange={(e) => setDiscountPercent(e.target.value)} placeholder="e.g., 15" className="bg-background/50 border-white/10 w-32" data-testid="input-event-discount" />
        </div>
      )}
      <div>
        <label className="text-sm font-medium mb-1 block">Tags (comma separated)</label>
        <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="e.g., 2K, Season 5, VC" className="bg-background/50 border-white/10" data-testid="input-event-tags" />
      </div>
      {event && (
        <div className="flex items-center gap-3">
          <Switch checked={isActive} onCheckedChange={setIsActive} data-testid="switch-event-active" />
          <label className="text-sm font-medium">Active</label>
        </div>
      )}
      <Button onClick={handleSubmit} disabled={mutation.isPending} className="w-full bg-gradient-to-r from-primary to-primary/80" data-testid="button-save-event">
        {mutation.isPending ? "Saving..." : event ? "Update Event" : "Create Event"}
      </Button>
    </div>
  );
}

export default function StaffEvents() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: events = [], isLoading } = useQuery<Event[]>({ queryKey: ["/api/events"], refetchInterval: 30000 });
  const [createOpen, setCreateOpen] = useState(false);
  const [editEvent, setEditEvent] = useState<Event | null>(null);

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/events/${id}`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      toast({ title: "Event deleted" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const res = await apiRequest("PATCH", `/api/events/${id}`, { isActive });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
    },
  });

  const typeIcon = (type: string) => {
    if (type === "promo") return <Percent className="w-4 h-4 text-emerald-400" />;
    if (type === "announcement") return <Megaphone className="w-4 h-4 text-blue-400" />;
    return <Gamepad2 className="w-4 h-4 text-amber-400" />;
  };

  const priorityBadge = (p: string) => {
    if (p === "urgent") return <Badge className="bg-red-500/20 text-red-400 border-0 text-[10px]"><AlertTriangle className="w-3 h-3 mr-0.5" />Urgent</Badge>;
    if (p === "high") return <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[10px]"><Star className="w-3 h-3 mr-0.5" />High</Badge>;
    if (p === "low") return <Badge className="bg-white/5 text-muted-foreground border-0 text-[10px]">Low</Badge>;
    return null;
  };

  const now = new Date();
  const activeEvents = events.filter(e => e.isActive);
  const inactiveEvents = events.filter(e => !e.isActive);

  return (
    <AnimatedPage className="space-y-6">
      <FadeInUp>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight" data-testid="text-events-title">
                Events & Promos
              </h1>
              <p className="text-sm text-muted-foreground mt-1">Manage upcoming events and promotions for grinders</p>
            </div>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20" data-testid="button-create-event">
                <Plus className="w-4 h-4" /> New Event
              </Button>
            </DialogTrigger>
            <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle className="font-display text-xl">Create Event / Promo</DialogTitle>
              </DialogHeader>
              <EventForm onClose={() => setCreateOpen(false)} onSaved={() => {}} />
            </DialogContent>
          </Dialog>
        </div>
      </FadeInUp>

      <FadeInUp>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border-0 bg-gradient-to-br from-amber-500/[0.08] to-transparent">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 flex items-center justify-center">
                <Gamepad2 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-amber-400">{events.filter(e => e.type === "event" && e.isActive).length}</p>
                <p className="text-xs text-muted-foreground">Active Events</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-emerald-500/[0.08] to-transparent">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                <Percent className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-emerald-400">{events.filter(e => e.type === "promo" && e.isActive).length}</p>
                <p className="text-xs text-muted-foreground">Active Promos</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-gradient-to-br from-blue-500/[0.08] to-transparent">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xl font-bold text-blue-400">{events.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
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
      ) : activeEvents.length === 0 && inactiveEvents.length === 0 ? (
        <FadeInUp>
          <Card className="bg-card/50 border-border/50">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">No events or promos yet</p>
              <p className="text-sm text-muted-foreground/70 mt-1">Create one to keep grinders informed</p>
            </CardContent>
          </Card>
        </FadeInUp>
      ) : (
        <>
          {activeEvents.length > 0 && (
            <FadeInUp>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Active ({activeEvents.length})
                </h3>
                {activeEvents.map(event => (
                  <Card key={event.id} className="border-0 bg-white/[0.03] hover:bg-white/[0.05] transition-colors" data-testid={`card-event-${event.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {typeIcon(event.type)}
                            <span className="font-bold text-lg">{event.title}</span>
                            {event.discountPercent && (
                              <Badge className="bg-emerald-500/20 text-emerald-400 border-0">{event.discountPercent}% OFF</Badge>
                            )}
                            {priorityBadge(event.priority)}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{event.description}</p>
                          <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Starts: {new Date(event.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                            {event.endDate && <span>Ends: {new Date(event.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}</span>}
                            <span className="text-primary/90 font-semibold bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/20">By: {event.createdByName}</span>
                          </div>
                          {(event.tags || []).length > 0 && (
                            <div className="flex gap-1 mt-2 flex-wrap">
                              {(event.tags || []).map(tag => (
                                <Badge key={tag} variant="outline" className="text-[10px] px-1.5 py-0"><Tag className="w-2.5 h-2.5 mr-0.5" />{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => setEditEvent(event)}
                            data-testid={`button-edit-event-${event.id}`}
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-amber-400"
                            onClick={() => toggleMutation.mutate({ id: event.id, isActive: false })}
                            data-testid={`button-hide-event-${event.id}`}
                          >
                            <EyeOff className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-red-400"
                            onClick={() => deleteMutation.mutate(event.id)}
                            data-testid={`button-delete-event-${event.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </FadeInUp>
          )}
          {inactiveEvents.length > 0 && (
            <FadeInUp>
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <EyeOff className="w-4 h-4" /> Inactive ({inactiveEvents.length})
                </h3>
                {inactiveEvents.map(event => (
                  <Card key={event.id} className="border-0 bg-white/[0.02] opacity-60" data-testid={`card-event-inactive-${event.id}`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          {typeIcon(event.type)}
                          <span className="font-medium">{event.title}</span>
                          {event.discountPercent && <Badge className="bg-emerald-500/10 text-emerald-400/60 border-0 text-[10px]">{event.discountPercent}% OFF</Badge>}
                        </div>
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-emerald-400" onClick={() => toggleMutation.mutate({ id: event.id, isActive: true })}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-foreground" onClick={() => setEditEvent(event)}>
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-red-400" onClick={() => deleteMutation.mutate(event.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </FadeInUp>
          )}
        </>
      )}

      <Dialog open={!!editEvent} onOpenChange={(open) => !open && setEditEvent(null)}>
        <DialogContent className="border-white/10 bg-background/95 backdrop-blur-xl sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-display text-xl">Edit Event</DialogTitle>
          </DialogHeader>
          {editEvent && <EventForm event={editEvent} onClose={() => setEditEvent(null)} onSaved={() => {}} />}
        </DialogContent>
      </Dialog>
    </AnimatedPage>
  );
}
