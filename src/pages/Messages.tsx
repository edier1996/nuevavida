import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { mockProducts, type Product } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.jpeg";

interface Message {
  id: string;
  from: string;
  to: string;
  fromName?: string;
  toName?: string;
  productId: string;
  subject: string;
  content: string;
  image?: string;
  timestamp: string;
  read: boolean;
}

const PLATFORM_USER_ID = "platform";
const PLATFORM_USER_NAME = "Nueva Vida (Plataforma)";

const Messages = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>(mockProducts);
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  const persistMessages = (list: Message[]) => {
    const serialized = JSON.stringify(list);
    try {
      localStorage.setItem("messages", serialized);
      localStorage.setItem("messages_backup", serialized);
    } catch {
      const trimmed = list.slice(-200);
      const serializedTrimmed = JSON.stringify(trimmed);
      try {
        localStorage.setItem("messages", serializedTrimmed);
        localStorage.setItem("messages_backup", serializedTrimmed);
      } catch {
        console.error("No se pudieron guardar los mensajes (cuota).");
      }
    }
  };

  const markAsRead = useCallback((conversationKey: string) => {
    const otherUserId = conversationKey;
    const userId = user?.id;
    const userEmail = user?.email;

    setMessages((prev) => {
      let changed = false;
      const updated = prev.map((msg) => {
        if (
          (msg.from === otherUserId || msg.from === userEmail) &&
          (msg.to === userId || msg.to === userEmail) &&
          !msg.read
        ) {
          changed = true;
          return { ...msg, read: true };
        }
        return msg;
      });

      if (changed) {
        persistMessages(updated);
      }

      return changed ? updated : prev;
    });
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) return;

    const storedMessages = localStorage.getItem("messages");
    const backupMessages = localStorage.getItem("messages_backup");
    const parsed = storedMessages
      ? JSON.parse(storedMessages)
      : backupMessages
        ? JSON.parse(backupMessages)
        : [];
    setMessages(parsed);

    const userProducts = JSON.parse(localStorage.getItem("products") || "[]");
    setAllProducts([...mockProducts, ...userProducts]);
  }, [isAuthenticated]);

  const conversations = useMemo(() => {
    if (!user) return [];
    const userId = user.id;
    const userEmail = user.email;

    const userMessages = messages.filter(
      (msg) =>
        msg.from === userId ||
        msg.to === userId ||
        msg.from === userEmail ||
        msg.to === userEmail
    );

    const conversationMap = new Map<string, any>();

    userMessages.forEach((msg) => {
      const otherUserId = msg.from === userId || msg.from === userEmail ? msg.to : msg.from;
      const otherUserName = msg.from === userId || msg.from === userEmail ? msg.toName || msg.to : msg.fromName || msg.from;
      const productKey = msg.productId || "general";
      const product = allProducts.find((p) => p.id === msg.productId);

      const key = otherUserId; // un chat por usuario
      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          key,
          otherUser: otherUserName,
          otherUserId,
          lastProductId: productKey,
          lastProduct: product,
          lastMessage: msg,
          unreadCount: msg.to === userId && !msg.read ? 1 : 0,
          messages: [] as Message[],
        });
      }

      const conv = conversationMap.get(key);
      conv.messages.push(msg);
      if (new Date(msg.timestamp).getTime() > new Date(conv.lastMessage.timestamp).getTime()) {
        conv.lastMessage = msg;
        conv.lastProductId = productKey;
        conv.lastProduct = product;
      }
      if ((msg.to === userId || msg.to === userEmail) && !msg.read) {
        conv.unreadCount++;
      }
    });

    return Array.from(conversationMap.values()).sort((a, b) =>
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    );
  }, [messages, user, allProducts]);

  // Selección inicial por query (?with)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const withUser = params.get("with");

    const desiredKey = withUser || null;
    const fallbackKey = conversations[0]?.key;
    const keyToUse = desiredKey || fallbackKey;

    if (keyToUse) {
      setSelectedConversation(keyToUse);
      markAsRead(keyToUse);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.search, conversations, markAsRead]);

  const selectedConvMessages = useMemo(() => {
    if (!selectedConversation || !user) return [];

    const otherUserId = selectedConversation;
    const userId = user.id;
    const userEmail = user.email;

    return messages
      .filter((msg) => {
        const isFromUser = msg.from === userId || msg.from === userEmail;
        const isToUser = msg.to === userId || msg.to === userEmail;
        const isFromOther = msg.from === otherUserId;
        const isToOther = msg.to === otherUserId;
        return (isFromUser && isToOther) || (isToUser && isFromOther);
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [selectedConversation, messages, user]);

  // Mantener selección válida
  useEffect(() => {
    if (!selectedConversation && conversations.length > 0) {
      setSelectedConversation(conversations[0].key);
      markAsRead(conversations[0].key);
    } else if (
      selectedConversation &&
      !conversations.find((c) => c.key === selectedConversation)
    ) {
      const next = conversations[0]?.key;
      setSelectedConversation(next || null);
      if (next) markAsRead(next);
    }
  }, [conversations, selectedConversation, markAsRead]);

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedConversation || !user) return;

    const otherUserId = selectedConversation;
    const message: Message = {
      id: Date.now().toString(),
      from: user.id,
      to: otherUserId,
      fromName: user.name,
      toName: otherUserId === PLATFORM_USER_ID ? PLATFORM_USER_NAME : otherUserId,
      productId: "general",
      subject: `Interés en producto`,
      content: newMessage,
      timestamp: new Date().toISOString(),
      read: false,
    };

    const updatedMessages = [...messages, message];

    setMessages(updatedMessages);
    persistMessages(updatedMessages);
    setNewMessage("");
  };

  const deleteMessage = (id: string) => {
    setMessages((prev) => {
      const updated = prev.filter((m) => m.id !== id);
      persistMessages(updated);
      return updated;
    });
  };

  const deleteConversation = (conversationKey: string) => {
    if (!user) return;
    const otherUserId = conversationKey;
    setMessages((prev) => {
      const updated = prev.filter((m) => {
        const involvesPair =
          ((m.from === user.id || m.from === user.email) && (m.to === otherUserId || m.to === PLATFORM_USER_ID)) ||
          ((m.to === user.id || m.to === user.email) && (m.from === otherUserId || m.from === PLATFORM_USER_ID)) ||
          (m.from === otherUserId && m.to === PLATFORM_USER_ID) ||
          (m.to === otherUserId && m.from === PLATFORM_USER_ID);
        return !involvesPair;
      });
      persistMessages(updated);
      return updated;
    });
    setSelectedConversation(null);
  };

  const startConversation = (product: Product) => {
    if (!user) return;

    // Un solo chat con plataforma
    const conversationKey = PLATFORM_USER_ID;
    setSelectedConversation(conversationKey);

    // Marcar mensajes como leídos
    markAsRead(conversationKey);
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Acceso requerido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Debes iniciar sesión para ver tus mensajes.
          </p>
          <Link to="/login" className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
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
            {/* Lista de conversaciones */}
            <div className="lg:col-span-1">
              <h2 className="text-lg font-semibold text-foreground mb-4">Conversaciones</h2>
              <div className="space-y-2">
                {conversations.length > 0 ? (
                  conversations.map((conv) => (
                    <div
                      key={conv.key}
                      onClick={() => {
                        setSelectedConversation(conv.key);
                        markAsRead(conv.key);
                      }}
                      className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                        selectedConversation === conv.key
                          ? "border-primary bg-white shadow-sm"
                          : "border-secondary hover:bg-secondary/40 bg-white"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{conv.otherUser}</p>
                          {conv.lastProduct && (
                            <p className="text-xs text-muted-foreground line-clamp-1">{conv.lastProduct.title}</p>
                          )}
                        </div>
                        {conv.unreadCount > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No tienes conversaciones aún.</p>
                    <Link
                      to="/"
                      className="mt-2 inline-block text-primary hover:underline"
                    >
                      Explorar objetos
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Chat */}
            <div className="lg:col-span-2">
              {selectedConversation ? (
                <div className="h-[600px] flex flex-col bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="p-4 bg-green-500 text-white flex items-center justify-between gap-3">
                    <div>
                      <h3 className="font-semibold">
                        {conversations.find((c) => c.key === selectedConversation)?.otherUser || selectedConversation}
                      </h3>
                      {(() => {
                        const conv = conversations.find((c) => c.key === selectedConversation);
                        const product = conv?.lastProduct;
                        return product ? (
                          <p className="text-sm opacity-90 mt-1">
                            {product.title}
                          </p>
                        ) : null;
                      })()}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white/90 text-green-700 hover:bg-white border border-white/60"
                        onClick={() => deleteConversation(selectedConversation)}
                      >
                        Eliminar chat
                      </Button>
                    </div>
                  </div>

                  <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
                    {selectedConvMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${(msg.from === user?.id || msg.from === user?.email) ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs px-4 py-2 rounded-2xl shadow-sm ${
                            (msg.from === user?.id || msg.from === user?.email)
                              ? 'bg-green-500 text-white'
                              : 'bg-white text-gray-800 border border-gray-200'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <p className="text-sm flex-1 break-words">{msg.content}</p>
                            <button
                              className={`text-xs underline ${ (msg.from === user.id || msg.from === user.email) ? 'text-green-100' : 'text-gray-500' }`}
                              onClick={() => deleteMessage(msg.id)}
                            >
                              Eliminar
                            </button>
                          </div>
                          {msg.image && (
                            <div className="mt-2">
                              <img
                                src={msg.image}
                                alt="Adjunto"
                                className="max-h-32 w-full object-cover rounded-md border border-white/20"
                              />
                            </div>
                          )}
                          <p className={`text-xs mt-1 ${
                            (msg.from === user?.id || msg.from === user?.email) ? 'text-green-100' : 'text-gray-500'
                          }`}>
                            {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-gray-100 border-t border-gray-200">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Escribe un mensaje..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full bg-white text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <Button
                        onClick={sendMessage}
                        disabled={!newMessage.trim()}
                        size="sm"
                        className="bg-green-500 hover:bg-green-600 text-white rounded-full px-4"
                      >
                        Enviar
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

