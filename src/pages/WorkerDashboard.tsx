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
  type RequestStatus,
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

  const changeStatus = async (id: string, status: RequestStatus) => {
    try {
      const updated = await updateRequestStatus(id, status);
      setInquiries(updated);
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
        description: "El solicitante recibira tu respuesta en Mensajes.",
      });
    } catch (err) {
      toast({
        title: "Error enviando mensaje",
        description: err instanceof Error ? err.message : "No se pudo enviar el mensaje.",
        variant: "destructive",
      });
    }
  };

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
            <CardTitle>Solicitudes entrantes</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-sm text-muted-foreground">Cargando...</p>}
            <div className="space-y-4">
              {inquiries.map((inquiry) => (
                <div key={inquiry.id} className="border rounded-lg p-4 shadow-sm bg-white">
                  <div className="flex justify-between items-start mb-2 gap-3">
                    <div className="space-y-1">
                      <h3 className="font-semibold text-lg">{inquiry.requesterName}</h3>
                      <p className="text-sm text-muted-foreground">{inquiry.productTitle}</p>
                      <p className="text-xs text-muted-foreground">{inquiry.requesterEmail}</p>
                    </div>
                    <Badge className={statusColors[inquiry.status]}>{statusText(inquiry.status)}</Badge>
                  </div>

                  <p className="text-sm text-foreground mb-3 whitespace-pre-line">{inquiry.reason}</p>

                  <div className="grid gap-2 md:grid-cols-3 mb-3 text-xs text-muted-foreground">
                    <div>Nivel: {inquiry.needLevel}</div>
                    <div>Puntaje: {inquiry.score}</div>
                    <div>Fecha: {new Date(inquiry.createdAt).toLocaleString()}</div>
                  </div>

                  <div className="flex gap-2 mb-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => changeStatus(inquiry.id, "in_review")}
                      disabled={inquiry.status === "in_review" || inquiry.status === "delivered"}
                    >
                      Tomar solicitud
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => changeStatus(inquiry.id, "selected")}
                      disabled={inquiry.status === "selected" || inquiry.status === "delivered"}
                    >
                      Seleccionar
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => changeStatus(inquiry.id, "delivered")}
                      disabled={inquiry.status === "delivered"}
                    >
                      Marcar resuelta
                    </Button>
                  </div>

                  <div className="flex gap-2">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default WorkerDashboard;
