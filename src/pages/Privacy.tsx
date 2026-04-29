import Header from "@/components/Header";

const Privacy = () => (
  <main className="min-h-screen bg-background">
    <Header />
    <section className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-semibold text-foreground">Política de Privacidad</h1>
      <p className="mt-4 text-sm text-muted-foreground">
        En cumplimiento de la Ley 1581 de 2012 y el Decreto 1377 de 2013, Nueva Vida garantiza la
        protección de los datos personales de los usuarios.
      </p>

      <div className="mt-8 space-y-4 text-sm text-muted-foreground">
        <p>
          Los datos recolectados serán utilizados exclusivamente para:
        </p>
        <ul className="list-disc pl-5">
          <li>Registro e identificación de usuarios.</li>
          <li>Gestión de publicaciones.</li>
          <li>Procesamiento de transacciones.</li>
        </ul>

        <p className="font-semibold">El titular de los datos tiene derecho a:</p>
        <ul className="list-disc pl-5">
          <li>Conocer, actualizar y rectificar su información.</li>
          <li>Solicitar la eliminación de sus datos.</li>
          <li>Revocar la autorización otorgada.</li>
        </ul>
      </div>
    </section>
  </main>
);

export default Privacy;
