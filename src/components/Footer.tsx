import { Link } from "react-router-dom";
import logo from "@/assets/logo.jpeg";

const Footer = () => {
  const pillars = [
    {
      icon: "👥",
      title: "MOVIMIENTO SOCIAL",
      description: "Unimos personas para ayudar a más familias.",
    },
    {
      icon: "🌱",
      title: "AMBIENTAL",
      description: "Reutilizamos y reducimos lo que va a la basura.",
    },
    {
      icon: "📚",
      title: "EDUCATIVO",
      description: "Formamos conciencia para un futuro mejor.",
    },
    {
      icon: "💚",
      title: "HUMANITARIO",
      description: "Dignidad, solidaridad y amor en cada entrega.",
    },
  ];

  return (
    <footer className="mt-10 px-4 pb-6">
      <div className="container mx-auto rounded-[1.75rem] border border-white/70 bg-[linear-gradient(135deg,rgba(58,96,70,0.96),rgba(113,77,47,0.94))] px-5 py-7 text-white shadow-[0_20px_56px_rgba(42,60,48,0.22)] md:px-8 md:py-8">
        <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr_0.8fr_0.8fr]">
          {/* Left Column - Pillars Section */}
          <div>
            <Link to="/" className="flex items-center gap-2.5 mb-3">
              <img src={logo} alt="Nueva Vida" className="h-9 w-9 rounded-lg border border-white/30 object-cover" />
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-white/70">Comunidad Nueva Vida</p>
                <span className="text-sm font-semibold tracking-tight text-white">Nueva Vida</span>
              </div>
            </Link>
            <p className="text-[11px] leading-4 text-white/80 mb-1.5">
              Plataforma solidaria que transforma donaciones en esperanza. Somos un{" "}
              <span className="font-semibold text-emerald-300">movimiento social, ambiental, educativo y humanitario</span> que construye un mundo mejor.
            </p>
            <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-white/75 mb-1.5">
              Economía circular con impacto local
            </p>
            <div className="grid grid-cols-4 gap-1">
              {pillars.map((pillar, idx) => (
                <div key={idx} className="rounded-sm border border-emerald-400/40 bg-emerald-800/30 p-1 text-center">
                  <div className="text-xs">{pillar.icon}</div>
                  <h4 className="font-bold uppercase tracking-wider text-emerald-200 text-[7px] leading-tight mt-0.5">
                    {pillar.title.split(" ")[0]}
                  </h4>
                  <p className="text-[6px] leading-tight text-white/70 mt-0.5 line-clamp-2">{pillar.description}</p>
                </div>
              ))}
            </div>
            <p className="text-[9px] font-semibold text-center mt-1.5 text-emerald-300">
              💚 Pequeñas acciones, gran impacto.
            </p>
          </div>
          
          {/* Platform Links */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Plataforma</h4>
            <ul className="space-y-1.5 text-sm text-white/82">
              <li><Link to="/explorar" className="transition-colors hover:text-white">Explorar</Link></li>
              <li><Link to="/publicar" className="transition-colors hover:text-white">Publicar objeto</Link></li>
              <li><Link to="/categorias" className="transition-colors hover:text-white">Categorias</Link></li>
            </ul>
          </div>
          
          {/* Community Links */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Comunidad</h4>
            <ul className="space-y-1.5 text-sm text-white/82">
              <li><Link to="/sobre" className="transition-colors hover:text-white">Sobre nosotros</Link></li>
              <li><Link to="/contacto" className="transition-colors hover:text-white">Contacto</Link></li>
              <li><Link to="/transparencia" className="transition-colors hover:text-white">Transparencia</Link></li>
            </ul>
          </div>
          
          {/* Legal Links */}
          <div>
            <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">Legal</h4>
            <ul className="space-y-1.5 text-sm text-white/82">
              <li><Link to="/privacidad" className="transition-colors hover:text-white">Privacidad</Link></li>
              <li><Link to="/terminos" className="transition-colors hover:text-white">Terminos</Link></li>
              <li><Link to="/cookies" className="transition-colors hover:text-white">Cookies</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-7 flex flex-col gap-2 pt-4 text-[11px] text-white/65 md:flex-row md:items-center md:justify-between">
          <p>© 1327 Nueva Vida. Todos los derechos reservados.</p>
          <p>Juntos hacemos un mundo mejor.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
