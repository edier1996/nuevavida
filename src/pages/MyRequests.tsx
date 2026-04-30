import { useEffect, useMemo, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpeg";
import { mockProducts, type Product } from "@/lib/mock-data";
import { fetchConversations, fetchMessages, sendMessage as apiSendMessage, markMessageAsRead, type ApiMessage } from "@/lib/messaging-api";

const PLATFORM_USER_ID = "platform";
const PLATFORM_USER_NAME = "Nueva Vida (Plataforma)";

interface Inquiry {
  id: string;
  buyerId?: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
  productId: string;
  productTitle: string;
  productCity?: string;
  message: string;
  status: "pending" | "in-progress" | "resolved";
  createdAt: string;
  assignedTo?: string;
  assignedToName?: string;
  sellerId?: string;
  sellerName?: string;
  sellerEmail?: string;
}

interface StoredMessage {
  id: string;
  from: string;
  to: string;
  fromName?: string;
  toName?: string;
  productId?: string;
  subject?: string;
  content: string;
  timestamp: string;
  read: boolean;
}

const statusColors: Record<Inquiry["status"], string> = {
  pending: "bg-yellow-500",
  "in-progress": "bg-blue-500",
  resolved: "bg-green-600",
};

const toStoredMessage = (msg: ApiMessage): StoredMessage => ({
  id: msg.id,
  from: msg.from,
  to: msg.to,
  fromName: msg.fromName,
  toName: msg.toName,
  productId: msg.productId,
  subject: msg.subject,
  content: msg.content,
  timestamp: msg.timestamp,
  read: msg.read,
});

const MyRequests = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Inquiry[]>([]);
  const [messages, setMessages] = useState<StoredMessage[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [allProducts, setAllProducts] = useState<Product[]>(mockProducts);

  // Cargar datos base
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Load inquiries from localStorage (worker_inquiries still managed locally)
    const storedInquiries: Inquiry[] = JSON.parse(localStorage.getItem("worker_inquiries") || "[]");
    const mine = storedInquiries
      .filter(
        (inq) =>
          inq.buyerId === user.id ||
          inq.customerEmail === user.email ||
          inq.customerPhone === user.phone
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setRequests(mine);
    setSelectedId((prev) => prev || mine[0]?.id || null);

    // Load messages from Messaging Service API, fall back to localStorage
    const loadMessages = async () => {
      try {
        const conversations = await fetchConversations(user.id);
        if (conversations.length > 0) {
          const allMsgs: StoredMessage[] = [];
          await Promise.all(
            conversations.map(async (conv) => {
              try {
                const msgs = await fetchMessages(conv.id);
                allMsgs.push(...msgs.map(toStoredMessage));
              } catch {
                // skip failed conversation
              }
            })
          );
          setMessages(allMsgs);
          return;
        }
      } catch {
        // fall through to localStorage
      }
      const storedMessages = localStorage.getItem("messages");
      const backupMessages = localStorage.getItem("messages_backup");
      const parsedMessages: StoredMessage[] = storedMessages
        ? JSON.parse(storedMessages)
        : backupMessages
        ? JSON.parse(backupMessages)
        : [];
      setMessages(parsedMessages);
    };

    loadMessages();

    const userProducts = JSON.parse(localStorage.getItem("products") || "[]");
    setAllProducts([...mockProducts, ...userProducts]);
  }, [isAuthenticated, user]);

  const persistMessages = useCallback((list: StoredMessage[]) => {
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
  }, []);

  const selectedRequest = useMemo(
    () => requests.find((r) => r.id === selectedId) || null,
    [requests, selectedId]
  );

  const selectedMessages = useMemo(() => {
    if (!selectedRequest || !user) return [];

    const otherId =
      selectedRequest.assignedTo ||
      selectedRequest.sellerId ||
      selectedRequest.sellerEmail ||
      PLATFORM_USER_ID;

    return messages
      .filter((msg) => {
        const msgProduct = msg.productId || "general";
        const targetProduct = selectedRequest.productId || "general";
        if (msgProduct !== targetProduct) return false;
        const involvesUser = msg.from === user.id || msg.from === user.email || msg.to === user.id || msg.to === user.email;
        const involvesOther = msg.from === otherId || msg.to === otherId;
        return involvesUser && involvesOther;
      })
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [messages, selectedRequest, user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedRequest || !user) return;

    const otherId =
      selectedRequest.assignedTo ||
      selectedRequest.sellerId ||
      selectedRequest.sellerEmail ||
      PLATFORM_USER_ID;
    const otherName =
      selectedRequest.assignedToName ||
      selectedRequest.sellerName ||
      PLATFORM_USER_NAME;

    const optimistic: StoredMessage = {
      id: Date.now().toString(),
      from: user.id,
      to: otherId,
      fromName: user.name,
      toName: otherName,
      productId: selectedRequest.productId,
      subject: `Seguimiento solicitud ${selectedRequest.productTitle}`,
      content: newMessage.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };

    // Optimistic UI update
    const updated = [...messages, optimistic];
    setMessages(updated);
    persistMessages(updated);
    setNewMessage("");

    // Persist to Messaging Service API
    try {
      const saved = await apiSendMessage({
        from: user.id,
        to: otherId,
        fromName: user.name,
        toName: otherName,
        productId: selectedRequest.productId,
        subject: `Seguimiento solicitud ${selectedRequest.productTitle}`,
        content: optimistic.content,
      });
      // Replace optimistic entry with server-confirmed message
      setMessages((prev) =>
        prev.map((m) => (m.id === optimistic.id ? toStoredMessage(saved) : m))
      );
    } catch {
      // Keep optimistic message — already in localStorage via persistMessages
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?redirect=/mis-solicitudes");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link to="/" className="inline-flex items-center rounded-full bg-white p-1 shadow-sm">
            <img src={logo} alt="Nueva Vida" className="h-12 w-12 rounded-full" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Historial de solicitudes</h1>
            <p className="text-sm text-muted-foreground">
              Consulta el estado y conversa con el trabajador asignado.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Mis peticiones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {requests.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aún no tienes solicitudes. Explora productos y envía una petición desde el detalle.
                </p>
              )}
              {requests.map((req) => (
                <button
                  key={req.id}
                  onClick={() => setSelectedId(req.id)}
                  className={`w-full text-left rounded-lg border p-3 transition ${
                    req.id === selectedId ? "border-primary bg-primary/5" : "border-border hover:bg-secondary/60"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold leading-tight">{req.productTitle}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(req.createdAt).toLocaleString()}
                      </p>
                      {req.productCity && (
                        <p className="text-xs text-muted-foreground">{req.productCity}</p>
                      )}
                    </div>
                    <Badge className={statusColors[req.status]}>{req.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {req.message}
                  </p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Detalle y chat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selectedRequest && (
                <p className="text-sm text-muted-foreground">
                  Selecciona una solicitud para ver su estado y conversar.
                </p>
              )}

              {selectedRequest && (
                <>
                  <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold">{selectedRequest.productTitle}</p>
                      <p className="text-sm text-muted-foreground">
                        Solicitud ID: {selectedRequest.id}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[selectedRequest.status]}>
                        {selectedRequest.status === "pending"
                          ? "Pendiente"
                          : selectedRequest.status === "in-progress"
                          ? "En progreso"
                          : "Resuelta"}
                      </Badge>
                      {selectedRequest.assignedToName && (
                        <Badge variant="outline">
                          Trabajador: {selectedRequest.assignedToName}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border bg-gray-50 p-3 space-y-2 text-sm">
                    <p className="font-medium">Notas iniciales</p>
                    <p className="whitespace-pre-line text-foreground">{selectedRequest.message}</p>
                  </div>

                  <div className="h-[420px] flex flex-col border rounded-lg overflow-hidden">
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white">
                      {selectedMessages.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          Aún no hay mensajes en esta solicitud.
                        </p>
                      )}
                      {selectedMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.from === user.id || msg.from === user.email ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-xs px-4 py-2 rounded-2xl shadow-sm ${
                              msg.from === user.id || msg.from === user.email
                                ? "bg-green-500 text-white"
                                : "bg-gray-100 text-gray-800 border border-gray-200"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p
                              className={`text-[11px] mt-1 ${
                                msg.from === user.id || msg.from === user.email ? "text-green-100" : "text-gray-500"
                              }`}
                            >
                              {new Date(msg.timestamp).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-gray-100 border-t">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
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
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
};

export default MyRequests;
