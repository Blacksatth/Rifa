"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import {
  collection,
  onSnapshot,
  query,
  where,
  limit,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import {
  Raffle,
  RaffleNumber,
} from "@/lib/types";

import PrizeCard from "@/components/PrizeCard";
import NumberGrid from "@/components/NumberGrid";
import Header from "@/components/Header";
import ReservationModal from "@/components/ReservationModal";
import Footer from "@/components/Footer";

export default function HomePage() {
  const [raffle, setRaffle] =
    useState<Raffle | null>(null);

  const [numbers, setNumbers] =
    useState<RaffleNumber[]>([]);

  const [selected, setSelected] =
    useState<RaffleNumber | null>(null);

  const [loadingRaffle, setLoadingRaffle] =
    useState(true);

  const [loadingNumbers, setLoadingNumbers] =
    useState(true);

  /* ================================================================
     OBTENER RIFA ACTIVA
  ================================================================= */

  useEffect(() => {
    const q = query(
      collection(db, "raffles"),
      where("active", "==", true),
      limit(1)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const raffleDoc = snap.docs[0];

        if (raffleDoc) {
          const { id: _storedId, ...raffleData } =
            raffleDoc.data() as Raffle;

          setRaffle({
            ...raffleData,
            id: raffleDoc.id,
          });
        } else {
          setRaffle(null);
          setNumbers([]);
          setLoadingNumbers(false);
        }

        setLoadingRaffle(false);
      },
      (error) => {
        console.error(
          "Error obteniendo la rifa:",
          error
        );

        setLoadingRaffle(false);
        setLoadingNumbers(false);
      }
    );

    return () => unsub();
  }, []);

  /* ================================================================
     OBTENER NÚMEROS
  ================================================================= */

  useEffect(() => {
    if (!raffle) {
      setNumbers([]);
      setLoadingNumbers(false);
      return;
    }

    setLoadingNumbers(true);

    const numbersRef = collection(
      db,
      "raffles",
      raffle.id,
      "numbers"
    );

    const unsub = onSnapshot(
      numbersRef,
      (snap) => {
        const raffleNumbers = snap.docs.map((d) => {
          const { id: _storedId, ...numberData } =
            d.data() as RaffleNumber;

          return {
            ...numberData,
            id: d.id,
          };
        });

        setNumbers(raffleNumbers);

        setLoadingNumbers(false);
      },
      (error) => {
        console.error(
          "Error obteniendo números:",
          error
        );

        setLoadingNumbers(false);
      }
    );

    return () => unsub();
  }, [raffle]);

  /* ================================================================
     ESTADÍSTICAS
  ================================================================= */

  const total = numbers.length;

  const sold = numbers.filter(
    (number) =>
      number.status === "sold" ||
      number.status === "reserved"
  ).length;

  const progress =
    total > 0
      ? Math.round((sold / total) * 100)
      : 0;

  const isLoading =
    loadingRaffle ||
    (raffle !== null && loadingNumbers);

  /* ================================================================
     RENDER
  ================================================================= */

  return (
    <main
      className="
        relative
        min-h-screen
        overflow-x-hidden
        bg-slate-950
      "
    >

      {/* ========================================================= */}
      {/* FONDO DECORATIVO                                         */}
      {/* ========================================================= */}

      <div
        className="
          pointer-events-none
          fixed
          inset-0
          z-0
          overflow-hidden
        "
      >

        {/* Gradientes principales */}

        <div
          className="
            absolute
            inset-0
            bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.18),_transparent_35%)]
          "
        />

        {/* Luz izquierda */}

        <div
          className="
            absolute
            -left-32
            -top-32
            h-[280px]
            w-[280px]
            rounded-full
            bg-purple-600/20
            blur-[90px]
            sm:-left-40
            sm:-top-40
            sm:h-[500px]
            sm:w-[500px]
            sm:blur-[120px]
          "
        />

        {/* Luz derecha */}

        <div
          className="
            absolute
            -right-32
            top-20
            h-[280px]
            w-[280px]
            rounded-full
            bg-blue-600/20
            blur-[90px]
            sm:-right-40
            sm:h-[450px]
            sm:w-[450px]
            sm:blur-[120px]
          "
        />

        {/* Luz inferior */}

        <div
          className="
            absolute
            -bottom-32
            left-1/2
            h-[280px]
            w-[280px]
            -translate-x-1/2
            rounded-full
            bg-fuchsia-600/10
            blur-[90px]
            sm:-bottom-40
            sm:left-1/3
            sm:h-[450px]
            sm:w-[450px]
            sm:translate-x-0
            sm:blur-[120px]
          "
        />

        {/* Patrón de puntos */}

        <div
          className="
            absolute
            inset-0
            opacity-[0.10]
            [background-image:radial-gradient(circle,_rgba(255,255,255,0.8)_1px,_transparent_1px)]
            [background-size:24px_24px]
            sm:[background-size:32px_32px]
          "
        />
      </div>

      {/* ========================================================= */}
      {/* HEADER                                                    */}
      {/* ========================================================= */}

      <div className="relative z-30">
        <Header raffle={!!raffle} />
      </div>

      {/* ========================================================= */}
      {/* BOTÓN PANEL ADMIN                                        */}
      {/* ========================================================= */}

      <div
        className="
          relative
          z-20
          mx-auto
          flex
          w-full
          max-w-5xl
          justify-end
          px-3
          pt-4
          sm:px-6
          lg:px-8
        "
      >
        <Link
          href="/admin"
          className="
            group
            inline-flex
            items-center
            gap-2
            rounded-xl
            border
            border-violet-500/30
            bg-violet-500/10
            px-4
            py-2.5
            text-sm
            font-semibold
            text-violet-300
            shadow-lg
            shadow-violet-900/10
            backdrop-blur-md
            transition-all
            duration-300
            hover:-translate-y-0.5
            hover:border-violet-400/50
            hover:bg-violet-500/20
            hover:text-white
          "
        >

          {/* Icono */}

          <svg
            className="
              h-5
              w-5
              transition-transform
              duration-300
              group-hover:rotate-12
            "
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
            />

            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              d="M19.4 15a1.7 1.7 0 00.34 1.87l.06.06-1.8 1.8-.06-.06a1.7 1.7 0 00-1.87-.34 1.7 1.7 0 00-1.03 1.56V20h-2.55v-.11a1.7 1.7 0 00-1.03-1.56 1.7 1.7 0 00-1.87.34l-.06.06-1.8-1.8.06-.06A1.7 1.7 0 008.13 15a1.7 1.7 0 00-1.56-1.03H6v-2.55h.57A1.7 1.7 0 008.13 10a1.7 1.7 0 00-.34-1.87l-.06-.06 1.8-1.8.06.06a1.7 1.7 0 001.87.34 1.7 1.7 0 001.03-1.56V5h2.55v.11a1.7 1.7 0 001.03 1.56 1.7 1.7 0 001.87-.34l.06-.06 1.8 1.8-.06.06A1.7 1.7 0 0019.4 10c.13.54.54.95 1.08 1.08H21v2.55h-.52A1.7 1.7 0 0019.4 15z"
            />
          </svg>

          <span className="hidden sm:inline">
            Panel admin
          </span>

          <span className="sm:hidden">
            Admin
          </span>

          <svg
            className="
              h-4
              w-4
              transition-transform
              duration-300
              group-hover:translate-x-0.5
            "
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            />
          </svg>

        </Link>
      </div>

      {/* ========================================================= */}
      {/* CONTENIDO                                                 */}
      {/* ========================================================= */}

      {isLoading ? (
        <LoadingScreen />

      ) : !raffle ? (

        /* ======================================================= */
        /* SIN RIFA                                                */
        /* ======================================================= */

        <div
          className="
            relative
            z-10
            flex
            min-h-[calc(100vh-64px)]
            items-center
            justify-center
            px-4
            py-10
          "
        >
          <div
            className="
              w-full
              max-w-sm
              rounded-2xl
              border
              border-white/10
              bg-white/5
              px-5
              py-6
              text-center
              shadow-2xl
              backdrop-blur-xl
              sm:px-8
              sm:py-7
            "
          >

            <div
              className="
                mx-auto
                mb-4
                flex
                h-12
                w-12
                items-center
                justify-center
                rounded-xl
                bg-white/5
              "
            >
              <svg
                className="h-6 w-6 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
            </div>

            <p
              className="
                text-base
                font-medium
                leading-relaxed
                text-slate-300
                sm:text-lg
              "
            >
              No hay rifas activas por el momento.
            </p>

            <p
              className="
                mt-2
                text-sm
                leading-relaxed
                text-slate-500
              "
            >
              Vuelve pronto, ¡ya viene otra ronda!
            </p>

          </div>
        </div>

      ) : (

        /* ======================================================= */
        /* RIFA ACTIVA                                             */
        /* ======================================================= */

        <div
          className="
            relative
            z-10
            mx-auto
            w-full
            max-w-5xl
            px-3
            py-6
            sm:px-6
            sm:py-8
            lg:px-8
          "
        >

          {/* ===================================================== */}
          {/* TÍTULO                                                */}
          {/* ===================================================== */}

          <div
            className="
              mb-6
              text-center
              sm:mb-8
            "
          >

            <div
              className="
                mb-3
                inline-flex
                items-center
                rounded-full
                border
                border-purple-400/20
                bg-purple-500/10
                px-3
                py-1.5
                text-xs
                font-medium
                text-purple-300
                backdrop-blur-md
                sm:px-4
                sm:text-sm
              "
            >
              🎟️ Rifa activa
            </div>

            <h1
              className="
                text-2xl
                font-black
                tracking-tight
                text-white
                sm:text-4xl
                md:text-5xl
              "
            >
              ¡Participa y gana!
            </h1>

            <p
              className="
                mx-auto
                mt-2
                max-w-xl
                px-2
                text-sm
                leading-relaxed
                text-slate-400
                sm:mt-3
                sm:text-base
              "
            >
              Elige tu número, resérvalo y participa
              por increíbles premios.
            </p>

          </div>

          {/* ===================================================== */}
          {/* PREMIO                                                */}
          {/* ===================================================== */}

          <div className="mb-5 sm:mb-6">
            <PrizeCard raffle={raffle} />
          </div>
{/* ===================================================== */}
{/* FECHA Y HORA DEL SORTEO                              */}
{/* ===================================================== */}

<div className="mb-5 sm:mb-6">

  <div
    className="
      rounded-2xl
      border
      border-violet-500/20
      bg-violet-500/5
      p-4
      backdrop-blur-xl
      sm:p-5
    "
  >

    <div className="mb-4">

      <p
        className="
          text-xs
          font-bold
          uppercase
          tracking-[0.2em]
          text-violet-400
        "
      >
        🎰 Fecha del sorteo
      </p>

      <p className="mt-1 text-sm text-slate-400">
        Estos son los datos programados para el sorteo.
      </p>

    </div>

    <div className="grid gap-3 sm:grid-cols-3">

      {/* FECHA */}

      <div
        className="
          rounded-xl
          border
          border-white/10
          bg-white/[0.04]
          p-4
        "
      >

        <div className="flex items-center gap-3">

          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-violet-500/10
              text-lg
            "
          >
            📅
          </div>

          <div className="min-w-0">

            <p className="text-xs text-slate-500">
              Fecha
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
              {raffle.drawDate
                ? new Date(
                    `${raffle.drawDate}T12:00:00`
                  ).toLocaleDateString(
                    "es-CO",
                    {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }
                  )
                : "No definida"}
            </p>

          </div>

        </div>

      </div>

      {/* HORA */}

      <div
        className="
          rounded-xl
          border
          border-white/10
          bg-white/[0.04]
          p-4
        "
      >

        <div className="flex items-center gap-3">

          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-blue-500/10
              text-lg
            "
          >
            🕐
          </div>

          <div>

            <p className="text-xs text-slate-500">
              Hora
            </p>

            <p className="mt-1 text-sm font-semibold text-white">
              {raffle.drawTime || "No definida"}
            </p>

          </div>

        </div>

      </div>

      {/* MÉTODO */}

      <div
        className="
          rounded-xl
          border
          border-white/10
          bg-white/[0.04]
          p-4
        "
      >

        <div className="flex items-center gap-3">

          <div
            className="
              flex
              h-10
              w-10
              shrink-0
              items-center
              justify-center
              rounded-xl
              bg-emerald-500/10
              text-lg
            "
          >
            🎟️
          </div>

          <div className="min-w-0">

            <p className="text-xs text-slate-500">
              Método
            </p>

            <p className="mt-1 truncate text-sm font-semibold text-white">
              {raffle.drawMethod || "No definido"}
            </p>

          </div>

        </div>

      </div>

    </div>

  </div>

</div>
          {/* ===================================================== */}
          {/* PROGRESO                                               */}
          {/* ===================================================== */}

          {total > 0 && (
            <div
              className="
                mb-5
                rounded-2xl
                border
                border-white/10
                bg-white/[0.04]
                p-3.5
                backdrop-blur-xl
                sm:mb-6
                sm:p-5
              "
            >

              <div
                className="
                  mb-2
                  flex
                  items-center
                  justify-between
                  gap-3
                  text-xs
                  sm:text-sm
                "
              >

                <span className="font-medium text-slate-300">
                  Números vendidos
                </span>

                <span
                  className="
                    shrink-0
                    font-semibold
                    text-violet-300
                  "
                >
                  {sold} / {total} ({progress}%)
                </span>

              </div>

              <div
                className="
                  h-2
                  overflow-hidden
                  rounded-full
                  bg-white/5
                  sm:h-2.5
                "
              >
                <div
                  className="
                    h-full
                    rounded-full
                    bg-gradient-to-r
                    from-violet-500
                    to-blue-500
                    transition-all
                    duration-500
                  "
                  style={{
                    width: `${progress}%`,
                  }}
                />
              </div>

            </div>
          )}

          {/* ===================================================== */}
          {/* NÚMEROS                                               */}
          {/* ===================================================== */}

          <div
            className="
              rounded-2xl
              border
              border-white/10
              bg-white/[0.04]
              p-3.5
              shadow-2xl
              backdrop-blur-xl
              sm:rounded-3xl
              sm:p-6
            "
          >

            <div className="mb-4 sm:mb-5">

              <h2
                className="
                  text-lg
                  font-bold
                  text-white
                  sm:text-xl
                "
              >
                Elige tu número
              </h2>

              <p
                className="
                  mt-1
                  text-xs
                  leading-relaxed
                  text-slate-400
                  sm:text-sm
                "
              >
                Selecciona uno de los números
                disponibles para participar.
              </p>

            </div>

            <div className="w-full overflow-x-auto">

              <NumberGrid
                numbers={numbers}
                onSelect={setSelected}
              />

            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* FOOTER                                                    */}
      {/* ========================================================= */}

      {!isLoading && <Footer />}

      {/* ========================================================= */}
      {/* MODAL                                                     */}
      {/* ========================================================= */}

      {selected && raffle && (
  <ReservationModal
    raffleId={raffle.id}
    raffle={raffle}
    number={selected}
    onClose={() => setSelected(null)}
  />
)}
    </main>
  );
}

/* ================================================================
   COMPONENTE FECHA DEL SORTEO
================================================================ */

function DrawDateCard({
  drawDate,
}: {
  drawDate: string | Date | { toDate: () => Date };
}) {
  const date =
    drawDate instanceof Date
      ? drawDate
      : typeof drawDate === "object" && "toDate" in drawDate
        ? drawDate.toDate()
        : new Date(drawDate);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const formattedDate = new Intl.DateTimeFormat(
    "es-CO",
    {
      timeZone: "America/Bogota",
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(date);

  const formattedTime = new Intl.DateTimeFormat(
    "es-CO",
    {
      timeZone: "America/Bogota",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }
  ).format(date);

  return (
    <div
      className="
        relative
        mb-6
        overflow-hidden
        rounded-3xl
        border
        border-amber-400/20
        bg-gradient-to-br
        from-amber-500/10
        via-white/[0.04]
        to-violet-500/10
        p-5
        shadow-2xl
        shadow-black/20
        backdrop-blur-xl
        sm:p-6
      "
    >

      {/* Brillos */}

      <div
        className="
          pointer-events-none
          absolute
          -right-20
          -top-20
          h-40
          w-40
          rounded-full
          bg-amber-400/10
          blur-3xl
        "
      />

      <div
        className="
          pointer-events-none
          absolute
          -bottom-20
          -left-20
          h-40
          w-40
          rounded-full
          bg-violet-500/10
          blur-3xl
        "
      />

      <div
        className="
          relative
          flex
          flex-col
          gap-5
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >

        {/* Información */}

        <div className="flex items-center gap-4">

          <div
            className="
              flex
              h-14
              w-14
              shrink-0
              items-center
              justify-center
              rounded-2xl
              border
              border-amber-400/20
              bg-amber-400/10
              text-amber-300
              shadow-lg
              shadow-amber-900/10
            "
          >
            <svg
              className="h-7 w-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M8 2v4m8-4v4M3 10h18M5 4h14a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z"
              />
            </svg>
          </div>

          <div>

            <p
              className="
                text-xs
                font-bold
                uppercase
                tracking-[0.2em]
                text-amber-400
              "
            >
              Fecha del sorteo
            </p>

            <p
              className="
                mt-1
                text-base
                font-bold
                capitalize
                text-white
                sm:text-lg
              "
            >
              {formattedDate}
            </p>

          </div>

        </div>

        {/* Hora */}

        <div
          className="
            flex
            items-center
            gap-3
            rounded-2xl
            border
            border-white/10
            bg-black/20
            px-4
            py-3
            sm:px-5
          "
        >

          <svg
            className="h-5 w-5 text-amber-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              strokeWidth="1.8"
            />

            <path
              strokeLinecap="round"
              strokeWidth="1.8"
              d="M12 7v5l3 2"
            />
          </svg>

          <div>

            <p
              className="
                text-[10px]
                font-semibold
                uppercase
                tracking-wider
                text-slate-500
              "
            >
              Hora Colombia
            </p>

            <p
              className="
                mt-0.5
                text-lg
                font-black
                text-amber-300
              "
            >
              {formattedTime}
            </p>

          </div>

        </div>

      </div>

    </div>
  );
}

/* ================================================================
   PANTALLA DE CARGA
================================================================ */

function LoadingScreen() {
  return (
    <div
      className="
        relative
        z-10
        flex
        min-h-[calc(100vh-64px)]
        flex-col
        items-center
        justify-center
        px-4
        py-10
      "
    >

      {/* Logo animado */}

      <div
        className="
          relative
          mb-6
          flex
          h-16
          w-16
          items-center
          justify-center
        "
      >

        <div
          className="
            absolute
            inset-0
            animate-ping
            rounded-2xl
            bg-violet-600/30
          "
        />

        <div
          className="
            relative
            flex
            h-16
            w-16
            items-center
            justify-center
            rounded-2xl
            bg-gradient-to-br
            from-violet-600
            to-blue-600
            shadow-lg
            shadow-violet-600/30
          "
        >

          <svg
            className="
              h-7
              w-7
              animate-spin
              text-white
            "
            style={{
              animationDuration: "1.2s",
            }}
            fill="none"
            viewBox="0 0 24 24"
          >

            <circle
              className="opacity-20"
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeWidth="3"
            />

            <path
              d="M21 12a9 9 0 00-9-9"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />

          </svg>

        </div>

      </div>

      <p
        className="
          text-sm
          font-semibold
          tracking-tight
          text-white
          sm:text-base
        "
      >
        Cargando la rifa
      </p>

      <p
        className="
          mt-1
          text-xs
          text-slate-500
          sm:text-sm
        "
      >
        Un momento, estamos preparando todo para ti...
      </p>

      {/* Skeleton */}

      <div
        className="
          mt-8
          w-full
          max-w-md
          space-y-4
        "
      >

        <div
          className="
            h-28
            w-full
            animate-pulse
            rounded-2xl
            border
            border-white/10
            bg-white/[0.04]
          "
        />

        <div
          className="
            h-4
            w-2/3
            animate-pulse
            rounded-full
            bg-white/[0.06]
          "
        />

        <div
          className="
            grid
            grid-cols-5
            gap-2
            sm:grid-cols-6
          "
        >

          {Array.from({ length: 12 }).map(
            (_, i) => (
              <div
                key={i}
                className="
                  h-10
                  animate-pulse
                  rounded-lg
                  border
                  border-white/[0.06]
                  bg-white/[0.03]
                "
                style={{
                  animationDelay:
                    `${i * 60}ms`,
                }}
              />
            )
          )}

        </div>

      </div>

    </div>
  );
}