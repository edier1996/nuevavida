import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, MessageCircle, Heart, DollarSign, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface Notification {
  id: string;
  type: "message" | "favorite" | "sale" | "system";
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
  metadata?: any;
}

const NotificationsDropdown = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Cargar notificaciones del localStorage
    const storageKey = `notifications_${user.id}`;
    const stored = JSON.parse(localStorage.getItem(storageKey) || "[]");
    setNotifications(stored);
    setUnreadCount(stored.filter((n: Notification) => !n.read).length);

    // Escuchar cambios en mensajes para crear notificaciones
    const checkForNewMessages = () => {
      const messages = JSON.parse(localStorage.getItem("messages") || "[]");
      const userMessages = messages.filter((msg: any) =>
        (msg.to === user.id || msg.to === user.email) && !msg.read
      );

      userMessages.forEach((msg: any) => {
        const existingNotification = stored.find((n: Notification) =>
          n.type === "message" && n.metadata?.messageId === msg.id
        );

        if (!existingNotification) {
          const newNotification: Notification = {
            id: `msg_${msg.id}`,
            type: "message",
            title: "Nuevo mensaje",
            message: `Tienes un mensaje sobre "${msg.subject}"`,
            read: false,
            createdAt: new Date().toISOString(),
            actionUrl: "/mensajes",
            metadata: { messageId: msg.id, from: msg.from }
          };

          stored.unshift(newNotification);
          setNotifications([...stored]);
          setUnreadCount(prev => prev + 1);
        }
      });

      localStorage.setItem(storageKey, JSON.stringify(stored));
    };

    // Verificar mensajes cada 30 segundos
    const interval = setInterval(checkForNewMessages, 30000);
    checkForNewMessages(); // Verificar inmediatamente

    return () => clearInterval(interval);
  }, [user]);

  const markAsRead = (notificationId: string) => {
    const updated = notifications.map(n =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.read).length);
    if (user) localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
    if (user) localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
  };

  const deleteNotification = (notificationId: string) => {
    const updated = notifications.filter(n => n.id !== notificationId);
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.read).length);
    if (user) localStorage.setItem(`notifications_${user.id}`, JSON.stringify(updated));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "message":
        return <MessageCircle className="h-4 w-4" />;
      case "favorite":
        return <Heart className="h-4 w-4" />;
      case "sale":
        return <DollarSign className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  if (!user) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Notificaciones</CardTitle>
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                  Marcar todas como leídas
                </Button>
              )}
            </div>
            <CardDescription>
              {unreadCount > 0
                ? `Tienes ${unreadCount} notificación${unreadCount !== 1 ? 'es' : ''} sin leer`
                : "No tienes notificaciones nuevas"
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-80">
              {notifications.length > 0 ? (
                <div className="space-y-1">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`flex items-start gap-3 p-3 hover:bg-muted/50 cursor-pointer border-l-2 ${
                        !notification.read
                          ? "border-l-primary bg-primary/5"
                          : "border-l-transparent"
                      }`}
                      onClick={() => {
                        if (!notification.read) markAsRead(notification.id);
                        if (notification.actionUrl) {
                          window.location.href = notification.actionUrl;
                        }
                      }}
                    >
                      <div className={`mt-0.5 ${!notification.read ? "text-primary" : "text-muted-foreground"}`}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-start justify-between">
                          <p className={`text-sm font-medium ${!notification.read ? "text-foreground" : "text-muted-foreground"}`}>
                            {notification.title}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.createdAt).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No tienes notificaciones
                  </p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationsDropdown;