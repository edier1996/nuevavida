import { Link } from "react-router-dom";
import { ArrowRight, Recycle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import heroImage from "@/assets/hero-image.jpg";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden px-4 pt-8 md:pt-10">
      <div className="pointer-events-none absolute left-0 top-0 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      <div className="container mx-auto grid gap-8 rounded-[2rem] border border-white/60 surface-panel px-6 py-10 hero-glow md:grid-cols-[1.1fr_0.9fr] md:items-center md:px-10 md:py-14">
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0, 0, 1] }}
          className="max-w-lg"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-white/80 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
            <Recycle className="h-4 w-4" strokeWidth={2.5} />
            Plataforma solidaria Nueva Vida
          </div>
          <h1 className="text-4xl leading-[0.95] text-foreground text-balance md:text-6xl">
            Lo que ya no usas puede convertirse en alivio para otra familia.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground text-pretty">
            Publica objetos, recibe solicitudes con criterio social y entrégalos a quien realmente los necesita. Sin ventas entre usuarios, con impacto real en comunidad.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/publicar">
              <Button size="lg" className="gap-2 rounded-full bg-primary px-6 text-base shadow-lg shadow-primary/20 hover:bg-primary/90">
                Publicar un objeto
                <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
              </Button>
            </Link>
            <Link to="/explorar">
              <Button variant="outline" size="lg" className="rounded-full border-border/80 bg-white/75 text-base">
                Ver objetos disponibles
              </Button>
            </Link>
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-border/70 bg-white/75 px-4 py-3">
              <span className="block text-sm font-bold uppercase tracking-[0.2em] text-primary/75">Sin lucro</span>
              <span className="mt-2 block text-sm text-muted-foreground">Solo donaciones y entregas solidarias.</span>
            </div>
            <div className="rounded-2xl border border-border/70 bg-white/75 px-4 py-3">
              <span className="block text-sm font-bold uppercase tracking-[0.2em] text-primary/75">Con evaluacion</span>
              <span className="mt-2 block text-sm text-muted-foreground">El equipo revisa solicitudes cuando hace falta.</span>
            </div>
            <div className="rounded-2xl border border-border/70 bg-white/75 px-4 py-3">
              <span className="block text-sm font-bold uppercase tracking-[0.2em] text-primary/75">Impacto local</span>
              <span className="mt-2 block text-sm text-muted-foreground">Objetos utiles que circulan dentro de la comunidad.</span>
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
          <div className="overflow-hidden rounded-[2rem] border border-white/70 card-shadow">
            <img
              src={heroImage}
              alt="Personas intercambiando objetos en comunidad"
              className="h-full min-h-[420px] w-full object-cover"
            />
          </div>
          <div className="absolute -bottom-6 left-6 max-w-xs rounded-[1.5rem] border border-white/80 bg-white/88 p-5 card-shadow">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">Como funciona</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Publicas un objeto, recibes solicitudes y eliges con acompanamiento cuando se requiere priorizar casos.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
