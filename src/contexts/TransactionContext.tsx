import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { Transaction, ShippingInfo, TransactionStatus } from "@/lib/transactions";

interface TransactionContextType {
  // Estado
  transactions: Transaction[];
  currentTransaction: Transaction | null;

  // Acciones
  createTransaction: (transaction: Transaction) => void;
  updateTransactionStatus: (transactionId: string, newStatus: TransactionStatus, notes?: string) => void;
  getSellerTransactions: (sellerId: string) => Transaction[];
  getBuyerTransactions: (buyerId: string) => Transaction[];
  getProductTransaction: (productId: string) => Transaction | undefined;
  getTransactionById: (transactionId: string) => Transaction | undefined;

  // Envíos
  updateShipping: (transactionId: string, shipping: ShippingInfo) => void;
}

const TransactionContext = createContext<TransactionContextType | undefined>(undefined);

export const TransactionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentTransaction, setCurrentTransaction] = useState<Transaction | null>(null);

  // Cargar transacciones del localStorage al montar
  useEffect(() => {
    const storedTransactions = localStorage.getItem("transactions");
    if (storedTransactions) {
      try {
        setTransactions(JSON.parse(storedTransactions));
      } catch (error) {
        console.error("Error parsing transactions from localStorage:", error);
      }
    }
  }, []);

  // Guardar transacciones en localStorage cuando cambien
  useEffect(() => {
    localStorage.setItem("transactions", JSON.stringify(transactions));
  }, [transactions]);

  const createTransaction = useCallback((transaction: Transaction) => {
    setTransactions((prev) => [...prev, transaction]);
  }, []);

  const updateTransactionStatus = useCallback(
    (transactionId: string, newStatus: TransactionStatus, notes?: string) => {
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id === transactionId) {
            const statusEntry = {
              status: newStatus,
              timestamp: new Date().toISOString(),
              notes,
              changedBy: "system",
            };

            return {
              ...t,
              status: newStatus,
              statusHistory: [...t.statusHistory, statusEntry],
              timestamps: {
                ...t.timestamps,
                updated: new Date().toISOString(),
              },
            };
          }
          return t;
        })
      );
    },
    []
  );

  const getSellerTransactions = useCallback(
    (sellerId: string) => {
      return transactions.filter((t) => t.sellerId === sellerId);
    },
    [transactions]
  );

  const getBuyerTransactions = useCallback(
    (buyerId: string) => {
      return transactions.filter((t) => t.buyerId === buyerId);
    },
    [transactions]
  );

  const getProductTransaction = useCallback(
    (productId: string) => {
      return transactions.find((t) => t.productId === productId);
    },
    [transactions]
  );

  const getTransactionById = useCallback(
    (transactionId: string) => {
      return transactions.find((t) => t.id === transactionId);
    },
    [transactions]
  );

  const updateShipping = useCallback(
    (transactionId: string, shipping: ShippingInfo) => {
      setTransactions((prev) =>
        prev.map((t) => {
          if (t.id === transactionId) {
            return {
              ...t,
              shipping,
              timestamps: {
                ...t.timestamps,
                updated: new Date().toISOString(),
              },
            };
          }
          return t;
        })
      );
    },
    []
  );

  const value: TransactionContextType = {
    transactions,
    currentTransaction,
    createTransaction,
    updateTransactionStatus,
    getSellerTransactions,
    getBuyerTransactions,
    getProductTransaction,
    getTransactionById,
    updateShipping,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (context === undefined) {
    throw new Error("useTransactions must be used within a TransactionProvider");
  }
  return context;
};
