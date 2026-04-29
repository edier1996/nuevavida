import React, { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTransactions } from "@/contexts/TransactionContext";
import { mockProducts, type Product } from "@/lib/mock-data";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Star,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";

type PurchaseFilter = "all" | "pending" | "delivered" | "cancelled";

const MyPurchases = () => {
  const { user, isAuthenticated } = useAuth();
  const { transactions } = useTransactions();
  const [allProducts] = useState<Product[]>([...mockProducts, ...JSON.parse(localStorage.getItem("products") || "[]")]);

  const [filterStatus, setFilterStatus] = useState<PurchaseFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Obtener compras del usuario actual
  const userPurchases = useMemo(() => {
    return transactions.filter((t) => t.buyerId === user?.id);
  }, [transactions, user?.id]);

  // Filtrar y buscar
  const filteredPurchases = useMemo(() => {
    let result = userPurchases;

    // Filtrar por estado
    if (filterStatus !== "all") {
      if (filterStatus === "pending") {
        result = result.filter((t) => ["pending", "paid", "seller_contacted", "picked_up", "in_transit"].includes(t.status));
      } else if (filterStatus === "delivered") {
        result = result.filter((t) => t.status === "delivered");
      } else if (filterStatus === "cancelled") {
        result = result.filter((t) => t.status === "cancelled");
      }
    }

    // Buscar por nombre de producto
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter((t) =>
        t.productTitle.toLowerCase().includes(query)
      );
    }

    return result;
  }, [userPurchases, filterStatus, searchQuery]);

  // Obtener producto para mostrar más detalles
  const getProduct = (productId: string) => {
    return allProducts.find((p) => p.id === productId);
  };

  // Mapeo de estados a iconos y colores
  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { icon: React.ReactNode; label: string; color: string; bgColor: string }> = {
      pending: { icon: <Clock className="h-4 w-4" />, label: "Pendiente de pago", color: "text-yellow-600", bgColor: "bg-yellow-50 border-yellow-200" },
      paid: { icon: <CheckCircle2 className="h-4 w-4" />, label: "Pago confirmado", color: "text-green-600", bgColor: "bg-green-50 border-green-200" },
      seller_contacted: { icon: <AlertCircle className="h-4 w-4" />, label: "Contactando vendedor", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
      picked_up: { icon: <Package className="h-4 w-4" />, label: "Recogido", color: "text-blue-600", bgColor: "bg-blue-50 border-blue-200" },
      in_transit: { icon: <Truck className="h-4 w-4" />, label: "En camino", color: "text-orange-600", bgColor: "bg-orange-50 border-orange-200" },
      delivered: { icon: <CheckCircle2 className="h-4 w-4" />, label: "Entregado", color: "text-green-600", bgColor: "bg-green-50 border-green-200" },
      cancelled: { icon: <AlertCircle className="h-4 w-4" />, label: "Cancelado", color: "text-red-600", bgColor: "bg-red-50 border-red-200" },
    };
    return statusMap[status] || statusMap.pending;
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background">
        <Header />
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Acceso requerido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Debes iniciar sesión para ver tus compras.
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

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <section className="container mx-auto px-4 py-8">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Mis Compras</h1>
          <p className="mt-2 text-muted-foreground">
            Aquí puedes ver todas tus compras y rastrear tus envíos
          </p>
        </div>

        {/* Filtros */}
        <Card className="mb-6 border-primary/20">
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-3">
              {/* Búsqueda */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-foreground">Buscar por nombre</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Buscar en mis compras..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Estado */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Estado</label>
                <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as PurchaseFilter)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas las compras</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="delivered">Entregadas</SelectItem>
                    <SelectItem value="cancelled">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de compras */}
        {filteredPurchases.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Package className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">
                {userPurchases.length === 0 ? "Aún no tienes compras" : "No hay compras con ese filtro"}
              </p>
              <Link
                to="/explorar"
                className="mt-4 text-sm text-primary hover:underline"
              >
                Explorar productos
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredPurchases.map((transaction) => {
              const product = getProduct(transaction.productId);
              const statusInfo = getStatusInfo(transaction.status);

              return (
                <Card key={transaction.id} className={`border ${statusInfo.bgColor} transition-all hover:shadow-md`}>
                  <CardContent className="pt-6">
                    <div className="grid gap-6 md:grid-cols-2">
                      {/* Información del producto */}
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          {product && (
                            <img
                              src={product.images[0]}
                              alt={transaction.productTitle}
                              className="h-24 w-24 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-foreground line-clamp-2">
                              {transaction.productTitle}
                            </h3>
                            {product && (
                              <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {product.city}
                              </p>
                            )}
                            <p className="mt-2 font-mono font-bold text-primary">
                              ${transaction.productPrice.toLocaleString()}
                            </p>
                          </div>
                        </div>

                        {/* Número de orden */}
                        <div className="text-xs text-muted-foreground">
                          Orden: <span className="font-mono font-semibold">{transaction.id}</span>
                        </div>
                      </div>

                      {/* Estado y acciones */}
                      <div className="space-y-4">
                        {/* Estado */}
                        <div>
                          <p className="mb-2 text-xs text-muted-foreground">ESTADO</p>
                          <div className={`flex items-center gap-2 rounded-lg p-3 ${statusInfo.bgColor}`}>
                            <div className={statusInfo.color}>
                              {statusInfo.icon}
                            </div>
                            <span className={`font-semibold text-sm ${statusInfo.color}`}>
                              {statusInfo.label}
                            </span>
                          </div>
                        </div>

                        {/* Fechas */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="text-muted-foreground">Comprado</p>
                            <p className="font-semibold text-foreground">
                              {new Date(transaction.timestamps.created).toLocaleDateString("es-CO")}
                            </p>
                          </div>
                          {transaction.shipping?.estimatedDeliveryDate && (
                            <div>
                              <p className="text-muted-foreground">Entrega estimada</p>
                              <p className="font-semibold text-foreground">
                                {new Date(transaction.shipping.estimatedDeliveryDate).toLocaleDateString("es-CO")}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Botones */}
                        <div className="flex gap-2 pt-2">
                          <Link
                            to={`/order-confirmation/${transaction.id}`}
                            className="flex-1"
                          >
                            <Button variant="outline" size="sm" className="w-full">
                              Ver detalles
                            </Button>
                          </Link>
                          <Link
                            to="/mensajes"
                            className="flex-1"
                          >
                            <Button variant="outline" size="sm" className="w-full">
                              Contactar
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>

                    {/* Timeline de envío si existe */}
                    {transaction.shipping && (
                      <div className="mt-6 border-t pt-4">
                        <p className="mb-3 text-xs font-semibold text-muted-foreground">PROGRESO DEL ENVÍO</p>
                        <div className="flex items-center justify-between text-xs">
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${transaction.status === "paid" || transaction.statusHistory.some(h => h.status === "paid") ? "bg-green-600 text-white" : "bg-gray-200"}`}>
                            ✓
                          </div>
                          <div className={`h-0.5 flex-1 ${transaction.status === "picked_up" || transaction.statusHistory.some(h => h.status === "picked_up") ? "bg-green-600" : "bg-gray-200"}`} />
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${transaction.status === "picked_up" || transaction.statusHistory.some(h => h.status === "picked_up") ? "bg-green-600 text-white" : "bg-gray-200"}`}>
                            📦
                          </div>
                          <div className={`h-0.5 flex-1 ${transaction.status === "in_transit" || transaction.statusHistory.some(h => h.status === "in_transit") ? "bg-green-600" : "bg-gray-200"}`} />
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${transaction.status === "in_transit" || transaction.statusHistory.some(h => h.status === "in_transit") ? "bg-green-600 text-white" : "bg-gray-200"}`}>
                            🚚
                          </div>
                          <div className={`h-0.5 flex-1 ${transaction.status === "delivered" ? "bg-green-600" : "bg-gray-200"}`} />
                          <div className={`flex h-8 w-8 items-center justify-center rounded-full ${transaction.status === "delivered" ? "bg-green-600 text-white" : "bg-gray-200"}`}>
                            ✓
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                          <span>Pagado</span>
                          <span>Recogido</span>
                          <span>En tránsito</span>
                          <span>Entregado</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Información de ayuda */}
        {userPurchases.length > 0 && (
          <Alert className="mt-8 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-900 text-sm">
              <p className="font-semibold mb-1">💡 Tip:</p>
              Puedes contactar al vendedor desde aquí si tienes preguntas sobre tu compra.
            </AlertDescription>
          </Alert>
        )}
      </section>
    </main>
  );
};

export default MyPurchases;
