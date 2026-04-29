import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Users, Phone, Mail, Send, CheckCircle2 } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

interface Inquiry {
  id: string;
  transactionId?: string;
  buyerId?: string;
  sellerId?: string;
  sellerName?: string;
  sellerEmail?: string;
  assignedTo?: string;
  assignedToName?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  productId: string;
  productTitle: string;
  message: string;
  status: 'pending' | 'in-progress' | 'resolved';
  createdAt: string;
  score?: number;
  needLevel?: string;
}

const WORKER_INQUIRIES_KEY = "worker_inquiries";

const WorkerDashboard = () => {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});

  if (!user || user.role !== 'worker') {
    return <div>No tienes permisos para acceder a esta página.</div>;
  }

  const persistInquiries = useCallback((list: Inquiry[]) => {
    const sorted = [...list].sort((a, b) => {
      const scoreDiff = (b as any).score - (a as any).score || 0;
      if (scoreDiff !== 0 && !Number.isNaN(scoreDiff)) return scoreDiff;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    setInquiries(sorted);
    localStorage.setItem(WORKER_INQUIRIES_KEY, JSON.stringify(sorted));
  }, []);

  useEffect(() => {
    if (!user) return;

    const stored: Inquiry[] = JSON.parse(localStorage.getItem(WORKER_INQUIRIES_KEY) || "[]");
    const transactions = JSON.parse(localStorage.getItem("transactions") || "[]");
    const messages = JSON.parse(localStorage.getItem("messages") || "[]");
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const products = JSON.parse(localStorage.getItem("products") || "[]");

    const merged: Inquiry[] = [...stored];

    const addIfMissing = (inq: Inquiry) => {
      const exists = merged.some((i) => i.id === inq.id);
      if (!exists) merged.push(inq);
    };

    transactions.forEach((tx: any) => {
      const buyer = users.find((u: any) => u.id === tx.buyerId);
      const seller = users.find((u: any) => u.id === tx.sellerId);
      const product = products.find((p: any) => p.id === tx.productId);

      addIfMissing({
        id: tx.id,
        transactionId: tx.id,
        buyerId: tx.buyerId,
        sellerId: tx.sellerId,
        sellerName: product?.sellerName || seller?.name || "Vendedor",
        sellerEmail: product?.sellerEmail || seller?.email,
        customerName: buyer?.name || "Comprador",
        customerEmail: buyer?.email || "sin-email",
        customerPhone: buyer?.phone,
        productId: tx.productId,
        productTitle: tx.productTitle || product?.title || "Producto",
        message: tx.buyerNotes || "Compra confirmada, coordinar entrega.",
        status: "pending",
        createdAt: tx.timestamps?.created || new Date().toISOString(),
      });
    });

    messages
      .filter((msg: any) => msg.to === user.id || msg.to === user.email)
      .forEach((msg: any) => {
        const msgId = msg.id.startsWith("msg-") ? msg.id : `msg-${msg.id}`;
        const product = products.find((p: any) => p.id === msg.productId);
        addIfMissing({
          id: msgId,
          customerName: msg.fromName || msg.from || "Cliente",
          customerEmail: msg.from || "sin-email",
          customerPhone: undefined,
          productId: msg.productId || "sin-producto",
          productTitle: product?.title || msg.subject || "Producto",
          message: msg.content || "Mensaje entrante",
          status: "pending",
          createdAt: msg.timestamp || new Date().toISOString(),
          buyerId: msg.from,
          sellerId: product?.sellerId,
          sellerName: product?.sellerName,
          sellerEmail: product?.sellerEmail,
        });
      });

    persistInquiries(merged);
  }, [user, persistInquiries]);

  const persistMessages = (list: any[]) => {
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

  const notifyBuyerAssigned = (inq: Inquiry) => {
    if (!user) return;
    const destinationId = inq.customerEmail || inq.buyerId;
    if (!destinationId) return;

    const messages = JSON.parse(localStorage.getItem("messages") || "[]");
    messages.push({
      id: `${Date.now()}-assign`,
      from: user.id,
      to: destinationId,
      fromName: user.name,
      toName: inq.customerName,
      productId: inq.productId,
      subject: `Tu solicitud sobre "${inq.productTitle}" fue tomada`,
      content: `Hola ${inq.customerName}, soy ${user.name} del equipo de soporte. Tomé tu solicitud y coordinaré con el publicador para ayudarte. Te escribiré por aquí con novedades. ID solicitud: ${inq.id}.`,
      timestamp: new Date().toISOString(),
      read: false,
    });
    persistMessages(messages);
  };

  const updateInquiryStatus = (id: string, status: 'pending' | 'in-progress' | 'resolved') => {
    const previous = inquiries.find((inq) => inq.id === id);
    const updated = inquiries.map((inq) =>
      inq.id === id
        ? { ...inq, status, assignedTo: inq.assignedTo ?? user?.id, assignedToName: inq.assignedToName ?? user?.name }
        : inq
    );
    persistInquiries(updated);

    if (status === "in-progress" && previous?.status !== "in-progress") {
      notifyBuyerAssigned(previous || updated.find((i) => i.id === id)!);
    }
  };

  const takeInquiry = (inq: Inquiry) => {
    if (!user) return;
    const updated = inquiries.map((item) =>
      item.id === inq.id
        ? { ...item, status: 'in-progress', assignedTo: user.id, assignedToName: user.name }
        : item
    );
    persistInquiries(updated);
    notifyBuyerAssigned({ ...inq, assignedTo: user.id, assignedToName: user.name });
  };

  const sendReply = (inq: Inquiry, target: 'buyer' | 'seller') => {
    const key = `${inq.id}-${target}`;
    const message = (replies[key] || "").trim();
    if (!message) {
      toast({
        title: "Mensaje vacío",
        description: "Escribe una respuesta antes de enviar.",
        variant: "destructive",
      });
      return;
    }

    const destinationId =
      target === "buyer"
        ? inq.buyerId || inq.customerEmail
        : inq.sellerId || inq.sellerEmail || inq.customerEmail;
    const destinationName =
      target === "buyer" ? inq.customerName : inq.sellerName || "Vendedor";

    if (!destinationId) {
      toast({
        title: "Falta información",
        description: "No encontramos a quién enviar este mensaje.",
        variant: "destructive",
      });
      return;
    }

    const storedMessages = JSON.parse(localStorage.getItem("messages") || "[]");
    storedMessages.push({
      id: `${Date.now()}`,
      from: user.id,
      to: destinationId,
      fromName: user.name,
      toName: destinationName,
      productId: inq.productId,
      subject:
        target === "buyer"
          ? `Seguimiento sobre "${inq.productTitle}"`
          : `Coordinación con publicador "${inq.productTitle}"`,
      content: message,
      timestamp: new Date().toISOString(),
      read: false,
    });

    persistMessages(storedMessages);

    if (inq.status === "pending") {
      updateInquiryStatus(inq.id, "in-progress");
    }
    setReplies((prev) => ({ ...prev, [key]: "" }));

    toast({
      title: "Mensaje enviado",
      description:
        target === "buyer"
          ? "El solicitante recibirá tu respuesta en Mensajes."
          : "El publicador recibirá tu mensaje para coordinar.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'in-progress': return 'bg-blue-500';
      case 'resolved': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'in-progress': return 'En progreso';
      case 'resolved': return 'Resuelto';
      default: return status;
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="inline-flex items-center rounded-full bg-white p-1 shadow-sm">
          <img src={logo} alt="Logo Nueva Vida" className="h-12 w-12 rounded-full object-cover" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Panel de Trabajador</h1>
          <p className="text-sm text-muted-foreground">Gestiona y responde consultas de clientes.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Consultas Pendientes</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {inquiries.filter(i => i.status === 'pending').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">En Progreso</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {inquiries.filter(i => i.status === 'in-progress').length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resueltas</CardTitle>
              <Badge className="h-4 w-4 bg-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {inquiries.filter(i => i.status === 'resolved').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Solicitudes entrantes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {inquiries.map((inquiry) => {
                const takenByOther = inquiry.assignedTo && inquiry.assignedTo !== user?.id;
                return (
                  <div key={inquiry.id} className="border rounded-lg p-4 shadow-sm bg-white">
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <div className="space-y-1">
                        <h3 className="font-semibold text-lg">{inquiry.customerName}</h3>
                        <p className="text-sm text-muted-foreground">{inquiry.productTitle}</p>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/60 px-2 py-1">
                            <Mail className="h-3 w-3" /> {inquiry.customerEmail}
                          </span>
                          {inquiry.customerPhone && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/60 px-2 py-1">
                              <Phone className="h-3 w-3" /> {inquiry.customerPhone}
                            </span>
                          )}
                          {inquiry.sellerName && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-secondary/60 px-2 py-1">
                              Publicador: <span className="font-medium text-foreground">{inquiry.sellerName}</span>
                            </span>
                          )}
                          {inquiry.assignedToName && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-blue-700">
                              Asignada a: {inquiry.assignedToName}
                            </span>
                          )}
                          {"score" in inquiry && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-amber-700">
                              Prioridad: {(inquiry as any).score ?? 0}
                            </span>
                          )}
                          {"needLevel" in inquiry && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-emerald-700 capitalize">
                              Necesidad: {(inquiry as any).needLevel}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge className={getStatusColor(inquiry.status)}>
                          {getStatusText(inquiry.status)}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          Creada: {new Date(inquiry.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    {(() => {
                      const { cleanedText, imageUrl } = extractImageFromMessage(inquiry.message);
                      return (
                        <>
                          {cleanedText && (
                            <div className="rounded-md bg-secondary/40 p-3 text-sm text-foreground whitespace-pre-line break-words">
                              {cleanedText}
                            </div>
                          )}
                          {imageUrl && (
                            <div className="mt-2">
                              <p className="text-xs text-muted-foreground mb-1">Imagen del producto:</p>
                              <img
                                src={imageUrl}
                                alt={`Imagen de ${inquiry.productTitle}`}
                                className="w-full max-h-48 rounded-md border object-contain bg-white"
                                loading="lazy"
                              />
                            </div>
                          )}
                        </>
                      );
                    })()}

                    <div className="mt-3 flex flex-col gap-3">
                      {inquiry.status === 'pending' && (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            onClick={() => takeInquiry(inquiry)}
                            disabled={takenByOther}
                          >
                            {takenByOther ? "En gestión por otro" : "Tomar solicitud"}
                          </Button>
                        </div>
                      )}

                      {inquiry.status === 'in-progress' && (!takenByOther || inquiry.assignedTo === user?.id) && (
                        <>
                          <textarea
                            className="w-full rounded-md border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            rows={3}
                            placeholder="Mensaje al solicitante..."
                            value={replies[`${inquiry.id}-buyer`] || ""}
                            onChange={(e) => setReplies((prev) => ({ ...prev, [`${inquiry.id}-buyer`]: e.target.value }))}
                          />
                          <textarea
                            className="w-full rounded-md border border-gray-200 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            rows={2}
                            placeholder="Mensaje al publicador..."
                            value={replies[`${inquiry.id}-seller`] || ""}
                            onChange={(e) => setReplies((prev) => ({ ...prev, [`${inquiry.id}-seller`]: e.target.value }))}
                          />
                          <div className="flex flex-wrap gap-2">
                            <Button
                              size="sm"
                              onClick={() => sendReply(inquiry, 'buyer')}
                              className="inline-flex items-center gap-2"
                            >
                              <Send className="h-4 w-4" /> Enviar a solicitante
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={!inquiry.sellerId && !inquiry.sellerEmail}
                              onClick={() => sendReply(inquiry, 'seller')}
                              className="inline-flex items-center gap-2"
                            >
                              <Send className="h-4 w-4" /> Contactar publicador
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateInquiryStatus(inquiry.id, 'resolved')}
                              className="inline-flex items-center gap-2"
                            >
                              <CheckCircle2 className="h-4 w-4" /> Marcar resuelta
                            </Button>
                          </div>
                        </>
                      )}

                      {inquiry.status === 'resolved' && (
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-green-600">Solicitud terminada.</p>
                          <Link
                            to={`/mensajes?product=${inquiry.productId}&with=${inquiry.customerEmail || inquiry.buyerId || ''}`}
                            className="text-sm text-primary hover:underline"
                          >
                            Ver conversación
                          </Link>
                        </div>
                      )}

                      <div className="flex justify-between text-sm">
                        <Link
                          to={`/mensajes?product=${inquiry.productId}&with=${inquiry.customerEmail || inquiry.buyerId || ''}`}
                          className="text-primary hover:underline"
                        >
                          Abrir hilo en Mensajes
                        </Link>
                      </div>
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
const extractImageFromMessage = (text: string) => {
  const dataUrlMatch = text.match(/data:image[^\s)"]+/i);
  const httpImageMatch = text.match(/https?:\/\/\S+\.(png|jpe?g|webp|gif|svg)/i);
  const imageUrl = dataUrlMatch?.[0] || httpImageMatch?.[0] || null;

  if (!imageUrl) {
    return { cleanedText: text.trim(), imageUrl: null };
  }

  const cleanedText = text
    .split("\n")
    .filter((line) => !line.includes(imageUrl))
    .join("\n")
    .trim();

  return {
    cleanedText: cleanedText || "Solicitud con imagen adjunta.",
    imageUrl,
  };
};
