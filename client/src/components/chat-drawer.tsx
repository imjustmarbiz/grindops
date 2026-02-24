import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, ArrowLeft, Users, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MessageThread, Message, Grinder } from "@shared/schema";

function formatTime(date: string | Date | null) {
  if (!date) return "";
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return d.toLocaleDateString();
}

export function ChatDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = (user as any)?.discordId || user?.id || "";
  const isStaff = user?.role === "staff" || user?.role === "owner";

  const { data: threads = [] } = useQuery<MessageThread[]>({
    queryKey: ["/api/chat/threads"],
    refetchInterval: 5000,
    enabled: open,
  });

  const { data: activeMessages = [] } = useQuery<Message[]>({
    queryKey: ["/api/chat/threads", activeThreadId, "messages"],
    enabled: !!activeThreadId && open,
    refetchInterval: 3000,
  });

  const { data: grinders = [] } = useQuery<Grinder[]>({
    queryKey: ["/api/grinders"],
    enabled: showNewChat && isStaff,
  });

  const sendMutation = useMutation({
    mutationFn: async (body: string) => {
      const res = await apiRequest("POST", `/api/chat/threads/${activeThreadId}/messages`, { body });
      return res.json();
    },
    onSuccess: () => {
      setMessageText("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/threads", activeThreadId, "messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/chat/threads"] });
    },
  });

  const startThreadMutation = useMutation({
    mutationFn: async (data: { recipientId: string; recipientName: string; recipientRole: string; recipientAvatarUrl?: string }) => {
      const res = await apiRequest("POST", "/api/chat/threads", data);
      return res.json();
    },
    onSuccess: (thread: MessageThread) => {
      setActiveThreadId(thread.id);
      setShowNewChat(false);
      queryClient.invalidateQueries({ queryKey: ["/api/chat/threads"] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  const totalUnread = threads.reduce((sum, t) => {
    return sum + (t.userAId === userId ? t.userAUnread : t.userBUnread);
  }, 0);

  const getOtherUser = (thread: MessageThread) => {
    if (thread.userAId === userId) {
      return { name: thread.userBName, role: thread.userBRole, avatar: thread.userBAvatarUrl };
    }
    return { name: thread.userAName, role: thread.userARole, avatar: thread.userAAvatarUrl };
  };

  const getUnread = (thread: MessageThread) => {
    return thread.userAId === userId ? thread.userAUnread : thread.userBUnread;
  };

  const filteredGrinders = grinders.filter(g =>
    !g.isRemoved && g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSend = () => {
    if (messageText.trim() && activeThreadId) {
      sendMutation.mutate(messageText.trim());
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full w-full max-w-md bg-card border-l border-border/50 z-50 flex flex-col shadow-2xl"
          >
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              {activeThreadId ? (
                <button
                  onClick={() => setActiveThreadId(null)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-chat-back"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary" />
                  <span className="font-semibold">Messages</span>
                  {totalUnread > 0 && (
                    <Badge variant="destructive" className="h-5 px-1.5 text-xs">{totalUnread}</Badge>
                  )}
                </div>
              )}
              <div className="flex items-center gap-2">
                {!activeThreadId && isStaff && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNewChat(!showNewChat)}
                    data-testid="button-new-chat"
                    className="h-8 w-8"
                  >
                    <Users className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-chat" className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {showNewChat && !activeThreadId ? (
              <div className="flex-1 flex flex-col">
                <div className="p-3 border-b border-border/50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search grinders..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-background/50"
                      data-testid="input-search-grinders"
                    />
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2">
                    {filteredGrinders.map(g => (
                      <button
                        key={g.id}
                        onClick={() => startThreadMutation.mutate({
                          recipientId: g.discordUserId || g.id,
                          recipientName: g.name,
                          recipientRole: "grinder",
                          recipientAvatarUrl: (g as any).discordAvatarUrl || undefined,
                        })}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                        data-testid={`button-start-chat-${g.id}`}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={(g as any).discordAvatarUrl || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">{g.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">{g.name}</span>
                          <span className="text-xs text-muted-foreground">{g.tier} - {(g.roles as string[])?.join(", ") || "Grinder"}</span>
                        </div>
                      </button>
                    ))}
                    {filteredGrinders.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">No grinders found</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : activeThreadId ? (
              <div className="flex-1 flex flex-col min-h-0">
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-3">
                    {activeMessages.map(msg => {
                      const isMine = msg.senderUserId === userId;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
                            isMine
                              ? "bg-primary text-primary-foreground rounded-br-md"
                              : "bg-white/10 text-foreground rounded-bl-md"
                          }`}>
                            {!isMine && (
                              <p className="text-[10px] font-medium text-muted-foreground mb-0.5">{msg.senderName}</p>
                            )}
                            <p className="text-sm leading-relaxed">{msg.body}</p>
                            <p className={`text-[10px] mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>
                <div className="p-3 border-t border-border/50">
                  <form
                    onSubmit={(e) => { e.preventDefault(); handleSend(); }}
                    className="flex gap-2"
                  >
                    <Input
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type a message..."
                      className="bg-background/50"
                      data-testid="input-chat-message"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!messageText.trim() || sendMutation.isPending}
                      data-testid="button-send-message"
                      className="shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1">
                <div className="p-2">
                  {threads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
                      <p className="text-sm">No conversations yet</p>
                      {isStaff && <p className="text-xs mt-1">Click the people icon to start one</p>}
                    </div>
                  ) : (
                    threads.map(thread => {
                      const other = getOtherUser(thread);
                      const unread = getUnread(thread);
                      return (
                        <button
                          key={thread.id}
                          onClick={() => setActiveThreadId(thread.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                          data-testid={`button-thread-${thread.id}`}
                        >
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={other.avatar || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary text-sm">{other.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium truncate">{other.name}</span>
                              <span className="text-[10px] text-muted-foreground">{formatTime(thread.lastMessageAt)}</span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-muted-foreground truncate">{thread.lastMessageText || "No messages yet"}</p>
                              {unread > 0 && (
                                <Badge variant="destructive" className="h-5 min-w-[20px] px-1.5 text-[10px] shrink-0">{unread}</Badge>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
