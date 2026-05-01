import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Search, Plus, Menu, X, Heart, MessageCircle, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import logo from "@/assets/logo.jpeg";
import { fetchConversations, fetchConversationMessages } from "@/lib/messaging-api";

const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const { user, logout, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const updateUnreadCount = async () => {
      try {
        const conversations = await fetchConversations(user.id);
        const bundles = await Promise.all(
          conversations.map((conv) => fetchConversationMessages(conv.id).catch(() => ({ messages: [] })))
        );
        const unread = bundles.reduce((acc, bundle) => {
          const list = Array.isArray(bundle.messages) ? bundle.messages : [];
          return acc + list.filter((msg) => msg.senderId !== user.id && !msg.read).length;
        }, 0);
        setUnreadMessages(unread);
      } catch {
        setUnreadMessages(0);
      }
    };

    updateUnreadCount();
    const interval = setInterval(updateUnreadCount, 10000);

    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  return (
    <header className="sticky top-0 z-50 bg-card/80 backdrop-blur-xl nav-shadow">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img src={logo} alt="Nueva Vida" className="h-16 w-16 rounded-lg" />
        </Link>

        {/* Desktop Search */}
        <div className="hidden max-w-md flex-1 px-8 md:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2.5} />
            <input
              type="text"
              placeholder="Buscar productos..."
              className="w-full rounded-lg bg-secondary py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-2 md:flex">
          <Link to="/explorar">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              Explorar
            </Button>
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/favoritos">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                  <Heart className="h-5 w-5" strokeWidth={2.5} />
                </Button>
              </Link>
              <Link to="/mensajes">
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground relative">
                  <MessageCircle className="h-5 w-5" strokeWidth={2.5} />
                  {unreadMessages > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </Badge>
                  )}
                </Button>
              </Link>
              <NotificationsDropdown />
            </>
          )}
          {isAuthenticated ? (
            <div className="flex items-center gap-2">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Dashboard
                </Button>
              </Link>
              <Link to="/mis-solicitudes">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Mis solicitudes
                </Button>
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    Admin
                  </Button>
                </Link>
              )}
              {user?.role === 'worker' && (
                <Link to="/worker">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    Soporte
                  </Button>
                </Link>
              )}
              <Link to="/perfil">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  {user?.name}
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground hover:text-foreground">
                <LogOut className="h-5 w-5" strokeWidth={2.5} />
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm">
                Iniciar sesión
              </Button>
            </Link>
          )}
          {isAuthenticated && (
            <Link to="/publicar">
              <Button size="sm" className="ml-2 gap-1.5">
                <Plus className="h-4 w-4" strokeWidth={2.5} />
                Publicar
              </Button>
            </Link>
          )}
        </nav>

        {/* Mobile menu toggle */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-card md:hidden"
          >
            <div className="container mx-auto space-y-3 px-4 pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2.5} />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  className="w-full rounded-lg bg-secondary py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Link to="/explorar" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">Explorar</Link>
                {isAuthenticated && (
                  <>
                    <Link to="/favoritos" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">Favoritos</Link>
                    <Link to="/mensajes" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">Mensajes</Link>
                    <Link to="/dashboard" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">Dashboard</Link>
                    <Link to="/mis-solicitudes" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">Mis solicitudes</Link>
                    <Link to="/perfil" className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground">Mi Perfil</Link>
                  </>
                )}
              </div>
              {isAuthenticated ? (
                <>
                  <Link to="/publicar">
                    <Button className="w-full gap-1.5">
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                      Publicar objeto
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full" onClick={logout}>
                    Cerrar sesión
                  </Button>
                </>
              ) : (
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    Iniciar sesión
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
