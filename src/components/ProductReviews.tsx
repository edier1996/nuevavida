import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MessageCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export interface Review {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  comment: string;
  createdAt: string;
}

interface ProductReviewsProps {
  productId: string;
  sellerName: string;
  sellerId?: string;
}

const ProductReviews = ({ productId, sellerName, sellerId }: ProductReviewsProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [newReview, setNewReview] = useState("");
  const [rating, setRating] = useState(5);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Cargar reseñas del localStorage
    const stored = JSON.parse(localStorage.getItem(`reviews_${productId}`) || "[]");
    setReviews(stored);
  }, [productId]);

  const submitReview = () => {
    if (!user || !newReview.trim()) return;

    const review: Review = {
      id: Date.now().toString(),
      productId,
      userId: user.id,
      userName: user.name,
      userAvatar: "",
      rating,
      comment: newReview.trim(),
      createdAt: new Date().toISOString()
    };

    const updatedReviews = [...reviews, review];
    setReviews(updatedReviews);
    localStorage.setItem(`reviews_${productId}`, JSON.stringify(updatedReviews));

    // Reset form
    setNewReview("");
    setRating(5);
    setShowReviewForm(false);

    // Crear notificación para el vendedor
    const notifications = JSON.parse(
      localStorage.getItem(`notifications_${sellerId ?? sellerName}`) || "[]"
    );
    const notification = {
      id: `review_${review.id}`,
      type: "system",
      title: "Nueva reseña",
      message: `${user.name} dejó una reseña en tu producto`,
      read: false,
      createdAt: new Date().toISOString(),
      actionUrl: `/producto/${productId}`
    };
    notifications.unshift(notification);
    localStorage.setItem(`notifications_${sellerId ?? sellerName}`, JSON.stringify(notifications));
  };

  const averageRating = reviews.length > 0
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
    : 0;

  const ratingDistribution = [5, 4, 3, 2, 1].map(stars => ({
    stars,
    count: reviews.filter(r => r.rating === stars).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === stars).length / reviews.length) * 100 : 0
  }));

  const StarRating = ({ rating, interactive = false, onRatingChange }: {
    rating: number;
    interactive?: boolean;
    onRatingChange?: (rating: number) => void;
  }) => (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && onRatingChange?.(star)}
          className={`text-lg ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''} ${
            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
          }`}
        >
          ★
        </button>
      ))}
    </div>
  );

  // Verificar si el usuario ya dejó una reseña
  const userReview = reviews.find(r => r.userId === user?.id);
  const canReview = isAuthenticated && user?.name !== sellerName && !userReview;

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-foreground">Reseñas y calificaciones</h3>
          <p className="text-sm text-muted-foreground">
            {reviews.length} reseña{reviews.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canReview && (
          <Button
            onClick={() => setShowReviewForm(!showReviewForm)}
            variant="outline"
            className="gap-2"
          >
            <MessageCircle className="h-4 w-4" />
            Dejar reseña
          </Button>
        )}
      </div>

      {/* Estadísticas de calificación */}
      {reviews.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-foreground">
                  {averageRating.toFixed(1)}
                </div>
                <StarRating rating={Math.round(averageRating)} />
                <p className="text-sm text-muted-foreground">
                  Basado en {reviews.length} reseña{reviews.length !== 1 ? 's' : ''}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {ratingDistribution.map(({ stars, count, percentage }) => (
                  <div key={stars} className="flex items-center gap-3">
                    <div className="flex items-center gap-1 w-12">
                      <span className="text-sm">{stars}</span>
                      <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                    </div>
                    <div className="flex-1 bg-muted rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-muted-foreground w-8">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Formulario para nueva reseña */}
      {showReviewForm && canReview && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Escribe tu reseña</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Calificación
              </label>
              <StarRating rating={rating} interactive onRatingChange={setRating} />
            </div>

            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                Comentario
              </label>
              <Textarea
                value={newReview}
                onChange={(e) => setNewReview(e.target.value)}
                placeholder="Comparte tu experiencia con este producto..."
                className="min-h-20"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={submitReview} disabled={!newReview.trim()}>
                Publicar reseña
              </Button>
              <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de reseñas */}
      {reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map((review) => (
            <Card key={review.id}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarFallback>
                      {review.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{review.userName}</p>
                        <div className="flex items-center gap-2">
                          <StarRating rating={review.rating} />
                          <span className="text-xs text-muted-foreground">
                            {new Date(review.createdAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </span>
                        </div>
                      </div>
                      {review.userId === user?.id && (
                        <Badge variant="secondary">Tu reseña</Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {review.comment}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="font-medium text-foreground mb-2">Sin reseñas aún</h4>
            <p className="text-sm text-muted-foreground">
              Sé el primero en dejar una reseña sobre este producto.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductReviews;