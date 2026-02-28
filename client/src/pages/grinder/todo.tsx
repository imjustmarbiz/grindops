import { Link } from "wouter";
import { useGrinderData } from "@/hooks/use-grinder-data";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle2, Circle, AlertTriangle, ClipboardList, Info, LogIn,
  Video, PlayCircle, Loader2, ChevronDown, ChevronRight, Flag, Send, Clock
} from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import { useState, useMemo } from "react";

type AutoTodo = {
  id: string;
  title: string;
  description: string;
  orderId: string;
  assignmentId: string;
  type: "login" | "start_order" | "submit_proof" | "ticket_ack";
  priority: "high" | "normal";
  completed: boolean;
};

export default function GrinderTodoList() {
  const { assignments, payoutRequests, isLoading, grinder, isElite, eliteGradient, eliteBorder, eliteAccent } = useGrinderData();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [expandedGuide, setExpandedGuide] = useState(false);

  const { data: customTasks = [], isLoading: tasksLoading } = useQuery<any[]>({
    queryKey: ["/api/grinder/me/tasks"],
  });

  const { data: allCheckpoints = [] } = useQuery<any[]>({
    queryKey: ["/api/grinder/me/checkpoints-all"],
    enabled: false,
  });

  const completeTaskMutation = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await apiRequest("PATCH", `/api/grinder/me/tasks/${taskId}/complete`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/grinder/me/tasks"] });
      toast({ title: "Task completed", description: "Nice work!" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const autoTodos = useMemo(() => {
    const todos: AutoTodo[] = [];
    const activeAssignments = (assignments || []).filter((a: any) => a.status === "Active");
    for (const assignment of activeAssignments) {
      if (!assignment.startedAt) {
        if (!assignment.isLoggedIn) {
          todos.push({
            id: `auto-login-${assignment.id}`,
            title: `Log in for Order #${assignment.orderId}`,
            description: "You need to log in to your gaming session before you can start the order.",
            orderId: assignment.orderId,
            assignmentId: assignment.id,
            type: "login",
            priority: "high",
            completed: false,
          });
        }
        todos.push({
          id: `auto-start-${assignment.id}`,
          title: `Start Order #${assignment.orderId}`,
          description: "Click 'Start Order' on your assignment card to begin working.",
          orderId: assignment.orderId,
          assignmentId: assignment.id,
          type: "start_order",
          priority: "high",
          completed: false,
        });
      }
      if (assignment.hasTicket && !assignment.hasTicketAck) {
        todos.push({
          id: `auto-ticket-${assignment.id}`,
          title: `Respond to ticket for Order #${assignment.orderId}`,
          description: "Accept or decline the Discord ticket associated with this order.",
          orderId: assignment.orderId,
          assignmentId: assignment.id,
          type: "ticket_ack",
          priority: "high",
          completed: false,
        });
      }
    }

    const completedAssignments = (assignments || []).filter((a: any) => a.status === "Completed");
    for (const assignment of completedAssignments) {
      const hasPayout = (payoutRequests || []).find((p: any) => p.assignmentId === assignment.id);
      // Only show proof task if payout is pending AND no proof is uploaded
      if (hasPayout && hasPayout.status === "Pending" && !hasPayout.completionProofUrl) {
        todos.push({
          id: `auto-proof-${assignment.id}`,
          title: `Upload video proof for Order #${assignment.orderId}`,
          description: "Submit completion video proof showing the order was completed and the account was removed from the console.",
          orderId: assignment.orderId,
          assignmentId: assignment.id,
          type: "submit_proof",
          priority: "high",
          completed: false,
        });
      }
    }

    // New Registration Tasks
    const hasLinkedTwitch = !!grinder?.twitchUsername;
    const hasStrikes = (customTasks || []).some((t: any) => t.id === "req-review-strikes" && t.status === "completed");
    const hasQueueGuide = (customTasks || []).some((t: any) => t.id === "req-review-queue" && t.status === "completed");

    if (!hasLinkedTwitch) {
      todos.push({
        id: "req-link-twitch",
        title: "Link your Twitch Account",
        description: "Connect your Twitch to appear on the live streams page and boost your profile visibility.",
        orderId: "",
        assignmentId: "",
        type: "custom",
        priority: "normal",
        completed: false,
      });
    }

    if (!hasStrikes) {
      todos.push({
        id: "req-review-strikes",
        title: "Review Strikes & Policy",
        description: "Read through the grinder policy and strike system to ensure you're compliant.",
        orderId: "",
        assignmentId: "",
        type: "custom",
        priority: "normal",
        completed: false,
      });
    }

    if (!hasQueueGuide) {
      todos.push({
        id: "req-review-queue",
        title: "Review Scorecard & AI Queue",
        description: "Understand how the 9-factor AI queue works and how to improve your ranking.",
        orderId: "",
        assignmentId: "",
        type: "custom",
        priority: "normal",
        completed: false,
      });
    }

    return todos;
  }, [assignments, payoutRequests, grinder, customTasks]);

  const pendingCustomTasks = customTasks.filter((t: any) => t.status === "pending");
  const completedCustomTasks = customTasks.filter((t: any) => t.status === "completed");
  const totalPending = autoTodos.length + pendingCustomTasks.length;
  const totalCompleted = completedCustomTasks.length;

  if (isLoading || tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const priorityIcon = (priority: string) => {
    if (priority === "high" || priority === "urgent") return <Flag className="w-3.5 h-3.5 text-red-400" />;
    return null;
  };

  const typeIcon = (type: string) => {
    switch (type) {
      case "login": return <LogIn className="w-4 h-4 text-blue-400" />;
      case "start_order": return <PlayCircle className="w-4 h-4 text-emerald-400" />;
      case "submit_proof": return <Video className="w-4 h-4 text-purple-400" />;
      case "ticket_ack": return <Send className="w-4 h-4 text-amber-400" />;
      case "custom": return <ClipboardList className="w-4 h-4 text-cyan-400" />;
      default: return <ClipboardList className="w-4 h-4 text-cyan-400" />;
    }
  };

  return (
    <AnimatedPage>
      <div className="space-y-6">
        <FadeInUp delay={0}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardList className={`w-7 h-7 ${isElite ? "text-cyan-400" : "text-amber-400"}`} />
              <div>
                <h1 className="text-xl sm:text-2xl font-bold font-display tracking-tight">Order To-Do List</h1>
                <p className="text-muted-foreground text-sm mt-1">
                  Track what you need to do for your active orders
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {totalPending > 0 && (
                <Badge variant="outline" className="border-amber-500/30 text-amber-400 bg-amber-500/10 text-sm px-3 py-1" data-testid="badge-pending-count">
                  {totalPending} pending
                </Badge>
              )}
              {totalCompleted > 0 && (
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 text-sm px-3 py-1" data-testid="badge-completed-count">
                  {totalCompleted} done
                </Badge>
              )}
            </div>
          </div>
        </FadeInUp>

        <FadeInUp delay={0.05}>
          <Card className="border-0 bg-gradient-to-br from-background to-background overflow-hidden" data-testid="card-checkpoint-guide">
            <button
              className="w-full text-left px-6 py-4 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
              onClick={() => setExpandedGuide(!expandedGuide)}
              data-testid="button-toggle-guide"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center shrink-0">
                <Info className="w-4 h-4 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm">How Activity Checkpoints Work</h3>
                <p className="text-xs text-muted-foreground">Learn about the checkpoint system and what's expected</p>
              </div>
              {expandedGuide ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>
            {expandedGuide && (
              <CardContent className="pt-0 pb-5 px-6 space-y-4 border-t border-white/5">
                <div className="grid gap-3 mt-4">
                  <div className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <LogIn className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Log In / Log Off</p>
                      <p className="text-xs text-muted-foreground">Track your gaming sessions. Log in when you start working on an order, and log off when you finish a session. This helps staff monitor activity and calculate work time.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-md bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <PlayCircle className="w-3.5 h-3.5 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Start Order</p>
                      <p className="text-xs text-muted-foreground">Mark when you officially begin working on the order. This changes the order status to "In Progress" and sets your start timestamp. You must log in first.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-md bg-amber-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Send className="w-3.5 h-3.5 text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Ticket Response</p>
                      <p className="text-xs text-muted-foreground">When a Discord ticket is created for your order, you need to accept or decline it. This confirms your communication channel with the customer/staff.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-md bg-purple-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Video className="w-3.5 h-3.5 text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Completion Video Proof</p>
                      <p className="text-xs text-muted-foreground">When marking an order complete, you must upload a video showing the completed work and the account being removed from the console. This is required for payout processing.</p>
                    </div>
                  </div>
                  <div className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-md bg-red-500/10 flex items-center justify-center shrink-0 mt-0.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Daily Updates</p>
                      <p className="text-xs text-muted-foreground">If daily checkups are enabled, you're expected to submit regular progress updates on active orders. Missing updates will be flagged and may affect your performance score.</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-lg border border-amber-500/25 bg-amber-500/[0.06] p-3 mt-3">
                  <p className="text-xs text-amber-200/80 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    Checkpoints are automatically tracked. Complete the actions on your assignment cards in "My Orders" and they'll be marked off here. Staff can also assign you custom tasks below.
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </FadeInUp>

        {totalPending === 0 && totalCompleted === 0 && (
          <FadeInUp delay={0.1}>
            <Card className="border-0 bg-gradient-to-br from-emerald-500/[0.06] via-background to-emerald-900/[0.03]" data-testid="card-all-clear">
              <CardContent className="py-12 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                </div>
                <h3 className="font-semibold text-lg">All clear!</h3>
                <p className="text-sm text-muted-foreground text-center max-w-sm">
                  You have no pending tasks. When you get new assignments or staff sends you requests, they'll appear here.
                </p>
              </CardContent>
            </Card>
          </FadeInUp>
        )}

        {autoTodos.length > 0 && (
          <FadeInUp delay={0.1}>
            <Card className={`border-0 bg-gradient-to-br ${eliteGradient} overflow-hidden relative`} data-testid="card-auto-todos">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/[0.02] -translate-y-12 translate-x-12" />
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className={`w-8 h-8 rounded-lg bg-amber-500/15 flex items-center justify-center`}>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  Action Required
                  <Badge variant="outline" className="ml-auto border-amber-500/30 text-amber-400 bg-amber-500/10">
                    {autoTodos.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {autoTodos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors"
                    data-testid={`todo-auto-${todo.id}`}
                  >
                    <div className="mt-0.5">{typeIcon(todo.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{todo.title}</p>
                        {priorityIcon(todo.priority)}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">{todo.description}</p>
                    </div>
                    <Link href={
                      todo.id === "req-link-twitch" ? "/grinder/status" :
                      todo.id === "req-review-strikes" ? "/grinder/strikes" :
                      todo.id === "req-review-queue" ? "/scorecard-guide" :
                      "/grinder/assignments"
                    } data-testid={`link-goto-orders-${todo.id}`}>
                      <Badge variant="outline" className="shrink-0 border-amber-500/20 text-amber-400/80 text-[10px] cursor-pointer hover:bg-amber-500/10 transition-colors">
                        {todo.id.startsWith("req-") ? "Go to Page" : "Go to My Orders"}
                      </Badge>
                    </Link>
                  </div>
                ))}
              </CardContent>
            </Card>
          </FadeInUp>
        )}

        {pendingCustomTasks.length > 0 && (
          <FadeInUp delay={0.15}>
            <Card className={`border-0 bg-gradient-to-br ${eliteGradient} overflow-hidden relative`} data-testid="card-custom-tasks">
              <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/[0.02] -translate-y-12 translate-x-12" />
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/15 flex items-center justify-center">
                    <ClipboardList className="w-4 h-4 text-cyan-400" />
                  </div>
                  Staff Requests
                  <Badge variant="outline" className="ml-auto border-cyan-500/30 text-cyan-400 bg-cyan-500/10">
                    {pendingCustomTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {pendingCustomTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors"
                    data-testid={`todo-custom-${task.id}`}
                  >
                    <div className="mt-0.5">
                      <Circle className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{task.title}</p>
                        {task.priority === "urgent" && <Flag className="w-3.5 h-3.5 text-red-400" />}
                        {task.priority === "high" && <Flag className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        {task.createdByName && (
                          <span className="text-[10px] text-muted-foreground">From: {task.createdByName}</span>
                        )}
                        {task.orderId && (
                          <Badge variant="outline" className="text-[10px] border-white/10 px-1.5 py-0">
                            Order #{task.orderId}
                          </Badge>
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
                      className="shrink-0 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/10 text-xs h-8"
                      onClick={() => completeTaskMutation.mutate(task.id)}
                      disabled={completeTaskMutation.isPending}
                      data-testid={`button-complete-task-${task.id}`}
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

        {completedCustomTasks.length > 0 && (
          <FadeInUp delay={0.2}>
            <Card className="border-0 bg-gradient-to-br from-background to-background overflow-hidden" data-testid="card-completed-tasks">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Completed Tasks
                  <Badge variant="outline" className="ml-auto border-emerald-500/20 text-emerald-400/60 bg-emerald-500/5 text-[10px]">
                    {completedCustomTasks.length}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1.5">
                {completedCustomTasks.map((task: any) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.02] border border-white/5 opacity-60"
                    data-testid={`todo-completed-${task.id}`}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <p className="text-xs line-through flex-1">{task.title}</p>
                    {task.completedAt && (
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(task.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </FadeInUp>
        )}
      </div>
    </AnimatedPage>
  );
}
