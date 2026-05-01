import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import logo from "@/assets/logo.jpeg";
import {
  fetchConversations,
  fetchConversationMessages,
  sendMessage as apiSendMessage,
  deleteMessage as apiDeleteMessage,
  markAsRead as apiMarkAsRead,
  type Conversation,
  type Message,
} from "@/lib/messaging-api";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConversationView {
  conversation: Conversation;
  messages: Message[];
  otherUserId: string;
  unreadCount: number;
  lastMessage: Message | null;
}

// ─── Component ────────────────────────────────────────────────────────────────

const Messages = () => {
  const [conversationViews, setConversationViews] = useState<ConversationView[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const hasFetched = useRef(false);

  // ── Helpers ────────────────────────────────────────────────────────────────

  /** Returns the other participant's ID in a two-person conversation. */
  const getOtherUserId = useCallback(
    (conv: Conversation): string => {
      if (!user) return "";
      return conv.participantIds.find((id) => id !== user.id) ?? conv.participantIds[0] ?? "";
    },
    [user]
  );

  // ── Data loading ───────────────────────────────────────────────────────────

  const loadConversations = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const conversations = await fetchConversations(user.id);

      // Fetch messages for every conversation in parallel
      const views = await Promise.all(
        conversations.map(async (conv): Promise<ConversationView> => {
          try {
            const { messages } = await fetchConversationMessages(conv.id);
            const unreadCount = messages.filter(
              (m) => m.senderId !== user.id && !m.read
            ).length;
            const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
            return {
              conversation: conv,
              messages,
              otherUserId: getOtherUserId(conv),
              unreadCount,
              lastMessage,
            };
          } catch {
            return {
              conversation: conv,
              messages: [],
              otherUserId: getOtherUserId(conv),
              unreadCount: 0,
              lastMessage: null,
            };
          }
        })
      );

      // Sort by most recent activity
      views.sort((a, b) => {
        const aTime = a.lastMessage
          ? new Date(a.lastMessage.createdAt).getTime()
          : new Date(a.conversation.updatedAt).getTime();
        const bTime = b.lastMessage
          ? new Date(b.lastMessage.createdAt).getTime()
          : new Date(b.conversation.updatedAt).getTime();
        return bTime - aTime;
      });

      setConversationViews(views);
    } catch (err) {
      console.error("Error al cargar conversaciones:", err);
      toast.error("No se pudieron cargar los mensajes. Intenta de nuevo más tarde.");
    } finally {
      setIsLoading(false);
    }
  }, [user, getOtherUserId]);

  useEffect(() => {
    if (!isAuthenticated || !user || hasFetched.current) return;
    hasFetched.current = true;
    loadConversations();
  }, [isAuthenticated, user, loadConversations]);

  // ── Conversation selection ─────────────────────────────────────────────────

  // Auto-select from ?with=<otherUserId> query param or fall back to first conversation
  useEffect(() => {
    if (conversationViews.length === 0) return;

    const params = new URLSearchParams(location.search);
    const withUser = params.get("with");

    let target: ConversationView | undefined;
    if (withUser) {
      target = conversationViews.find((v) => v.otherUserId === withUser);
    }
    if (!target) {
      target = conversationViews[0];
    }

    if (target && selectedConversationId !== target.conversation.id) {
      setSelectedConversationId(target.conversation.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, conversationViews]);

  // Keep selection valid when conversations change
  useEffect(() => {
    if (!selectedConversationId && conversationViews.length > 0) {
      setSelectedConversationId(conversationViews[0].conversation.id);
    } else if (
      selectedConversationId &&
      !conversationViews.find((v) => v.conversation.id === selectedConversationId)
    ) {
      setSelectedConversationId(conversationViews[0]?.conversation.id ?? null);
    }
  }, [conversationViews, selectedConversationId]);

  // ── Derived state ──────────────────────────────────────────────────────────

  const selectedView = useMemo(
    () => conversationViews.find((v) => v.conversation.id === selectedConversationId) ?? null,
    [conversationViews, selectedConversationId]
  );

  // ── Mark as read ───────────────────────────────────────────────────────────

  const markConversationAsRead = useCallback(
    async (conversationId: string) => {
      if (!user) return;

      setConversationViews((prev) =>
        prev.map((v) => {
          if (v.conversation.id !== conversationId) return v;

          const toMark = v.messages.filter((m) => m.senderId !== user.id && !m.read);
          if (toMark.length === 0) return v;

          // Fire-and-forget; update local state optimistically
          toMark.forEach((m) => {
            apiMarkAsRead(m.id).catch((err) =>
              console.error("Error al marcar mensaje como leído:", err)
            );
          });

          return {
            ...v,
            unreadCount: 0,
            messages: v.messages.map((m) =>
              toMark.some((tm) => tm.id === m.id) ? { ...m, read: true } : m
            ),
          };
        })
      );
    },
    [user]
  );

  const selectConversation = useCallback(
    (conversationId: string) => {
      setSelectedConversationId(conversationId);
      markConversationAsRead(conversationId);
    },
    [markConversationAsRead]
  );

  // ── Send message ───────────────────────────────────────────────────────────

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversationId || !user || isSending) return;

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMessage: Message = {
      id: optimisticId,
      conversationId: selectedConversationId,
      senderId: user.id,
      senderName: user.name,
      content: newMessage,
      read: false,
      createdAt: new Date().toISOString(),
    };

    // Optimistic update
    setConversationViews((prev) =>
      prev.map((v) =>
        v.conversation.id === selectedConversationId
          ? { ...v, messages: [...v.messages, optimisticMessage], lastMessage: optimisticMessage }
          : v
      )
    );
    setNewMessage("");
    setIsSending(true);

    try {
      const { message: saved } = await apiSendMessage({
        conversationId: selectedConversationId,
        senderId: user.id,
        senderName: user.name,
        content: optimisticMessage.content,
      });

      // Replace optimistic entry with the server-confirmed message
      setConversationViews((prev) =>
        prev.map((v) =>
          v.conversation.id === selectedConversationId
            ? {
                ...v,
                messages: v.messages.map((m) => (m.id === optimisticId ? saved : m)),
                lastMessage: saved,
              }
            : v
        )
      );
    } catch (err) {
      console.error("Error al enviar mensaje:", err);
      toast.error("No se pudo enviar el mensaje. Intenta de nuevo.");
      // Roll back optimistic update
      setConversationViews((prev) =>
        prev.map((v) =>
          v.conversation.id === selectedConversationId
            ? {
                ...v,
                messages: v.messages.filter((m) => m.id !== optimisticId),
                lastMessage:
                  v.messages.filter((m) => m.id !== optimisticId).slice(-1)[0] ?? null,
              }
            : v
        )
      );
      setNewMessage(optimisticMessage.content);
    } finally {
      setIsSending(false);
    }
  };

  // ── Delete message ─────────────────────────────────────────────────────────

  const deleteMessage = async (messageId: string, conversationId: string) => {
    // Optimistic removal
    setConversationViews((prev) =>
      prev.map((v) => {
        if (v.conversation.id !== conversationId) return v;
        const remaining = v.messages.filter((m) => m.id !== messageId);
        return {
          ...v,
          messages: remaining,
          lastMessage: remaining.slice(-1)[0] ?? null,
        };
      })
    );

    try {
      await apiDeleteMessage(messageId);
    } catch (err) {
      console.error("Error al eliminar mensaje:", err);
      toast.error("No se pudo eliminar el mensaje. Intenta de nuevo.");
      // Re-fetch to restore state
      loadConversations();
    }
  };

  // ── Start a new conversation ───────────────────────────────────────────────

  /**
   * Starts a conversation with another user by sending the first message.
   * If a conversation with that user already exists, selects it instead.
   */
  const startConversation = async (
    otherUserId: string,
    firstMessage: string,
    productId?: string
  ) => {
    if (!user || !firstMessage.trim()) return;

    // Check if a conversation already exists
    const existing = conversationViews.find((v) => v.otherUserId === otherUserId);
    if (existing) {
      selectConversation(existing.conversation.id);
      return;
    }

    setIsSending(true);
    try {
      const { conversation, message } = await apiSendMessage({
        participantIds: [user.id, otherUserId],
        senderId: user.id,
        senderName: user.name,
        content: firstMessage,
        productId,
      });

      const newView: ConversationView = {
        conversation,
        messages: [message],
        otherUserId,
        unreadCount: 0,
        lastMessage: message,
      };

      setConversationViews((prev) => [newView, ...prev]);
      setSelectedConversationId(conversation.id);
    } catch (err) {
      console.error("Error al iniciar conversación:", err);
      toast.error("No se pudo iniciar la conversación. Intenta de nuevo.");
    } finally {
      setIsSending(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Acceso requerido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Debes iniciar sesión para ver tus mensajes.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Iniciar sesión
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center rounded-full bg-white p-1 shadow-sm">
              <img src={logo} alt="Nueva Vida" className="h-10 w-10 rounded-full" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Mensajes</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Conversaciones sobre tus publicaciones y objetos de interés.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            {/* ── Conversation list ── */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold text-foreground mb-4">Conversaciones</h2>
              <div className="space-y-2">
                {isLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="p-4 rounded-lg border border-secondary bg-white animate-pulse"
                      >
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                ) : conversationViews.length > 0 ? (
                  conversationViews.map((view) => (
                    <div
                      key={view.conversation.id}
                      onClick={() => selectConversation(view.conversation.id)}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedConversationId === view.conversation.id
                          ? "border-primary bg-white shadow-sm"
                          : "border-secondary hover:bg-secondary/40 bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {view.otherUserId}
                          </p>
                          {view.lastMessage && (
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                              {view.lastMessage.content}
                            </p>
                          )}
                        </div>
                        {view.unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-2 shrink-0">
                            {view.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No tienes conversaciones aún.</p>
                    <Link to="/" className="mt-2 inline-block text-primary hover:underline">
                      Explorar objetos
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* ── Chat panel ── */}
            <div className="lg:col-span-2">
              {selectedView ? (
                <div className="h-[600px] flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden">
                  {/* Header */}
                  <div className="p-4 bg-green-500 text-white flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">{selectedView.otherUserId}</h3>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
                    {selectedView.messages.map((msg) => {
                      const isOwn = msg.senderId === user?.id;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs px-4 py-2 rounded-2xl shadow-sm ${
                              isOwn
                                ? "bg-green-500 text-white"
                                : "bg-white text-gray-800 border border-gray-200"
                            }`}
                          >
                            {!isOwn && (
                              <p className="text-xs font-semibold mb-1 opacity-70">
                                {msg.senderName}
                              </p>
                            )}
                            <div className="flex items-start gap-2">
                              <p className="text-sm flex-1 break-words">{msg.content}</p>
                              {isOwn && (
                                <button
                                  className="text-xs underline text-green-100 shrink-0"
                                  onClick={() => deleteMessage(msg.id, msg.conversationId)}
                                >
                                  Eliminar
                                </button>
                              )}
                            </div>
                            <p
                              className={`text-xs mt-1 ${
                                isOwn ? "text-green-100" : "text-gray-500"
                              }`}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Input */}
                  <div className="p-4 bg-gray-100 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && !isSending && sendMessage()}
                        placeholder="Escribe un mensaje..."
                        disabled={isSending}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-60"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim() || isSending}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white rounded-full px-4 disabled:opacity-60"
                      >
                        {isSending ? "Enviando..." : "Enviar"}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-[600px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded-lg text-gray-500">
                  <div className="text-center">
                    <p>Selecciona una conversación para comenzar a chatear</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Messages;
