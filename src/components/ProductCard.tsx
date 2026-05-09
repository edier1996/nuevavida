import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MapPin, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import type { Product } from "@/lib/mock-data";

interface ProductCardProps {
  product: Product;
  index?: number;
}

const timeAgo = (date: string) => {
  const diff = Date.now() - new Date(date).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Hoy";
  if (days === 1) return "Ayer";
  if (days < 7) return `Hace ${days} dias`;
  return `Hace ${Math.floor(days / 7)} sem`;
};

const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const [liked, setLiked] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const donationStatus = product.donationStatus || "disponible";

  useEffect(() => {
    if (!user) {
      setLiked(false);
      return;
    }

    const favorites = JSON.parse(localStorage.getItem(`favorites_${user.id}`) || "[]");
    setLiked(favorites.includes(product.id));
  }, [product.id, user]);

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!user) {
      navigate("/login");
      return;
    }

    const storageKey = `favorites_${user.id}`;
    const favorites = JSON.parse(localStorage.getItem(storageKey) || "[]");
    let newFavorites;
    if (liked) {
      newFavorites = favorites.filter((id: string) => id !== product.id);
    } else {
      newFavorites = [...favorites, product.id];
    }
    localStorage.setItem(storageKey, JSON.stringify(newFavorites));
    setLiked(!liked);
  };

  const handleCardClick = () => {
    navigate(`/producto/${product.id}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: [0.2, 0, 0, 1] }}
      whileHover={{ y: -4 }}
      className={`group cursor-pointer overflow-hidden rounded-[1.75rem] border border-white/70 bg-white/85 card-shadow transition-shadow duration-200 hover:card-shadow-hover ${
        product.sold || donationStatus !== "disponible" ? 'opacity-75' : ''
      }`}
      onClick={handleCardClick}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden">
        <div className="absolute inset-x-0 top-0 z-10 h-24 bg-gradient-to-b from-black/28 to-transparent" />
        <img
          src={product.images[0]}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Overlay para productos vendidos */}
        {(product.sold || donationStatus === "entregado") && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Entregado
            </div>
          </div>
        )}

        {donationStatus === "en_proceso" && (
          <div className="absolute inset-0 bg-black/35 flex items-center justify-center">
            <div className="bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              En proceso
            </div>
          </div>
        )}

        {/* Badge */}
        <span className="absolute left-3 top-3 z-20 rounded-full border border-white/25 bg-white/85 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
          Donación
        </span>

        {/* Fav */}
        {!product.sold && (
          <button
            onClick={handleLike}
            className="absolute right-3 top-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/85 backdrop-blur-sm opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Heart className={`h-4 w-4 ${liked ? 'text-red-500 fill-red-500' : 'text-muted-foreground'}`} strokeWidth={2.5} />
          </button>
        )}

      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="rounded-full bg-secondary px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
            {product.category}
          </p>
          <p className="text-xs font-medium text-muted-foreground">{timeAgo(product.createdAt)}</p>
        </div>
        <h3 className={`font-semibold leading-snug tracking-tight line-clamp-2 ${
          product.sold ? 'text-muted-foreground line-through' : 'text-foreground'
        }`}>
          {product.title}
        </h3>
        <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span>{product.city}</span>
        </div>
        <p className="mt-3 text-sm leading-6 text-muted-foreground line-clamp-2">{product.description}</p>
      </div>
    </motion.div>
  );
};

export default ProductCard;

