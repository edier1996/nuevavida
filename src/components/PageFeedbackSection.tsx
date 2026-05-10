import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  createPageFeedback,
  fetchPageFeedback,
  type PageFeedbackItem,
} from "@/lib/page-feedback-api";

const MAX_REVIEWS = 6;

const renderStars = (rating: number) =>
  Array.from({ length: 5 }).map((_, index) => {
    const active = index < rating;
    return (
      <Star
        key={`star-${index}`}
        className={`h-4 w-4 ${active ? "fill-amber-400 text-amber-400" : "text-slate-300"}`}
      />
    );
  });

const PageFeedbackSection = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState<PageFeedbackItem[]>([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const visibleReviews = useMemo(() => reviews.slice(0, MAX_REVIEWS), [reviews]);

  const loadFeedback = async () => {
    setIsLoading(true);
    try {
      const data = await fetchPageFeedback();
      setReviews(data.reviews || []);
      setAverageRating(data.summary?.averageRating || 0);
      setTotalReviews(data.summary?.total || 0);
    } catch {
      setReviews([]);
      setAverageRating(0);
      setTotalReviews(0);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      toast({
        title: "Inicia sesion",
        description: "Debes iniciar sesion para dejar tu calificacion.",
        variant: "destructive",
      });
      navigate("/login?redirect=/");
      return;
    }

    const normalizedComment = comment.trim();
    if (normalizedComment.length < 8) {
      toast({
        title: "Comentario muy corto",
        description: "Escribe al menos 8 caracteres para enviar tu opinion.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { review } = await createPageFeedback({ rating, comment: normalizedComment });
      setReviews((prev) => [review, ...prev]);
      setComment("");

      const nextTotal = totalReviews + 1;
      const nextAverage = nextTotal > 0
        ? Number((((averageRating * totalReviews) + rating) / nextTotal).toFixed(1))
        : rating;

      setTotalReviews(nextTotal);
      setAverageRating(nextAverage);

      toast({
        title: "Gracias por tu opinion",
        description: "Tu calificacion fue registrada correctamente.",
      });
    } catch (error) {
      toast({
        title: "No se pudo registrar",
        description: error instanceof Error ? error.message : "Intenta nuevamente en unos segundos.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="container mx-auto px-4 pb-12">
      <div className="rounded-[2rem] border border-white/70 surface-panel p-5 card-shadow md:p-7">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary/75">Comunidad</p>
            <h3 className="mt-2 text-2xl text-foreground md:text-3xl">Califica tu experiencia en Nueva Vida</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Tu opinion nos ayuda a mejorar la plataforma para toda la comunidad.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-white/80 px-4 py-3 text-sm">
            <div className="flex items-center gap-1">{renderStars(Math.round(averageRating))}</div>
            <p className="mt-1 font-semibold text-foreground">{averageRating.toFixed(1)} / 5</p>
            <p className="text-xs text-muted-foreground">{totalReviews} calificaciones</p>
          </div>
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-[1.05fr_1fr]">
          <div className="rounded-2xl border border-border/70 bg-white/85 p-4">
            <p className="text-sm font-semibold text-foreground">Deja tu comentario</p>

            <div className="mt-3 flex items-center gap-2">
              {Array.from({ length: 5 }).map((_, index) => {
                const starValue = index + 1;
                const active = starValue <= rating;
                return (
                  <button
                    key={`rating-${starValue}`}
                    type="button"
                    onClick={() => setRating(starValue)}
                    className="rounded-md p-1 transition hover:bg-amber-50"
                    aria-label={`Calificar con ${starValue} estrellas`}
                  >
                    <Star className={`h-5 w-5 ${active ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                  </button>
                );
              })}
            </div>

            <Textarea
              className="mt-3 min-h-[110px] bg-white"
              placeholder="Comparte como te ha ido usando la pagina..."
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              maxLength={500}
            />
            <p className="mt-1 text-right text-xs text-muted-foreground">{comment.length}/500</p>

            <Button className="mt-3 w-full md:w-auto" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "Enviando..." : "Enviar calificacion"}
            </Button>
          </div>

          <div className="rounded-2xl border border-border/70 bg-white/85 p-4">
            <p className="mb-3 text-sm font-semibold text-foreground">Comentarios recientes</p>
            {isLoading && <p className="text-sm text-muted-foreground">Cargando opiniones...</p>}
            {!isLoading && visibleReviews.length === 0 && (
              <p className="text-sm text-muted-foreground">Aun no hay comentarios. Se la primera persona en calificar.</p>
            )}
            <div className="space-y-3">
              {visibleReviews.map((review) => (
                <article key={review.id} className="rounded-xl border border-border/60 bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{review.userName}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">{renderStars(review.rating)}</div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{review.comment}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PageFeedbackSection;
