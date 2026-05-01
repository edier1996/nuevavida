import { Link } from "react-router-dom";
import { Recycle } from "lucide-react";
import logo from "@/assets/logo.jpeg";

const Footer = () => {
  return (
    <footer className="mt-10 px-4 pb-6">
      <div className="container mx-auto rounded-[1.75rem] border border-white/70 bg-[linear-gradient(135deg,rgba(58,96,70,0.96),rgba(113,77,47,0.94))] px-5 py-7 text-white shadow-[0_20px_56px_rgba(42,60,48,0.22)] md:px-8 md:py-8">
        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <img src={logo} alt="Nueva Vida" className="h-11 w-11 rounded-xl border border-white/30 object-cover" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">Comunidad Nueva Vida</p>
                <span className="text-lg font-semibold tracking-tight text-white">Nueva Vida</span>
              </div>
            </Link>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/80">
              Plataforma solidaria para reutilizar objetos con criterio social y reducir desperdicio en la comunidad.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/80">
              <Recycle className="h-3 w-3" strokeWidth={2.5} />
              Economia circular con impacto local
            </div>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Plataforma</h4>
            <ul className="space-y-1.5 text-sm text-white/82">
              <li><Link to="/explorar" className="transition-colors hover:text-white">Explorar</Link></li>
              <li><Link to="/publicar" className="transition-colors hover:text-white">Publicar objeto</Link></li>
              <li><Link to="/categorias" className="transition-colors hover:text-white">Categorias</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Comunidad</h4>
            <ul className="space-y-1.5 text-sm text-white/82">
              <li><Link to="/sobre" className="transition-colors hover:text-white">Sobre nosotros</Link></li>
              <li><Link to="/contacto" className="transition-colors hover:text-white">Contacto</Link></li>
              <li><Link to="/transparencia" className="transition-colors hover:text-white">Transparencia</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Legal</h4>
            <ul className="space-y-1.5 text-sm text-white/82">
              <li><Link to="/privacidad" className="transition-colors hover:text-white">Privacidad</Link></li>
              <li><Link to="/terminos" className="transition-colors hover:text-white">Terminos</Link></li>
              <li><Link to="/cookies" className="transition-colors hover:text-white">Cookies</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-7 flex flex-col gap-2 border-t border-white/15 pt-4 text-[11px] text-white/65 md:flex-row md:items-center md:justify-between">
          <p>© 1327 Nueva Vida. Todos los derechos reservados.</p>
          <div className="flex items-center gap-1">
            <Recycle className="h-3 w-3 text-white/80" strokeWidth={2.5} />
            Promoviendo la reutilizacion responsable
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
