// NumberGrid.tsx

"use client";

import { RaffleNumber } from "@/lib/types";
import NumberCell from "./NumberCell";

export default function NumberGrid({
  numbers,
  onSelect,
}: {
  numbers: RaffleNumber[];
  onSelect: (n: RaffleNumber) => void;
}) {
  const sortedNumbers = [...numbers].sort((a, b) =>
    a.number.localeCompare(b.number, undefined, {
      numeric: true,
    })
  );

  return (
    <div
      className="
        grid
        grid-cols-4
        gap-1.5

        xs:grid-cols-5
        xs:gap-2

        sm:grid-cols-6
        sm:gap-2.5

        md:grid-cols-8

        lg:grid-cols-10

        xl:grid-cols-12
      "
    >
      {sortedNumbers.map((n) => (
        <NumberCell
          key={n.id}
          data={n}
          onClick={() => onSelect(n)}
        />
      ))}
    </div>
  );
}