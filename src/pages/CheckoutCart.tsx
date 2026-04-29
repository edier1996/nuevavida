import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
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
import { ArrowLeft, CheckCircle2, AlertCircle, Loader2, Package } from "lucide-react";

const CheckoutCart = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { cart, clearCart } = useCart();
  const { createTransaction } = useTransactions();
  const [allProducts] = useState<Product[]>([...mockProducts, ...JSON.parse(localStorage.getItem("products") || "[]")]);

  // Formulario
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

  // Redirigir si no está autenticado o el carrito está vacío
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login?redirect=/carrito");
      return;
    }
    if (cart.length === 0) {
      navigate("/carrito");
    }
  }, [isAuthenticated, cart.length, navigate]);

  if (!isAuthenticated || cart.length === 0) {
    return null;
  }

  // Calcular totales
  const cartSubtotal = cart.reduce((total, item) => total + item.product.price * item.quantity, 0);
  const platformCommission = shippingInfo?.platformCommission || 0;
  const totalPrice = cartSubtotal + (shippingInfo?.totalShippingCost || 0);

  // Obtener la ciudad del primer producto para calcular envío
  const fromCity = cart.length > 0 ? cart[0].product.city : "";

  const handleShippingCalculated = (data: any) => {
    setShippingInfo(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

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
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Crear transacción para cada producto
      const createdTransactions: string[] = [];

      for (const item of cart) {
        const transactionId = `TXN-${Date.now()}-${item.product.id}`;

        // Calcular envío prorraeteado si hay múltiples productos
        const itemShippingCost = Math.round(shippingInfo.baseCost / cart.length);
        const itemPlatformCommission = Math.round(itemShippingCost * 0.5);

        const shippingData: ShippingInfo = {
          id: `SHIP-${Date.now()}-${item.product.id}`,
          transactionId,
          sellerId: item.product.sellerId || item.product.sellerName,
          buyerId: user!.id,
          productId: item.product.id,
          pickupCity: item.product.city,
          pickupAddress: "Dirección del vendedor",
          deliveryCity,
          deliveryAddress,
          estimatedDistanceKm: shippingInfo.estimatedDays * 200,
          baseCostPerKm: 0,
          baseCost: itemShippingCost,
          platformCommission: itemPlatformCommission,
          totalShippingCost: itemShippingCost + itemPlatformCommission,
          estimatedDeliveryDays: shippingInfo.estimatedDays,
          estimatedDeliveryDate: new Date(
            Date.now() + shippingInfo.estimatedDays * 24 * 60 * 60 * 1000
          ).toISOString(),
          timestamps: {
            created: new Date().toISOString(),
            paid: new Date().toISOString(),
          },
        };

        const itemPrice = item.product.price * item.quantity;
        const platformSalesCommission = Math.round(itemPrice * 0.05);

        const transaction: Transaction = {
          id: transactionId,
          productId: item.product.id,
          sellerId: item.product.sellerId || item.product.sellerName,
          buyerId: user!.id,
          productTitle: item.product.title,
          productPrice: itemPrice,
          shippingBaseCost: itemShippingCost,
          platformShippingCommission: itemPlatformCommission,
          platformSalesCommission,
          totalPrice: itemPrice + itemShippingCost + itemPlatformCommission,
          sellerReceives: itemPrice - platformSalesCommission,
          platformEarns: itemPlatformCommission + platformSalesCommission,
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

        createTransaction(transaction);
        createdTransactions.push(transactionId);

        // Marcar producto como vendido
        const products = JSON.parse(localStorage.getItem("products") || "[]");
        const updatedProducts = products.map((p: Product) =>
          p.id === item.product.id ? { ...p, sold: true, status: "sold", purchasedBy: user!.id, transactionId } : p
        );
        localStorage.setItem("products", JSON.stringify(updatedProducts));
      }

      setSuccess(true);
      clearCart();

      // Redirigir a primera orden creada
      setTimeout(() => {
        navigate(`/order-confirmation/${createdTransactions[0]}`);
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
          to="/carrito"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al carrito
        </Link>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Formulario */}
          <div className="lg:col-span-2 space-y-6">
            {/* Productos a comprar */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Productos ({cart.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{item.product.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">Cantidad: {item.quantity}</p>
                      <p className="font-mono font-bold text-primary mt-1">
                        ${(item.product.price * item.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
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
                fromCity={fromCity}
                productPrice={cartSubtotal}
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
                      <span className="text-muted-foreground">Productos ({cart.length}):</span>
                      <span className="font-mono font-semibold">
                        ${cartSubtotal.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Envío base:</span>
                      <span className="font-mono font-semibold">
                        ${shippingInfo.baseCost.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between text-primary">
                      <span className="font-medium">Comisión envío (50%):</span>
                      <span className="font-mono font-semibold">
                        ${platformCommission.toLocaleString()}
                      </span>
                    </div>

                    <div className="border-t pt-3">
                      <div className="flex justify-between text-lg font-bold">
                        <span>TOTAL:</span>
                        <span className="text-primary">
                          ${totalPrice.toLocaleString()}
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
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Confirmar y pagar
                      </>
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

export default CheckoutCart;
