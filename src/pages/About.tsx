import Header from "@/components/Header";
import React from "react";

const Section = ({ emoji, title, children }: { emoji: string; title: string; children: React.ReactNode }) => (
  <div className="mt-10">
    <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
      <span>{emoji}</span> {title}
    </h2>
    <div className="mt-3 space-y-3 text-sm text-muted-foreground">{children}</div>
    <hr className="mt-8 border-border" />
  </div>
);

const About = () => (
  <main className="min-h-screen bg-background">
    <Header />
    <article className="container mx-auto max-w-3xl px-4 py-16">

      {/* Hero */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold text-foreground">🌱 NUEVA VIDA</h1>
        <p className="mt-2 text-base text-muted-foreground italic">
          "Promoviendo la economía circular y el bienestar social"
        </p>
      </div>

      <hr className="border-border" />

      {/* Misión */}
      <Section emoji="🧭" title="MISIÓN">
        <p>
          Nueva Vida es una plataforma digital que conecta personas para donar, reutilizar y aprovechar objetos en buen estado, reduciendo el desperdicio y fomentando la solidaridad. Buscamos transformar lo que otros ya no usan en oportunidades para quienes lo necesitan, generando impacto social, económico y ambiental positivo.
        </p>
      </Section>

      {/* Visión */}
      <Section emoji="🔭" title="VISIÓN">
        <p>
          Ser la plataforma líder en América Latina en economía circular solidaria, reconocida por reducir el desperdicio, fortalecer comunidades y mejorar la calidad de vida de miles de personas, promoviendo una cultura donde reutilizar y compartir sea parte del día a día.
        </p>
      </Section>

      {/* Quiénes somos */}
      <Section emoji="👥" title="¿QUIÉNES SOMOS?">
        <p>
          Somos una iniciativa social y tecnológica comprometida con el bienestar de las comunidades. Nueva Vida nace con el propósito de darle una segunda oportunidad a los objetos y una primera oportunidad a muchas personas.
        </p>
        <p>
          Creemos en la solidaridad, la sostenibilidad y el poder de la comunidad para generar cambios reales. Nuestro equipo está enfocado en construir un espacio seguro, accesible y útil donde todos puedan aportar y beneficiarse.
        </p>
      </Section>

      {/* Qué es */}
      <Section emoji="💡" title="¿QUÉ ES NUEVA VIDA?">
        <p>Nueva Vida es una plataforma donde los usuarios pueden:</p>
        <ul className="list-none space-y-1 pl-2">
          <li>📦 Donar objetos que ya no usan</li>
          <li>🔍 Explorar artículos disponibles</li>
          <li>🤝 Recibir productos de forma gratuita</li>
          <li>♻️ Contribuir a reducir residuos</li>
        </ul>
        <p>Funciona como un puente entre quienes tienen algo para dar y quienes lo necesitan.</p>
      </Section>

      {/* Objetivos */}
      <Section emoji="🎯" title="OBJETIVOS">
        <p className="font-medium text-foreground">Objetivo General</p>
        <p>Promover la reutilización de bienes mediante una plataforma digital que fomente la solidaridad y reduzca el impacto ambiental.</p>
        <p className="font-medium text-foreground mt-2">Objetivos Específicos</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Reducir la cantidad de residuos que terminan en la basura</li>
          <li>Facilitar el acceso a bienes a personas con bajos recursos</li>
          <li>Fomentar la cultura de donación y reutilización</li>
          <li>Apoyar la economía familiar</li>
          <li>Crear comunidad basada en la ayuda mutua</li>
        </ul>
      </Section>

      {/* Impacto */}
      <Section emoji="🌍" title="IMPACTO DE NUEVA VIDA">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-card border border-border p-4">
            <p className="font-semibold text-foreground mb-2">Impacto Social</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Mejora la calidad de vida de personas con necesidades</li>
              <li>Fomenta la solidaridad y la empatía</li>
              <li>Fortalece el tejido comunitario</li>
            </ul>
          </div>
          <div className="rounded-lg bg-card border border-border p-4">
            <p className="font-semibold text-foreground mb-2">Impacto Económico</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Permite ahorrar dinero a quienes reciben objetos</li>
              <li>Reduce gastos en productos básicos</li>
              <li>Incentiva el consumo responsable</li>
            </ul>
          </div>
          <div className="rounded-lg bg-card border border-border p-4">
            <p className="font-semibold text-foreground mb-2">Impacto Ambiental</p>
            <ul className="list-disc pl-4 space-y-1">
              <li>Disminuye la cantidad de residuos</li>
              <li>Reduce la contaminación</li>
              <li>Promueve la economía circular</li>
            </ul>
          </div>
        </div>
      </Section>

      {/* Justificación */}
      <Section emoji="🧱" title="JUSTIFICACIÓN DE LA PLATAFORMA">
        <p>
          Actualmente, millones de objetos en buen estado son desechados diariamente, generando contaminación y desperdicio de recursos. Al mismo tiempo, muchas personas carecen de acceso a bienes básicos.
        </p>
        <p>
          Nueva Vida surge como una solución a esta problemática, permitiendo que los objetos que ya no son útiles para unos, se conviertan en una oportunidad para otros. De esta manera:
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Se evita que los productos terminen en la basura</li>
          <li>Se apoya a personas en situación de necesidad</li>
          <li>Se fomenta una cultura sostenible</li>
        </ul>
        <p>
          La plataforma no solo resuelve un problema ambiental, sino también social y económico, creando un sistema donde todos ganan.
        </p>
      </Section>

      {/* Cómo funciona */}
      <Section emoji="⚙️" title="¿CÓMO FUNCIONA?">
        <ol className="list-decimal pl-5 space-y-1">
          <li>El usuario se registra</li>
          <li>Publica un objeto que desea donar</li>
          <li>Otros usuarios exploran los artículos</li>
          <li>Una persona solicita el objeto</li>
          <li>Se coordina la entrega</li>
        </ol>
      </Section>

      {/* Valores */}
      <Section emoji="❤️" title="VALORES">
        <ul className="list-disc pl-5 space-y-1">
          <li>Solidaridad</li>
          <li>Responsabilidad social</li>
          <li>Sostenibilidad</li>
          <li>Transparencia</li>
          <li>Comunidad</li>
        </ul>
      </Section>

      {/* Lema */}
      <div className="mt-10 rounded-xl bg-primary/10 border border-primary/20 p-6 text-center">
        <p className="text-base font-semibold text-foreground">📢 LEMA</p>
        <p className="mt-2 text-lg italic text-muted-foreground">
          "Lo que ya no usas puede cambiar la vida de alguien más."
        </p>
      </div>

    </article>
  </main>
);

export default About;
