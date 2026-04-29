import { useState, useEffect } from "react";
import { Shield, AlertTriangle, CheckCircle, X, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SecurityAlert {
  id: string;
  type: 'warning' | 'error' | 'success' | 'info';
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  dismissible: boolean;
}

const SecurityDashboard = () => {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [securityScore, setSecurityScore] = useState(0);

  useEffect(() => {
    // Simular análisis de seguridad
    const checkSecurity = () => {
      const newAlerts: SecurityAlert[] = [];
      let score = 100;

      // Verificar si hay usuarios con contraseñas débiles
      const users = JSON.parse(localStorage.getItem("users") || "[]");
      const weakPasswords = users.filter((user: any) => {
        // Usuarios nuevos almacenan un campo `passwordStrength`
        if (user.passwordStrength) {
          return user.passwordStrength !== "strong";
        }

        // Compatibilidad con usuarios anteriores que almacenaban password en texto plano
        if (user.password) {
          return !/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}/.test(user.password);
        }

        // Si no hay información, tratar como alerta
        return true;
      });

      if (weakPasswords.length > 0) {
        newAlerts.push({
          id: 'weak-passwords',
          type: 'warning',
          title: 'Contraseñas débiles detectadas',
          message: `${weakPasswords.length} usuario(s) tienen contraseñas que no cumplen con los estándares de seguridad.`,
          action: {
            label: 'Actualizar contraseñas',
            onClick: () => {
              // En una implementación real, esto redirigiría a una página de gestión de usuarios
              alert('Funcionalidad de actualización de contraseñas próximamente disponible');
            }
          },
          dismissible: false
        });
        score -= 30;
      }

      // Verificar productos sin imágenes
      const products = JSON.parse(localStorage.getItem("products") || "[]");
      const productsWithoutImages = products.filter((product: any) =>
        !product.images || product.images.length === 0
      );

      if (productsWithoutImages.length > 0) {
        newAlerts.push({
          id: 'missing-images',
          type: 'info',
          title: 'Productos sin imágenes',
          message: `${productsWithoutImages.length} producto(s) no tienen imágenes. Las imágenes ayudan a aumentar la confianza de los compradores.`,
          dismissible: true
        });
        score -= 10;
      }

      // Verificar mensajes no leídos antiguos
      const messages = JSON.parse(localStorage.getItem("messages") || "[]");
      const oldUnreadMessages = messages.filter((msg: any) =>
        !msg.read && new Date(msg.timestamp) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      );

      if (oldUnreadMessages.length > 0) {
        newAlerts.push({
          id: 'old-messages',
          type: 'warning',
          title: 'Mensajes antiguos sin leer',
          message: `Tienes ${oldUnreadMessages.length} mensaje(s) sin leer de más de una semana.`,
          dismissible: true
        });
        score -= 15;
      }

      // Verificar backup de datos (simulado)
      const lastBackup = localStorage.getItem("lastBackup");
      if (!lastBackup || new Date(lastBackup) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)) {
        newAlerts.push({
          id: 'backup-reminder',
          type: 'info',
          title: 'Recordatorio de respaldo',
          message: 'Hace más de 30 días que no se realiza un respaldo de los datos.',
          action: {
            label: 'Crear respaldo',
            onClick: () => {
              const backup = {
                users: localStorage.getItem("users"),
                products: localStorage.getItem("products"),
                messages: localStorage.getItem("messages"),
                timestamp: new Date().toISOString()
              };
              localStorage.setItem("backup", JSON.stringify(backup));
              localStorage.setItem("lastBackup", new Date().toISOString());
              alert('Respaldo creado exitosamente');
              checkSecurity(); // Recargar alertas
            }
          },
          dismissible: true
        });
        score -= 20;
      }

      // Verificar HTTPS (simulado - en producción verificaría la URL actual)
      if (window.location.protocol !== 'https:') {
        newAlerts.push({
          id: 'https-warning',
          type: 'warning',
          title: 'Conexión no segura',
          message: 'El sitio no está usando HTTPS. Considera implementar SSL para proteger los datos de los usuarios.',
          dismissible: false
        });
        score -= 25;
      }

      setAlerts(newAlerts);
      setSecurityScore(Math.max(0, score));
    };

    checkSecurity();
  }, []);

  const dismissAlert = (alertId: string) => {
    setAlerts(alerts.filter(alert => alert.id !== alertId));
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'error': return <X className="h-4 w-4 text-red-600" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      default: return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Puntaje de Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-bold ${getScoreColor(securityScore)}`}>
              {securityScore}
            </div>
            <div className="flex-1">
              <div className={`h-3 rounded-full ${getScoreBgColor(securityScore)}`}>
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    securityScore >= 80 ? 'bg-green-600' :
                    securityScore >= 60 ? 'bg-yellow-600' : 'bg-red-600'
                  }`}
                  style={{ width: `${securityScore}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-2">
                {securityScore >= 80 ? 'Excelente seguridad' :
                 securityScore >= 60 ? 'Seguridad aceptable' : 'Requiere atención inmediata'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Alertas de Seguridad</CardTitle>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Todo está seguro</h3>
              <p className="text-muted-foreground">No se encontraron problemas de seguridad.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Alert key={alert.id} className="relative">
                  <div className="flex items-start gap-3">
                    {getAlertIcon(alert.type)}
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{alert.title}</h4>
                      <AlertDescription className="mt-1">
                        {alert.message}
                      </AlertDescription>
                      {alert.action && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={alert.action.onClick}
                        >
                          {alert.action.label}
                        </Button>
                      )}
                    </div>
                    {alert.dismissible && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => dismissAlert(alert.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Consejos de Seguridad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Usa contraseñas fuertes</h4>
                <p className="text-sm text-muted-foreground">
                  Combina letras mayúsculas, minúsculas, números y caracteres especiales.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Verifica identidades</h4>
                <p className="text-sm text-muted-foreground">
                  Antes de realizar transacciones, verifica la identidad de la otra parte.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">No compartas información sensible</h4>
                <p className="text-sm text-muted-foreground">
                  Evita compartir contraseñas, datos bancarios o información personal por mensaje.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-foreground">Realiza respaldos regularmente</h4>
                <p className="text-sm text-muted-foreground">
                  Mantén copias de seguridad de tus datos importantes.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SecurityDashboard;