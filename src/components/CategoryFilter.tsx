import { Home, Smartphone, Armchair, Shirt, Package, Zap } from "lucide-react";
import type { Category } from "@/lib/mock-data";

const iconMap: Record<string, React.ReactNode> = {
  Home: <Home className="h-5 w-5" strokeWidth={2.5} />,
  Smartphone: <Smartphone className="h-5 w-5" strokeWidth={2.5} />,
  Armchair: <Armchair className="h-5 w-5" strokeWidth={2.5} />,
  Shirt: <Shirt className="h-5 w-5" strokeWidth={2.5} />,
  Refrigerator: <Zap className="h-5 w-5" strokeWidth={2.5} />,
  Package: <Package className="h-5 w-5" strokeWidth={2.5} />,
};

interface CategoryFilterProps {
  selected: Category | null;
  onSelect: (cat: Category | null) => void;
}

const categories: { value: Category; label: string; icon: string }[] = [
  { value: "hogar", label: "Hogar", icon: "Home" },
  { value: "tecnologia", label: "Tecnología", icon: "Smartphone" },
  { value: "muebles", label: "Muebles", icon: "Armchair" },
  { value: "ropa", label: "Ropa", icon: "Shirt" },
  { value: "electrodomesticos", label: "Electrodomésticos", icon: "Refrigerator" },
  { value: "otros", label: "Otros", icon: "Package" },
];

const CategoryFilter = ({ selected, onSelect }: CategoryFilterProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
          selected === null
            ? "bg-primary text-primary-foreground card-shadow"
            : "bg-card text-muted-foreground card-shadow hover:text-foreground"
        }`}
      >
        Todos
      </button>
      {categories.map((cat) => (
        <button
          key={cat.value}
          onClick={() => onSelect(cat.value === selected ? null : cat.value)}
          className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
            selected === cat.value
              ? "bg-primary text-primary-foreground card-shadow"
              : "bg-card text-muted-foreground card-shadow hover:text-foreground"
          }`}
        >
          {iconMap[cat.icon]}
          {cat.label}
        </button>
      ))}
    </div>
  );
};

export default CategoryFilter;
