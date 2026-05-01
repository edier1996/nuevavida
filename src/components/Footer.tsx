import { Link } from "react-router-dom";
import { Recycle } from "lucide-react";
import logo from "@/assets/logo.jpeg";

const Footer = () => {
  return (
    <footer className="mt-20 px-4 pb-8">
      <div className="container mx-auto rounded-[2rem] border border-white/70 bg-[linear-gradient(135deg,rgba(58,96,70,0.96),rgba(113,77,47,0.94))] px-6 py-10 text-white shadow-[0_24px_70px_rgba(42,60,48,0.24)] md:px-10">
        <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <Link to="/" className="flex items-center gap-3">
              <img src={logo} alt="Nueva Vida" className="h-14 w-14 rounded-2xl border border-white/30 object-cover" />
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-white/70">Fundacion 1327</p>
                <span className="text-xl font-semibold tracking-tight text-white">Nueva Vida</span>
              </div>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-7 text-white/80">
              Plataforma solidaria para reutilizar objetos con criterio social, conectar familias y reducir desperdicio en la comunidad.
            </p>
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80">
              <Recycle className="h-3.5 w-3.5" strokeWidth={2.5} />
              Economia circular con impacto local
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Plataforma</h4>
            <ul className="space-y-2 text-sm text-white/82">
              <li><Link to="/explorar" className="transition-colors hover:text-white">Explorar</Link></li>
              <li><Link to="/publicar" className="transition-colors hover:text-white">Publicar objeto</Link></li>
              <li><Link to="/categorias" className="transition-colors hover:text-white">Categorias</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Fundacion</h4>
            <ul className="space-y-2 text-sm text-white/82">
              <li><Link to="/sobre" className="transition-colors hover:text-white">Sobre nosotros</Link></li>
              <li><Link to="/contacto" className="transition-colors hover:text-white">Contacto</Link></li>
              <li><Link to="/transparencia" className="transition-colors hover:text-white">Transparencia</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-white/70">Legal</h4>
            <ul className="space-y-2 text-sm text-white/82">
              <li><Link to="/privacidad" className="transition-colors hover:text-white">Privacidad</Link></li>
              <li><Link to="/terminos" className="transition-colors hover:text-white">Terminos</Link></li>
              <li><Link to="/cookies" className="transition-colors hover:text-white">Cookies</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-white/15 pt-6 text-xs text-white/65 md:flex-row md:items-center md:justify-between">
          <p>© 1327 Nueva Vida. Todos los derechos reservados.</p>
          <div className="flex items-center gap-1">
            <Recycle className="h-3.5 w-3.5 text-white/80" strokeWidth={2.5} />
            Promoviendo la reutilizacion responsable
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
