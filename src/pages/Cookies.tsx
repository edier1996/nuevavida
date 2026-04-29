import Header from "@/components/Header";

const Cookies = () => (
  <main className="min-h-screen bg-background">
    <Header />
    <section className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-semibold text-foreground">Política de Cookies</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Nueva Vida utiliza cookies conforme a las buenas prácticas digitales y la normativa aplicable
        en Colombia.
      </p>

      <div className="mt-8 space-y-4 text-sm text-muted-foreground">
        <p className="font-semibold">Las cookies permiten:</p>
        <ul className="list-disc pl-5">
          <li>Mejorar la experiencia del usuario.</li>
          <li>Recordar preferencias.</li>
          <li>Analizar el comportamiento en la plataforma.</li>
        </ul>

        <p className="font-semibold">Control de cookies:</p>
        <p>
          El usuario puede aceptar, rechazar o configurar el uso de cookies desde su navegador.
        </p>
      </div>
    </section>
  </main>
);

export default Cookies;
