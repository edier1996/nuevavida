import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Trash2, Minus, Plus, AlertCircle } from "lucide-react";

const Cart = () => {
  const { cart, cartTotal, removeFromCart, updateQuantity, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="container mx-auto px-4 py-16 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-amber-500" />
          <h1 className="mt-4 text-2xl font-semibold text-foreground">Inicia sesión</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Debes iniciar sesión para ver tu carrito.
          </p>
          <Link
            to="/login"
            className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            Iniciar sesión
          </Link>
        </section>
      </main>
    );
  }

  if (cart.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="container mx-auto px-4 py-16">
          <Link
            to="/explorar"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>

          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                🛒
              </div>
              <h1 className="text-2xl font-bold text-foreground">Tu carrito está vacío</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Explora nuestro catálogo y agrega productos a tu carrito
              </p>
              <Link
                to="/explorar"
                className="mt-6"
              >
                <Button>Explorar productos</Button>
              </Link>
            </CardContent>
          </Card>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="container mx-auto px-4 py-8">
        <Link
          to="/explorar"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-8">Tu Carrito</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Lista de productos */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <Card key={item.product.id}>
                <CardContent className="pt-6">
                  <div className="flex gap-4">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {item.product.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {item.product.city}
                      </p>
                      <p className="mt-2 font-mono font-bold text-primary">
                        ${item.product.price.toLocaleString()}
                      </p>
                    </div>

                    {/* Controles de cantidad */}
                    <div className="flex flex-col items-end gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFromCart(item.product.id)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-2 rounded-lg border border-input bg-muted p-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center font-semibold text-sm">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Subtotal</p>
                        <p className="font-bold text-foreground">
                          ${(item.product.price * item.quantity).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Resumen de compra */}
          <div className="lg:col-span-1">
            <Card className="sticky top-20 border-primary/20">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
                <CardTitle>Resumen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {/* Ítems */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Productos ({cart.length})</span>
                    <span className="font-semibold">
                      ${cartTotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Envío</span>
                    <span className="font-semibold text-amber-600">Calculado al comprar</span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Subtotal</span>
                    <span className="text-primary">
                      ${cartTotal.toLocaleString()}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    El costo del envío se calculará en el siguiente paso
                  </p>
                </div>

                {/* Botón de checkout */}
                <Button
                  onClick={() => {
                    if (cart.length === 0) {
                      alert("Tu carrito está vacío");
                      return;
                    }
                    navigate("/checkout-carrito");
                  }}
                  className="w-full mt-6"
                  size="lg"
                >
                  Ir a comprar ({cart.length} productos)
                </Button>

                {/* Botón vaciar carrito */}
                <Button
                  onClick={clearCart}
                  variant="outline"
                  className="w-full"
                  size="sm"
                >
                  Vaciar carrito
                </Button>
              </CardContent>
            </Card>

            {/* Info */}
            <Alert className="mt-4 border-blue-200 bg-blue-50">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-900 text-xs">
                <p className="font-semibold mb-1">💡 Tip:</p>
                Puedes seguir comprando y agregar más productos a tu carrito. Al finalizar, verás el costo total del envío.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Cart;
