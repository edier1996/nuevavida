import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, CheckCircle2, Clock3, Trophy, SendHorizontal } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import {
  getRequests,
  updateRequestStatus,
  type ProductRequest,
} from "@/lib/requests";
import { sendMessage as sendMessageApi } from "@/lib/messaging-api";
import { updateProduct } from "@/lib/products-api";

const statusColors: Record<ProductRequest["status"], string> = {
  pending: "bg-amber-500",
  in_review: "bg-sky-600",
  selected: "bg-emerald-600",
  rejected: "bg-rose-600",
  delivered: "bg-teal-700",
};

const needLevelStyles: Record<ProductRequest["needLevel"], string> = {
  alta: "bg-rose-100 text-rose-700 border-rose-200",
  media: "bg-amber-100 text-amber-700 border-amber-200",
  baja: "bg-emerald-100 text-emerald-700 border-emerald-200",
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

const toVisibleInquiries = (items: ProductRequest[]) =>
  items
    .filter((request) => request.status !== "rejected" && request.status !== "delivered")
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

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
      setInquiries(toVisibleInquiries(all));
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
      const targetInquiry = inquiries.find((inquiry) => inquiry.id === id);
      const updated = await updateRequestStatus(id, status);
      if (targetInquiry?.productId) {
        if (status === "in_review") {
          await updateProduct(targetInquiry.productId, { donationStatus: "en_proceso" });
        }

        if (status === "delivered") {
          await updateProduct(targetInquiry.productId, {
            donationStatus: "entregado",
            sold: true,
            status: "sold",
          });

          try {
            await sendMessageApi({
              participantIds: [user.id, targetInquiry.requesterId],
              senderId: user.id,
              senderName: user.name,
              content: `Tu solicitud para "${targetInquiry.productTitle}" ya fue marcada como entregada.`,
              productId: targetInquiry.productId,
              orderId: targetInquiry.id,
            });
          } catch {
            // Non-blocking notification failure.
          }
        }
      }

      setInquiries(toVisibleInquiries(updated));
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

      await updateProduct(selected.productId, { donationStatus: "en_proceso" });

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
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f7f3ea_0%,#f1f7f3_55%,#edf5ff_100%)]">
      <div className="pointer-events-none absolute -left-24 -top-20 h-64 w-64 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 top-16 h-72 w-72 rounded-full bg-amber-300/20 blur-3xl" />

      <div className="container mx-auto p-4 md:p-6">
        <div className="mb-6 rounded-3xl border border-white/80 bg-white/80 p-4 shadow-[0_16px_40px_rgba(39,68,50,0.10)] backdrop-blur md:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Link to="/" className="inline-flex items-center rounded-2xl border border-border bg-white p-1 shadow-sm">
                <img src={logo} alt="Logo Nueva Vida" className="h-12 w-12 rounded-xl object-cover" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground md:text-3xl">Panel de Trabajador</h1>
                <p className="text-sm text-muted-foreground">Analiza solicitudes y asigna beneficiarios con criterio social.</p>
              </div>
            </div>
            <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-white">Equipo activo</Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-0 bg-white/85 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Solicitudes pendientes</CardTitle>
              <MessageSquare className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums text-foreground">{stats.pending}</div>
              <p className="mt-1 text-xs text-muted-foreground">Casos nuevos por revisar</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/85 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">En progreso</CardTitle>
              <Clock3 className="h-4 w-4 text-sky-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums text-foreground">{stats.inProgress}</div>
              <p className="mt-1 text-xs text-muted-foreground">Solicitudes tomadas por el equipo</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/85 shadow-[0_12px_28px_rgba(15,23,42,0.08)]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-semibold text-muted-foreground">Resueltas</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tabular-nums text-foreground">{stats.resolved}</div>
              <p className="mt-1 text-xs text-muted-foreground">Entregas confirmadas</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-5 border-white/80 bg-white/80 shadow-[0_20px_45px_rgba(39,68,50,0.10)] backdrop-blur">
          <CardHeader className="pb-3">
            <CardTitle className="text-2xl">Solicitudes por producto</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading && <p className="text-sm text-muted-foreground">Cargando solicitudes...</p>}
            <div className="space-y-5">
              {groupedByProduct.length === 0 && !isLoading && (
                <div className="rounded-2xl border border-dashed border-border bg-white/70 p-8 text-center">
                  <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                  <p className="mt-3 text-sm text-muted-foreground">No hay solicitudes activas para analizar por el momento.</p>
                </div>
              )}

              {groupedByProduct.map((group) => {
                const top = group[0];
                const hasWinner = group.some((r) => r.status === "selected" || r.status === "delivered");

                return (
                  <div key={top.productId} className="rounded-2xl border border-border/70 bg-white/85 p-4 shadow-sm md:p-5">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{top.productTitle}</h3>
                        <p className="text-xs text-muted-foreground">{top.productCity || "Sin ciudad"} · {group.length} solicitudes</p>
                      </div>
                      {hasWinner ? (
                        <Badge className="gap-1 rounded-full bg-emerald-600 px-3 py-1 text-white">
                          <Trophy className="h-3.5 w-3.5" />
                          Beneficiario definido
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="rounded-full px-3 py-1">Pendiente de seleccion</Badge>
                      )}
                    </div>

                    <div className="space-y-4">
                      {group.map((inquiry, idx) => (
                        <div key={inquiry.id} className="rounded-2xl border border-border/70 bg-gradient-to-b from-white to-slate-50/60 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-foreground">#{idx + 1} {inquiry.requesterName}</p>
                              <p className="text-xs text-muted-foreground">{inquiry.requesterEmail}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`${statusColors[inquiry.status]} rounded-full px-3 py-1 text-white`}>
                                {statusText(inquiry.status)}
                              </Badge>
                              <Badge variant="outline" className={`${needLevelStyles[inquiry.needLevel]} rounded-full`}>
                                Nivel {inquiry.needLevel}
                              </Badge>
                            </div>
                          </div>

                          <p className="mt-3 rounded-xl bg-white/70 p-3 text-sm leading-6 text-foreground whitespace-pre-line">{inquiry.reason}</p>

                          <div className="mt-3 grid gap-2 text-xs text-muted-foreground md:grid-cols-3 lg:grid-cols-4">
                            <div className="rounded-lg bg-white/70 px-3 py-2">Puntaje: <span className="font-semibold text-foreground">{inquiry.score}</span></div>
                            <div className="rounded-lg bg-white/70 px-3 py-2">Hogar: <span className="font-semibold text-foreground">{inquiry.householdSize || "N/A"}</span></div>
                            <div className="rounded-lg bg-white/70 px-3 py-2 md:col-span-2">Fecha: <span className="font-semibold text-foreground">{new Date(inquiry.createdAt).toLocaleString()}</span></div>
                          </div>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              className="rounded-full bg-sky-600 text-white hover:bg-sky-700"
                              onClick={() => changeStatus(inquiry.id, "in_review")}
                              disabled={inquiry.status === "in_review" || inquiry.status === "selected" || inquiry.status === "delivered"}
                            >
                              Tomar
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                              onClick={() => selectBeneficiary(inquiry)}
                              disabled={busyProductId === inquiry.productId || inquiry.status === "selected" || inquiry.status === "delivered"}
                            >
                              {busyProductId === inquiry.productId ? "Procesando..." : "Seleccionar beneficiario"}
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-full border-rose-300 text-rose-700 hover:bg-rose-50"
                              onClick={() => changeStatus(inquiry.id, "rejected")}
                              disabled={inquiry.status === "rejected" || inquiry.status === "selected" || inquiry.status === "delivered"}
                            >
                              Rechazar
                            </Button>

                            {(inquiry.status === "selected" || inquiry.status === "in_review") && (
                              <Button
                                size="sm"
                                className="rounded-full bg-emerald-700 text-white hover:bg-emerald-800"
                                onClick={() => changeStatus(inquiry.id, "delivered")}
                                disabled={inquiry.status === "delivered"}
                              >
                                Marcar entregado
                              </Button>
                            )}
                          </div>

                          <div className="mt-4 flex flex-col gap-2 md:flex-row">
                            <textarea
                              value={replies[inquiry.id] || ""}
                              onChange={(e) => setReplies((prev) => ({ ...prev, [inquiry.id]: e.target.value }))}
                              placeholder="Responder al solicitante..."
                              className="min-h-[44px] flex-1 rounded-xl border border-border bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-200"
                              rows={2}
                            />
                            <Button className="gap-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => sendReply(inquiry)}>
                              <SendHorizontal className="h-4 w-4" />
                              Enviar
                            </Button>
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
