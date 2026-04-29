import Header from "@/components/Header";

const Transparency = () => (
  <main className="min-h-screen bg-background">
    <Header />
    <section className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-semibold text-foreground">Transparencia</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Nueva Vida garantiza la gestión transparente de sus actividades, conforme a lo establecido en:
      </p>

      <div className="mt-6 space-y-2 text-sm text-muted-foreground">
        <p className="font-semibold">• Ley 1712 de 2014 (Ley de Transparencia y del Derecho de Acceso a la Información Pública)</p>
        <p className="font-semibold">• Régimen tributario especial para ESAL (Estatuto Tributario Art. 19 y siguientes)</p>
      </div>

      <div className="mt-8 space-y-4 text-sm text-muted-foreground">
        <p className="font-semibold">Nos comprometemos a:</p>
        <ul className="list-disc pl-5">
          <li>Publicar información clara sobre el uso de recursos.</li>
          <li>Informar sobre las comisiones generadas (5% en ventas).</li>
          <li>Rendir cuentas sobre el impacto social de la plataforma.</li>
        </ul>
      </div>
    </section>
  </main>
);

export default Transparency;
