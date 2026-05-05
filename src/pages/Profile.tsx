import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ProductCard from "@/components/ProductCard";
import { mockProducts, type Product } from "@/lib/mock-data";
import { fetchProducts } from "@/lib/products-api";
import logo from "@/assets/logo.jpeg";

const Profile = () => {
  const [allProducts, setAllProducts] = useState<Product[]>(mockProducts);
  const [userProducts, setUserProducts] = useState<Product[]>([]);
  const { user, isAuthenticated, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", phone: "", city: "", address: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const remoteProducts = await fetchProducts();
        setAllProducts(remoteProducts);
        if (user) {
          setUserProducts(remoteProducts.filter((p: Product) => p.sellerId === user.id));
        }
      } catch {
        setAllProducts(mockProducts);
        if (user) {
          setUserProducts(mockProducts.filter((p: Product) => p.sellerId === user.id));
        }
      }
    };

    loadProducts();
  }, [user]);

  void allProducts;

  const openEdit = () => {
    setEditForm({
      name: user?.name || "",
      phone: user?.phone || "",
      city: user?.city || "",
      address: user?.address || "",
    });
    setEditError("");
    setIsEditing(true);
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    const result = await updateUser(editForm);
    setEditLoading(false);
    if (result.success) {
      setIsEditing(false);
    } else {
      setEditError(result.error || "Error al guardar los cambios");
    }
  };

  const soldProducts = useMemo(() => {
    return userProducts.filter(product => product.sold);
  }, [userProducts]);

  const totalCommission = useMemo(() => {
    return soldProducts.reduce((total, product) => total + (product.commission || 0), 0);
  }, [soldProducts]);

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Acceso requerido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Debes iniciar sesión para ver tu perfil.
          </p>
          <Link to="/login" className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Iniciar sesión
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-6xl">
          {/* Header / cover */}
          <div className="relative mb-12">
            <div className="h-44 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />
            <div className="absolute left-6 right-6 bottom-0 flex flex-col gap-6 translate-y-1/2 md:flex-row md:items-end md:justify-between">
              <div className="flex items-end gap-6">
                <div className="relative">
                  <div className="h-28 w-28 rounded-full border-4 border-white bg-white shadow-lg overflow-hidden">
                    <img src={logo} alt="Avatar" className="h-full w-full object-cover" />
                  </div>
                  <div className="absolute -bottom-2 right-0">
                    <button
                      onClick={openEdit}
                      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold text-foreground shadow-sm hover:bg-gray-100"
                    >
                      Editar perfil
                    </button>
                  </div>
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{user?.name}</h1>
                  <p className="text-sm text-muted-foreground">
                    {user?.email}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    {user?.city && <span className="rounded-full bg-white/40 px-3 py-1">{user.city}</span>}
                    {user?.phone && <span className="rounded-full bg-white/40 px-3 py-1">{user.phone}</span>}
                    <span className="rounded-full bg-white/40 px-3 py-1">{userProducts.length} publicaciones</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  to="/publicar"
                  className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
                >
                  + Publicar
                </Link>
                <Link
                  to="/favoritos"
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-gray-100"
                >
                  Favoritos
                </Link>
                <Link
                  to="/mensajes"
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-gray-100"
                >
                  Mensajes
                </Link>
                <Link
                  to="/mis-solicitudes"
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-foreground shadow-sm hover:bg-gray-100"
                >
                  Mis solicitudes
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-secondary bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">Información</h2>
                {!isEditing && (
                  <button onClick={openEdit} className="text-xs text-primary hover:underline">Editar</button>
                )}
              </div>

              {isEditing ? (
                <form onSubmit={handleEditSave} className="mt-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Nombre</label>
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Teléfono</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Ciudad</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Dirección</label>
                    <input
                      type="text"
                      value={editForm.address}
                      onChange={e => setEditForm(f => ({ ...f, address: e.target.value }))}
                      className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {editError && <p className="text-xs text-red-500">{editError}</p>}
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="flex-1 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                    >
                      {editLoading ? "Guardando..." : "Guardar"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 rounded-lg bg-secondary px-3 py-2 text-sm font-semibold text-foreground hover:bg-secondary/80"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Nombre</span>
                  <span>{user?.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Email</span>
                  <span>{user?.email}</span>
                </div>
                {user?.phone && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Teléfono</span>
                    <span>{user.phone}</span>
                  </div>
                )}
                {user?.city && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Ciudad</span>
                    <span>{user.city}</span>
                  </div>
                )}
                {user?.address && (
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Dirección</span>
                    <span>{user.address}</span>
                  </div>
                )}
              </div>
              )}
            </div>

            <div className="rounded-2xl border border-secondary bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Estadísticas</h2>
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Publicaciones</span>
                  <span>{userProducts.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Regalos</span>
                  <span>{userProducts.filter(p => p.isGift).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Ventas activas</span>
                  <span>{userProducts.filter(p => !p.isGift && !p.sold).length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-medium">Vendidos</span>
                  <span>{soldProducts.length}</span>
                </div>
                {totalCommission > 0 && (
                  <div className="flex items-center justify-between text-green-600">
                    <span className="font-medium">Comisión</span>
                    <span>${totalCommission.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-secondary bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground">Acciones rápidas</h2>
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  to="/publicar"
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
                >
                  Publicar un objeto
                </Link>
                <Link
                  to="/favoritos"
                  className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary/90"
                >
                  Ver favoritos
                </Link>
                <Link
                  to="/mensajes"
                  className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary/90"
                >
                  Ver mensajes
                </Link>
                <Link
                  to="/mis-solicitudes"
                  className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary/90"
                >
                  Ver mis solicitudes
                </Link>
              </div>
            </div>
          </div>

          {userProducts.length > 0 && (
            <div className="mt-12">
              <h2 className="text-xl font-semibold text-foreground">Mis publicaciones</h2>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {userProducts.map((product, i) => (
                  <ProductCard key={product.id} product={product} index={i} />
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Profile;
