import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { mockProducts, type Product } from "@/lib/mock-data";
import { fetchProducts, deleteProductById, updateProduct } from "@/lib/products-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Star,
  Package,
  Eye,
  Heart,
  Plus,
  Edit,
  Trash2,
  Calendar,
  DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";
import SecurityDashboard from "@/components/SecurityDashboard";
import logo from "@/assets/logo.jpeg";

interface DashboardStats {
  totalProducts: number;
  activeProducts: number;
  totalViews: number;
  totalLikes: number;
  totalMessages: number;
  averageRating: number;
  totalReviews: number;
  monthlyRevenue: number;
  weeklyViews: number;
  conversionRate: number;
}

interface ProductAnalytics {
  productId: string;
  title: string;
  views: number;
  likes: number;
  messages: number;
  reviews: number;
  averageRating: number;
  lastActivity: string;
}

const SellerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    activeProducts: 0,
    totalViews: 0,
    totalLikes: 0,
    totalMessages: 0,
    averageRating: 0,
    totalReviews: 0,
    monthlyRevenue: 0,
    weeklyViews: 0,
    conversionRate: 0
  });
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const [analytics, setAnalytics] = useState<ProductAnalytics[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;

    const loadSellerProducts = async () => {
      let sellerProducts: Product[] = [];
      try {
        const allRemoteProducts = await fetchProducts();
        sellerProducts = allRemoteProducts.filter((p) => p.sellerId === user.id);
      } catch {
        sellerProducts = [];
      }

      setUserProducts(sellerProducts);

      // Calcular estadísticas
      const totalProducts = sellerProducts.length;
      const activeProducts = sellerProducts.filter(p => p.status === "active").length;

      // Simular datos de analytics (en producción vendrían de una API)
      const mockAnalytics = sellerProducts.map(product => ({
        productId: product.id,
        title: product.title,
        views: Math.floor(Math.random() * 100) + 10,
        likes: Math.floor(Math.random() * 20) + 1,
        messages: Math.floor(Math.random() * 15) + 1,
        reviews: Math.floor(Math.random() * 8) + 1,
        averageRating: Math.round((Math.random() * 2 + 3) * 10) / 10,
        lastActivity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }));

      const totalViews = mockAnalytics.reduce((sum, a) => sum + a.views, 0);
      const totalLikes = mockAnalytics.reduce((sum, a) => sum + a.likes, 0);
      const totalMessages = mockAnalytics.reduce((sum, a) => sum + a.messages, 0);
      const totalReviews = mockAnalytics.reduce((sum, a) => sum + a.reviews, 0);
      const averageRating = totalReviews > 0
        ? mockAnalytics.reduce((sum, a) => sum + (a.averageRating * a.reviews), 0) / totalReviews
        : 0;

      setStats({
        totalProducts,
        activeProducts,
        totalViews,
        totalLikes,
        totalMessages,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        monthlyRevenue: sellerProducts.filter(p => !p.isGift).reduce((sum, p) => sum + (p.price || 0), 0) * 0.1, // Simulado
        weeklyViews: Math.floor(totalViews * 0.3),
        conversionRate: totalMessages > 0 ? Math.round((totalMessages / totalViews) * 100) : 0
      });

      setAnalytics(mockAnalytics);

      // Actividad reciente
      const messages = JSON.parse(localStorage.getItem("messages") || "[]");
      const sellerMessages = messages
        .filter((msg: any) => msg.to === user.id || msg.to === user.email)
        .slice(0, 5);
      setRecentActivity(sellerMessages);
    };

    loadSellerProducts();
  }, [user]);

  const deleteProduct = async (productId: string) => {
    try {
      await deleteProductById(productId);
      setUserProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch {
      return;
    }
  };

  const toggleProductStatus = async (productId: string) => {
    const target = userProducts.find((p) => p.id === productId);
    if (!target) return;

    const nextStatus = target.status === "active" ? "archived" : "active";

    try {
      const updated = await updateProduct(productId, { status: nextStatus });
      setUserProducts((prev) => prev.map((p) => (p.id === productId ? updated : p)));
    } catch {
      return;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold text-foreground mb-4">Acceso requerido</h1>
          <p className="text-muted-foreground">Debes iniciar sesión para acceder al dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to="/" className="inline-flex items-center rounded-full bg-white p-1 shadow-sm">
              <img src={logo} alt="Nueva Vida" className="h-10 w-10 rounded-full" />
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-foreground">Dashboard de Vendedor</h1>
              <p className="text-muted-foreground">Bienvenido de vuelta, {user.name}</p>
            </div>
          </div>
          <Link to="/publicar">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nuevo producto
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Productos</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalProducts}</p>
                  <p className="text-xs text-green-600">{stats.activeProducts} activos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Eye className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Vistas totales</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalViews}</p>
                  <p className="text-xs text-blue-600">+{stats.weeklyViews} esta semana</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Mensajes</p>
                  <p className="text-2xl font-bold text-foreground">{stats.totalMessages}</p>
                  <p className="text-xs text-orange-600">{stats.conversionRate}% conversión</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Calificación</p>
                  <p className="text-2xl font-bold text-foreground">{stats.averageRating}</p>
                  <p className="text-xs text-muted-foreground">{stats.totalReviews} reseñas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="products" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="products">Productos</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="activity">Actividad</TabsTrigger>
            <TabsTrigger value="performance">Rendimiento</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
          </TabsList>

          {/* Products Tab */}
          <TabsContent value="products" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Mis Productos</CardTitle>
              </CardHeader>
              <CardContent>
                {userProducts.length === 0 ? (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No tienes productos publicados</h3>
                    <p className="text-muted-foreground mb-4">Comienza publicando tu primer producto para llegar a más compradores.</p>
                    <Link to="/publicar">
                      <Button>Publicar primer producto</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userProducts.map((product) => (
                      <div key={product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-foreground">{product.title}</h4>
                          <p className="text-sm text-muted-foreground">{product.city}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={product.isGift ? "secondary" : "default"}>
                              {product.isGift ? "Regalo" : `$${product.price?.toLocaleString()}`}
                            </Badge>
                            <Badge variant={product.status === "active" ? "default" : "secondary"}>
                              {product.status === "active" ? "Activo" : "Pausado"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleProductStatus(product.id)}
                          >
                            {product.status === "active" ? "Pausar" : "Activar"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Productos más vistos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics
                      .sort((a, b) => b.views - a.views)
                      .slice(0, 5)
                      .map((item) => (
                        <div key={item.productId} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-foreground truncate">{item.title}</p>
                            <p className="text-sm text-muted-foreground">{item.views} vistas</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{item.messages} mensajes</p>
                            <p className="text-xs text-muted-foreground">{item.likes} likes</p>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mejores calificaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analytics
                      .sort((a, b) => b.averageRating - a.averageRating)
                      .slice(0, 5)
                      .map((item) => (
                        <div key={item.productId} className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-foreground truncate">{item.title}</p>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                              <span className="text-sm">{item.averageRating}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground">{item.reviews} reseñas</p>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Actividad Reciente</CardTitle>
              </CardHeader>
              <CardContent>
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay actividad reciente</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-4 p-4 border rounded-lg">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{activity.subject}</p>
                          <p className="text-sm text-muted-foreground">{activity.content}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(activity.timestamp).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        {!activity.read && (
                          <Badge variant="destructive" className="text-xs">Nuevo</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Rendimiento General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Tasa de conversión</span>
                      <span>{stats.conversionRate}%</span>
                    </div>
                    <Progress value={stats.conversionRate} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Productos activos</span>
                      <span>{stats.activeProducts}/{stats.totalProducts}</span>
                    </div>
                    <Progress
                      value={stats.totalProducts > 0 ? (stats.activeProducts / stats.totalProducts) * 100 : 0}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Calificación promedio</span>
                      <span>{stats.averageRating}/5</span>
                    </div>
                    <Progress value={(stats.averageRating / 5) * 100} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Estadísticas del Mes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Ingresos estimados</span>
                    </div>
                    <span className="font-medium">${stats.monthlyRevenue.toLocaleString()}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Vistas semanales</span>
                    </div>
                    <span className="font-medium">{stats.weeklyViews}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-600" />
                      <span className="text-sm">Mensajes este mes</span>
                    </div>
                    <span className="font-medium">{stats.totalMessages}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">Nuevas reseñas</span>
                    </div>
                    <span className="font-medium">{stats.totalReviews}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <SecurityDashboard />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SellerDashboard;