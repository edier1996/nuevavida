import React, { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useTransactions } from "@/contexts/TransactionContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Calendar,
  Package,
  Truck,
  Clock,
  Copy,
  ArrowRight,
} from "lucide-react";

const OrderConfirmation = () => {
  const { id } = useParams<{ id: string }>();
  const { transactions } = useTransactions();

  const transaction = useMemo(() => transactions.find((t) => t.id === id), [transactions, id]);

  if (!transaction) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Orden no encontrada</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Parece que el número de orden que buscas no existe.
          </p>
          <Link
            to="/"
            className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Volver al inicio
          </Link>
        </section>
      </main>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="container mx-auto px-4 py-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al inicio
        </Link>

        {/* Success Banner */}
        <div className="mb-8 rounded-lg border-2 border-green-200 bg-green-50 p-6 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
          <h1 className="mt-4 text-3xl font-bold text-green-900">¡Compra confirmada!</h1>
          <p className="mt-2 text-green-700">
            Tu pedido ha sido procesado correctamente. Tu envío será preparado próximamente.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Información principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Número de orden */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-lg">Información de la orden</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-white p-4">
                  <p className="text-sm text-muted-foreground">Número de orden</p>
                  <div className="mt-2 flex items-center justify-between gap-3">
                    <p className="font-mono text-lg font-bold text-foreground">{transaction.id}</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(transaction.id)}
                      className="gap-2"
                    >
                      <Copy className="h-4 w-4" />
                      Copiar
                    </Button>
                  </div>
                </div>

                {transaction.shipping?.trackingNumber && (
                  <div className="rounded-lg bg-white p-4">
                    <p className="text-sm text-muted-foreground">Número de seguimiento</p>
                    <p className="mt-2 font-mono font-semibold">{transaction.shipping.trackingNumber}</p>
                  </div>
                )}

                <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Fecha de pedido</p>
                    <p className="mt-1 font-semibold text-foreground">
                      {new Date(transaction.timestamps.created).toLocaleDateString("es-CO")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Estado</p>
                    <Badge className="mt-1" variant="default">
                      {transaction.status === "paid" ? "Pagado" : transaction.status}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Producto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Producto</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="font-semibold text-foreground">{transaction.productTitle}</p>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="text-muted-foreground">Precio:</span>
                    <span className="font-mono font-semibold">
                      ${transaction.productPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información de envío */}
            {transaction.shipping && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Truck className="h-5 w-5" />
                    Información de envío
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-lg bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-primary mt-1" />
                      <div>
                        <p className="text-xs text-muted-foreground">Enviar a</p>
                        <p className="font-semibold text-foreground">
                          {transaction.shipping.deliveryCity}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {transaction.shipping.deliveryAddress}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-start gap-3">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Fecha estimada</p>
                        <p className="font-semibold text-foreground">
                          {new Date(transaction.shipping.estimatedDeliveryDate || "").toLocaleDateString(
                            "es-CO"
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-xs text-muted-foreground">Tiempo estimado</p>
                        <p className="font-semibold text-foreground">
                          {transaction.shipping.estimatedDeliveryDays} día(s)
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline de estados */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Historial de estados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transaction.statusHistory.map((entry, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="h-3 w-3 rounded-full bg-primary" />
                        {index < transaction.statusHistory.length - 1 && (
                          <div className="mt-2 w-0.5 h-12 bg-primary/20" />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="font-semibold text-foreground capitalize">
                          {entry.status.replace(/_/g, " ")}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(entry.timestamp).toLocaleString("es-CO")}
                        </p>
                        {entry.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{entry.notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Próximos pasos */}
            <Alert className="border-blue-200 bg-blue-50">
              <Clock className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-sm">
                <p className="font-semibold mb-2">¿Qué sigue?</p>
                <ul className="list-disc pl-5 space-y-1 text-xs">
                  <li>El vendedor será notificado para recoger el paquete</li>
                  <li>Recibirás un correo con el número de seguimiento</li>
                  <li>Podrás rastrear tu envío en tiempo real</li>
                  <li>Si tienes preguntas, contacta al vendedor a través de mensajes</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>

          {/* Resumen de costos */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 border-primary/20">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
                <CardTitle className="text-lg">Resumen de costos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Producto:</span>
                    <span className="font-mono font-semibold">
                      ${transaction.productPrice.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Envío base:</span>
                    <span className="font-mono font-semibold">
                      ${transaction.shippingBaseCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-primary">
                    <span className="font-medium">Comisión envío:</span>
                    <span className="font-mono font-semibold">
                      ${transaction.platformShippingCommission.toLocaleString()}
                    </span>
                  </div>

                  <div className="border-t pt-3">
                    <div className="flex justify-between text-lg font-bold">
                      <span>TOTAL PAGADO:</span>
                      <span className="text-primary">
                        ${transaction.totalPrice.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="border-t pt-3 space-y-2 text-xs">
                    <p className="text-muted-foreground">
                      La plataforma recibe: ${transaction.platformEarns.toLocaleString()}
                    </p>
                    <p className="text-muted-foreground">
                      El vendedor recibe: ${transaction.sellerReceives.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <Link
                    to="/mensajes"
                    className="w-full"
                  >
                    <Button variant="outline" className="w-full gap-2" size="sm">
                      Contactar vendedor
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Link
                    to="/"
                    className="w-full"
                  >
                    <Button className="w-full gap-2" size="sm">
                      Seguir comprando
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
};

export default OrderConfirmation;
