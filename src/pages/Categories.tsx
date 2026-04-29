import { Link } from "react-router-dom";
import Header from "@/components/Header";

const categories = [
  { id: "hogar", label: "Hogar" },
  { id: "tecnologia", label: "Tecnología" },
  { id: "muebles", label: "Muebles" },
  { id: "ropa", label: "Ropa" },
  { id: "electrodomesticos", label: "Electrodomésticos" },
  { id: "otros", label: "Otros" },
];

const Categories = () => (
  <main className="min-h-screen bg-background">
    <Header />
    <section className="container mx-auto px-4 py-16">
      <h1 className="text-3xl font-semibold text-foreground">Categorías</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Explora los objetos que otros usuarios han publicado clasificándolos por categoría.
      </p>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.id}
            to={`/explorar?category=${category.id}`}
            className="rounded-xl border border-secondary bg-card p-6 transition hover:border-primary hover:bg-primary/5"
          >
            <h2 className="text-lg font-medium text-foreground">{category.label}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ver publicaciones en la categoría {category.label}.
            </p>
          </Link>
        ))}
      </div>
    </section>
  </main>
);

export default Categories;
