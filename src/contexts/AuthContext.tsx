import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  address?: string;
  role: 'admin' | 'worker' | 'user';
}

interface StoredUser extends User {
  password?: string;
  passwordHash?: string;
  passwordStrength?: "weak" | "strong";
}

const resolveApiBaseUrl = () => {
  const raw =
    import.meta.env.VITE_USERS_API_BASE_URL ||
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

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    name: string,
    email: string,
    password: string,
    phone: string,
    city: string,
    address: string,
    role?: 'admin' | 'worker' | 'user'
  ) => Promise<{ success: boolean; error?: string }>;
  createUser: (
    name: string,
    email: string,
    password: string,
    phone: string,
    city: string,
    address: string,
    role: 'admin' | 'worker' | 'user'
  ) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUserRaw = localStorage.getItem("user");
    if (storedUserRaw) {
      setUser(JSON.parse(storedUserRaw));
    }

    const DEFAULT_ADMIN = {
      id: "admin-1",
      name: "Administrador",
      email: "nuevavida1327@gmail.com",
      phone: "",
      city: "",
      address: "",
      role: "admin" as const,
      passwordHash: "3ce2d89fc21e170599929e3893fa79a82ce7577c27abc3d0704ae8d1b8287b05", // SHA-256 de "nueva2026"
      passwordStrength: "strong" as const,
    };

    const DEFAULT_WORKER = {
      id: "worker-1",
      name: "Soporte",
      email: "worker@nuevavida.com",
      phone: "",
      city: "",
      address: "",
      role: "worker" as const,
      passwordHash: "3ce2d89fc21e170599929e3893fa79a82ce7577c27abc3d0704ae8d1b8287b05", // SHA-256 de "nueva2026"
      passwordStrength: "strong" as const,
    };

    const users: StoredUser[] = JSON.parse(localStorage.getItem("users") || "[]");

    // Eliminamos cualquier admin previo y dejamos solo el admin por defecto con las nuevas credenciales
    const nonAdminUsers = users.filter((u) => u.role !== "admin" && u.id !== DEFAULT_ADMIN.id);
    const nonWorkerUsers = nonAdminUsers.filter((u) => u.role !== "worker" && u.id !== DEFAULT_WORKER.id);
    const updatedUsers: StoredUser[] = [...nonWorkerUsers, DEFAULT_ADMIN, DEFAULT_WORKER];
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    // Si el usuario autenticado es/era admin, sincronizarlo
    if (storedUserRaw) {
      const parsedStoredUser: StoredUser = JSON.parse(storedUserRaw);
      if (parsedStoredUser.role === "admin" || parsedStoredUser.id === DEFAULT_ADMIN.id) {
        localStorage.setItem("user", JSON.stringify(DEFAULT_ADMIN));
        setUser(DEFAULT_ADMIN);
      }
    }
  }, []);

  const isPasswordStrong = (password: string) => {
    // Requerimos al menos 8 caracteres, mayúsculas, minúsculas, dígitos y un carácter especial.
    return /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}/.test(password);
  };

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    // Login local para cuentas internas (admin/worker)
    const users: StoredUser[] = JSON.parse(localStorage.getItem("users") || "[]");
    const hashedPassword = await hashPassword(password);

    const foundUser = users.find((u: StoredUser) => {
      if (u.email !== email) return false;
      // Compatibilidad hacia atrás: algunos usuarios pueden tener contraseña en texto plano
      if (u.passwordHash) {
        return u.passwordHash === hashedPassword;
      }
      return u.password === password;
    });

    if (foundUser && (foundUser.role === "admin" || foundUser.role === "worker")) {
      const { password, passwordHash, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem("user", JSON.stringify(userWithoutPassword));
      return true;
    }

    // Login SQL para usuarios finales
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const backendUser: User = {
        id: String(data.user?.id || data.userId || ""),
        name: data.user?.name || email.split("@")[0],
        email: data.user?.email || email,
        role: "user",
      };

      if (!backendUser.id) {
        return false;
      }

      const profileRaw = localStorage.getItem(`user_profile_${backendUser.id}`);
      const profile = profileRaw ? JSON.parse(profileRaw) : {};
      const mergedUser = { ...backendUser, ...profile };

      if (data.token) {
        localStorage.setItem("auth_token", data.token);
      }

      setUser(mergedUser);
      localStorage.setItem("user", JSON.stringify(mergedUser));
      return true;
    } catch {
      return false;
    }

    return false;
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    phone: string,
    city: string,
    address: string,
    role: 'admin' | 'worker' | 'user' = 'user'
  ): Promise<{ success: boolean; error?: string }> => {
    // Registro SQL para cuentas de usuario final
    if (role !== "user") {
      return { success: false, error: "Solo se permite el registro de usuarios finales." };
    }

    if (!isPasswordStrong(password)) {
      return {
        success: false,
        error:
          "La contraseña debe tener mínimo 8 caracteres e incluir mayúsculas, minúsculas, números y símbolos.",
      };
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        let apiError = `Error ${response.status}`;
        try {
          const raw = await response.text();
          try {
            const data = JSON.parse(raw);
            apiError =
              (typeof data?.error === "string" && data.error) ||
              (typeof data?.message === "string" && data.message) ||
              (typeof data?.msg === "string" && data.msg) ||
              `Error ${response.status}: ${raw.slice(0, 200)}`;
          } catch {
            if (raw.includes("<!DOCTYPE") || raw.includes("Cannot GET") || raw.includes("Not Found")) {
              apiError =
                "El frontend no apunta al servicio de usuarios. Revisa VITE_USERS_API_BASE_URL en Railway.";
            } else {
              apiError = `Error ${response.status}: ${raw.slice(0, 200)}`;
            }
          }
        } catch {
          apiError = `Error ${response.status} al crear cuenta`;
        }
        return { success: false, error: apiError };
      }

      const data = await response.json();
      const registeredUser: User = {
        id: String(data.user?.id || data.userId || ""),
        name: data.user?.name || name,
        email: data.user?.email || email,
        phone,
        city,
        address,
        role: "user",
      };

      if (!registeredUser.id) {
        return { success: false, error: "Respuesta inválida del servidor al registrar." };
      }

      if (data.token) {
        localStorage.setItem("auth_token", data.token);
      }

      localStorage.setItem(
        `user_profile_${registeredUser.id}`,
        JSON.stringify({ phone, city, address })
      );

      setUser(registeredUser);
      localStorage.setItem("user", JSON.stringify(registeredUser));
      return { success: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      return { success: false, error: `No se pudo conectar: ${msg}` };
    }
  };

  const createUser = async (
    name: string,
    email: string,
    password: string,
    phone: string,
    city: string,
    address: string,
    role: 'admin' | 'worker' | 'user'
  ): Promise<boolean> => {
    if (!user || user.role !== 'admin') {
      return false; // Solo admin puede crear usuarios
    }

    const users: StoredUser[] = JSON.parse(localStorage.getItem("users") || "[]");
    if (users.some((u) => u.email === email)) {
      return false; // Email ya existe
    }

    // Permitimos contraseñas débiles creadas por admin para no bloquear el alta.
    const passwordHash = await hashPassword(password);
    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      phone,
      city,
      address,
      role,
      passwordHash,
      passwordStrength: "strong",
    };

    users.push(newUser);
    localStorage.setItem("users", JSON.stringify(users));

    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("auth_token");
    // conservar mensajes; ya se guardan en messages/messages_backup
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    createUser,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};



