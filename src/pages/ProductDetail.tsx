import { useMemo, useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { mockProducts, type Product } from "@/lib/mock-data";
import { fetchProducts } from "@/lib/products-api";
import { addRequest, type NeedLevel } from "@/lib/requests";
import { Button } from "@/components/ui/button";
import { MessageCircle, ChevronLeft, ChevronRight, X, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import ProductReviews from "@/components/ProductReviews";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

interface StoredMessage {
  id?: string;
  from: string;
  to: string;
  fromName?: string;
  toName?: string;
  productId: string;
  subject?: string;
  content: string;
  image?: string;
  timestamp?: string;
  read?: boolean;
}

const PLATFORM_USER_ID = "platform";
const PLATFORM_USER_NAME = "Nueva Vida (Plataforma)";

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [allProducts, setAllProducts] = useState<Product[]>(mockProducts);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reason, setReason] = useState("");
  const [intendedUse, setIntendedUse] = useState("");
  const [pickupWindow, setPickupWindow] = useState("");
  const [extraNotes, setExtraNotes] = useState("");
  const [needLevel, setNeedLevel] = useState<NeedLevel>("alta");
  const [householdSize, setHouseholdSize] = useState("");
  const [evidence, setEvidence] = useState<string | null>(null);
  const [requesterCity, setRequesterCity] = useState("");
  const [acceptPolicy, setAcceptPolicy] = useState(false);
  const [formError, setFormError] = useState("");

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

  useEffect(() => {
    if (user?.city) {
      setRequesterCity(user.city);
    }
  }, [user]);

  const product = useMemo(() => allProducts.find((p) => p.id === id), [allProducts, id]);
  const donationStatus = product?.donationStatus ?? "disponible";

  const handleEvidenceUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setFormError("La evidencia supera los 5MB. Sube una imagen más ligera.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setEvidence(reader.result as string);
    reader.onerror = () => setFormError("No pudimos leer el archivo. Intenta nuevamente.");
    reader.readAsDataURL(file);
  };

  const submitRequest = async () => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    if (!product || !user) return;

    if (!reason.trim() || !pickupWindow.trim() || !acceptPolicy || !requesterCity.trim()) {
      setFormError("Completa los campos obligatorios y acepta la política.");
      return;
    }

    const workerId = PLATFORM_USER_ID;
    const workerName = PLATFORM_USER_NAME;
    const now = new Date().toISOString();

    const firstImageUrl = product.images?.[0]
      ? new URL(product.images[0], window.location.origin).toString()
      : undefined;

    const messageContent =
      `Solicitud para "${product.title}"\n\n` +
      `¿Por qué lo necesitas?: ${reason}\n` +
      `Nivel de necesidad: ${needLevel}\n` +
      (householdSize ? `Personas en tu hogar: ${householdSize}\n` : "") +
      (intendedUse ? `¿Para quién/uso?: ${intendedUse}\n` : "") +
      `Disponibilidad para recibir/recoger: ${pickupWindow}\n` +
      (extraNotes ? `Notas: ${extraNotes}\n` : "") +
      `Tu ubicación: ${requesterCity}\n` +
      `Ciudad del producto: ${product.city}` +
      (firstImageUrl ? `\nImagen: ${firstImageUrl}` : "");

    let created;
    try {
      created = await addRequest({
        productId: product.id,
        productTitle: product.title,
        productCity: product.city,
        requesterId: user.id,
        requesterName: user.name,
        requesterEmail: user.email,
        requesterPhone: user.phone,
        requesterCity,
        householdSize,
        needLevel,
        reason,
        intendedUse,
        pickupWindow,
        extraNotes,
        evidence: evidence || undefined,
      });
    } catch (err) {
      toast({
        title: "Error al enviar la solicitud",
        description:
          err instanceof Error
            ? err.message
            : "No se pudo registrar la solicitud. Intenta nuevamente.",
        variant: "destructive",
      });
      return;
    }

    const requestId = created.id;

    const messages = JSON.parse(localStorage.getItem("messages") || "[]") as StoredMessage[];
    messages.push({
      id: requestId,
      from: user.id,
      to: workerId,
      fromName: user.name,
      toName: workerName,
      productId: product.id,
      subject: `Solicitud de ${user.name} - ${product.title}`,
      content: messageContent,
      image: evidence || firstImageUrl,
      timestamp: now,
      read: false,
    });

    try {
      localStorage.setItem("messages", JSON.stringify(messages));
      localStorage.setItem("messages_backup", JSON.stringify(messages));
    } catch {
      const trimmed = messages.slice(-200);
      localStorage.setItem("messages", JSON.stringify(trimmed));
      localStorage.setItem("messages_backup", JSON.stringify(trimmed));
    }

    const existingInquiries = JSON.parse(localStorage.getItem("worker_inquiries") || "[]");
    const newInquiry = {
      id: requestId,
      transactionId: requestId,
      buyerId: user.id,
      sellerId: product.sellerId || product.sellerName,
      sellerName: product.sellerName,
      sellerEmail: product.sellerEmail,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone,
      productId: product.id,
      productTitle: product.title,
      message: messageContent,
      status: "pending",
      createdAt: now,
      score: created.score,
      needLevel: created.needLevel,
    };
    localStorage.setItem("worker_inquiries", JSON.stringify([newInquiry, ...existingInquiries]));

    setShowRequestForm(false);
    setFormError("");
    setReason("");
    setIntendedUse("");
    setPickupWindow("");
    setExtraNotes("");
    setNeedLevel("alta");
    setHouseholdSize("");
    setEvidence(null);
    setRequesterCity(user.city || "");
    setAcceptPolicy(false);

    navigate(`/mensajes?product=${product.id}`);
  };

  const nextImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length);
    }
  };

  const prevImage = () => {
    if (product) {
      setCurrentImageIndex((prev) => (prev - 1 + product.images.length) % product.images.length);
    }
  };

  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
  };

  if (!product) {
    return (
      <main className="min-h-screen bg-background">
        <section className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold text-foreground">Producto no encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">El producto solicitado no existe o ya fue retirado.</p>
          <Link to="/" className="mt-6 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
            Volver al inicio
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-4xl rounded-xl bg-card p-8 shadow-sm">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            Estado: {donationStatus === "disponible" ? "Disponible" : donationStatus === "en_proceso" ? "En proceso de entrega" : "Entregado"}
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Image Gallery */}
            <div className="space-y-4">
              {/* Main Image */}
              <div className="relative group">
                <img
                  src={product.images[currentImageIndex]}
                  alt={product.title}
                  className="h-80 w-full rounded-lg object-cover cursor-pointer"
                  onClick={() => setShowGallery(true)}
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-lg flex items-center justify-center">
                  <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>

                {/* Navigation arrows */}
                {product.images.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {product.images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => goToImage(index)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                        index === currentImageIndex
                          ? "border-primary"
                          : "border-transparent hover:border-muted-foreground"
                      }`}
                    >
                      <img
                        src={image}
                        alt={`${product.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}

              {/* Image Counter */}
              {product.images.length > 1 && (
                <p className="text-sm text-muted-foreground text-center">
                  {currentImageIndex + 1} de {product.images.length}
                </p>
              )}
            </div>

            <div>
              <h1 className="text-2xl font-semibold text-foreground">{product.title}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{product.city}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  Donación/abonación
                </span>
              </div>

              <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button
                  onClick={() => {
                    if (!isAuthenticated) {
                      navigate("/login");
                    } else {
                      setShowRequestForm(true);
                    }
                  }}
                  className="w-full sm:w-auto"
                  disabled={donationStatus !== "disponible"}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {donationStatus === "disponible" ? "Solicitar" : "No disponible"}
                </Button>
                <Link
                  to="/"
                  className="w-full rounded-lg border border-secondary px-4 py-2 text-sm font-semibold text-foreground hover:bg-secondary/70 sm:w-auto text-center"
                >
                  Volver
                </Link>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-12 pt-8 border-t">
            <ProductReviews productId={product.id} sellerName={product.sellerName} sellerId={product.sellerId} />
          </div>
        </div>
      </section>

      {/* Full Screen Gallery Modal */}
      <Dialog open={showGallery} onOpenChange={setShowGallery}>
        <DialogContent className="max-w-4xl h-[90vh] p-0">
          <div className="relative h-full flex items-center justify-center bg-black">
            {/* Close button */}
            <button
              onClick={() => setShowGallery(false)}
              className="absolute top-4 right-4 z-10 bg-black/50 text-white p-2 rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Main image */}
            <img
              src={product.images[currentImageIndex]}
              alt={product.title}
              className="max-h-full max-w-full object-contain"
            />

            {/* Navigation arrows */}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white p-3 rounded-full hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Image counter */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm">
              {currentImageIndex + 1} / {product.images.length}
            </div>

            {/* Thumbnail strip */}
            {product.images.length > 1 && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-lg">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => goToImage(index)}
                    className={`w-12 h-12 rounded overflow-hidden border-2 transition-colors ${
                      index === currentImageIndex
                        ? "border-white"
                        : "border-transparent hover:border-white/50"
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Questionnaire for requesting product */}
      <Dialog open={showRequestForm} onOpenChange={setShowRequestForm}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto sm:max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Solicitud de producto</DialogTitle>
            <DialogDescription>
              Cuéntanos por qué necesitas este producto. Tu solicitud será revisada por el equipo de la plataforma.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pb-2">
            <div className="space-y-2">
              <Label htmlFor="reason">¿Por qué lo necesitas? *</Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Ej: Para amoblar el cuarto de mis hijos..."
                className="h-20"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="needLevel">Nivel de necesidad *</Label>
              <Select value={needLevel} onValueChange={(v) => setNeedLevel(v as NeedLevel)}>
                <SelectTrigger id="needLevel">
                  <SelectValue placeholder="Selecciona" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="media">Media</SelectItem>
                  <SelectItem value="baja">Baja</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="use">¿Para quién o para qué lo usarás?</Label>
              <Input
                id="use"
                value={intendedUse}
                onChange={(e) => setIntendedUse(e.target.value)}
                placeholder="Ej: Para mi familia / proyecto comunitario"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="household">¿Quiénes viven contigo?</Label>
              <Input
                id="household"
                value={householdSize}
                onChange={(e) => setHouseholdSize(e.target.value)}
                placeholder="Ej: 4 personas (2 adultos, 2 niños)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup">¿Cuándo puedes recibirlo/recogerlo? *</Label>
              <Input
                id="pickup"
                value={pickupWindow}
                onChange={(e) => setPickupWindow(e.target.value)}
                placeholder="Ej: Esta semana en las tardes / sábado en la mañana"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas adicionales</Label>
              <Textarea
                id="notes"
                value={extraNotes}
                onChange={(e) => setExtraNotes(e.target.value)}
                placeholder="Referencias de entrega, contacto alterno, etc."
                className="h-16"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Tu ciudad / barrio *</Label>
              <Input
                id="location"
                value={requesterCity}
                onChange={(e) => setRequesterCity(e.target.value)}
                placeholder="Solo ciudad o barrio, sin direcciones exactas"
              />
            </div>

            <div className="space-y-2">
              <Label>Evidencia (opcional)</Label>
              <div className="flex items-center gap-3">
                <input type="file" accept="image/*" onChange={handleEvidenceUpload} className="text-sm" />
                {evidence && (
                  <button
                    type="button"
                    onClick={() => setEvidence(null)}
                    className="text-xs text-destructive underline"
                  >
                    Quitar
                  </button>
                )}
              </div>
              {evidence && (
                <img
                  src={evidence}
                  alt="Evidencia"
                  className="h-24 w-auto rounded-md border"
                />
              )}
            </div>

            <div className="flex items-start gap-3 rounded-md border border-secondary/70 p-3">
              <Checkbox id="policy" checked={acceptPolicy} onCheckedChange={(v) => setAcceptPolicy(!!v)} />
              <Label htmlFor="policy" className="text-sm leading-tight">
                Acepto que la plataforma gestione esta solicitud y se comunique conmigo por este medio.
              </Label>
            </div>

            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRequestForm(false)}>
              Cancelar
            </Button>
            <Button onClick={submitRequest} disabled={donationStatus !== "disponible"}>
              Enviar solicitud
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default ProductDetail;

