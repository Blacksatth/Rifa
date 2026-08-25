export default function SearchBar({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      className="border rounded-lg w-full p-2"
      placeholder="Buscar por nombre, teléfono o número"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}