import { type Product } from "@/lib/mock-data";

const resolveApiBaseUrl = () => {
  const raw =
    import.meta.env.VITE_PRODUCTS_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.PUBLIC_API_URL ||
    "";

  const trimmed = raw.trim().replace(/\/+$/, "");
  const normalized = trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;

  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    normalized.startsWith("http://")
  ) {
    return normalized.replace("http://", "https://");
  }

  return normalized;
};

const API_BASE_URL = resolveApiBaseUrl();

type ApiProduct = {
  id: number | string;
  title?: string;
  name?: string;
  description: string;
  category: string;
  price?: number | string;
  isGift?: boolean;
  condition?: string;
  images?: string[] | string;
  city?: string;
  sellerId?: string;
  sellerEmail?: string;
  sellerName?: string;
  sellerAvatar?: string;
  status?: string;
  donationStatus?: string;
  sold?: boolean;
  commission?: number | string;
  createdAt?: string;
  created_at?: string;
};

const toProduct = (item: ApiProduct): Product => {
  const parsedImages = Array.isArray(item.images)
    ? item.images
    : typeof item.images === "string" && item.images
      ? JSON.parse(item.images)
      : [];

  return {
    id: String(item.id),
    title: item.title || item.name || "Sin título",
    description: item.description,
    category: (item.category as Product["category"]) || "otros",
    price: Number(item.price || 0),
    isGift: item.isGift !== undefined ? item.isGift : true,
    condition: (item.condition as Product["condition"]) || "bueno",
    images: parsedImages,
    city: item.city || "",
    sellerId: item.sellerId,
    sellerEmail: item.sellerEmail,
    sellerName: item.sellerName || "Usuario",
    sellerAvatar: item.sellerAvatar || "",
    status: (item.status as Product["status"]) || "active",
    donationStatus: (item.donationStatus as Product["donationStatus"]) || "disponible",
    createdAt: item.createdAt || item.created_at || new Date().toISOString(),
    sold: item.sold || false,
    commission: Number(item.commission || 0),
  };
};

export const fetchProducts = async (): Promise<Product[]> => {
  const response = await fetch(`${API_BASE_URL}/api/products`);
  if (!response.ok) {
    throw new Error("No se pudieron cargar los productos");
  }
  const data = (await response.json()) as ApiProduct[];
  return data.map(toProduct);
};

export const createProduct = async (payload: Product): Promise<Product> => {
  const response = await fetch(`${API_BASE_URL}/api/products/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("No se pudo crear la publicación");
  }

  const created = (await response.json()) as ApiProduct;
  return toProduct(created);
};

export const updateProduct = async (
  productId: string,
  updates: Partial<Product>
): Promise<Product> => {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    throw new Error("No se pudo actualizar el producto");
  }

  const updated = (await response.json()) as ApiProduct;
  return toProduct(updated);
};

export const deleteProductById = async (productId: string): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/products/${productId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("No se pudo eliminar el producto");
  }
};
