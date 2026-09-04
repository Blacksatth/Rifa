
"use client";

import { useEffect, useState } from "react";
import { RaffleNumber } from "@/lib/types";
import {
  getVisitorId,
  isReservationMine,
} from "@/lib/reservations";

/**
 * Estados posibles de un número de la rifa.
 * Cada estado tiene estilos visuales y comportamiento de interacción diferente.
 */
type NumberStatus =
  | "available"
  | "reserved"
  | "sold";

interface NumberCellProps {
  data: RaffleNumber;
  onClick: () => void;
}

/**
 * Estilos visuales para cada estado del número.
 * Incluye clases de Tailwind para: contenedor, número, dot indicador, y etiqueta.
 */
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

/**
 * Celda individual de un número de la rifa.
 *
 * Renderiza un botón con el número, su estado (disponible/reservado/vendido)
 * y un dot indicador de color. El comportamiento depende del estado:
 *
 * - **Disponible**: Cualquier visitante puede hacer clic para reservar
 * - **Reservado**: Solo el visitante que hizo la reserva puede hacer clic
 *   (verificado con buyerVisitorId vs localStorage visitorId)
 * - **Vendido**: No interactuable
 *
 * Si la reserva pertenece al visitante actual, se muestra con estilo
 * especial azul ("Tu reserva") con glow y dot pulsante.
 *
 * @see docs/decisions/002-anonymous-visitor-identification.md
 */
export default function NumberCell({
  data,
  onClick,
}: NumberCellProps) {
  // ============================================================
  // VISITOR ID
  // ============================================================

  const [visitorId, setVisitorId] =
    useState<string | null>(null);

  // ============================================================
  // CARGAR VISITOR ID
  // ============================================================

  useEffect(() => {
    /*
     * Esto se ejecuta solamente en el navegador.
     *
     * Es compatible con Vercel porque:
     * - no se ejecuta durante SSR
     * - no depende de Firebase Auth
     * - utiliza localStorage
     */

    const id = getVisitorId();

    if (id) {
      setVisitorId(id);
    }
  }, []);

  // ============================================================
  // ESTADO
  // ============================================================

  const status: NumberStatus =
    data.status === "available" ||
    data.status === "reserved" ||
    data.status === "sold"
      ? data.status
      : "sold";

  // ============================================================
  // ¿ES MI RESERVA?
  // ============================================================

  /*
   * Mientras visitorId todavía está cargando,
   * NO consideramos ninguna reserva como nuestra.
   *
   * Esto evita que un número reservado pueda abrirse
   * accidentalmente durante el primer render.
   */

  const mine =
    status === "reserved" &&
    visitorId !== null &&
    isReservationMine(
      data,
      visitorId
    );

  // ============================================================
  // ESTILOS
  // ============================================================

  const styles =
    STATUS_STYLES[status];

  const isAvailable =
    status === "available";

  // ============================================================
  // PUEDE ABRIR
  // ============================================================

  /*
   * Disponible:
   * cualquier visitante puede abrirlo.
   *
   * Reservado:
   * solamente el visitante que realizó la reserva.
   *
   * Vendido:
   * nadie puede abrirlo.
   */

  const canOpen =
    isAvailable || mine;

  // ============================================================
  // ETIQUETA
  // ============================================================

  const label = mine
    ? "Tu reserva"
    : styles.label;

  // ============================================================
  // ESTILOS DE MI RESERVA
  // ============================================================

  const mineStyles = mine
    ? `
      border-sky-400/40
      bg-sky-500/[0.10]
      shadow-lg
      shadow-sky-500/10
      cursor-pointer
      hover:border-sky-300/60
      hover:bg-sky-500/[0.16]
      hover:-translate-y-0.5
    `
    : "";

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <button
      type="button"
      disabled={!canOpen}
      onClick={
        canOpen
          ? onClick
          : undefined
      }
      aria-label={`Número ${data.number}: ${label}`}
      title={
        isAvailable
          ? `Seleccionar número ${data.number}`
          : mine
            ? `Abrir tu reserva: ${data.number}`
            : styles.label
      }
      className={`
        group
        relative

        flex
        w-full

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

        ${mineStyles}

        ${
          canOpen
            ? "cursor-pointer"
            : "cursor-not-allowed"
        }
      `}
    >
      {/* ========================================= */}
      {/* GLOW DISPONIBLE */}
      {/* ========================================= */}

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
      {/* GLOW MI RESERVA */}
      {/* ========================================= */}

      {mine && (
        <span
          className="
            pointer-events-none
            absolute
            -right-5
            -top-5
            h-14
            w-14
            rounded-full
            bg-sky-400/10
            blur-xl
            opacity-100
          "
        />
      )}

      {/* ========================================= */}
      {/* CONTENT */}
      {/* ========================================= */}

      <span className="relative flex items-center gap-2">
        {/* DOT */}

        <span
          className={`
            h-1.5
            w-1.5
            shrink-0
            rounded-full

            ${
              mine
                ? "bg-sky-400 shadow-lg shadow-sky-400/60"
                : styles.dot
            }

            ${
              isAvailable
                ? "animate-pulse shadow-lg"
                : ""
            }

            ${
              mine
                ? "animate-pulse"
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
              canOpen
                ? "group-hover:scale-105"
                : ""
            }

            ${
              mine
                ? "text-sky-300"
                : styles.number
            }
          `}
        >
          {data.number}
        </span>
      </span>

      {/* ========================================= */}
      {/* STATUS */}
      {/* ========================================= */}

      <span
        className={`
          relative
          mt-1
          text-[9px]
          font-semibold
          uppercase
          tracking-wider

          ${
            mine
              ? "text-sky-300 opacity-90"
              : "opacity-60"
          }
        `}
      >
        {label}
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

      {/* ========================================= */}
      {/* MY RESERVATION INDICATOR */}
      {/* ========================================= */}

      {mine && (
        <span
          className="
            absolute
            bottom-0
            left-1/2
            h-[2px]
            w-1/2
            -translate-x-1/2
            rounded-full
            bg-sky-400
          "
        />
      )}
    </button>
  );
}

