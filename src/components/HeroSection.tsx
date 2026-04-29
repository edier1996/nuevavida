import { Link } from "react-router-dom";
import { ArrowRight, Recycle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-image.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-card">
      <div className="container mx-auto grid gap-8 px-4 py-16 md:grid-cols-2 md:items-center md:py-24">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="max-w-lg"
        >
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
            <Recycle className="h-4 w-4" strokeWidth={2.5} />
            Plataforma Nuevavida
          </div>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-foreground text-balance md:text-5xl lg:text-6xl">
            Dale una segunda vida a lo que ya no usas.
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground text-pretty">
            Publica objetos para regalar o entregar por abonación. Promueve la reutilización y ayuda a tu comunidad sin ventas entre usuarios.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/publicar">
              <Button size="lg" className="gap-2 text-base">
                Publicar un objeto
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Button>
            </Link>
            <Link to="/explorar">
              <Button variant="outline" size="lg" className="text-base">
                Explorar regalos
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-6 text-sm text-muted-foreground">
            <div>
              <span className="block text-2xl font-semibold text-foreground tabular-nums">0</span>
              Objetos publicados
            </div>
            <div className="h-10 w-px bg-secondary" />
            <div>
              <span className="block text-2xl font-semibold text-foreground tabular-nums">0</span>
              Regalos entregados
            </div>
            <div className="h-10 w-px bg-secondary" />
            <div>
              <span className="block text-2xl font-semibold text-foreground tabular-nums">0</span>
              Usuarios activos
            </div>
          </div>
        </motion.div>

        {/* Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.2, 0, 0, 1] }}
          className="relative"
        >
          <div className="overflow-hidden rounded-2xl card-shadow">
            <img
              src={heroImage}
              alt="Personas intercambiando objetos en comunidad"
              className="h-full w-full object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
