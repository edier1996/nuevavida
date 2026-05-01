import Header from "@/components/Header";

const Privacy = () => (
  <main className="min-h-screen bg-background">
    <Header />
    <article className="container mx-auto max-w-3xl px-4 py-16">
      <h1 className="text-3xl font-bold text-foreground">🔐 Política de Privacidad</h1>
      <p className="mt-1 text-xs text-muted-foreground">Plataforma Nueva Vida — Última actualización: Abril 2026</p>
      <p className="mt-4 text-sm text-muted-foreground">
        En Nueva Vida, respetamos y protegemos la privacidad de nuestros usuarios. Esta Política explica cómo recopilamos, usamos, almacenamos y protegemos su información personal.
      </p>

      <div className="mt-8 space-y-6 text-sm text-muted-foreground">

        <div>
          <p className="font-semibold text-foreground">1. 📌 Información que recopilamos</p>
          <p className="mt-1">Datos personales:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Nombre completo</li>
            <li>Correo electrónico</li>
            <li>Número de teléfono</li>
            <li>Ubicación (ciudad o zona)</li>
            <li>Información de perfil</li>
            <li>Datos relacionados con publicaciones</li>
          </ul>
          <p className="mt-2">Datos automáticos: dirección IP, tipo de dispositivo, navegador, actividad en la plataforma.</p>
        </div>

        <div>
          <p className="font-semibold text-foreground">2. 🎯 Uso de la información</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Permitir el registro y acceso a la plataforma</li>
            <li>Facilitar la conexión entre usuarios (donantes y receptores)</li>
            <li>Mejorar la experiencia del usuario</li>
            <li>Gestionar publicaciones y solicitudes</li>
            <li>Enviar notificaciones importantes</li>
            <li>Prevenir fraudes o actividades indebidas</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-foreground">3. 🤝 Compartición de información</p>
          <p className="mt-1">Nueva Vida <strong>no vende ni alquila</strong> datos personales. Podemos compartir información en estos casos:</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Entre usuarios, solo lo necesario para coordinar entregas</li>
            <li>Con proveedores de servicios tecnológicos (hosting, seguridad)</li>
            <li>Cuando sea requerido por ley o autoridad competente</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold text-foreground">4. 🔒 Protección de datos</p>
          <p className="mt-1">Implementamos medidas de seguridad técnicas y organizativas para proteger la información personal contra acceso no autorizado, pérdida, alteración o uso indebido.</p>
        </div>

        <div>
          <p className="font-semibold text-foreground">5. 👤 Derechos del usuario</p>
          <ul className="list-disc pl-5 mt-1 space-y-1">
            <li>Acceder a sus datos personales</li>
            <li>Solicitar la corrección de información incorrecta</li>
            <li>Solicitar la eliminación de sus datos</li>
            <li>Retirar su consentimiento en cualquier momento</li>
          </ul>
          <p className="mt-2">Contáctenos: <a href="mailto:nuevavida1327@gmail.com" className="text-primary underline">nuevavida1327@gmail.com</a></p>
        </div>

        <div>
          <p className="font-semibold text-foreground">6. ⏳ Conservación de datos</p>
          <p className="mt-1">Los datos se conservan durante el tiempo necesario para cumplir los fines descritos, o mientras el usuario tenga su cuenta activa.</p>
        </div>

        <div>
          <p className="font-semibold text-foreground">7. 👶 Menores de edad</p>
          <p className="mt-1">La plataforma no está dirigida a menores sin autorización de sus padres o representantes legales. Si detectamos información de menores sin consentimiento, será eliminada.</p>
        </div>

        <div>
          <p className="font-semibold text-foreground">8. 🔄 Cambios en la política</p>
          <p className="mt-1">Nueva Vida puede actualizar esta Política en cualquier momento. Se notificará a los usuarios sobre cambios relevantes a través de la plataforma.</p>
        </div>

        <div className="rounded-lg bg-card border border-border p-4">
          <p className="font-semibold text-foreground">✔️ Aceptación</p>
          <p className="mt-1">Al utilizar la plataforma Nueva Vida, el usuario acepta esta Política de Privacidad.</p>
        </div>

      </div>
    </article>
  </main>
);

export default Privacy;
