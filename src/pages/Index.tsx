import { useState, useMemo, useEffect } from "react";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import ProductCard from "@/components/ProductCard";
import CategoryFilter from "@/components/CategoryFilter";
import Footer from "@/components/Footer";
import { mockProducts, type Category, type Product } from "@/lib/mock-data";
import { fetchProducts } from "@/lib/products-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [allProducts, setAllProducts] = useState<Product[]>(mockProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "oldest">("newest");
  const [showFilters, setShowFilters] = useState(false);

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
  }, []);

  const filtered = useMemo(() => {
    let filteredProducts = allProducts.filter((p) => {
      // Filtros existentes
      if (selectedCategory && p.category !== selectedCategory) return false;
      // Solo permitimos donaciones/abonaciones
      if (!p.isGift) return false;

      // Nuevo filtro de búsqueda por texto
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(query);
        const matchesDescription = p.description.toLowerCase().includes(query);
        const matchesCategory = p.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDescription && !matchesCategory) return false;
      }

      // Filtro por ubicación
      if (locationFilter && !p.city.toLowerCase().includes(locationFilter.toLowerCase())) return false;

      // Solo productos activos y no vendidos
      if (p.status !== "active" || p.sold) return false;

      // Nuevo: solo mostrar productos disponibles (no en proceso ni entregados)
      const donationStatus = p.donationStatus || "disponible";
      if (donationStatus !== "disponible") return false;

      return true;
    });

    // Ordenamiento
    filteredProducts.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filteredProducts;
  }, [allProducts, selectedCategory, searchQuery, locationFilter, sortBy]);

  const clearFilters = () => {
    setSearchQuery("");
    setLocationFilter("");
    setSelectedCategory(null);
    setSortBy("newest");
  };

  const hasActiveFilters = searchQuery || locationFilter || selectedCategory;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />

      {/* Products Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex flex-col gap-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar productos, categorías..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4"
            />
          </div>

          {/* Filters Row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Sheet open={showFilters} onOpenChange={setShowFilters}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filtros
                    {hasActiveFilters && (
                      <span className="ml-1 h-2 w-2 rounded-full bg-primary"></span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Filtros avanzados</SheetTitle>
                    <SheetDescription>
                      Refina tu búsqueda con estos filtros
                    </SheetDescription>
                  </SheetHeader>

                  <div className="mt-6 space-y-6">
                    {/* Ubicación */}
                    <div className="space-y-2">
                      <Label htmlFor="location">Ubicación</Label>
                      <Input
                        id="location"
                        placeholder="Ej: Bogotá, Medellín..."
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                      />
                    </div>

                    {/* Ordenamiento */}
                    <div className="space-y-2">
                      <Label>Ordenar por</Label>
                      <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="newest">Más recientes</SelectItem>
                          <SelectItem value="oldest">Más antiguos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Limpiar filtros */}
                    {hasActiveFilters && (
                      <Button variant="outline" onClick={clearFilters} className="w-full gap-2">
                        <X className="h-4 w-4" />
                        Limpiar filtros
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <div className="text-sm text-muted-foreground">
              {filtered.length} resultado{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        <CategoryFilter selected={selectedCategory} onSelect={setSelectedCategory} />

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-20 text-center">
            <p className="text-lg text-muted-foreground">No se encontraron objetos con esos filtros.</p>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
};

export default Index;
