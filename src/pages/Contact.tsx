import Header from "@/components/Header";

const Contact = () => (
  <main className="min-h-screen bg-background">
    <Header />
    <section className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-semibold text-foreground">Contacto</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Si tienes preguntas, sugerencias o necesitas ayuda, escríbenos y te responderemos
        a la brevedad.
      </p>

      <div className="mt-8 space-y-4 text-sm text-muted-foreground">
        <p>
          <strong>Email:</strong> <a className="text-primary" href="mailto:soporte@nuevavida.example">soporte@nuevavida.example</a>
        </p>
        <p>
          <strong>Horario de atención:</strong> Lunes a viernes, 9:00 - 18:00 (GMT-5)
        </p>
        <p>
          También puedes usar el chat interno de la plataforma para contactar al vendedor
          de un producto directamente desde la página del producto.
        </p>
      </div>
    </section>
  </main>
);

export default Contact;
