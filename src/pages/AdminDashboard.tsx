import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { Trash2, Users, UserPlus } from "lucide-react";
import logo from "@/assets/logo.jpeg";
import { Link } from "react-router-dom";
import { getRequests, updateRequestStatus, type ProductRequest } from "@/lib/requests";
import { deleteAdminUserFromDatabase, fetchAdminUserStats, fetchAdminUsers, type AdminUserRecord } from "@/lib/user-api";
import { updateProduct } from "@/lib/products-api";

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
  const [requests, setRequests] = useState<ProductRequest[]>([]);

  if (!user || user.role !== 'admin') {
    return <div>No tienes permisos para acceder a esta pÃ¡gina.</div>;
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
      const updated = await updateRequestStatus(id, "selected");
      setRequests(updated);
      if (req?.productId) {
        try {
          await updateProduct(req.productId, { donationStatus: "en_proceso" });
        } catch {
          // No bloquear el flujo si falla la actualización del producto
        }
      }
      toast({
        title: "Beneficiario seleccionado",
        description: "Se bloquearon nuevas solicitudes y el producto quedó en proceso de entrega.",
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
      const updated = await updateRequestStatus(id, "delivered");
      setRequests(updated);
      if (req?.productId) {
        await updateProduct(req.productId, {
          donationStatus: "entregado",
          sold: true,
          status: "sold",
        });
      }
      toast({
        title: "Entrega cerrada",
        description: "El producto quedó marcado como entregado y se quitó de la página principal.",
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/" className="inline-flex items-center rounded-full bg-white p-1 shadow-sm">
          <img src={logo} alt="Logo Nueva Vida" className="h-12 w-12 rounded-full object-cover" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Panel de AdministraciÃ³n</h1>
          <p className="text-sm text-muted-foreground">Gestiona usuarios y roles de la plataforma.</p>
        </div>
      </div>

      <div className="grid gap-6">
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
                <Label htmlFor="password">ContraseÃ±a</Label>
                <Input
                  id="password"
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  placeholder="ContraseÃ±a segura"
                />
              </div>
              <div>
                <Label htmlFor="phone">TelÃ©fono</Label>
                <Input
                  id="phone"
                  value={newUser.phone}
                  onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                  placeholder="NÃºmero de telÃ©fono"
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
                <Label htmlFor="address">DirecciÃ³n</Label>
                <Input
                  id="address"
                  value={newUser.address}
                  onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                  placeholder="DirecciÃ³n completa"
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
              GestiÃ³n de Usuarios
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Total actual en base de datos: <span className="font-semibold text-foreground">{totalUsers}</span>
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            {users.length === 0 ? (
              <p className="text-muted-foreground">No hay usuarios registrados aÃºn.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="py-2 pr-3">Nombre</th>
                      <th className="py-2 pr-3">Email</th>
                      <th className="py-2 pr-3">Rol</th>
                      <th className="py-2 pr-3">TelÃ©fono</th>
                      <th className="py-2 pr-3">Ciudad</th>
                      <th className="py-2 pr-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td className="py-2 pr-3">{u.name || "â€”"}</td>
                        <td className="py-2 pr-3">{u.email}</td>
                        <td className="py-2 pr-3 capitalize">{u.role}</td>
                        <td className="py-2 pr-3">{u.phone || "â€”"}</td>
                        <td className="py-2 pr-3">{u.city || "â€”"}</td>
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


