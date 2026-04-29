import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Product } from "@/lib/mock-data";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  // Estado
  cart: CartItem[];
  cartTotal: number;
  cartCount: number;

  // Acciones
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getCartItems: () => CartItem[];
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);

  // Cargar carrito del localStorage al montar
  useEffect(() => {
    const storedCart = localStorage.getItem("cart");
    if (storedCart) {
      try {
        setCart(JSON.parse(storedCart));
      } catch (error) {
        console.error("Error parsing cart from localStorage:", error);
      }
    }
  }, []);

  // Guardar carrito en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // Calcular total del carrito
  const cartTotal = cart.reduce((total, item) => {
    if (item.product.isGift) return total;
    return total + item.product.price * item.quantity;
  }, 0);

  // Calcular cantidad total de items
  const cartCount = cart.reduce((count, item) => count + item.quantity, 0);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    // No permitir agregar regalos al carrito
    if (product.isGift) {
      alert("Los regalos no se pueden comprar. Contacta al vendedor.");
      return;
    }

    setCart((prev) => {
      const existingItem = prev.find((item) => item.product.id === product.id);

      if (existingItem) {
        // Actualizar cantidad si ya existe
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        // Agregar nuevo item
        return [...prev, { product, quantity }];
      }
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === productId
            ? { ...item, quantity }
            : item
        )
      );
    }
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const getCartItems = useCallback(() => {
    return cart;
  }, [cart]);

  const value: CartContextType = {
    cart,
    cartTotal,
    cartCount,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartItems,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
