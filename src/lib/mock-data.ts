export type Category = "hogar" | "tecnologia" | "muebles" | "ropa" | "electrodomesticos" | "otros";
export type ProductStatus = "pending" | "active" | "sold" | "archived";
export type DonationStatus = "disponible" | "en_proceso" | "entregado";
export type Condition = "nuevo" | "bueno" | "regular";

export interface Product {
  id: string;
  title: string;
  description: string;
  category: Category;
  price: number;
  isGift: boolean;
  condition: Condition;
  images: string[];
  city: string;
  sellerId?: string;
  sellerEmail?: string;
  sellerName: string;
  sellerAvatar: string;
  status: ProductStatus;
  createdAt: string;
  sold?: boolean;
  commission?: number;
  donationStatus?: DonationStatus;
}

export const categories: { value: Category; label: string; icon: string }[] = [
  { value: "hogar", label: "Hogar", icon: "Home" },
  { value: "tecnologia", label: "Tecnología", icon: "Smartphone" },
  { value: "muebles", label: "Muebles", icon: "Armchair" },
  { value: "ropa", label: "Ropa", icon: "Shirt" },
  { value: "electrodomesticos", label: "Electrodomésticos", icon: "Refrigerator" },
  { value: "otros", label: "Otros", icon: "Package" },
];

export const mockProducts: Product[] = [];
