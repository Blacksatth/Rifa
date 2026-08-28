"use client";

import { RaffleNumber } from "@/lib/types";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useEffect, useState } from "react";

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
  // ============================================================
  // USUARIO ACTUAL DE FIREBASE
  // ============================================================

  const [currentUserUid, setCurrentUserUid] = useState<
    string | null
  >(auth.currentUser?.uid ?? null);

  // ============================================================
  // ESCUCHAR SESIÓN DE FIREBASE
  // ============================================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setCurrentUserUid(user?.uid ?? null);
      }
    );

    return () => unsubscribe();
  }, []);

  // ============================================================
  // ESTADO DEL NÚMERO
  // ============================================================

  const status: NumberStatus =
    data.status === "available" ||
    data.status === "reserved" ||
    data.status === "sold"
      ? data.status
      : "sold";

  // ============================================================
  // ¿ESTE NÚMERO ES MÍO?
  //
  // IMPORTANTE:
  //
  // Ya NO usamos localStorage.
  //
  // Firestore:
  // buyerUid = UID del usuario que hizo la reserva
  //
  // Firebase Auth:
  // currentUserUid = UID del usuario actualmente conectado
  //
  // Si coinciden => la reserva es del usuario.
  // ============================================================

  const mine =
    status === "reserved" &&
    !!currentUserUid &&
    !!data.buyerUid &&
    data.buyerUid === currentUserUid;

  // ============================================================
  // ESTILOS
  // ============================================================

  const styles = STATUS_STYLES[status];

  const isAvailable =
    status === "available";

  // ============================================================
  // ¿SE PUEDE ABRIR?
  //
  // Disponible = sí
  // Mi reserva = sí
  // Reserva de otro usuario = no
  // Vendido = no
  // ============================================================

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

      /*
       * Disponible:
       * puede abrirse.
       *
       * Mi reserva:
       * puede abrirse nuevamente.
       *
       * Reserva de otro usuario:
       * bloqueada.
       *
       * Vendido:
       * bloqueado.
       */

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
      {/* GLOW DE MI RESERVA */}
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
        {/* ========================================= */}
        {/* STATUS DOT */}
        {/* ========================================= */}

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

        {/* ========================================= */}
        {/* NUMBER */}
        {/* ========================================= */}

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