import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { resolveUserApiBaseUrl } from "@/lib/user-api";

const USERS_API_BASE_URL = resolveUserApiBaseUrl();

const VerifyEmail = () => {
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail } = useAuth();
  const email = location.state?.email || "";
  const emailSent = location.state?.emailSent !== false; // Default to true if not specified

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-destructive mb-4">Email no proporcionado</p>
            <Link to="/login" className="text-primary hover:underline">
              Volver al inicio de sesión
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!verificationCode.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa el código de verificación",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await verifyEmail(email, verificationCode);

      if (!result.success) {
        throw new Error(result.error || "Error al verificar el email");
      }

      toast({
        title: "Éxito",
        description: "Email verificado correctamente. Cuenta creada!",
      });

      setTimeout(() => navigate("/"), 2000);
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "No se pudo verificar el email",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);
    let timer: ReturnType<typeof setTimeout> | null = null;

    const resendOnce = async (timeoutMs: number) => {
      const controller = new AbortController();
      timer = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(
        `${USERS_API_BASE_URL}/api/users/resend-verification-code`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
          signal: controller.signal,
        }
      );

      clearTimeout(timer);
      timer = null;

      const data = await response.json().catch(() => ({}));
      return { response, data };
    };

    const getFriendlyError = (error: unknown) => {
      if (!(error instanceof Error)) {
        return "No se pudo reenviar el código";
      }

      const msg = error.message.toLowerCase();
      if (
        msg.includes("aborted") ||
        msg.includes("aborterror") ||
        msg.includes("signal is aborted")
      ) {
        return "El servidor tardó demasiado en responder. Intenta de nuevo en unos segundos.";
      }

      if (msg.includes("failed to fetch") || msg.includes("network")) {
        return "No hay conexión con el servicio de usuarios en este momento.";
      }

      return error.message;
    };

    try {
      let payload = await resendOnce(15000);

      // Retry once when the first attempt times out/network-fails.
      if (!payload.response.ok && payload.response.status >= 500) {
        payload = await resendOnce(25000);
      }

      const { response, data } = payload;

      if (!response.ok) {
        throw new Error(
          typeof data?.error === "string" && data.error
            ? data.error
            : "Error al reenviar el código"
        );
      }

      if (data?.emailSent === false) {
        throw new Error(
          (typeof data?.emailError === "string" && data.emailError) ||
            (typeof data?.msg === "string" && data.msg) ||
            "No se pudo enviar el correo de verificación"
        );
      }

      toast({
        title: "Éxito",
        description:
          (typeof data?.msg === "string" && data.msg) ||
          "Código de verificación reenviado a tu email",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: getFriendlyError(error),
        variant: "destructive",
      });
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Verifica tu email</CardTitle>
        </CardHeader>
        <CardContent>
          {emailSent ? (
            <p className="text-sm text-muted-foreground mb-4">
              Hemos enviado un código de verificación a <strong>{email}</strong>
            </p>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ Nota:</strong> No pudimos enviar el código por email.
                Usa el botón "Reenviar Código" para intentar de nuevo, o verifica tu carpeta de spam.
              </p>
            </div>
          )}
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <Label htmlFor="code">Código de verificación</Label>
              <Input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Verificando..." : "Verificar email"}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              ¿No recibiste el código?
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={isResending}
            >
              {isResending ? "Reenviando..." : "Reenviar código"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
