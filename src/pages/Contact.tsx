import Header from "@/components/Header";

const Contact = () => (
  <main className="min-h-screen bg-background">
    <Header />
    <article className="container mx-auto max-w-2xl px-4 py-16">
      <h1 className="text-3xl font-bold text-foreground">📞 Contacto</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Si tienes preguntas, sugerencias o necesitas ayuda, comunícate con nosotros por cualquiera de estos medios.
      </p>

      <div className="mt-8 rounded-xl bg-card border border-border p-6 space-y-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="text-xl">📧</span>
          <div>
            <p className="font-medium text-foreground">Correo electrónico</p>
            <a href="mailto:nuevavida1327@gmail.com" className="text-primary underline">nuevavida1327@gmail.com</a>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl">📱</span>
          <div>
            <p className="font-medium text-foreground">Teléfono</p>
            <p>3136320309</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl">📷</span>
          <div>
            <p className="font-medium text-foreground">Instagram</p>
            <p>nuevavida</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl">▶️</span>
          <div>
            <p className="font-medium text-foreground">YouTube</p>
            <a href="https://www.youtube.com/channel/UCCZ0CRGcRK9SPlStYaF-9WA" target="_blank" rel="noopener noreferrer" className="text-primary underline">Canal Nueva Vida</a>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xl">📍</span>
          <div>
            <p className="font-medium text-foreground">Ubicación</p>
            <p>Apartadó, Antioquia — Sede principal</p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        También puedes usar el chat interno de la plataforma para contactar directamente con un publicador desde la página del producto.
      </p>
    </article>
  </main>
);

export default Contact;
