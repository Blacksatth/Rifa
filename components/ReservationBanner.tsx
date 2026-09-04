"use client";

import { useEffect, useMemo, useState } from "react";

import { Raffle, RaffleNumber } from "@/lib/types";
import {
  getExpirationTimeMs,
  getVisitorId,
  isReservationExpired,
  isReservationMine,
} from "@/lib/reservations";

/**
 * Banner persistente que muestra la reserva activa del visitante.
 *
 * Aparece como una barra fija en la parte inferior de la página principal
 * cuando el visitante tiene un número reservado (y aún no expirado), para
 * que no olvide completar el pago. Muestra:
 * - El número reservado
 * - Un contador regresivo en tiempo real (0:00 cuando expira)
 * - Un botón para reabrir el modal de pago
 *
 * Cuando la reserva expira, el banner desaparece automáticamente
 * (la página ya libera las reservas vencidas vía Server Actions).
 */

interface ReservationBannerProps {
  /** Lista de números de la rifa (en tiempo real desde Firestore) */
  numbers: RaffleNumber[];
  /** Datos de la rifa activa (para precio, WhatsApp, etc.) */
  raffle: Raffle;
  /** Callback para reabrir el modal con un número específico */
  onOpenNumber: (number: RaffleNumber) => void;
}

export default function ReservationBanner({
  numbers,
  raffle,
  onOpenNumber,
}: ReservationBannerProps) {
  const [now, setNow] = useState<number>(Date.now());

  // Tick de 1 segundo para actualizar el contador.
  useEffect(() => {
    const interval = setInterval(
      () => setNow(Date.now()),
      1000
    );

    return () => clearInterval(interval);
  }, []);

  // Número actual del visitante (el que coincida con su visitorId).
  const myReservation = useMemo(() => {
    const visitorId = getVisitorId();

    if (!visitorId) {
      return null;
    }

    return (
      numbers.find(
        (n) =>
          n.status === "reserved" &&
          isReservationMine(n, visitorId)
      ) ?? null
    );
  }, [numbers]);

  // Si no hay reserva propia, no se muestra nada.
  if (!myReservation) {
    return null;
  }

  const expired = isReservationExpired(
    myReservation,
    now
  );

  // Si ya expiró, ocultamos el banner (la página libera las reservas
  // vencidas automáticamente, y el número volverá a "available").
  if (expired) {
    return null;
  }

  const remainingMs = Math.max(
    0,
    (getExpirationTimeMs(
      myReservation.reservationExpiresAt
    ) ?? now) - now
  );

  const formatPrice = (price: number) =>
    new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(price);

  const formatTime = (milliseconds: number) => {
    const totalSeconds = Math.max(
      0,
      Math.floor(milliseconds / 1000)
    );

    const minutes = Math.floor(
      totalSeconds / 60
    );

    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };

  // Umbral de urgencia: < 5 minutos restantes.
  const urgent = remainingMs < 5 * 60 * 1000;

  return (
    <div
      className="
        fixed
        inset-x-0
        bottom-0
        z-40
        p-3
        sm:p-4
        pointer-events-none
      "
    >
      <div
        className={`
          pointer-events-auto
          mx-auto
          w-full
          max-w-2xl
          overflow-hidden
          rounded-2xl
          border
          bg-[#0b0e1a]/95
          shadow-2xl
          shadow-black/50
          backdrop-blur-md
          animate-in
          slide-in-from-bottom-4
          fade-in
          duration-300
          ${
            urgent
              ? "border-amber-500/30"
              : "border-white/10"
          }
        `}
      >
        {/* Línea superior de estado */}
        <div
          className={`
            h-1
            w-full
            ${
              urgent
                ? "bg-gradient-to-r from-amber-500 to-amber-400"
                : "bg-gradient-to-r from-emerald-500 to-emerald-400"
            }
          `}
        />

        <div
          className="
            flex
            items-center
            gap-3
            p-3.5
            sm:gap-4
            sm:p-4
          "
        >
          {/* ICONO */}
          <div
            className={`
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              border
              ${
                urgent
                  ? "border-amber-500/30 bg-amber-500/10"
                  : "border-emerald-500/30 bg-emerald-500/10"
              }
            `}
          >
            <span className="text-lg">
              {urgent ? "⏳" : "🎟️"}
            </span>
          </div>

          {/* TEXTO */}
          <div className="min-w-0 flex-1">
            <p
              className="
                text-[10px]
                font-bold
                uppercase
                tracking-[0.14em]
                text-slate-400
              "
            >
              Tu número{" "}
              <span
                className="
                  font-mono
                  text-violet-300
                "
              >
                {myReservation.number}
              </span>{" "}
              está reservado
            </p>

            <div
              className="
                mt-0.5
                flex
                items-baseline
                gap-2
              "
            >
              <span
                className={`
                  font-mono
                  text-2xl
                  font-black
                  tracking-wider
                  ${
                    urgent
                      ? "text-amber-400"
                      : "text-white"
                  }
                `}
              >
                {formatTime(remainingMs)}
              </span>

              <span
                className="
                  text-[10px]
                  leading-none
                  text-slate-500
                "
              >
                para completar el pago
              </span>
            </div>
          </div>

          {/* BOTÓN */}
          <button
            type="button"
            onClick={() =>
              onOpenNumber(myReservation)
            }
            className="
              flex
              shrink-0
              items-center
              gap-1.5
              rounded-xl
              bg-violet-600
              px-3.5
              py-2.5
              text-xs
              font-bold
              text-white
              shadow-lg
              shadow-violet-900/40
              transition-all
              duration-150
              hover:bg-violet-500
              active:scale-[0.98]
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
                d="M3 10h18M7 15h1m4 0h1m-7 4h8a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
              />
            </svg>
            Pagar
          </button>
        </div>
      </div>
    </div>
  );
}
