import Header from "@/components/Header";

const Cookies = () => (
  <main className="min-h-screen bg-background">
    <Header />
    <article className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-foreground">🍪 Política de Cookies</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Nueva Vida utiliza cookies para mejorar la experiencia de los usuarios en la plataforma, conforme a las buenas prácticas digitales y la normativa aplicable en Colombia.
      </p>

      <div className="mt-8 space-y-6 text-sm text-muted-foreground">

        <div>
          <p className="font-semibold text-foreground">¿Qué son las cookies?</p>
          <p className="mt-2">Las cookies son pequeños archivos de texto que se almacenan en el dispositivo del usuario cuando visita un sitio web. Permiten que el sitio recuerde información sobre su visita.</p>
        </div>

        <div>
          <p className="font-semibold text-foreground">¿Para qué usamos cookies?</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Mejorar la navegación dentro de la plataforma</li>
            <li>Recordar preferencias del usuario</li>
            <li>Analizar el uso de la plataforma para mejoras continuas</li>
            <li>Mantener la sesión activa del usuario</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-foreground">Control de cookies</p>
          <p className="mt-2">El usuario puede configurar su navegador para rechazar cookies. Sin embargo, esto puede afectar el funcionamiento correcto de algunos servicios de la plataforma.</p>
          <p className="mt-2">La mayoría de navegadores permiten gestionar las cookies desde su configuración de privacidad o seguridad.</p>
        </div>

        <div className="rounded-lg bg-card border border-border p-4">
          <p className="font-semibold text-foreground">📬 Contacto</p>
          <p className="mt-1">Para consultas sobre el uso de cookies, contáctenos en: <a href="mailto:nuevavida1327@gmail.com" className="text-primary underline">nuevavida1327@gmail.com</a></p>
        </div>

      </div>
    </article>
  </main>
);

export default Cookies;
