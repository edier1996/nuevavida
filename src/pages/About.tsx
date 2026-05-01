import Header from "@/components/Header";

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

      <hr className="mt-10 border-border" />

      {/* Política de Privacidad */}
      <Section emoji="🔐" title="POLÍTICA DE PRIVACIDAD">
        <p className="text-xs text-muted-foreground">Última actualización: Abril 2026</p>
        <p>En Nueva Vida, respetamos y protegemos la privacidad de nuestros usuarios. Esta Política de Privacidad explica cómo recopilamos, usamos, almacenamos y protegemos su información personal cuando utiliza nuestra plataforma.</p>

        <p className="font-semibold text-foreground mt-4">1. 📌 Información que recopilamos</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Nombre completo, correo electrónico, número de teléfono, ubicación</li>
          <li>Información de perfil y publicaciones</li>
          <li>Datos automáticos: IP, dispositivo, navegador, actividad en la plataforma</li>
        </ul>

        <p className="font-semibold text-foreground mt-4">2. 🎯 Uso de la información</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Registro y acceso a la plataforma</li>
          <li>Conexión entre usuarios (donantes y receptores)</li>
          <li>Mejorar la experiencia del usuario</li>
          <li>Gestionar publicaciones y solicitudes</li>
          <li>Enviar notificaciones importantes</li>
          <li>Prevenir fraudes o actividades indebidas</li>
        </ul>

        <p className="font-semibold text-foreground mt-4">3. 🤝 Compartición de información</p>
        <p>Nueva Vida no vende ni alquila datos personales. Podemos compartir información entre usuarios para coordinar entregas, con proveedores tecnológicos o cuando sea requerido por ley.</p>

        <p className="font-semibold text-foreground mt-4">4. 🔒 Protección de datos</p>
        <p>Implementamos medidas de seguridad técnicas y organizativas contra acceso no autorizado, pérdida, alteración o uso indebido de datos.</p>

        <p className="font-semibold text-foreground mt-4">5. 🍪 Uso de Cookies</p>
        <p>Utilizamos cookies para mejorar la navegación, recordar preferencias y analizar el uso de la plataforma.</p>

        <p className="font-semibold text-foreground mt-4">6. 👤 Derechos del usuario</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Acceder a sus datos personales</li>
          <li>Solicitar corrección o eliminación de su información</li>
          <li>Retirar su consentimiento en cualquier momento</li>
        </ul>
        <p>Contacto: <a href="mailto:nuevavida1327@gmail.com" className="text-primary underline">nuevavida1327@gmail.com</a></p>

        <p className="font-semibold text-foreground mt-4">7. ⏳ Conservación de datos</p>
        <p>Los datos se conservan mientras el usuario tenga su cuenta activa o sea necesario para los fines descritos.</p>

        <p className="font-semibold text-foreground mt-4">8. 👶 Menores de edad</p>
        <p>La plataforma no está dirigida a menores sin autorización de sus padres o representantes legales.</p>

        <p className="font-semibold text-foreground mt-4">9. 🔄 Cambios en la política</p>
        <p>Nueva Vida puede actualizar esta política en cualquier momento. Se notificará a los usuarios sobre cambios relevantes.</p>

        <p className="font-semibold text-foreground mt-4">10. 📞 Contacto</p>
        <ul className="list-none space-y-1">
          <li>📧 <a href="mailto:nuevavida1327@gmail.com" className="text-primary underline">nuevavida1327@gmail.com</a></li>
          <li>📱 Tel: 3136320309</li>
          <li>📷 Instagram: nuevavida</li>
          <li>▶️ <a href="https://www.youtube.com/channel/UCCZ0CRGcRK9SPlStYaF-9WA" target="_blank" rel="noopener noreferrer" className="text-primary underline">YouTube: Nueva Vida</a></li>
          <li>📍 Ubicación: Apartadó, Antioquia — Sede principal</li>
        </ul>

        <p className="mt-4 font-medium text-foreground">✔️ Al utilizar la plataforma Nueva Vida, el usuario acepta esta Política de Privacidad.</p>
      </Section>

      {/* Marco Legal */}
      <Section emoji="⚖️" title="MARCO LEGAL Y AMBIENTAL">
        <p className="font-semibold text-foreground">🌍 Referentes Internacionales</p>
        <p>Nueva Vida se alinea con los Objetivos de Desarrollo Sostenible (ODS) de la ONU:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>ODS 11: Ciudades y comunidades sostenibles</li>
          <li>ODS 12: Producción y consumo responsable</li>
          <li>ODS 13: Acción por el clima</li>
        </ul>
        <p>El Programa de las Naciones Unidas para el Medio Ambiente promueve la economía circular y la gestión responsable de residuos, principios clave de Nueva Vida.</p>

        <p className="font-semibold text-foreground mt-4">🇨🇴 Marco Legal en Colombia</p>
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Ley 99 de 1993</strong> — Protección del medio ambiente. Respalda iniciativas que reduzcan el impacto ambiental.</li>
          <li><strong>Ley 142 de 1994</strong> — Regula el manejo de residuos sólidos.</li>
          <li><strong>Ley 1672 de 2013</strong> — Gestión responsable de residuos electrónicos.</li>
          <li><strong>Ley 1480 de 2011</strong> — Protege los derechos de los usuarios.</li>
          <li><strong>Ley 1581 de 2012</strong> — Regula el manejo de datos personales.</li>
        </ul>

        <p className="font-semibold text-foreground mt-4">♻️ Principio Clave: Economía Circular</p>
        <p>Nueva Vida se basa en la economía circular: reducir residuos, reutilizar productos y extender la vida útil de los objetos. En lugar de desechar, se reintegra al ciclo de uso.</p>

        <p className="font-semibold text-foreground mt-4">⚖️ Conclusión Legal</p>
        <p>Nueva Vida está alineada con normativas ambientales nacionales, principios internacionales de sostenibilidad y derechos del consumidor y protección de datos. Es un proyecto legalmente respaldado, ambientalmente responsable y socialmente necesario.</p>
      </Section>

    </article>
  </main>
);

export default About;
