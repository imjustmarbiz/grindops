import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, ArrowLeft, Users, Search, UserPlus, Crown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { MessageThread, Message, ThreadParticipant } from "@shared/schema";

type ThreadWithParticipants = MessageThread & { participants: ThreadParticipant[] };
type ChatMember = { id: string; name: string; role: string; avatarUrl: string | null; type: string };

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
  const [showGroupCreate, setShowGroupCreate] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [groupTitle, setGroupTitle] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<Array<{ id: string; name: string; role: string; avatarUrl?: string }>>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = (user as any)?.discordId || user?.id || "";
  const isStaff = user?.role === "staff" || user?.role === "owner";

  const { data: threads = [] } = useQuery<ThreadWithParticipants[]>({
    queryKey: ["/api/chat/threads"],
    refetchInterval: 5000,
    enabled: open,
  });

  const { data: activeMessages = [] } = useQuery<Message[]>({
    queryKey: ["/api/chat/threads", activeThreadId, "messages"],
    enabled: !!activeThreadId && open,
    refetchInterval: 3000,
  });

  const { data: members = [] } = useQuery<ChatMember[]>({
    queryKey: ["/api/chat/members"],
    enabled: (showNewChat || showGroupCreate || showAddMember) && open,
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

  const createThreadMutation = useMutation({
    mutationFn: async (data: { title?: string; type: string; participantIds: string[]; participantNames: string[]; participantRoles: string[]; participantAvatarUrls: (string | null)[] }) => {
      const res = await apiRequest("POST", "/api/chat/threads", data);
      return res.json();
    },
    onSuccess: (thread: ThreadWithParticipants) => {
      setActiveThreadId(thread.id);
      setShowNewChat(false);
      setShowGroupCreate(false);
      setSelectedParticipants([]);
      setGroupTitle("");
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/threads"] });
    },
  });

  const addParticipantMutation = useMutation({
    mutationFn: async (data: { participantId: string; participantName: string; participantRole: string; participantAvatarUrl?: string }) => {
      const res = await apiRequest("POST", `/api/chat/threads/${activeThreadId}/participants`, data);
      return res.json();
    },
    onSuccess: () => {
      setShowAddMember(false);
      setSearchQuery("");
      queryClient.invalidateQueries({ queryKey: ["/api/chat/threads"] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  const totalUnread = threads.reduce((sum, t) => {
    const myParticipant = t.participants.find(p => p.userId === userId);
    return sum + (myParticipant?.unreadCount || 0);
  }, 0);

  const getThreadDisplayName = (thread: ThreadWithParticipants) => {
    if (thread.title) return thread.title;
    const others = thread.participants.filter(p => p.userId !== userId);
    if (others.length === 0) return "Empty chat";
    if (others.length === 1) return others[0].userName;
    return others.map(p => p.userName.split(" ")[0]).join(", ");
  };

  const getThreadAvatar = (thread: ThreadWithParticipants) => {
    const others = thread.participants.filter(p => p.userId !== userId);
    if (others.length === 1) return others[0].userAvatarUrl;
    return null;
  };

  const getUnread = (thread: ThreadWithParticipants) => {
    const myParticipant = thread.participants.find(p => p.userId === userId);
    return myParticipant?.unreadCount || 0;
  };

  const activeThread = threads.find(t => t.id === activeThreadId);
  const isOwner = activeThread?.ownerId === userId;
  const isGroup = activeThread?.type === "group";

  const filteredMembers = members.filter(m => {
    if (!m.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (showAddMember && activeThread) {
      return !activeThread.participants.some(p => p.userId === m.id);
    }
    return true;
  });

  const handleSend = () => {
    if (messageText.trim() && activeThreadId) {
      sendMutation.mutate(messageText.trim());
    }
  };

  const handleStartDM = (member: ChatMember) => {
    createThreadMutation.mutate({
      type: "dm",
      participantIds: [member.id],
      participantNames: [member.name],
      participantRoles: [member.role],
      participantAvatarUrls: [member.avatarUrl],
    });
  };

  const toggleParticipant = (member: ChatMember) => {
    if (selectedParticipants.some(p => p.id === member.id)) {
      setSelectedParticipants(prev => prev.filter(p => p.id !== member.id));
    } else {
      setSelectedParticipants(prev => [...prev, {
        id: member.id,
        name: member.name,
        role: member.role,
        avatarUrl: member.avatarUrl || undefined,
      }]);
    }
  };

  const handleCreateGroup = () => {
    if (selectedParticipants.length === 0) return;
    createThreadMutation.mutate({
      title: groupTitle.trim() || undefined,
      type: "group",
      participantIds: selectedParticipants.map(p => p.id),
      participantNames: selectedParticipants.map(p => p.name),
      participantRoles: selectedParticipants.map(p => p.role),
      participantAvatarUrls: selectedParticipants.map(p => p.avatarUrl || null),
    });
  };

  const handleAddMember = (member: ChatMember) => {
    addParticipantMutation.mutate({
      participantId: member.id,
      participantName: member.name,
      participantRole: member.role,
      participantAvatarUrl: member.avatarUrl || undefined,
    });
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
              {activeThreadId && !showAddMember ? (
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <button
                    onClick={() => { setActiveThreadId(null); setShowAddMember(false); }}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0"
                    data-testid="button-chat-back"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <span className="font-semibold text-sm truncate">{activeThread ? getThreadDisplayName(activeThread) : ""}</span>
                  {isGroup && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {activeThread?.participants.length || 0}
                    </Badge>
                  )}
                </div>
              ) : showAddMember ? (
                <button
                  onClick={() => { setShowAddMember(false); setSearchQuery(""); }}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-add-member-back"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Add Member
                </button>
              ) : showGroupCreate ? (
                <button
                  onClick={() => { setShowGroupCreate(false); setSelectedParticipants([]); setGroupTitle(""); setSearchQuery(""); }}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  data-testid="button-group-create-back"
                >
                  <ArrowLeft className="w-4 h-4" />
                  New Group
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
              <div className="flex items-center gap-1">
                {activeThreadId && isGroup && isOwner && !showAddMember && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => { setShowAddMember(true); setSearchQuery(""); }}
                    data-testid="button-add-member"
                    className="h-8 w-8"
                    title="Add member"
                  >
                    <UserPlus className="w-4 h-4" />
                  </Button>
                )}
                {!activeThreadId && !showGroupCreate && isStaff && (
                  <>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setShowNewChat(!showNewChat); setShowGroupCreate(false); }}
                      data-testid="button-new-dm"
                      className="h-8 w-8"
                      title="New message"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setShowGroupCreate(true); setShowNewChat(false); setSearchQuery(""); setSelectedParticipants([]); }}
                      data-testid="button-new-group"
                      className="h-8 w-8"
                      title="New group"
                    >
                      <Users className="w-4 h-4" />
                    </Button>
                  </>
                )}
                <Button variant="ghost" size="icon" onClick={onClose} data-testid="button-close-chat" className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {showAddMember ? (
              <div className="flex-1 flex flex-col">
                <div className="p-3 border-b border-border/50">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search grinders to add..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-background/50"
                      data-testid="input-search-add-member"
                    />
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2">
                    {filteredMembers.map(m => (
                      <button
                        key={m.id}
                        onClick={() => handleAddMember(m)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                        data-testid={`button-add-member-${m.id}`}
                        disabled={addParticipantMutation.isPending}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={m.avatarUrl || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">{m.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">{m.name}</span>
                          <Badge variant={m.type === "staff" ? "default" : "secondary"} className="text-[10px] w-fit">{m.type}</Badge>
                        </div>
                      </button>
                    ))}
                    {filteredMembers.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">No members to add</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : showGroupCreate ? (
              <div className="flex-1 flex flex-col">
                <div className="p-3 border-b border-border/50 space-y-2">
                  <Input
                    placeholder="Group name (optional)"
                    value={groupTitle}
                    onChange={(e) => setGroupTitle(e.target.value)}
                    className="bg-background/50"
                    data-testid="input-group-title"
                  />
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search members..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-background/50"
                      data-testid="input-search-group-members"
                    />
                  </div>
                  {selectedParticipants.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {selectedParticipants.map(p => (
                        <Badge
                          key={p.id}
                          variant="secondary"
                          className="text-xs cursor-pointer hover:bg-destructive/20"
                          onClick={() => setSelectedParticipants(prev => prev.filter(x => x.id !== p.id))}
                          data-testid={`badge-selected-${p.id}`}
                        >
                          {p.name} &times;
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2">
                    {filteredMembers.map(m => {
                      const isSelected = selectedParticipants.some(p => p.id === m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={() => toggleParticipant(m)}
                          className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${isSelected ? "bg-primary/10" : "hover:bg-white/5"}`}
                          data-testid={`button-toggle-participant-${m.id}`}
                        >
                          <Avatar className="h-9 w-9">
                            <AvatarImage src={m.avatarUrl || undefined} />
                            <AvatarFallback className="bg-primary/20 text-primary text-xs">{m.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="text-sm font-medium truncate">{m.name}</span>
                            <Badge variant={m.type === "staff" ? "default" : "secondary"} className="text-[10px] w-fit">{m.type}</Badge>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
                <div className="p-3 border-t border-border/50">
                  <Button
                    onClick={handleCreateGroup}
                    disabled={selectedParticipants.length === 0 || createThreadMutation.isPending}
                    className="w-full"
                    data-testid="button-create-group"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Create Group ({selectedParticipants.length} members)
                  </Button>
                </div>
              </div>
            ) : showNewChat && !activeThreadId ? (
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
                    {filteredMembers.map(m => (
                      <button
                        key={m.id}
                        onClick={() => handleStartDM(m)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                        data-testid={`button-start-chat-${m.id}`}
                      >
                        <Avatar className="h-9 w-9">
                          <AvatarImage src={m.avatarUrl || undefined} />
                          <AvatarFallback className="bg-primary/20 text-primary text-xs">{m.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium truncate">{m.name}</span>
                          <Badge variant={m.type === "staff" ? "default" : "secondary"} className="text-[10px] w-fit">{m.type}</Badge>
                        </div>
                      </button>
                    ))}
                    {filteredMembers.length === 0 && (
                      <p className="text-center text-sm text-muted-foreground py-8">No members found</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
            ) : activeThreadId ? (
              <div className="flex-1 flex flex-col min-h-0">
                {isGroup && (
                  <div className="px-4 py-2 border-b border-border/30 flex items-center gap-1 flex-wrap">
                    {activeThread?.participants.map(p => (
                      <div key={p.id} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                        {p.userId === activeThread.ownerId && <Crown className="w-3 h-3 text-yellow-500" />}
                        <span>{p.userName.split(" ")[0]}</span>
                        {p.userId !== activeThread.participants[activeThread.participants.length - 1]?.userId && <span>,</span>}
                      </div>
                    ))}
                  </div>
                )}
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
                      {isStaff && <p className="text-xs mt-1">Start a DM or create a group</p>}
                    </div>
                  ) : (
                    threads.map(thread => {
                      const displayName = getThreadDisplayName(thread);
                      const avatar = getThreadAvatar(thread);
                      const unread = getUnread(thread);
                      return (
                        <button
                          key={thread.id}
                          onClick={() => setActiveThreadId(thread.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                          data-testid={`button-thread-${thread.id}`}
                        >
                          {thread.type === "group" ? (
                            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                              <Users className="w-5 h-5 text-primary" />
                            </div>
                          ) : (
                            <Avatar className="h-10 w-10 shrink-0">
                              <AvatarImage src={avatar || undefined} />
                              <AvatarFallback className="bg-primary/20 text-primary text-sm">{displayName.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium truncate">{displayName}</span>
                              <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(thread.lastMessageAt)}</span>
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
