import { type Product } from "@/lib/mock-data";

const resolveApiBaseUrl = () => {
  const runtimeUrl =
    typeof window !== "undefined" &&
    typeof (window as Window & { __API_CONFIG__?: Record<string, string> }).__API_CONFIG__?.VITE_PRODUCTS_API_BASE_URL === "string" &&
    (window as Window & { __API_CONFIG__?: Record<string, string> }).__API_CONFIG__!.VITE_PRODUCTS_API_BASE_URL !== "__VITE_PRODUCTS_API_BASE_URL__"
      ? (window as Window & { __API_CONFIG__?: Record<string, string> }).__API_CONFIG__!.VITE_PRODUCTS_API_BASE_URL
      : "";

  const raw =
    runtimeUrl ||
    import.meta.env.VITE_PRODUCTS_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    import.meta.env.PUBLIC_API_URL ||
    "";

  const trimmed = raw.trim().replace(/\/+$/, "");
  let normalized = trimmed.endsWith("/api") ? trimmed.slice(0, -4) : trimmed;

  if (normalized && !/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

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
const PRODUCT_API_FALLBACKS = ["https://nuevavida-production.up.railway.app"];

const buildApiUrl = (path: string, baseUrl: string) => {
  if (!baseUrl) return path;
  return `${baseUrl}${path}`;
};

const buildCandidateBaseUrls = () => {
  const normalizedPrimary = API_BASE_URL.trim().replace(/\/+$/, "");
  const candidates = [normalizedPrimary, ...PRODUCT_API_FALLBACKS]
    .map((base) => base.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  return Array.from(new Set(candidates));
};

const fetchProductsApi = async (path: string, init?: RequestInit) => {
  const candidateBaseUrls = buildCandidateBaseUrls();
  const primaryBaseUrl = candidateBaseUrls[0] || "";
  const primaryUrl = buildApiUrl(path, primaryBaseUrl);

  try {
    const primaryResponse = await fetch(primaryUrl, init);

    // If the configured base URL points to the frontend service, Railway can
    // reply 404 without CORS headers. Retry against same-origin /api.
    if (
      typeof window !== "undefined" &&
      primaryBaseUrl &&
      !primaryUrl.startsWith(window.location.origin) &&
      primaryResponse.status === 404
    ) {
      for (const candidateBaseUrl of candidateBaseUrls.slice(1)) {
        try {
          const candidateResponse = await fetch(buildApiUrl(path, candidateBaseUrl), init);
          if (candidateResponse.ok) return candidateResponse;
        } catch {
          // Try next candidate.
        }
      }

      return fetch(buildApiUrl(path, window.location.origin), init);
    }

    return primaryResponse;
  } catch {
    for (const candidateBaseUrl of candidateBaseUrls.slice(1)) {
      try {
        const candidateResponse = await fetch(buildApiUrl(path, candidateBaseUrl), init);
        if (candidateResponse.ok) return candidateResponse;
      } catch {
        // Try next candidate.
      }
    }

    if (typeof window !== "undefined" && primaryBaseUrl && !primaryUrl.startsWith(window.location.origin)) {
      return fetch(buildApiUrl(path, window.location.origin), init);
    }

    throw new Error("No se pudo conectar con la API de productos");
  }
};

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
  const response = await fetchProductsApi(`/api/products`);
  if (!response.ok) {
    throw new Error("No se pudieron cargar los productos");
  }
  const data = (await response.json()) as ApiProduct[];
  return data.map(toProduct);
};

export const createProduct = async (payload: Product): Promise<Product> => {
  const response = await fetchProductsApi(`/api/products/create`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const fallback = "No se pudo crear la publicación";
    let message = fallback;

    try {
      const data = await response.json();
      message =
        (typeof data?.error === "string" && data.error) ||
        (typeof data?.message === "string" && data.message) ||
        fallback;
    } catch {
      // Keep fallback if body is not JSON.
    }

    throw new Error(message);
  }

  const created = (await response.json()) as ApiProduct;
  return toProduct(created);
};

export const updateProduct = async (
  productId: string,
  updates: Partial<Product>
): Promise<Product> => {
  const response = await fetchProductsApi(`/api/products/${productId}`, {
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
  const response = await fetchProductsApi(`/api/products/${productId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("No se pudo eliminar el producto");
  }
};
