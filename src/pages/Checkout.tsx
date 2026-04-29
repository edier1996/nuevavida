import React, { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactions } from "@/contexts/TransactionContext";
import { mockProducts, type Product } from "@/lib/mock-data";
import { calculateShippingCost } from "@/lib/transactions";
import { Transaction, ShippingInfo } from "@/lib/transactions";
import Header from "@/components/Header";
import ShippingCalculator from "@/components/ShippingCalculator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const Checkout = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { createTransaction } = useTransactions();

  const [allProducts] = useState<Product[]>([...mockProducts, ...JSON.parse(localStorage.getItem("products") || "[]")]);
  const product = useMemo(() => allProducts.find((p) => p.id === id), [allProducts, id]);

  // Formulario de envío
  const [deliveryCity, setDeliveryCity] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [buyerNotes, setBuyerNotes] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  // Información de envío
  const [shippingInfo, setShippingInfo] = useState<{
    baseCost: number;
    platformCommission: number;
    totalShippingCost: number;
    estimatedDays: number;
  } | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

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

  const notifyWorker = (
    transactionId: string,
    buyerNotesText: string
  ) => {
    if (!product || !user) return;

    const storedUsers = JSON.parse(localStorage.getItem("users") || "[]");
    const workerUser = storedUsers.find((u: any) => u.role === "worker");
    const workerId = workerUser?.id ?? "worker-1";
    const workerName = workerUser?.name ?? "Soporte";

    const messages = JSON.parse(localStorage.getItem("messages") || "[]");
    const now = new Date().toISOString();

    messages.push({
      id: `${Date.now()}-buyer-worker`,
      from: user!.id,
      to: workerId,
      fromName: user!.name,
      toName: workerName,
      productId: product.id,
      subject: `Nueva solicitud de compra: ${product.title}`,
      content: `El comprador ${user!.name} (${user!.email}) confirmó la compra.\nCiudad de entrega: ${deliveryCity}\nDirección: ${deliveryAddress}${buyerNotesText ? `\nNotas: ${buyerNotesText}` : ""}\n\nID de transacción: ${transactionId}`,
      timestamp: now,
      read: false,
    });

    messages.push({
      id: `${Date.now()}-worker-seller`,
      from: workerId,
      to: product.sellerId || product.sellerName,
      fromName: workerName,
      toName: product.sellerName,
      productId: product.id,
      subject: `Compra en curso de "${product.title}"`,
      content: `Tenemos una solicitud confirmada del comprador ${user!.name} (${user!.email}).\nCiudad de entrega: ${deliveryCity}\nDirección: ${deliveryAddress}${buyerNotesText ? `\nNotas del comprador: ${buyerNotesText}` : ""}\n\nID de transacción: ${transactionId}.`,
      timestamp: now,
      read: false,
    });

    persistMessages(messages);

    const existingInquiries = JSON.parse(localStorage.getItem("worker_inquiries") || "[]");
    const newInquiry = {
      id: transactionId,
      transactionId,
      buyerId: user!.id,
      customerName: user!.name,
      customerEmail: user!.email,
      customerPhone: user!.phone,
      productId: product.id,
      productTitle: product.title,
      message: buyerNotesText || "Compra confirmada pendiente de coordinación.",
      status: "pending",
      createdAt: now,
      sellerId: product.sellerId || product.sellerName,
      sellerName: product.sellerName,
      sellerEmail: product.sellerEmail,
    };

    const updatedInquiries = [
      newInquiry,
      ...existingInquiries.filter((inq: any) => inq.id !== transactionId),
    ];

    localStorage.setItem("worker_inquiries", JSON.stringify(updatedInquiries));
  };

  // Redirigir si no está autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/checkout/${id}`);
    }
  }, [isAuthenticated, navigate, id]);

  if (!isAuthenticated) {
    return null;
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Producto no encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">El producto que intentas comprar no existe o ya fue retirado.</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>
        </section>
      </main>
    );
  }

  if (product.isGift) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
          <h1 className="mt-4 text-2xl font-semibold text-foreground">Este es un regalo gratis</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Este producto se gestiona como donación. Usa el botón “Solicitar” en el detalle para que el equipo de la plataforma coordine la entrega.
          </p>
          <Link
            to={`/producto/${id}`}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al producto
          </Link>
        </section>
      </main>
    );
  }

  const handleShippingCalculated = (data: any) => {
    setShippingInfo(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validaciones
    if (!deliveryCity) {
      setError("Debes seleccionar una ciudad de entrega.");
      return;
    }

    if (!deliveryAddress.trim()) {
      setError("Debes ingresar una dirección de entrega.");
      return;
    }

    if (!shippingInfo) {
      setError("Debes calcular el costo de envío.");
      return;
    }

    if (!acceptTerms) {
      setError("Debes aceptar los términos y condiciones.");
      return;
    }

    setIsProcessing(true);

    try {
      // Simular delay de procesamiento de pago
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Crear transacción
      const transactionId = `TXN-${Date.now()}`;
      const shippingData: ShippingInfo = {
        id: `SHIP-${Date.now()}`,
        transactionId,
        sellerId: product.sellerId || product.sellerName,
        buyerId: user!.id,
        productId: product.id,
        pickupCity: product.city,
        pickupAddress: "Dirección del vendedor", // En producción, obtendrías esta de la BD
        deliveryCity,
        deliveryAddress,
        estimatedDistanceKm: shippingInfo.estimatedDays * 200, // Aproximación
        baseCostPerKm: 0,
        baseCost: shippingInfo.baseCost,
        platformCommission: shippingInfo.platformCommission,
        totalShippingCost: shippingInfo.totalShippingCost,
        estimatedDeliveryDays: shippingInfo.estimatedDays,
        estimatedDeliveryDate: new Date(Date.now() + shippingInfo.estimatedDays * 24 * 60 * 60 * 1000).toISOString(),
        timestamps: {
          created: new Date().toISOString(),
          paid: new Date().toISOString(),
        },
      };

      const totalPrice = product.price + shippingInfo.totalShippingCost;
      const platformEarnings = shippingInfo.platformCommission + Math.round(product.price * 0.05);
      const sellerEarnings = product.price - Math.round(product.price * 0.05);

      const transaction: Transaction = {
        id: transactionId,
        productId: product.id,
        sellerId: product.sellerId || product.sellerName,
        buyerId: user!.id,
        productTitle: product.title,
        productPrice: product.price,
        shippingBaseCost: shippingInfo.baseCost,
        platformShippingCommission: shippingInfo.platformCommission,
        platformSalesCommission: Math.round(product.price * 0.05),
        totalPrice,
        sellerReceives: sellerEarnings,
        platformEarns: platformEarnings,
        status: "paid",
        shipping: shippingData,
        statusHistory: [
          {
            status: "pending",
            timestamp: new Date(Date.now() - 1000).toISOString(),
            notes: "Transacción creada",
            changedBy: "system",
          },
          {
            status: "paid",
            timestamp: new Date().toISOString(),
            notes: "Pago confirmado",
            changedBy: "buyer",
          },
        ],
        timestamps: {
          created: new Date(Date.now() - 1000).toISOString(),
          updated: new Date().toISOString(),
        },
        buyerNotes,
      };

      // Guardar transacción
      createTransaction(transaction);

      // Avisar al trabajador/intermediario con los datos del pedido
      notifyWorker(transactionId, buyerNotes.trim());

      // Actualizar estado del producto
      const products = JSON.parse(localStorage.getItem("products") || "[]");
      const updatedProducts = products.map((p: Product) =>
        p.id === product.id ? { ...p, sold: true, status: "sold", purchasedBy: user!.id, transactionId } : p
      );
      localStorage.setItem("products", JSON.stringify(updatedProducts));

      setSuccess(true);

      // Redirigir a confirmación después de 2 segundos
      setTimeout(() => {
        navigate(`/order-confirmation/${transactionId}`);
      }, 2000);
    } catch (err) {
      setError("Error al procesar la compra. Intenta nuevamente.");
      console.error(err);
      setIsProcessing(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="container mx-auto px-4 py-8">
        <Link
          to={`/producto/${id}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al producto
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Formulario */}
          <div className="lg:col-span-2 space-y-6">
            {/* Producto */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Producto</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-4">
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="h-24 w-24 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">{product.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{product.description}</p>
                  <p className="mt-2 font-mono text-lg font-bold text-primary">
                    ${product.price.toLocaleString()}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Formulario de envío */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Información de entrega</CardTitle>
                <CardDescription>Donde deseas que llegue tu compra</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="deliveryCity" className="text-sm font-medium">
                    Ciudad de destino *
                  </Label>
                  <input
                    id="deliveryCity"
                    type="text"
                    value={deliveryCity}
                    onChange={(e) => setDeliveryCity(e.target.value)}
                    placeholder="Ej: Cali"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deliveryAddress" className="text-sm font-medium">
                    Dirección completa *
                  </Label>
                  <Textarea
                    id="deliveryAddress"
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Ej: Calle 123 #45-67, Apartamento 8B"
                    className="h-24 resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="buyerNotes" className="text-sm font-medium">
                    Notas especiales (opcional)
                  </Label>
                  <Textarea
                    id="buyerNotes"
                    value={buyerNotes}
                    onChange={(e) => setBuyerNotes(e.target.value)}
                    placeholder="Ej: Puerta con código, horario disponible, etc."
                    className="h-20 resize-none"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Calculadora de envío */}
            {deliveryCity && (
              <ShippingCalculator
                fromCity={product.city}
                productPrice={product.price}
                onShippingCalculated={handleShippingCalculated}
              />
            )}

            {/* Términos */}
            <div className="flex items-start space-x-3 rounded-lg border border-input p-4">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 h-4 w-4 cursor-pointer accent-primary"
              />
              <label htmlFor="acceptTerms" className="cursor-pointer text-sm text-muted-foreground">
                Acepto los{" "}
                <Link to="/terminos" className="text-primary hover:underline">
                  términos y condiciones
                </Link>{" "}
                y confirmo que he leído la{" "}
                <Link to="/privacidad" className="text-primary hover:underline">
                  política de privacidad
                </Link>
                . Entiendo que seré cobrado por el envío incluyendo la comisión de la plataforma.
              </label>
            </div>

            {/* Errores */}
            {error && (
              <Alert className="border-destructive bg-destructive/10">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-destructive">{error}</AlertDescription>
              </Alert>
            )}

            {/* Éxito */}
            {success && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-900">
                  ¡Compra confirmada! Redirigiendo a confirmación...
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Resumen */}
          {shippingInfo && (
            <div className="lg:col-span-1">
              <Card className="sticky top-4 border-primary/20">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
                  <CardTitle className="text-lg">Resumen de compra</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Producto:</span>
                      <span className="font-mono font-semibold">
                        ${product.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Envío base:</span>
                      <span className="font-mono font-semibold">
                        ${shippingInfo.baseCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-primary">
                      <span className="font-medium">Comisión envío:</span>
                      <span className="font-mono font-semibold">
                        ${shippingInfo.platformCommission.toLocaleString()}
                      </span>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>TOTAL:</span>
                        <span className="text-primary">
                          ${(product.price + shippingInfo.totalShippingCost).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={
                      isProcessing ||
                      !deliveryCity ||
                      !deliveryAddress ||
                      !shippingInfo ||
                      !acceptTerms
                    }
                    className="w-full"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Confirmar y pagar"
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground pt-2">
                    Entrega estimada en {shippingInfo.estimatedDays} día(s)
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Checkout;
