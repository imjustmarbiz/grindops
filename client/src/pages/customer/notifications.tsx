import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bell, Loader2 } from "lucide-react";
import { AnimatedPage, FadeInUp } from "@/lib/animations";
import type { Notification } from "@shared/schema";

const PANEL =
  "relative overflow-hidden rounded-[28px] border border-black/45 bg-[linear-gradient(180deg,rgba(236,72,153,0.08),rgba(255,255,255,0.02)),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.012))] shadow-[0_18px_60px_rgba(0,0,0,0.34)]";

export default function CustomerNotifications() {
  const { user } = useAuth();
  const userId = (user as any)?.discordId || user?.id || "";
  const [statusFilter, setStatusFilter] = useState<"all" | "unread" | "read">("all");

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("POST", `/api/notifications/${id}/read`);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/notifications"] }),
  });

  const isRead = (n: Notification) => {
    const readBy = (n.readBy as string[]) || [];
    return readBy.includes(userId);
  };

  const filtered = notifications.filter((n) => {
    if (statusFilter === "unread" && isRead(n)) return false;
    if (statusFilter === "read" && !isRead(n)) return false;
    return true;
  });
  const unreadCount = notifications.filter((n) => !isRead(n)).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-pink-400" />
      </div>
    );
  }

  return (
    <AnimatedPage className="space-y-5 pb-6 sm:space-y-6 sm:pb-8">
      <FadeInUp>
        <section className={`${PANEL} p-4 sm:p-7 lg:p-8`}>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-pink-300/40 to-transparent" />
          <div className="absolute right-0 top-0 hidden h-full w-[42%] bg-gradient-to-l from-pink-500/24 via-fuchsia-500/12 to-transparent sm:block" />
          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-start gap-3 sm:items-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-pink-400/25 bg-pink-500/12 sm:h-14 sm:w-14">
                <Bell className="h-6 w-6 text-pink-300 sm:h-7 sm:w-7" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-pink-300/90">
                  Message Center
                </p>
                <h1 className="mt-2 text-[2rem] font-semibold leading-none tracking-[-0.03em] text-white sm:text-5xl">
                  Notifications
                </h1>
                <p className="mt-1 text-sm text-white/58">
                  Order updates and important announcements
                </p>
              </div>
            </div>
            <div className="flex w-full flex-col items-stretch gap-3 shrink-0 sm:w-auto sm:flex-row sm:items-center">
              {unreadCount > 0 && (
                <Badge className="w-fit rounded-full border border-pink-500/25 bg-pink-500/12 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-pink-300">
                  {unreadCount} unread
                </Badge>
              )}
              <div className="flex w-full rounded-full border border-black/45 bg-pink-500/[0.08] p-1 sm:w-auto">
                <Button variant={statusFilter === "all" ? "secondary" : "ghost"} size="sm" className="h-8 flex-1 rounded-full px-3 text-xs sm:flex-none" onClick={() => setStatusFilter("all")}>All</Button>
                <Button variant={statusFilter === "unread" ? "secondary" : "ghost"} size="sm" className="h-8 flex-1 rounded-full px-3 text-xs sm:flex-none" onClick={() => setStatusFilter("unread")}>Unread</Button>
                <Button variant={statusFilter === "read" ? "secondary" : "ghost"} size="sm" className="h-8 flex-1 rounded-full px-3 text-xs sm:flex-none" onClick={() => setStatusFilter("read")}>Read</Button>
              </div>
            </div>
          </div>
        </section>
      </FadeInUp>

      <FadeInUp>
        <section className={`${PANEL} p-4 sm:p-7`}>
          <div className="relative z-10">
            {filtered.length === 0 ? (
              <div className="rounded-[24px] border border-black/45 bg-white/[0.02] py-12 text-center text-white/45">
                No notifications
              </div>
            ) : (
              <div className="space-y-3">
                {filtered.map((n) => (
                  <div
                    key={n.id}
                    className={`rounded-[24px] border p-4 sm:p-5 ${
                      !isRead(n)
                        ? "border-black/45 bg-pink-500/[0.10]"
                        : "border-black/45 bg-pink-500/[0.045]"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-white">{n.title}</p>
                          {!isRead(n) && (
                            <Badge className="rounded-full border border-pink-500/25 bg-pink-500/10 text-[10px] uppercase tracking-[0.18em] text-pink-300">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="mt-2 text-sm leading-7 text-white/68">{n.body}</p>
                        <p className="mt-3 text-[11px] uppercase tracking-[0.18em] text-white/36">
                          {new Date(n.createdAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      {!isRead(n) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full shrink-0 rounded-full border-pink-500/30 text-pink-300 hover:bg-pink-500/10 hover:text-pink-200 sm:w-auto"
                          onClick={() => markReadMutation.mutate(n.id)}
                          disabled={markReadMutation.isPending}
                        >
                          Mark read
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </FadeInUp>
    </AnimatedPage>
  );
}
