"use client";

import { RaffleNumber } from "@/lib/types";

type NumberStatus =
  | "available"
  | "reserved"
  | "sold";

interface NumberCellProps {
  data: RaffleNumber;
  onClick: () => void;
}

const STATUS_STYLES: Record<
  NumberStatus,
  {
    container: string;
    number: string;
    dot: string;
    label: string;
  }
> = {
  available: {
    container: `
      border-emerald-500/20
      bg-emerald-500/[0.07]
      hover:border-emerald-400/50
      hover:bg-emerald-500/[0.14]
      hover:shadow-lg
      hover:shadow-emerald-500/10
      cursor-pointer
    `,
    number: "text-emerald-300",
    dot: "bg-emerald-400 shadow-emerald-400/60",
    label: "Disponible",
  },

  reserved: {
    container: `
      border-amber-500/20
      bg-amber-500/[0.06]
      cursor-not-allowed
    `,
    number: "text-amber-300",
    dot: "bg-amber-400",
    label: "Reservado",
  },

  sold: {
    container: `
      border-slate-700/50
      bg-slate-800/50
      cursor-not-allowed
    `,
    number: "text-slate-500",
    dot: "bg-slate-600",
    label: "Vendido",
  },
};

export default function NumberCell({
  data,
  onClick,
}: NumberCellProps) {

  const status: NumberStatus =
    data.status === "available" ||
    data.status === "reserved" ||
    data.status === "sold"
      ? data.status
      : "sold";

  const styles = STATUS_STYLES[status];

  const isAvailable = status === "available";

  return (
    <button
      type="button"
      disabled={!isAvailable}
      onClick={isAvailable ? onClick : undefined}
      aria-label={`Número ${data.number}: ${styles.label}`}
      title={
        isAvailable
          ? `Seleccionar número ${data.number}`
          : styles.label
      }
      className={`
        group relative
        flex w-full
        min-h-[58px]
        flex-col
        items-center
        justify-center
        overflow-hidden
        rounded-xl
        border
        px-3
        py-2.5

        backdrop-blur-xl

        transition-all
        duration-200
        ease-out

        active:scale-95

        ${styles.container}

        ${
          isAvailable
            ? "hover:-translate-y-0.5"
            : ""
        }
      `}
    >

      {/* ========================================= */}
      {/* GLOW */}
      {/* ========================================= */}x

      {isAvailable && (
        <span
          className="
            pointer-events-none
            absolute
            -right-5
            -top-5
            h-14
            w-14
            rounded-full
            bg-emerald-400/10
            blur-xl
            opacity-0
            transition-opacity
            duration-300
            group-hover:opacity-100
          "
        />
      )}

      {/* ========================================= */}
      {/* CONTENT */}
      {/* ========================================= */}

      <span className="relative flex items-center gap-2">

        {/* STATUS DOT */}

        <span
          className={`
            h-1.5
            w-1.5
            shrink-0
            rounded-full
            ${styles.dot}

            ${
              isAvailable
                ? "animate-pulse shadow-lg"
                : ""
            }
          `}
        />

        {/* NUMBER */}

        <span
          className={`
            text-sm
            font-bold
            tracking-wide
            transition-transform
            duration-200

            ${
              isAvailable
                ? "group-hover:scale-105"
                : ""
            }

            ${styles.number}
          `}
        >
          {data.number}
        </span>

      </span>

      {/* ========================================= */}
      {/* STATUS */}
      {/* ========================================= */}

      <span
        className="
          relative
          mt-1
          text-[9px]
          font-semibold
          uppercase
          tracking-wider
          opacity-60
        "
      >
        {styles.label}
      </span>

      {/* ========================================= */}
      {/* AVAILABLE INDICATOR */}
      {/* ========================================= */}

      {isAvailable && (
        <span
          className="
            absolute
            bottom-0
            left-1/2
            h-[2px]
            w-0
            -translate-x-1/2
            rounded-full
            bg-emerald-400
            transition-all
            duration-300
            group-hover:w-1/2
          "
        />
      )}

    </button>
  );
}
