import { Link } from "react-router-dom";
import { Recycle } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card mt-16">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-8 md:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <span className="text-base font-bold text-primary-foreground">R</span>
              </div>
              <span className="text-lg font-semibold tracking-tight text-foreground">Nuevavida</span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Plataforma solidaria para la reutilización de objetos. Dona y encuentra lo que necesitas, sin ventas entre usuarios.
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-foreground text-sm">Plataforma</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/explorar" className="hover:text-foreground transition-colors">Explorar</Link></li>
              <li><Link to="/publicar" className="hover:text-foreground transition-colors">Publicar objeto</Link></li>
              <li><Link to="/categorias" className="hover:text-foreground transition-colors">Categorías</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-foreground text-sm">Fundación</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/sobre" className="hover:text-foreground transition-colors">Sobre nosotros</Link></li>
              <li><Link to="/contacto" className="hover:text-foreground transition-colors">Contacto</Link></li>
              <li><Link to="/transparencia" className="hover:text-foreground transition-colors">Transparencia</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 font-semibold text-foreground text-sm">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacidad" className="hover:text-foreground transition-colors">Privacidad</Link></li>
              <li><Link to="/terminos" className="hover:text-foreground transition-colors">Términos</Link></li>
              <li><Link to="/cookies" className="hover:text-foreground transition-colors">Cookies</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex items-center justify-between border-t border-secondary pt-6">
          <p className="text-xs text-muted-foreground">© 1327 Nuevavida. Todos los derechos reservados.</p>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Recycle className="h-3.5 w-3.5 text-primary" strokeWidth={2.5} />
            Promoviendo la economía circular
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
