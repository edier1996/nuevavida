import Header from "@/components/Header";

const Terms = () => (
  <main className="min-h-screen bg-background">
    <Header />
    <section className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-semibold text-foreground">Términos y Condiciones</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        El uso de la plataforma implica la aceptación de los presentes términos, conforme a la legislación
        colombiana vigente.
      </p>

      <div className="mt-8 space-y-4 text-sm text-muted-foreground">
        <p className="font-semibold">Condiciones principales:</p>
        <ul className="list-disc pl-5">
          <li>Los usuarios son responsables de la veracidad de la información publicada.</li>
          <li>Los objetos ofrecidos deben cumplir con condiciones legales y éticas.</li>
          <li>Nueva Vida actúa como intermediaria tecnológica.</li>
        </ul>

        <p className="font-semibold">Comisión:</p>
        <p>
          Se aplicará una comisión del <strong>5%</strong> sobre las ventas realizadas, destinada al
          sostenimiento de la plataforma. No se aplicarán comisiones a los objetos donados.
        </p>

        <p className="font-semibold">Marco legal:</p>
        <p>
          Estos términos se rigen por:
        </p>
        <ul className="list-disc pl-5">
          <li>Código de Comercio Colombiano.</li>
          <li>Ley 1480 de 2011 (Estatuto del Consumidor).</li>
        </ul>
      </div>
    </section>
  </main>
);

export default Terms;
