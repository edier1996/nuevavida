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
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/75 backdrop-blur-xl nav-shadow">
      <div className="container mx-auto flex items-center justify-between gap-3 px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 rounded-2xl border border-border/70 bg-white/80 px-2.5 py-2 transition-transform duration-200 hover:-translate-y-0.5">
          <img src={logo} alt="Nueva Vida" className="h-12 w-12 rounded-2xl object-cover" />
          <div className="hidden sm:block">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/75">Comunidad activa</p>
            <p className="text-base font-bold text-foreground">Nueva Vida</p>
          </div>
        </Link>

        {/* Desktop Search */}
        <div className="hidden max-w-xl flex-1 px-4 lg:block">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2.5} />
            <input
              type="text"
              placeholder="Busca muebles, ropa, tecnologia o ayudas disponibles"
              className="w-full rounded-full border border-border/80 bg-white/80 py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/explorar">
            <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:bg-white/70 hover:text-foreground">
              Explorar
            </Button>
          </Link>
          {isAuthenticated && (
            <>
              <Link to="/favoritos">
                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:bg-white/70 hover:text-foreground">
                  <Heart className="h-5 w-5" strokeWidth={2.5} />
                </Button>
              </Link>
              <Link to="/mensajes">
                <Button variant="ghost" size="icon" className="relative rounded-full text-muted-foreground hover:bg-white/70 hover:text-foreground">
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
                <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:bg-white/70 hover:text-foreground">
                  Dashboard
                </Button>
              </Link>
              <Link to="/mis-solicitudes">
                <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:bg-white/70 hover:text-foreground">
                  Mis solicitudes
                </Button>
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:bg-white/70 hover:text-foreground">
                    Admin
                  </Button>
                </Link>
              )}
              {user?.role === 'worker' && (
                <Link to="/worker">
                  <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:bg-white/70 hover:text-foreground">
                    Soporte
                  </Button>
                </Link>
              )}
              <Link to="/perfil">
                <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:bg-white/70 hover:text-foreground">
                  {user?.name}
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout} className="rounded-full text-muted-foreground hover:bg-white/70 hover:text-foreground">
                <LogOut className="h-5 w-5" strokeWidth={2.5} />
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button variant="outline" size="sm" className="rounded-full border-border/80 bg-white/80">
                Iniciar sesión
              </Button>
            </Link>
          )}
          {isAuthenticated && (
            <Link to="/publicar">
              <Button size="sm" className="ml-2 gap-1.5 rounded-full bg-accent text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent/90">
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
            className="overflow-hidden border-t border-border/70 bg-background/90 md:hidden"
          >
            <div className="container mx-auto space-y-3 px-4 pb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" strokeWidth={2.5} />
                <input
                  type="text"
                  placeholder="Buscar productos..."
                  className="w-full rounded-full border border-border/80 bg-white/80 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Link to="/explorar" className="rounded-2xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white/80 hover:text-foreground">Explorar</Link>
                {isAuthenticated && (
                  <>
                    <Link to="/favoritos" className="rounded-2xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white/80 hover:text-foreground">Favoritos</Link>
                    <Link to="/mensajes" className="rounded-2xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white/80 hover:text-foreground">Mensajes</Link>
                    <Link to="/dashboard" className="rounded-2xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white/80 hover:text-foreground">Dashboard</Link>
                    <Link to="/mis-solicitudes" className="rounded-2xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white/80 hover:text-foreground">Mis solicitudes</Link>
                    <Link to="/perfil" className="rounded-2xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white/80 hover:text-foreground">Mi Perfil</Link>
                  </>
                )}
              </div>
              {isAuthenticated ? (
                <>
                  <Link to="/publicar">
                    <Button className="w-full gap-1.5 rounded-full bg-accent text-accent-foreground hover:bg-accent/90">
                      <Plus className="h-4 w-4" strokeWidth={2.5} />
                      Publicar objeto
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full rounded-full border-border/80 bg-white/80" onClick={logout}>
                    Cerrar sesión
                  </Button>
                </>
              ) : (
                <Link to="/login">
                  <Button variant="outline" className="w-full rounded-full border-border/80 bg-white/80">
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
