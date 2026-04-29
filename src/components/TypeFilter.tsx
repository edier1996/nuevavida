interface TypeFilterProps {
  selected: "gift";
  onSelect: (type: "gift") => void;
}

const TypeFilter = ({ selected, onSelect }: TypeFilterProps) => {
  const options: { value: "gift"; label: string }[] = [
    { value: "gift", label: "Solo donaciones" },
  ];

  return (
    <div className="inline-flex rounded-lg bg-secondary p-1">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-all duration-200 ${
            selected === opt.value
              ? "bg-card text-foreground card-shadow"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};

export default TypeFilter;
