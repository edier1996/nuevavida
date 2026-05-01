import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, CheckCircle2 } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  getRequests,
  updateRequestStatus,
  type ProductRequest,
} from "@/lib/requests";
import { sendMessage as sendMessageApi } from "@/lib/messaging-api";

const statusColors: Record<ProductRequest["status"], string> = {
  pending: "bg-yellow-500",
  in_review: "bg-blue-500",
  selected: "bg-green-600",
  rejected: "bg-red-600",
  delivered: "bg-emerald-700",
};

const statusText = (status: ProductRequest["status"]) => {
  switch (status) {
    case "pending":
      return "Pendiente";
    case "in_review":
      return "En progreso";
    case "selected":
      return "Seleccionado";
    case "rejected":
      return "Rechazado";
    case "delivered":
      return "Resuelto";
    default:
      return status;
  }
};

const WorkerDashboard = () => {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<ProductRequest[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);

  if (!user || user.role !== "worker") {
    return <div>No tienes permisos para acceder a esta pagina.</div>;
  }

  const loadInquiries = async () => {
    setIsLoading(true);
    try {
      const all = await getRequests();
      const filtered = all
        .filter((r) => r.status !== "rejected")
        .sort(
          (a, b) =>
            b.score - a.score ||
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      setInquiries(filtered);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudieron cargar solicitudes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInquiries();
  }, []);

  const changeStatus = async (id: string, status: ProductRequest["status"]) => {
    try {
      const updated = await updateRequestStatus(id, status);
      const filtered = updated
        .filter((r) => r.status !== "rejected")
        .sort(
          (a, b) =>
            b.score - a.score ||
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      setInquiries(filtered);
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo actualizar estado.",
        variant: "destructive",
      });
    }
  };

  const sendReply = async (inq: ProductRequest) => {
    const message = (replies[inq.id] || "").trim();
    if (!message) {
      toast({
        title: "Mensaje vacio",
        description: "Escribe una respuesta antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendMessageApi({
        participantIds: [user.id, inq.requesterId],
        senderId: user.id,
        senderName: user.name,
        content: message,
        productId: inq.productId,
        orderId: inq.id,
      });

      if (inq.status === "pending") {
        await changeStatus(inq.id, "in_review");
      }

      setReplies((prev) => ({ ...prev, [inq.id]: "" }));
      toast({
        title: "Mensaje enviado",
        description: "El solicitante recibira tu respuesta en mensajes.",
      });
    } catch (err) {
      toast({
        title: "Error enviando mensaje",
        description: err instanceof Error ? err.message : "No se pudo enviar el mensaje.",
        variant: "destructive",
      });
    }
  };

  const selectBeneficiary = async (selected: ProductRequest) => {
    if (!user) return;
    setBusyProductId(selected.productId);

    try {
      // 1) Select winner
      await updateRequestStatus(selected.id, "selected");

      // 2) Reject competing requests for the same product
      const competitors = inquiries.filter(
        (r) =>
          r.productId === selected.productId &&
          r.id !== selected.id &&
          r.status !== "delivered" &&
          r.status !== "rejected"
      );

      for (const competitor of competitors) {
        await updateRequestStatus(competitor.id, "rejected");
      }

      // 3) Notify winner and others through chat API
      try {
        await sendMessageApi({
          participantIds: [user.id, selected.requesterId],
          senderId: user.id,
          senderName: user.name,
          content: `Tu solicitud para "${selected.productTitle}" fue seleccionada. Pronto coordinaremos la entrega.`,
          productId: selected.productId,
          orderId: selected.id,
        });
      } catch {
        // Non-blocking notification failure.
      }

      for (const competitor of competitors) {
        try {
          await sendMessageApi({
            participantIds: [user.id, competitor.requesterId],
            senderId: user.id,
            senderName: user.name,
            content: `Tu solicitud para "${competitor.productTitle}" no fue seleccionada en esta ocasion. Gracias por participar.`,
            productId: competitor.productId,
            orderId: competitor.id,
          });
        } catch {
          // Non-blocking notification failure.
        }
      }

      await loadInquiries();
      toast({
        title: "Beneficiario seleccionado",
        description: "Se selecciono un solicitante y se cerraron las demas solicitudes de ese producto.",
      });
    } catch (err) {
      toast({
        title: "Error al seleccionar beneficiario",
        description: err instanceof Error ? err.message : "No se pudo completar la seleccion.",
        variant: "destructive",
      });
    } finally {
      setBusyProductId(null);
    }
  };

  const groupedByProduct = useMemo(() => {
    const groups = new Map<string, ProductRequest[]>();
    inquiries.forEach((inquiry) => {
      const list = groups.get(inquiry.productId) || [];
      list.push(inquiry);
      groups.set(inquiry.productId, list);
    });

    return Array.from(groups.values())
      .map((group) =>
        group.sort(
          (a, b) =>
            b.score - a.score ||
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        )
      )
      .sort((a, b) => {
        const newestA = Math.max(...a.map((x) => new Date(x.createdAt).getTime()));
        const newestB = Math.max(...b.map((x) => new Date(x.createdAt).getTime()));
        return newestB - newestA;
      });
  }, [inquiries]);

  const stats = useMemo(
    () => ({
      pending: inquiries.filter((i) => i.status === "pending").length,
      inProgress: inquiries.filter((i) => i.status === "in_review" || i.status === "selected").length,
      resolved: inquiries.filter((i) => i.status === "delivered").length,
    }),
    [inquiries]
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="inline-flex items-center rounded-full bg-white p-1 shadow-sm">
          <img src={logo} alt="Logo Nueva Vida" className="h-12 w-12 rounded-full object-cover" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Panel de Trabajador</h1>
          <p className="text-sm text-muted-foreground">Gestiona y responde solicitudes desde MySQL.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Solicitudes pendientes</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En progreso</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resueltas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Solicitudes por producto</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-sm text-muted-foreground">Cargando...</p>}
            <div className="space-y-4">
              {groupedByProduct.length === 0 && !isLoading && (
                <p className="text-sm text-muted-foreground">
                  No hay solicitudes activas para analizar por el momento.
                </p>
              )}

              {groupedByProduct.map((group) => {
                const top = group[0];
                const hasWinner = group.some((r) => r.status === "selected" || r.status === "delivered");
                return (
                  <div key={top.productId} className="border rounded-lg p-4 shadow-sm bg-white">
                    <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-lg">{top.productTitle}</h3>
                        <p className="text-xs text-muted-foreground">{top.productCity || "Sin ciudad"} · {group.length} solicitudes</p>
                      </div>
                      {hasWinner && (
                        <Badge className="bg-green-600">Beneficiario definido</Badge>
                      )}
                    </div>

                    <div className="space-y-4">
                      {group.map((inquiry, idx) => (
                        <div key={inquiry.id} className="rounded-md border p-3 bg-gray-50">
                          <div className="flex flex-wrap justify-between items-start gap-2">
                            <div>
                              <p className="font-semibold">#{idx + 1} {inquiry.requesterName}</p>
                              <p className="text-xs text-muted-foreground">{inquiry.requesterEmail}</p>
                            </div>
                            <Badge className={statusColors[inquiry.status]}>{statusText(inquiry.status)}</Badge>
                          </div>

                          <p className="text-sm mt-2 whitespace-pre-line">{inquiry.reason}</p>

                          <div className="grid gap-2 md:grid-cols-4 mt-2 text-xs text-muted-foreground">
                            <div>Nivel: {inquiry.needLevel}</div>
                            <div>Puntaje: {inquiry.score}</div>
                            <div>Hogar: {inquiry.householdSize || "N/A"}</div>
                            <div>Fecha: {new Date(inquiry.createdAt).toLocaleString()}</div>
                          </div>

                          <div className="flex flex-wrap gap-2 mt-3">
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => changeStatus(inquiry.id, "in_review")}
                              disabled={inquiry.status === "in_review" || inquiry.status === "selected" || inquiry.status === "delivered"}
                            >
                              Tomar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => selectBeneficiary(inquiry)}
                              disabled={busyProductId === inquiry.productId || inquiry.status === "selected" || inquiry.status === "delivered"}
                            >
                              {busyProductId === inquiry.productId ? "Procesando..." : "Seleccionar beneficiario"}
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => changeStatus(inquiry.id, "rejected")}
                              disabled={inquiry.status === "rejected" || inquiry.status === "selected" || inquiry.status === "delivered"}
                            >
                              Rechazar
                            </Button>
                            {(inquiry.status === "selected" || inquiry.status === "in_review") && (
                              <Button
                                size="sm"
                                onClick={() => changeStatus(inquiry.id, "delivered")}
                                disabled={inquiry.status === "delivered"}
                              >
                                Marcar entregado
                              </Button>
                            )}
                          </div>

                          <div className="flex gap-2 mt-3">
                            <textarea
                              value={replies[inquiry.id] || ""}
                              onChange={(e) => setReplies((prev) => ({ ...prev, [inquiry.id]: e.target.value }))}
                              placeholder="Responder al solicitante..."
                              className="flex-1 rounded-md border p-2 text-sm"
                              rows={2}
                            />
                            <Button onClick={() => sendReply(inquiry)}>Enviar</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkerDashboard;
