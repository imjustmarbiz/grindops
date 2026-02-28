import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  ClipboardList, CheckCircle2, Circle, Flag, Clock, Loader2,
  Plus, ChevronDown, ChevronRight, User, ExternalLink, AlertTriangle,
  Zap, Eye, EyeOff, X, Hash
} from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { Link } from "wouter";

type StaffMember = {
  id: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  type: string;
};

type ActionItem = {
  key: string;
  category: string;
  priority: string;
  title: string;
  description: string;
  orderId?: string;
  linkUrl?: string;
  dismissed: boolean;
  dismissedBy?: string;
  dismissedByName?: string;
  dismissedAt?: string;
};

export default function StaffTodo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [tutorialCompleted, setTutorialCompleted] = useState(localStorage.getItem("grindops-tutorial-staff-v2-completed") === "true");

  useState(() => {
    const handleStorage = () => {
      setTutorialCompleted(localStorage.getItem("grindops-tutorial-staff-v2-completed") === "true");
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  });

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [priority, setPriority] = useState("normal");
  const [orderId, setOrderId] = useState("");
  const [completedOpen, setCompletedOpen] = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);

  const { data: actionItems = [], isLoading: actionItemsLoading } = useQuery<ActionItem[]>({
    queryKey: ["/api/staff/action-items"],
    refetchInterval: 30000,
  });

  const { data: myTasks = [], isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ["/api/staff/tasks"],
  });

  const { data: allTasks = [] } = useQuery<any[]>({
    queryKey: ["/api/staff/tasks/all"],
  });

  const { data: orders = [] } = useQuery<any[]>({
    queryKey: ["/api/orders"],
  });

  const { data: chatMembers = [] } = useQuery<StaffMember[]>({
    queryKey: ["/api/chat/members"],
  });

  const staffMembers = chatMembers.filter((m) => m.type === "staff");

  const dismissMutation = useMutation({
    mutationFn: async (actionKey: string) => {
      const res = await apiRequest("POST", `/api/staff/action-items/${encodeURIComponent(actionKey)}/dismiss`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/action-items"] });
      toast({ title: "Dismissed", description: "Action item dismissed." });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: { title: string; description: string; assignedTo: string; priority: string; orderId: string }) => {
      const res = await apiRequest("POST", "/api/staff/tasks", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/tasks/all"] });
      toast({ title: "Task created", description: "Task has been assigned successfully." });
      setTitle("");
      setDescription("");
      setAssignedTo("");
      setPriority("normal");
      setOrderId("");
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await apiRequest("PATCH", `/api/staff/tasks/${taskId}/complete`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff/tasks"] });
      queryClient.invalidateQueries({ queryKey: ["/api/staff/tasks/all"] });
      toast({ title: "Task completed", description: "Nice work!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const handleCreateTask = () => {
    if (!title.trim() || !assignedTo) {
      toast({ title: "Missing fields", description: "Title and recipient are required.", variant: "destructive" });
      return;
    }
    createTaskMutation.mutate({ 
      title: title.trim(), 
      description: description.trim(), 
      assignedTo, 
      priority, 
      orderId: orderId === "none" ? "" : orderId.trim() 
    });
  };

  const pendingTasks = myTasks.filter((t: any) => t.status === "pending");
  const completedTasks = myTasks.filter((t: any) => t.status === "completed");

  const sortedPending = [...pendingTasks].sort((a: any, b: any) => {
    const priorityOrder: Record<string, number> = { urgent: 0, high: 1, normal: 2 };
    const pa = priorityOrder[a.priority] ?? 2;
    const pb = priorityOrder[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const tasksICreated = allTasks.filter((t: any) => {
    const myId = user?.discordId || user?.id || "";
    return t.assignedBy === myId && t.assignedTo !== myId;
  });

  const pendingCreated = tasksICreated.filter((t: any) => t.status === "pending");

  const activeActionItems = actionItems.filter(i => !i.dismissed);
  const dismissedActionItems = actionItems.filter(i => i.dismissed);

  const groupedActions = activeActionItems.reduce<Record<string, ActionItem[]>>((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  const categoryOrder = [
    "Urgent Actions", "Disputes", "Customer Issues", "Overdue Orders", "Stalled Orders",
    "Pending Payouts", "Order Assignment", "Order Setup", "Missing Payouts", "Discord Setup"
  ];

  const sortedCategories = Object.keys(groupedActions).sort((a, b) => {
    const ai = categoryOrder.indexOf(a);
    const bi = categoryOrder.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  if (!tutorialCompleted) {
    if (!groupedActions["Onboarding"]) groupedActions["Onboarding"] = [];
    groupedActions["Onboarding"].push({
      key: "req-complete-tutorial",
      category: "Onboarding",
      priority: "normal",
      title: "Complete Dashboard Tutorial",
      description: "Take the interactive tour to understand how to use your management dashboard effectively.",
      linkUrl: "/",
      dismissed: false
    });
    if (!sortedCategories.includes("Onboarding")) sortedCategories.unshift("Onboarding");
  }

  const isLoading = tasksLoading || actionItemsLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const priorityBadge = (p: string) => {
    if (p === "urgent") return <Badge variant="outline" className="border-red-500/30 text-red-400 bg-red-500/10 text-[10px]">Urgent</Badge>;
    if (p === "high") return <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-[10px]">High</Badge>;
    return null;
  };

  const categoryIcon = (category: string) => {
    if (category === "Urgent Actions" || category === "Disputes" || category === "Customer Issues" || category === "Overdue Orders")
      return <AlertTriangle className="w-3.5 h-3.5 text-red-400" />;
    if (category === "Stalled Orders" || category === "Pending Payouts" || category === "Missing Payouts")
      return <Clock className="w-3.5 h-3.5 text-amber-400" />;
    return <Zap className="w-3.5 h-3.5 text-blue-400" />;
  };

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <FadeInUp delay={0}>
          <div className="flex items-center gap-3">
            <ClipboardList className="w-7 h-7 text-primary" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight" data-testid="text-page-title">To-Do List</h1>
              <p className="text-sm text-muted-foreground mt-1">System-generated action items and manual staff tasks</p>
            </div>
            {activeActionItems.length > 0 && (
              <Badge variant="outline" className="ml-auto border-red-500/30 text-red-400 bg-red-500/10" data-testid="badge-action-count">
                {activeActionItems.length} action{activeActionItems.length !== 1 ? "s" : ""} needed
              </Badge>
            )}
          </div>
        </FadeInUp>

        {activeActionItems.length > 0 && (
          <FadeInUp delay={0.05}>
            <Card className="border-white/[0.06] bg-white/[0.02]" data-testid="card-action-items">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Action Items
                  <Badge variant="outline" className="ml-auto border-amber-500/30 text-amber-400 bg-amber-500/10">
                    {activeActionItems.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {sortedCategories.map(category => (
                  <div key={category} className="space-y-1.5">
                    <div className="flex items-center gap-2 mb-2">
                      {categoryIcon(category)}
                      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{category}</span>
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-white/[0.1] text-muted-foreground">{groupedActions[category].length}</Badge>
                    </div>
                    {groupedActions[category].map(item => (
                      <div
                        key={item.key}
                        className="flex items-start gap-3 p-3 rounded-md bg-white/[0.03] border border-white/[0.06] group"
                        data-testid={`action-item-${item.key}`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium">{item.title}</p>
                            {priorityBadge(item.priority)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {item.linkUrl && (
                            <Link href={item.linkUrl}>
                              <Button size="sm" variant="outline" className="h-7 text-xs border-white/[0.1] hover:bg-white/[0.06]" data-testid={`link-action-${item.key}`}>
                                <ExternalLink className="w-3 h-3 mr-1" />
                                View
                              </Button>
                            </Link>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-xs opacity-40 group-hover:opacity-100 transition-opacity"
                            onClick={() => dismissMutation.mutate(item.key)}
                            disabled={dismissMutation.isPending}
                            data-testid={`dismiss-action-${item.key}`}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </CardContent>
            </Card>
          </FadeInUp>
        )}

        {dismissedActionItems.length > 0 && (
          <FadeInUp delay={0.08}>
            <Collapsible open={showDismissed} onOpenChange={setShowDismissed}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1.5 h-7" data-testid="button-toggle-dismissed">
                  {showDismissed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {dismissedActionItems.length} dismissed item{dismissedActionItems.length !== 1 ? "s" : ""}
                  {showDismissed ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Card className="mt-2 opacity-60 border-white/[0.06] bg-white/[0.02]" data-testid="card-dismissed-items">
                  <CardContent className="pt-4 space-y-1.5">
                    {dismissedActionItems.map(item => (
                      <div
                        key={item.key}
                        className="flex items-center gap-3 p-2.5 rounded-md bg-white/[0.02] border border-white/[0.04]"
                        data-testid={`dismissed-item-${item.key}`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <p className="text-xs line-through flex-1">{item.title}</p>
                        {item.dismissedByName && (
                          <span className="text-[10px] text-muted-foreground">by {item.dismissedByName}</span>
                        )}
                        {item.dismissedAt && (
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(item.dismissedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </FadeInUp>
        )}

        {activeActionItems.length === 0 && sortedPending.length === 0 && pendingCreated.length === 0 && completedTasks.length === 0 && (
          <FadeInUp delay={0.1}>
            <Card className="border-white/[0.06] bg-white/[0.02]" data-testid="card-all-clear">
              <CardContent className="py-12 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-lg">All clear!</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  No action items or pending tasks. Everything is on track.
                </p>
              </CardContent>
            </Card>
          </FadeInUp>
        )}

        {sortedPending.length > 0 && (
          <FadeInUp delay={0.1}>
            <Card className="border-white/[0.06] bg-white/[0.02]" data-testid="card-my-tasks">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Circle className="w-4 h-4 text-amber-400" />
                  My Pending Tasks
                  <Badge variant="outline" className="ml-auto border-amber-500/30 text-amber-400 bg-amber-500/10">
                    {sortedPending.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {sortedPending.map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-md bg-white/[0.03] border border-white/[0.06]"
                    data-testid={`task-pending-${task.id}`}
                  >
                    <div className="mt-0.5">
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium">{task.title}</p>
                        {priorityBadge(task.priority)}
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {task.assignedByName && (
                          <span className="text-[10px] text-muted-foreground">From: {task.assignedByName}</span>
                        )}
                        {task.orderId && (
                          <Link href={`/orders`} data-testid={`link-order-${task.id}`}>
                            <Badge variant="outline" className="text-[10px] cursor-pointer px-1.5 py-0 border-white/[0.1] text-muted-foreground hover:text-foreground">
                              <ExternalLink className="w-2.5 h-2.5 mr-1" />
                              Order {task.orderId}
                            </Badge>
                          </Link>
                        )}
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {new Date(task.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/[0.1] hover:bg-white/[0.06]"
                      onClick={() => completeTaskMutation.mutate(task.id)}
                      disabled={completeTaskMutation.isPending}
                      data-testid={`button-complete-${task.id}`}
                    >
                      {completeTaskMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                      Done
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </FadeInUp>
        )}

        <FadeInUp delay={0.15}>
          <Card className="border-white/[0.06] bg-white/[0.02]" data-testid="card-create-task">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create Task
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Assign To</label>
                  <Select value={assignedTo} onValueChange={setAssignedTo}>
                    <SelectTrigger data-testid="select-assigned-to">
                      <SelectValue placeholder="Select staff/owner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers.map((m) => (
                        <SelectItem key={m.id} value={m.id} data-testid={`select-item-staff-${m.id}`}>
                          <span className="flex items-center gap-2">
                            <User className="w-3 h-3" />
                            {m.name}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Priority</label>
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger data-testid="select-priority">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Title</label>
                <Input
                  placeholder="Task title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  data-testid="input-task-title"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Description (optional)</label>
                <Textarea
                  placeholder="Additional details..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="resize-none"
                  rows={2}
                  data-testid="input-task-description"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Order (optional)</label>
                <Select value={orderId} onValueChange={setOrderId}>
                  <SelectTrigger data-testid="select-task-order">
                    <SelectValue placeholder="Select an order..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Order</SelectItem>
                    {orders.filter(o => !["Completed", "Paid Out", "Cancelled", "Refunded"].includes(o.status)).map((o: any) => (
                      <SelectItem key={o.id} value={o.id} data-testid={`select-item-order-${o.id}`}>
                        <span className="flex items-center gap-2">
                          <Hash className="w-3 h-3 text-muted-foreground" />
                          <span className="font-mono text-xs">#{o.mgtOrderNumber || o.id}</span>
                          <span className="text-[10px] text-muted-foreground truncate">- {o.customerDiscordUsername}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleCreateTask}
                disabled={createTaskMutation.isPending}
                className="w-full sm:w-auto"
                data-testid="button-create-task"
              >
                {createTaskMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                Assign Task
              </Button>
            </CardContent>
          </Card>
        </FadeInUp>

        {pendingCreated.length > 0 && (
          <FadeInUp delay={0.2}>
            <Card className="border-white/[0.06] bg-white/[0.02]" data-testid="card-tasks-i-assigned">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Flag className="w-4 h-4 text-blue-400" />
                  Tasks I Assigned
                  <Badge variant="outline" className="ml-auto border-blue-500/30 text-blue-400 bg-blue-500/10">
                    {pendingCreated.length} pending
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingCreated.map((task: any) => {
                  const assignee = staffMembers.find((m) => m.id === task.assignedTo);
                  return (
                    <div
                      key={task.id}
                      className="flex items-start gap-3 p-3 rounded-md bg-white/[0.03] border border-white/[0.06]"
                      data-testid={`task-assigned-${task.id}`}
                    >
                      <div className="mt-0.5">
                        <User className="w-4 h-4 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium">{task.title}</p>
                          {priorityBadge(task.priority)}
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="text-[10px] text-muted-foreground">
                            Assigned to: {assignee?.name || task.assignedTo}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(task.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px] shrink-0 border-white/[0.1] text-muted-foreground">Pending</Badge>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </FadeInUp>
        )}

        {completedTasks.length > 0 && (
          <FadeInUp delay={0.25}>
            <Collapsible open={completedOpen} onOpenChange={setCompletedOpen}>
              <Card className="border-white/[0.06] bg-white/[0.02]" data-testid="card-completed-tasks">
                <CollapsibleTrigger asChild>
                  <CardHeader className="pb-3 cursor-pointer">
                    <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Completed Tasks
                      <Badge variant="outline" className="ml-auto border-emerald-500/20 text-emerald-400/60 bg-emerald-500/5 text-[10px]">
                        {completedTasks.length}
                      </Badge>
                      {completedOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </CardTitle>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="space-y-1.5 pt-0">
                    {completedTasks.map((task: any) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-3 p-2.5 rounded-md bg-white/[0.02] border border-white/[0.04] opacity-60"
                        data-testid={`task-completed-${task.id}`}
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <p className="text-xs line-through flex-1">{task.title}</p>
                        {task.assignedByName && (
                          <span className="text-[10px] text-muted-foreground">From: {task.assignedByName}</span>
                        )}
                        {task.completedAt && (
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(task.completedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </FadeInUp>
        )}
      </div>
    </AnimatedPage>
  );
}
