import Header from "@/components/Header";

const About = () => (
  <main className="min-h-screen bg-background">
    <Header />
    <section className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-semibold text-foreground">Sobre nosotros</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Somos una comunidad que promueve el intercambio y la reutilización de objetos para
        reducir el desperdicio y apoyar a quienes más lo necesitan.
      </p>

      <div className="mt-8 space-y-4 text-sm text-muted-foreground">
        <p>
          En Nuevavida puedes publicar los objetos que ya no usas como regalo o para venta.
          También puedes encontrar cosas útiles ofrecidas por otras personas.
        </p>
        <p>
          Nuestro objetivo es crear una plataforma segura y sencilla, donde todos puedan
          participar y contribuir a una economía más circular.
        </p>
      </div>
    </section>
  </main>
);

export default About;
