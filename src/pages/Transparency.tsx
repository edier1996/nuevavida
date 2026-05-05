import Header from "@/components/Header";

const Transparency = () => (
  <main className="min-h-screen bg-background">
    <Header />
    <article className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-foreground">Marco Legal y Ambiental</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Nueva Vida se fundamenta en principios legales y ambientales reconocidos a nivel nacional e internacional, que promueven la sostenibilidad, la reducción de residuos y la economía circular.
      </p>

      <div className="mt-8 space-y-8 text-sm text-muted-foreground">

        <div>
          <p className="font-semibold text-foreground text-base">Referentes Internacionales</p>
          <p className="mt-2 font-medium text-foreground">Objetivos de Desarrollo Sostenible (ODS) — ONU</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li><strong>ODS 11:</strong> Ciudades y comunidades sostenibles</li>
            <li><strong>ODS 12:</strong> Producción y consumo responsable</li>
            <li><strong>ODS 13:</strong> Acción por el clima</li>
          </ul>
          <p className="mt-3">El <strong>Programa de las Naciones Unidas para el Medio Ambiente</strong> promueve la economía circular y la gestión responsable de residuos, principios clave de Nueva Vida.</p>
        </div>

        <div>
          <p className="font-semibold text-foreground text-base">Marco Legal en Colombia</p>
          <div className="mt-3 space-y-3">
            <div className="rounded-lg bg-card border border-border p-3">
              <p className="font-medium text-foreground">Ley 99 de 1993</p>
              <p className="mt-1">Establece el Ministerio de Ambiente y regula la protección del medio ambiente. Respalda iniciativas que reduzcan el impacto ambiental, como Nueva Vida.</p>
            </div>
            <div className="rounded-lg bg-card border border-border p-3">
              <p className="font-medium text-foreground">Ley 142 de 1994</p>
              <p className="mt-1">Regula el manejo de residuos sólidos. Nueva Vida ayuda a disminuir la carga de residuos que llegan a los sistemas de recolección.</p>
            </div>
            <div className="rounded-lg bg-card border border-border p-3">
              <p className="font-medium text-foreground">Ley 1672 de 2013</p>
              <p className="mt-1">Promueve la gestión responsable de residuos electrónicos. Aplica cuando en la plataforma se donan dispositivos electrónicos.</p>
            </div>
            <div className="rounded-lg bg-card border border-border p-3">
              <p className="font-medium text-foreground">Ley 1480 de 2011</p>
              <p className="mt-1">Protege los derechos de los usuarios. Garantiza transparencia y responsabilidad en las interacciones dentro de la plataforma.</p>
            </div>
            <div className="rounded-lg bg-card border border-border p-3">
              <p className="font-medium text-foreground">Ley 1581 de 2012</p>
              <p className="mt-1">Regula el manejo de datos personales. Aplica directamente a la privacidad de los usuarios de Nueva Vida.</p>
            </div>
          </div>
        </div>

        <div>
          <p className="font-semibold text-foreground text-base">Principio Clave: Economía Circular</p>
          <p className="mt-2">Nueva Vida se basa en el concepto de <strong>economía circular</strong>, un modelo que busca:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Reducir residuos</li>
            <li>Reutilizar productos</li>
            <li>Extender la vida útil de los objetos</li>
          </ul>
          <p className="mt-2">En lugar de desechar, se reintegra al ciclo de uso.</p>
        </div>

        <div>
          <p className="font-semibold text-foreground text-base">Justificación Global</p>
          <p className="mt-2">El medio ambiente es un sistema global que afecta a toda la humanidad. La reducción de residuos en un municipio tiene impacto acumulativo a nivel regional y mundial. Nueva Vida contribuye a:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Disminuir la contaminación global</li>
            <li>Reducir emisiones asociadas a la producción de nuevos bienes</li>
            <li>Promover hábitos sostenibles en la sociedad</li>
          </ul>
        </div>

        <div className="rounded-xl bg-primary/10 border border-primary/20 p-5">
          <p className="font-semibold text-foreground">Conclusión Legal</p>
          <p className="mt-2">Nueva Vida está alineada con normativas ambientales nacionales, principios internacionales de sostenibilidad, y derechos del consumidor y protección de datos. Es un proyecto legalmente respaldado, ambientalmente responsable y socialmente necesario.</p>
        </div>

      </div>
    </article>
  </main>
);

export default Transparency;
