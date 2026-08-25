// NumberGrid.tsx
import { RaffleNumber } from "@/lib/types";
import NumberCell from "./NumberCell";

export default function NumberGrid({
  numbers,
  onSelect,
}: {
  numbers: RaffleNumber[];
  onSelect: (n: RaffleNumber) => void;
}) {
  return (
    <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
      {numbers
        .sort((a, b) => a.number.localeCompare(b.number))
        .map((n) => (
          <NumberCell key={n.id} data={n} onClick={() => onSelect(n)} />
        ))}
    </div>
  );
}