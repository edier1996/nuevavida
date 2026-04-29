import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { mockProducts, type Category, type Product } from "@/lib/mock-data";
import { fetchProducts } from "@/lib/products-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Grid, List } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const Explore = () => {
  const [allProducts, setAllProducts] = useState<Product[]>(mockProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category | "all">("all");
  const [searchParams] = useSearchParams();
  const [locationFilter, setLocationFilter] = useState("");
  const [conditionFilter, setConditionFilter] = useState<"all" | "nuevo" | "bueno" | "regular">("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "relevance">("relevance");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

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

    const categoryQuery = searchParams.get("category");
    if (categoryQuery) {
      setSelectedCategory((categoryQuery as Category) ?? "all");
    }
  }, [searchParams]);

  const filteredAndSorted = useMemo(() => {
    let filteredProducts = allProducts.filter((p) => {
      // Solo productos activos y no vendidos
      if (p.status !== "active" || p.sold) return false;

      // Búsqueda por texto
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesDescription = p.description.toLowerCase().includes(query);
        const matchesCategory = p.category.toLowerCase().includes(query);
        const matchesSeller = p.sellerName.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription && !matchesCategory && !matchesSeller) return false;
      }

      // Filtros
      if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
      // Solo donaciones/abonaciones
      if (!p.isGift) return false;
      if (locationFilter && !p.city.toLowerCase().includes(locationFilter.toLowerCase())) return false;
      if (conditionFilter !== "all" && p.condition !== conditionFilter) return false;

      return true;
    });

    // Ordenamiento
    filteredProducts.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "relevance":
          // Para relevancia, priorizar productos con más matches en búsqueda
          if (searchQuery) {
            const aScore = (a.title.toLowerCase().includes(searchQuery.toLowerCase()) ? 3 : 0) +
                          (a.description.toLowerCase().includes(searchQuery.toLowerCase()) ? 2 : 0) +
                          (a.category.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0);
            const bScore = (b.title.toLowerCase().includes(searchQuery.toLowerCase()) ? 3 : 0) +
                          (b.description.toLowerCase().includes(searchQuery.toLowerCase()) ? 2 : 0) +
                          (b.category.toLowerCase().includes(searchQuery.toLowerCase()) ? 1 : 0);
            return bScore - aScore;
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filteredProducts;
  }, [allProducts, searchQuery, selectedCategory, locationFilter, conditionFilter, sortBy]);

  // Paginación
  const totalPages = Math.ceil(filteredAndSorted.length / itemsPerPage);
  const paginatedProducts = filteredAndSorted.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setLocationFilter("");
    setConditionFilter("all");
    setSortBy("relevance");
    setCurrentPage(1);
  };

  const hasActiveFilters = searchQuery || selectedCategory !== "all" ||
                          locationFilter || conditionFilter !== "all";

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Explora miles de objetos
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Encuentra lo que necesitas o regala lo que ya no usas
            </p>

            {/* Search Bar Principal */}
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="¿Qué estás buscando?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-12 pl-12 pr-4 text-lg"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Filters Section */}
      <section className="border-b bg-card/50 py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Filtros principales */}
            <div className="flex flex-wrap items-center gap-3">
              <Select value={selectedCategory} onValueChange={(value: any) => setSelectedCategory(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Categoría" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las categorías</SelectItem>
                  <SelectItem value="hogar">Hogar</SelectItem>
                  <SelectItem value="tecnologia">Tecnología</SelectItem>
                  <SelectItem value="muebles">Muebles</SelectItem>
                  <SelectItem value="ropa">Ropa</SelectItem>
                  <SelectItem value="electrodomesticos">Electrodomésticos</SelectItem>
                  <SelectItem value="otros">Otros</SelectItem>
                </SelectContent>
              </Select>

              <Select value={conditionFilter} onValueChange={(value: any) => setConditionFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="nuevo">Nuevo</SelectItem>
                  <SelectItem value="bueno">Bueno</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" size="sm" className="gap-2">
                <MapPin className="h-4 w-4" />
                Ubicación
              </Button>
            </div>

            {/* Controles de vista y ordenamiento */}
            <div className="flex items-center gap-3">
              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">Más relevantes</SelectItem>
                  <SelectItem value="newest">Más recientes</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex rounded-lg border">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </div>
          </div>

          {/* Filtros activos */}
          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Filtros activos:</span>
              {searchQuery && (
                <Badge variant="secondary" className="gap-1">
                  "{searchQuery}"
                  <button onClick={() => setSearchQuery("")} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
              {selectedCategory !== "all" && (
                <Badge variant="secondary" className="gap-1">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory("all")} className="ml-1 hover:text-destructive">×</button>
                </Badge>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      <section className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">
              {filteredAndSorted.length} resultado{filteredAndSorted.length !== 1 ? 's' : ''} encontrado{filteredAndSorted.length !== 1 ? 's' : ''}
            </h2>
            {searchQuery && (
              <p className="text-sm text-muted-foreground">
                para "{searchQuery}"
              </p>
            )}
          </div>
        </div>

        {paginatedProducts.length > 0 ? (
          <>
            <div className={`grid gap-6 ${
              viewMode === "grid"
                ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                : "grid-cols-1"
            }`}>
              {paginatedProducts.map((product, i) => (
                viewMode === "grid" ? (
                  <ProductCard key={product.id} product={product} index={i} />
                ) : (
                  <Card key={product.id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex gap-4 p-4">
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className="h-24 w-24 rounded-lg object-cover"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-foreground line-clamp-1">
                                {product.title}
                              </h3>
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {product.description}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge variant="secondary">Donación</Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {product.city}
                            </div>
                            <Link
                              to={`/producto/${product.id}`}
                              className="text-primary hover:underline"
                            >
                              Ver detalles →
                            </Link>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              ))}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="mt-12 flex justify-center">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>

                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    if (pageNum > totalPages) return null;

                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="mx-auto max-w-md">
              <Search className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold text-foreground">
                No se encontraron resultados
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Intenta ajustar tus filtros o buscar con otros términos.
              </p>
              <Button onClick={clearFilters} className="mt-4">
                Limpiar filtros
              </Button>
            </div>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Explore;
