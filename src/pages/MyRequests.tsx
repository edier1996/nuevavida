import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.jpeg";
import { getRequestsByUser, type ProductRequest } from "@/lib/requests";
import {
  fetchConversations,
  fetchConversationMessages,
  sendMessage as sendMessageApi,
  type Conversation,
  type Message,
} from "@/lib/messaging-api";

const PLATFORM_USER_ID = "platform";

const statusColors: Record<ProductRequest["status"], string> = {
  pending: "bg-yellow-500",
  in_review: "bg-blue-500",
  selected: "bg-green-600",
  rejected: "bg-red-600",
  delivered: "bg-emerald-700",
};

const statusLabel = (status: ProductRequest["status"]) => {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "in_review":
      return "En revisión";
    case "selected":
      return "Seleccionado";
    case "rejected":
      return "Rechazado";
    case "delivered":
      return "Entregado";
    default:
      return status;
  }
};

const MyRequests = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messagesByConversation, setMessagesByConversation] = useState<Record<string, Message[]>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?redirect=/mis-solicitudes");
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        const [loadedRequests, loadedConversations] = await Promise.all([
          getRequestsByUser(user.id),
          fetchConversations(user.id),
        ]);

        setRequests(loadedRequests);
        setConversations(loadedConversations);

        const fromQuery = searchParams.get("request");
        setSelectedId(fromQuery || loadedRequests[0]?.id || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "No se pudieron cargar tus solicitudes.");
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [isAuthenticated, user, searchParams]);

  const selectedRequest = useMemo(
    () => requests.find((r) => r.id === selectedId) || null,
    [requests, selectedId]
  );

  const selectedConversation = useMemo(() => {
    if (!selectedRequest) return null;

    const byOrder = conversations.find((c) => c.orderId === selectedRequest.id);
    if (byOrder) return byOrder;

    const byProduct = conversations.find((c) => c.productId === selectedRequest.productId);
    return byProduct || null;
  }, [conversations, selectedRequest]);

  useEffect(() => {
    if (!selectedConversation) return;
    if (messagesByConversation[selectedConversation.id]) return;

    const loadMessages = async () => {
      try {
        const result = await fetchConversationMessages(selectedConversation.id);
        setMessagesByConversation((prev) => ({
          ...prev,
          [selectedConversation.id]: result.messages,
        }));
      } catch {
        // Keep empty state.
      }
    };

    loadMessages();
  }, [selectedConversation, messagesByConversation]);

  // ── Auto-polling: refresca mensajes de la conversación activa cada 4s ──────
  useEffect(() => {
    if (!selectedConversation || !user) return;
    const poll = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const result = await fetchConversationMessages(selectedConversation.id);
        setMessagesByConversation((prev) => ({
          ...prev,
          [selectedConversation.id]: result.messages,
        }));
      } catch {
        // ignorar errores de red durante el polling
      }
    };
    const interval = setInterval(poll, 4000);
    return () => clearInterval(interval);
  }, [selectedConversation, user]);

  // Auto-polling de estados: refresca solicitudes cada 6s para reflejar
  // cambios como "Seleccionado" y "Entregado" sin recargar la pagina.
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const pollRequests = async () => {
      if (document.visibilityState === "hidden") return;
      try {
        const refreshed = await getRequestsByUser(user.id);
        setRequests(refreshed);
        setSelectedId((prev) => {
          if (prev && refreshed.some((request) => request.id === prev)) return prev;
          return refreshed[0]?.id || null;
        });
      } catch {
        // Ignore transient polling errors.
      }
    };

    const interval = setInterval(pollRequests, 6000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  const selectedMessages = useMemo(() => {
    if (!selectedConversation) return [];
    return messagesByConversation[selectedConversation.id] || [];
  }, [messagesByConversation, selectedConversation]);

  const sendMessage = async () => {
    if (!user || !selectedRequest || !newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      const payload = {
        conversationId: selectedConversation?.id,
        participantIds: selectedConversation ? undefined : [user.id, PLATFORM_USER_ID],
        participantNames: selectedConversation ? undefined : [user.name, 'Plataforma'],
        senderId: user.id,
        senderName: user.name,
        content: newMessage.trim(),
        productId: selectedRequest.productId,
        orderId: selectedRequest.id,
      };

      const { conversation, message } = await sendMessageApi(payload);

      if (!selectedConversation) {
        setConversations((prev) => [conversation, ...prev]);
      }

      setMessagesByConversation((prev) => {
        const list = prev[conversation.id] || [];
        return {
          ...prev,
          [conversation.id]: [...list, message],
        };
      });

      setNewMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo enviar el mensaje.");
    } finally {
      setIsSending(false);
    }
  };

  if (!isAuthenticated || !user) return null;

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
              Consulta el estado de tus solicitudes y conversa desde aquí.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Mis peticiones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading && (
                <p className="text-sm text-muted-foreground">Cargando solicitudes...</p>
              )}
              {!isLoading && requests.length === 0 && (
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
                    <Badge className={statusColors[req.status]}>{statusLabel(req.status)}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{req.reason}</p>
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
                  Selecciona una solicitud para ver su detalle y conversar.
                </p>
              )}

              {selectedRequest && (
                <>
                  <div className="flex flex-wrap gap-3 items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold">{selectedRequest.productTitle}</p>
                      <p className="text-sm text-muted-foreground">Solicitud ID: {selectedRequest.id}</p>
                    </div>
                    <Badge className={statusColors[selectedRequest.status]}>
                      {statusLabel(selectedRequest.status)}
                    </Badge>
                  </div>

                  <div className="rounded-lg border bg-gray-50 p-3 space-y-2 text-sm">
                    <p className="font-medium">Motivo de la solicitud</p>
                    <p className="whitespace-pre-line text-foreground">{selectedRequest.reason}</p>
                  </div>

                  <div className="h-[420px] flex flex-col border rounded-lg overflow-hidden">
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-white">
                      {selectedMessages.length === 0 && (
                        <p className="text-sm text-muted-foreground">Aún no hay mensajes en esta solicitud.</p>
                      )}
                      {selectedMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.senderId === user.id ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-xs px-4 py-2 rounded-2xl shadow-sm ${
                              msg.senderId === user.id
                                ? "bg-green-500 text-white"
                                : "bg-gray-100 text-gray-800 border border-gray-200"
                            }`}
                          >
                            <p className="text-sm">{msg.content}</p>
                            <p
                              className={`text-[11px] mt-1 ${
                                msg.senderId === user.id ? "text-green-100" : "text-gray-500"
                              }`}
                            >
                              {new Date(msg.createdAt).toLocaleTimeString([], {
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
                          disabled={!newMessage.trim() || isSending}
                          size="sm"
                          className="bg-green-500 hover:bg-green-600 text-white rounded-full px-4"
                        >
                          {isSending ? "Enviando..." : "Enviar"}
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
