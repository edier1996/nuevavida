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
    <footer className="mt-12 px-4 pb-8">
      <div className="container mx-auto rounded-3xl bg-gradient-to-b from-emerald-800 to-emerald-900 px-6 py-12 text-white shadow-lg md:px-12 md:py-16">
        {/* Header with Logo and Title */}
        <div className="mb-12 flex flex-col items-start gap-6 md:flex-row md:items-center md:gap-8">
          <img src={logo} alt="Nueva Vida" className="h-20 w-20 rounded-2xl object-cover md:h-24 md:w-24" />
          <div>
            <p className="mb-1 text-sm font-bold uppercase tracking-widest text-emerald-200">Comunidad Nueva Vida</p>
            <h2 className="mb-3 text-4xl font-bold text-white">Nueva Vida</h2>
            <p className="max-w-2xl text-base leading-relaxed text-white/90">
              Plataforma solidaria que transforma donaciones en esperanza. Somos un{" "}
              <span className="font-semibold text-emerald-300">movimiento social, ambiental, educativo y humanitario</span> que construye un mundo mejor.
            </p>
          </div>
        </div>

        {/* Pillars Section */}
        <div className="mb-10">
          <p className="mb-6 text-sm font-bold uppercase tracking-widest text-emerald-200">
            Economía circular con impacto local
          </p>
          <div className="grid gap-4 md:grid-cols-4">
            {pillars.map((pillar, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-emerald-400/50 bg-emerald-700/40 p-4 text-center backdrop-blur-sm"
              >
                <div className="mb-2 text-3xl">{pillar.icon}</div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-emerald-100">
                  {pillar.title}
                </h3>
                <p className="text-xs leading-relaxed text-white/80">{pillar.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="mb-8 text-center">
          <p className="text-base font-semibold text-white">
            💚 <span className="text-emerald-300">Pequeñas acciones, gran impacto.</span>{" "}
            <span className="text-emerald-200">Juntos hacemos un mundo mejor.</span>
          </p>
        </div>

        {/* Copyright */}
        <div className="border-t border-emerald-400/30 pt-6 text-center text-xs text-white/70">
          <p>© 1327 Nueva Vida. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
