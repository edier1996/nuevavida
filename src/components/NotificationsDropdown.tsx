import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, MessageCircle, Heart, DollarSign, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  deleteNotificationById,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  syncNotification,
  type NotificationItem,
} from "@/lib/notification-api";
import { fetchConversations, fetchConversationMessages } from "@/lib/messaging-api";

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

const toUiNotification = (item: NotificationItem): Notification => ({
  id: item.id,
  type: item.type === "message" || item.type === "favorite" || item.type === "sale" ? item.type : "system",
  title: item.title,
  message: item.message,
  read: item.read,
  createdAt: item.createdAt,
  actionUrl: item.actionUrl || undefined,
  metadata: item.metadata,
});

const NotificationsDropdown = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !localStorage.getItem("auth_token")) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    let cancelled = false;

    const loadNotifications = async () => {
      try {
        const data = await fetchNotifications(user.id);
        if (cancelled) return;
        const parsed = data.map(toUiNotification);
        setNotifications(parsed);
        setUnreadCount(parsed.filter((item) => !item.read).length);
      } catch {
        if (cancelled) return;
        setNotifications([]);
        setUnreadCount(0);
      }
    };

    const syncUnreadMessages = async () => {
      try {
        const conversations = await fetchConversations(user.id);
        const bundles = await Promise.all(
          conversations.map((conversation) =>
            fetchConversationMessages(conversation.id).catch(() => ({ messages: [] }))
          )
        );

        const unreadIncomingMessages = bundles.flatMap((bundle) => {
          const list = Array.isArray(bundle.messages) ? bundle.messages : [];
          return list.filter((message) => message.senderId !== user.id && !message.read);
        });

        await Promise.all(
          unreadIncomingMessages.map((message) =>
            syncNotification({
              userId: user.id,
              type: "message",
              title: "Nuevo mensaje",
              message: `${message.senderName || "Tienes"} te envió un nuevo mensaje.`,
              actionUrl: "/mensajes",
              externalKey: `message-${message.id}`,
              metadata: {
                conversationId: message.conversationId,
                messageId: message.id,
                senderId: message.senderId,
              },
            }).catch(() => null)
          )
        );
      } finally {
        await loadNotifications();
      }
    };

    void syncUnreadMessages();
    const interval = setInterval(() => {
      void syncUnreadMessages();
    }, 15000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  const markAsRead = async (notificationId: string) => {
    await markNotificationAsRead(notificationId);
    const updated = notifications.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    setNotifications(updated);
    setUnreadCount(updated.filter((n) => !n.read).length);
  };

  const markAllAsRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.id);
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
    setUnreadCount(0);
  };

  const deleteNotification = async (notificationId: string) => {
    await deleteNotificationById(notificationId);
    const updated = notifications.filter(n => n.id !== notificationId);
    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.read).length);
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
                      onClick={async () => {
                        if (!notification.read) await markAsRead(notification.id);
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
                            onClick={async (e) => {
                              e.stopPropagation();
                              await deleteNotification(notification.id);
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