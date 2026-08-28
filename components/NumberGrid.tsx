"use client";

import { useMemo, useState } from "react";
import { RaffleNumber } from "@/lib/types";
import NumberCell from "./NumberCell";

type StatusFilter = "all" | "available" | "reserved" | "sold";

const FILTERS: {
  value: StatusFilter;
  label: string;
  dotClass: string;
}[] = [
  { value: "all", label: "Todos", dotClass: "bg-slate-400" },
  { value: "available", label: "Disponibles", dotClass: "bg-emerald-400" },
  { value: "reserved", label: "Reservados", dotClass: "bg-amber-400" },
  { value: "sold", label: "Vendidos", dotClass: "bg-red-400" },
];

export default function NumberGrid({
  numbers,
  onSelect,
}: {
  numbers: RaffleNumber[];
  onSelect: (n: RaffleNumber) => void;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const sortedNumbers = useMemo(
    () =>
      [...numbers].sort((a, b) =>
        a.number.localeCompare(b.number, undefined, {
          numeric: true,
        })
      ),
    [numbers]
  );

  // ============================================================
  // CONTEOS POR ESTADO
  // ============================================================

  const counts = useMemo(() => {
    return sortedNumbers.reduce(
      (acc, n) => {
        acc.all += 1;

        if (n.status === "available") acc.available += 1;
        if (n.status === "reserved") acc.reserved += 1;
        if (n.status === "sold") acc.sold += 1;

        return acc;
      },
      { all: 0, available: 0, reserved: 0, sold: 0 }
    );
  }, [sortedNumbers]);

  // ============================================================
  // FILTRADO
  // ============================================================

  const filteredNumbers = useMemo(() => {
    const cleanSearch = search.trim();

    return sortedNumbers.filter((n) => {
      const matchesSearch =
        !cleanSearch || n.number.includes(cleanSearch);

      const matchesStatus =
        statusFilter === "all" || n.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [sortedNumbers, search, statusFilter]);

  return (
    <div className="space-y-4">
      {/* ================================================== */}
      {/* BARRA DE CONTROLES */}
      {/* ================================================== */}

      <div
        className="
          rounded-2xl
          border
          border-white/[0.08]
          bg-white/[0.02]
          p-3.5
          sm:p-4
        "
      >
        <div
          className="
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:items-center
            sm:gap-3
          "
        >
          {/* BUSCADOR */}

          <div className="relative sm:w-64 sm:shrink-0">
            <svg
              className="
                pointer-events-none
                absolute
                left-3
                top-1/2
                h-4
                w-4
                -translate-y-1/2
                text-slate-500
              "
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>

            <input
              type="text"
              inputMode="numeric"
              placeholder="Buscar número..."
              value={search}
              onChange={(e) => {
                const onlyDigits = e.target.value.replace(
                  /[^0-9]/g,
                  ""
                );
                setSearch(onlyDigits);
              }}
              className="
                w-full
                rounded-xl
                border
                border-white/[0.08]
                bg-slate-950/70
                py-2.5
                pl-10
                pr-9
                text-sm
                text-white
                placeholder:text-slate-600
                outline-none
                transition-colors
                hover:border-white/[0.14]
                focus:border-violet-500/60
                focus:ring-2
                focus:ring-violet-500/10
              "
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Limpiar búsqueda"
                className="
                  absolute
                  right-2.5
                  top-1/2
                  flex
                  h-5
                  w-5
                  -translate-y-1/2
                  items-center
                  justify-center
                  rounded-full
                  text-slate-500
                  transition-colors
                  hover:text-white
                "
              >
                <svg
                  className="h-3.5 w-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* SEPARADOR VERTICAL EN DESKTOP */}

          <div
            className="
              hidden
              h-8
              w-px
              bg-white/[0.08]
              sm:block
            "
          />

          {/* FILTROS DE ESTADO */}

          <div
            className="
              no-scrollbar
              -mx-0.5
              flex
              items-center
              gap-1.5
              overflow-x-auto
              px-0.5
              sm:flex-1
              sm:flex-wrap
              sm:overflow-visible
            "
          >
            {FILTERS.map((f) => {
              const isActive = statusFilter === f.value;
              const count = counts[f.value];

              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setStatusFilter(f.value)}
                  className={`
                    flex
                    shrink-0
                    items-center
                    gap-1.5
                    whitespace-nowrap
                    rounded-lg
                    border
                    px-3
                    py-1.5
                    text-xs
                    font-semibold
                    transition-colors
                    ${
                      isActive
                        ? "border-violet-500/40 bg-violet-500/15 text-white"
                        : "border-white/[0.06] bg-white/[0.02] text-slate-400 hover:border-white/[0.14] hover:text-white"
                    }
                  `}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${f.dotClass}`}
                  />

                  <span>{f.label}</span>

                  <span
                    className={`
                      rounded-full
                      px-1.5
                      py-0.5
                      text-[10px]
                      font-bold
                      ${
                        isActive
                          ? "bg-white/15 text-white"
                          : "bg-white/[0.06] text-slate-500"
                      }
                    `}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ================================================== */}
      {/* RESULTADOS */}
      {/* ================================================== */}

      {filteredNumbers.length === 0 ? (
        <div
          className="
            flex
            flex-col
            items-center
            justify-center
            gap-2
            rounded-2xl
            border
            border-white/[0.06]
            bg-white/[0.02]
            py-14
            text-center
          "
        >
          <svg
            className="h-8 w-8 text-slate-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>

          <p className="text-sm font-medium text-slate-400">
            {search
              ? `Sin resultados para "${search}"`
              : "No hay números en esta categoría"}
          </p>

          {(search || statusFilter !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setStatusFilter("all");
              }}
              className="
                mt-1
                text-xs
                font-semibold
                text-violet-400
                transition-colors
                hover:text-violet-300
              "
            >
              Limpiar filtros
            </button>
          )}
        </div>
      ) : (
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
          {filteredNumbers.map((n) => (
            <NumberCell
              key={n.id}
              data={n}
              onClick={() => onSelect(n)}
            />
          ))}
        </div>
      )}

           <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}