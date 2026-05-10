import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Trash2, Users, UserPlus, ClipboardList, CheckCircle2, Clock3, BarChart3 } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { Link } from "react-router-dom";
import { getRequests, updateRequestStatus, type ProductRequest } from "@/lib/requests";
import { deleteAdminUserFromDatabase, fetchAdminUserStats, fetchAdminUsers, type AdminUserRecord } from "@/lib/user-api";
import { updateProduct } from "@/lib/products-api";
import { sendMessage as sendMessageApi } from "@/lib/messaging-api";

const AdminDashboard = () => {
  const { user, createUser } = useAuth();
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    address: '',
    role: 'user' as 'admin' | 'worker' | 'user'
  });
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [roleStats, setRoleStats] = useState({ admin: 0, worker: 0, user: 0 });
  const [requests, setRequests] = useState<ProductRequest[]>([]);

  if (!user || user.role !== 'admin') {
    return <div>No tienes permisos para acceder a esta pagina.</div>;
  }

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const [usersResponse, statsResponse] = await Promise.all([
          fetchAdminUsers(),
          fetchAdminUserStats(),
        ]);
        setUsers(usersResponse.users);
        setTotalUsers(statsResponse.totalUsers);
        setRoleStats(statsResponse.totalByRole);
      } catch (err) {
        toast({
          title: "Error al cargar usuarios",
          description:
            err instanceof Error
              ? err.message
              : "No se pudieron cargar los usuarios reales desde la base de datos.",
          variant: "destructive",
        });
      }
    };

    void loadUsers();
  }, []);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const data = await getRequests();
        setRequests(data);
      } catch (err) {
        toast({
          title: "Error al cargar solicitudes",
          description:
            err instanceof Error
              ? err.message
              : "No se pudieron cargar las solicitudes. Intenta nuevamente.",
          variant: "destructive",
        });
      }
    };
    loadRequests();
  }, []);

  const handleCreateUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos.",
        variant: "destructive",
      });
      return;
    }

    const result = await createUser(
      newUser.name,
      newUser.email,
      newUser.password,
      newUser.phone,
      newUser.city,
      newUser.address,
      newUser.role
    );

    if (result.success) {
      try {
        const [usersResponse, statsResponse] = await Promise.all([
          fetchAdminUsers(),
          fetchAdminUserStats(),
        ]);
        setUsers(usersResponse.users);
        setTotalUsers(statsResponse.totalUsers);
        setRoleStats(statsResponse.totalByRole);
      } catch {
        // noop: el usuario ya fue creado, la recarga se puede intentar luego.
      }

      toast({
        title: "Usuario creado",
        description: "El usuario ha sido creado exitosamente.",
      });
      setNewUser({
        name: '',
        email: '',
        password: '',
        phone: '',
        city: '',
        address: '',
        role: 'user'
      });
    } else {
      const rawError = result.error || "";
      let description: string;
      if (rawError.toLowerCase().includes("already exists") || rawError.toLowerCase().includes("ya existe")) {
        description = "El email ya está registrado. Usa otro correo electrónico.";
      } else if (
        rawError.toLowerCase().includes("fetch") ||
        rawError.toLowerCase().includes("network") ||
        rawError.toLowerCase().includes("failed to fetch") ||
        rawError.toLowerCase().includes("connect")
      ) {
        description = "No se pudo conectar al servidor. Verifica la conexión e inténtalo de nuevo.";
      } else if (rawError) {
        description = rawError;
      } else {
        description = "No se pudo crear el usuario. Verifica que el email no esté en uso.";
      }
      toast({
        title: "Error",
        description,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteAdminUserFromDatabase(userId);
      const [usersResponse, statsResponse] = await Promise.all([
        fetchAdminUsers(),
        fetchAdminUserStats(),
      ]);
      setUsers(usersResponse.users);
      setTotalUsers(statsResponse.totalUsers);
      setRoleStats(statsResponse.totalByRole);
      toast({
        title: "Usuario eliminado",
        description: "El total de usuarios fue recalculado con la base de datos actual.",
      });
    } catch (err) {
      toast({
        title: "Error al eliminar usuario",
        description:
          err instanceof Error ? err.message : "No se pudo eliminar el usuario.",
        variant: "destructive",
      });
    }
  };

  const handleSelectRequest = async (id: string) => {
    try {
      const req = requests.find((r) => r.id === id);
      if (!req) {
        throw new Error("No se encontro la solicitud seleccionada.");
      }

      const competitors = requests.filter(
        (r) =>
          r.productId === req.productId &&
          r.id !== req.id &&
          r.status !== "rejected" &&
          r.status !== "delivered"
      );

      await updateRequestStatus(id, "selected");

      for (const competitor of competitors) {
        await updateRequestStatus(competitor.id, "rejected");
      }

      const refreshed = await getRequests();
      setRequests(refreshed);

      if (req?.productId) {
        try {
          await updateProduct(req.productId, { donationStatus: "en_proceso" });
        } catch {
          // No bloquear el flujo si falla la actualización del producto
        }
      }

      try {
        await sendMessageApi({
          participantIds: [user.id, req.requesterId],
          senderId: user.id,
          senderName: user.name,
          content: `Tu solicitud para "${req.productTitle}" fue seleccionada como beneficiaria. Pronto coordinaremos la entrega.`,
          productId: req.productId,
          orderId: req.id,
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

      toast({
        title: "Beneficiario seleccionado",
        description: "Se selecciono un beneficiario, se cerraron las demas solicitudes y se envio una notificacion.",
      });
    } catch (err) {
      toast({
        title: "Error al seleccionar beneficiario",
        description:
          err instanceof Error
            ? err.message
            : "No se pudo actualizar el estado. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const handleMarkDelivered = async (id: string) => {
    try {
      const req = requests.find((r) => r.id === id);
      if (!req) {
        throw new Error("No se encontro la solicitud para marcar como entregada.");
      }

      const updated = await updateRequestStatus(id, "delivered");
      setRequests(updated);
      if (req?.productId) {
        await updateProduct(req.productId, {
          donationStatus: "entregado",
          sold: true,
          status: "sold",
        });
      }

      try {
        await sendMessageApi({
          participantIds: [user.id, req.requesterId],
          senderId: user.id,
          senderName: user.name,
          content: `Tu solicitud para "${req.productTitle}" ya fue marcada como entregada. Gracias por ser parte de Nueva Vida.`,
          productId: req.productId,
          orderId: req.id,
        });
      } catch {
        // Non-blocking notification failure.
      }

      toast({
        title: "Entrega cerrada",
        description: "El producto se marco como entregado y el solicitante fue notificado.",
      });
    } catch (err) {
      toast({
        title: "Error al marcar entrega",
        description:
          err instanceof Error
            ? err.message
            : "No se pudo actualizar el estado. Intenta nuevamente.",
        variant: "destructive",
      });
    }
  };

  const statusLabel = (status: ProductRequest["status"]) => {
    switch (status) {
      case "pending": return "Pendiente";
      case "in_review": return "En revisión";
      case "selected": return "Seleccionado";
      case "delivered": return "Entregado";
      case "rejected": return "Rechazado";
      default: return status;
    }
  };

  const requestStats = useMemo(() => {
    const total = requests.length;
    const pending = requests.filter((r) => r.status === "pending").length;
    const inReview = requests.filter((r) => r.status === "in_review").length;
    const selected = requests.filter((r) => r.status === "selected").length;
    const delivered = requests.filter((r) => r.status === "delivered").length;
    const rejected = requests.filter((r) => r.status === "rejected").length;
    const open = pending + inReview + selected;

    const highNeed = requests.filter((r) => r.needLevel === "alta").length;
    const mediumNeed = requests.filter((r) => r.needLevel === "media").length;
    const lowNeed = requests.filter((r) => r.needLevel === "baja").length;

    const deliveryRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

    return {
      total,
      pending,
      inReview,
      selected,
      delivered,
      rejected,
      open,
      highNeed,
      mediumNeed,
      lowNeed,
      deliveryRate,
    };
  }, [requests]);

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="inline-flex items-center rounded-full bg-white p-1 shadow-sm">
          <img src={logo} alt="Logo Nueva Vida" className="h-12 w-12 rounded-full object-cover" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Panel de Administracion</h1>
          <p className="text-sm text-muted-foreground">Gestiona usuarios y roles de la plataforma.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Rendimiento de la plataforma
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Resumen en tiempo real de registros, solicitudes y entregas.
            </p>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Personas registradas</p>
                <p className="mt-2 text-2xl font-bold">{totalUsers}</p>
              </div>
              <div className="rounded-xl border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Solicitudes montadas</p>
                <p className="mt-2 text-2xl font-bold">{requestStats.total}</p>
              </div>
              <div className="rounded-xl border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Entregas realizadas</p>
                <p className="mt-2 text-2xl font-bold text-emerald-700">{requestStats.delivered}</p>
              </div>
              <div className="rounded-xl border bg-background p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Peticiones pendientes</p>
                <p className="mt-2 text-2xl font-bold text-amber-700">{requestStats.open}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border p-4">
                <p className="mb-3 text-sm font-semibold">Solicitudes por estado</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between"><span>Pendientes</span><Badge variant="secondary">{requestStats.pending}</Badge></div>
                  <div className="flex items-center justify-between"><span>En revisión</span><Badge variant="secondary">{requestStats.inReview}</Badge></div>
                  <div className="flex items-center justify-between"><span>Seleccionadas</span><Badge variant="secondary">{requestStats.selected}</Badge></div>
                  <div className="flex items-center justify-between"><span>Entregadas</span><Badge variant="outline">{requestStats.delivered}</Badge></div>
                  <div className="flex items-center justify-between"><span>Rechazadas</span><Badge variant="secondary">{requestStats.rejected}</Badge></div>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <p className="mb-3 text-sm font-semibold">Usuarios por rol</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between"><span>Administradores</span><Badge variant="secondary">{roleStats.admin}</Badge></div>
                  <div className="flex items-center justify-between"><span>Trabajadores</span><Badge variant="secondary">{roleStats.worker}</Badge></div>
                  <div className="flex items-center justify-between"><span>Usuarios</span><Badge variant="secondary">{roleStats.user}</Badge></div>
                </div>
              </div>

              <div className="rounded-xl border p-4">
                <p className="mb-3 text-sm font-semibold">Detalle operativo</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-4 w-4 text-emerald-700" /> Tasa de entrega</span>
                    <span className="font-semibold">{requestStats.deliveryRate}%</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4 text-amber-700" /> En cola</span>
                    <span className="font-semibold">{requestStats.open}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1"><ClipboardList className="h-4 w-4 text-sky-700" /> Necesidad alta</span>
                    <span className="font-semibold">{requestStats.highNeed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Necesidad media</span>
                    <span className="font-semibold">{requestStats.mediumNeed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Necesidad baja</span>
                    <span className="font-semibold">{requestStats.lowNeed}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Crear Nuevo Usuario
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nombre</Label>
                <Input
                  id="name"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Nombre completo"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="correo@ejemplo.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Contrasena</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="Contrasena segura"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefono</Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  placeholder="Numero de telefono"
                />
              </div>
              <div>
                <Label htmlFor="city">Ciudad</Label>
                <Input
                  id="city"
                  value={newUser.city}
                  onChange={(e) => setNewUser({...newUser, city: e.target.value})}
                  placeholder="Ciudad"
                />
              </div>
              <div>
                <Label htmlFor="address">Direccion</Label>
                <Input
                  id="address"
                  value={newUser.address}
                  onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                  placeholder="Direccion completa"
                />
              </div>
              <div>
                <Label htmlFor="role">Rol</Label>
                <Select value={newUser.role} onValueChange={(value: 'admin' | 'worker' | 'user') => setNewUser({...newUser, role: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar rol" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">Usuario</SelectItem>
                    <SelectItem value="worker">Trabajador</SelectItem>
                    <SelectItem value="admin">Administrador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={handleCreateUser} className="w-full">
              Crear Usuario
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Gestion de Usuarios
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Total actual en base de datos: <span className="font-semibold text-foreground">{totalUsers}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.length === 0 ? (
              <p className="text-muted-foreground">No hay usuarios registrados aun.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-3">Nombre</th>
                      <th className="py-2 pr-3">Email</th>
                      <th className="py-2 pr-3">Rol</th>
                      <th className="py-2 pr-3">Telefono</th>
                      <th className="py-2 pr-3">Ciudad</th>
                      <th className="py-2 pr-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="py-2 pr-3">{u.name || "-"}</td>
                        <td className="py-2 pr-3">{u.email}</td>
                        <td className="py-2 pr-3 capitalize">{u.role}</td>
                        <td className="py-2 pr-3">{u.phone || "-"}</td>
                        <td className="py-2 pr-3">{u.city || "-"}</td>
                        <td className="py-2 pr-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={u.id === user.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Solicitudes de productos (prioridad)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {requests.length === 0 ? (
              <p className="text-muted-foreground">No hay solicitudes registradas.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-3">Producto</th>
                      <th className="py-2 pr-3">Solicitante</th>
                      <th className="py-2 pr-3">Necesidad</th>
                      <th className="py-2 pr-3">Puntaje</th>
                      <th className="py-2 pr-3">Estado</th>
                      <th className="py-2 pr-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {[...requests]
                      .sort((a, b) => {
                        const order = ["pending", "in_review", "selected", "delivered", "rejected"];
                        const diff = order.indexOf(a.status) - order.indexOf(b.status);
                        if (diff !== 0) return diff;
                        return b.score - a.score;
                      })
                      .map((req) => (
                        <tr key={req.id}>
                          <td className="py-2 pr-3">
                            <div className="font-medium">{req.productTitle}</div>
                            <p className="text-xs text-muted-foreground">{req.productCity || "Ciudad no indicada"}</p>
                          </td>
                          <td className="py-2 pr-3">
                            <div className="font-medium">{req.requesterName}</div>
                            <p className="text-xs text-muted-foreground">{req.requesterEmail}</p>
                          </td>
                          <td className="py-2 pr-3 capitalize">{req.needLevel}</td>
                          <td className="py-2 pr-3">
                            <Badge variant="secondary">#{req.score}</Badge>
                          </td>
                          <td className="py-2 pr-3">
                            <Badge variant={req.status === "selected" ? "default" : req.status === "delivered" ? "outline" : "secondary"}>
                              {statusLabel(req.status)}
                            </Badge>
                          </td>
                          <td className="py-2 pr-3 text-right space-x-2">
                            <Button
                              size="sm"
                              onClick={() => handleSelectRequest(req.id)}
                              disabled={req.status !== "pending" && req.status !== "in_review"}
                            >
                              Seleccionar
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleMarkDelivered(req.id)}
                              disabled={req.status !== "selected"}
                            >
                              Marcar entregado
                            </Button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;


