import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { categories, type Category } from "@/lib/mock-data";
import { createProduct } from "@/lib/products-api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, X } from "lucide-react";

const Publish = () => {
  const MAX_IMAGES = 5;
  const MAX_TOTAL_IMAGE_BYTES = 3 * 1024 * 1024;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("otros");
  const [city, setCity] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [error, setError] = useState("");
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const compressImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          const maxWidth = 1280;
          const maxHeight = 1280;

          let { width, height } = img;
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");

          if (!ctx) {
            reject(new Error("No se pudo procesar la imagen"));
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          // Use JPEG compression to keep SQL payloads smaller.
          const compressed = canvas.toDataURL("image/jpeg", 0.72);
          resolve(compressed);
        };
        img.onerror = reject;
        img.src = reader.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const estimateBase64Bytes = (dataUrl: string): number => {
    const base64 = dataUrl.split(",")[1] || "";
    return Math.floor((base64.length * 3) / 4);
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const currentCount = images.length;
    const remainingSlots = MAX_IMAGES - currentCount;

    if (files.length > remainingSlots) {
      setError(`Solo puedes subir hasta ${MAX_IMAGES} imágenes. Has seleccionado ${files.length} pero solo quedan ${remainingSlots} espacios disponibles.`);
      return;
    }

    setError("");

    try {
      const newImages: string[] = [];
      let totalBytes = images.reduce((acc, img) => acc + estimateBase64Bytes(img), 0);

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 8 * 1024 * 1024) {
          setError(`La imagen ${file.name} es demasiado grande. Máximo 8MB por imagen.`);
          return;
        }

        const base64 = await compressImageToBase64(file);
        const imageBytes = estimateBase64Bytes(base64);

        if (imageBytes > 1 * 1024 * 1024) {
          setError(`La imagen ${file.name} sigue siendo muy pesada tras comprimir. Usa una imagen más liviana.`);
          return;
        }

        totalBytes += imageBytes;
        if (totalBytes > MAX_TOTAL_IMAGE_BYTES) {
          setError("Las imágenes superan el tamaño máximo permitido para publicar. Reduce cantidad o peso.");
          return;
        }

        newImages.push(base64);
      }

      setImages([...images, ...newImages]);
    } catch (error) {
      setError("Error al procesar las imágenes. Inténtalo de nuevo.");
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Acceso requerido</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Debes iniciar sesión para publicar un objeto.
          </p>
          <Link to="/login" className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Iniciar sesión
          </Link>
        </section>
      </main>
    );
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (!title || !description || !city) {
      setError("Por favor completa todos los campos requeridos.");
      return;
    }

    if (images.length === 0) {
      setError("Debes subir al menos una imagen del producto.");
      return;
    }

    const newProduct = {
      title,
      description,
      category,
      price: 0,
      isGift: true,
      condition: "bueno" as const,
      images,
      city,
      sellerId: user!.id,
      sellerEmail: user!.email,
      sellerName: user!.name,
      sellerAvatar: "",
      status: "active" as const,
      donationStatus: "disponible" as const,
      sold: false,
      commission: 0,
    };

    try {
      await createProduct(newProduct);
      alert("¡Publicación creada exitosamente como donación/abonación!");
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo publicar en la base de datos SQL. Intenta de nuevo en unos segundos.");
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl rounded-xl bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-foreground">Publicar un objeto</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Completa los datos para publicar en la plataforma. Todas las publicaciones son donaciones o entregas por abonación; no se permiten ventas ni precios.
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* Imágenes */}
            <div className="space-y-4">
              <Label className="text-sm font-medium text-foreground">
                Imágenes del producto *
              </Label>
              <div className="grid gap-4">
                {/* Input de archivos */}
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:border-primary/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-muted-foreground" />
                      <p className="mb-2 text-sm text-muted-foreground">
                        <span className="font-semibold">Haz clic para subir</span> o arrastra y suelta
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG, GIF hasta 5MB (máximo 5 imágenes)
                      </p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Preview de imágenes */}
                {images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {images.map((image, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={image}
                          alt={`Imagen ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-medium text-foreground">
                Título *
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej: Cama en buen estado"
                required
              />
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-foreground">
                Descripción *
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el estado, medidas y cualquier detalle relevante"
                className="h-24 resize-none"
                required
              />
            </div>

            {/* Categoría y Ciudad */}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium text-foreground">
                  Categoría
                </Label>
                <Select value={category} onValueChange={(value) => setCategory(value as Category)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="city" className="text-sm font-medium text-foreground">
                  Ciudad *
                </Label>
                <Input
                  id="city"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Ej: Bogotá"
                  required
                />
              </div>
            </div>

            {/* Botones */}
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between pt-4">
              <Button type="submit" className="w-full md:w-auto">
                Publicar
              </Button>
              <Link
                to="/"
                className="w-full text-center text-sm font-medium text-muted-foreground hover:text-foreground md:w-auto"
              >
                Volver al inicio
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
};

export default Publish;
