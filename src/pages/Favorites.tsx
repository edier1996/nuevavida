import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import ProductCard from "@/components/ProductCard";
import { mockProducts, type Product } from "@/lib/mock-data";
import { fetchProducts } from "@/lib/products-api";
import logo from "@/assets/logo.jpeg";

const Favorites = () => {
  const [allProducts, setAllProducts] = useState<Product[]>(mockProducts);
  const [favorites, setFavorites] = useState<string[]>([]);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const remoteProducts = await fetchProducts();
        setAllProducts(remoteProducts);
      } catch {
        setAllProducts(mockProducts);
      }
    };

    loadProducts();

    if (!isAuthenticated || !user) {
      setFavorites([]);
      return;
    }

    const favs = JSON.parse(localStorage.getItem(`favorites_${user.id}`) || "[]");
    setFavorites(Array.isArray(favs) ? favs : []);
  }, [isAuthenticated, user]);

  const favoriteProducts = useMemo(() => {
    return allProducts.filter(product => favorites.includes(product.id));
  }, [allProducts, favorites]);

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Acceso requerido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Debes iniciar sesión para ver tus favoritos.
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
          <div className="flex items-center gap-3">
            <Link to="/" className="inline-flex items-center rounded-full bg-white p-1 shadow-sm">
              <img src={logo} alt="Nueva Vida" className="h-10 w-10 rounded-full" />
            </Link>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">Mis favoritos</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Los objetos que has marcado como favoritos.
              </p>
            </div>
          </div>

          {favoriteProducts.length > 0 ? (
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              {favoriteProducts.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          ) : (
            <div className="mt-8 border border-dashed border-secondary p-10 text-center text-sm text-muted-foreground">
              <p>No tienes favoritos aún.</p>
              <Link
                to="/"
                className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
              >
                Explorar objetos
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
};

export default Favorites;
