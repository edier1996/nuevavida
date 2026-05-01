import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Login = () => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");

    if (mode === "login") {
      const success = await login(email, password);
      if (success) {
        navigate("/");
      } else {
        setError("Credenciales incorrectas");
      }
      return;
    }

    const result = await register(name, email, password, phone, city, address);
    if (result.success) {
      navigate("/");
    } else {
      setError(result.error || "No se pudo crear la cuenta.");
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-md rounded-xl bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-semibold text-foreground">
            {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {mode === "login"
              ? "Ingresa tus datos para continuar."
              : "Crea una cuenta para comenzar a publicar y recibir mensajes."}
          </p>

          {error && (
            <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {mode === "register" && (
            <>
              <label className="block">
                <span className="text-sm font-medium text-foreground">Nombre</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Tu nombre"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">Teléfono</span>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: +57 300 000 0000"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">Ciudad</span>
                <input
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: Bogotá"
                  required
                />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-foreground">Dirección</span>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Ej: Calle 123 #45-67"
                  required
                />
              </label>
            </>
          )}

            <label className="block">
              <span className="text-sm font-medium text-foreground">Email</span>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                type="email"
                placeholder="ejemplo@correo.com"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-foreground">Contraseña</span>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                type="password"
                placeholder="••••••••"
                required
              />
            </label>

            <button
              type="submit"
              className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
            </button>
            {mode === "login" && (
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                ¿Olvidaste tu contraseña?
              </Link>
            )}
          </form>

          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            <button
              type="button"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setError("");
              }}
              className="font-medium text-primary hover:underline"
            >
              {mode === "login"
                ? "¿No tienes cuenta? Crear una"
                : "¿Ya tienes cuenta? Iniciar sesión"}
            </button>
            <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
              Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Login;


