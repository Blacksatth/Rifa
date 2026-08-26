"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  limit,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Raffle, RaffleNumber } from "@/lib/types";
import PrizeCard from "@/components/PrizeCard";
import NumberGrid from "@/components/NumberGrid";
import Header from "@/components/Header";
import ReservationModal from "@/components/ReservationModal";

export default function HomePage() {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [selected, setSelected] = useState<RaffleNumber | null>(null);

  const [loadingRaffle, setLoadingRaffle] = useState(true);
  const [loadingNumbers, setLoadingNumbers] = useState(true);

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
        const doc = snap.docs[0];

        if (doc) {
          setRaffle({
            id: doc.id,
            ...(doc.data() as any),
          });
        } else {
          setRaffle(null);
          setLoadingNumbers(false);
        }

        setLoadingRaffle(false);
      },
      () => {
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
    if (!raffle) return;

    setLoadingNumbers(true);

    const unsub = onSnapshot(
      collection(db, "raffles", raffle.id, "numbers"),
      (snap) => {
        setNumbers(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }))
        );

        setLoadingNumbers(false);
      },
      () => {
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
    (n) => n.status === "sold" || n.status === "reserved"
  ).length;

  const progress = total > 0 ? Math.round((sold / total) * 100) : 0;

  const isLoading =
    loadingRaffle || (raffle !== null && loadingNumbers);

  /* ================================================================
     RENDER
  ================================================================= */

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-950 top-15">

      {/* ========================================================= */}
      {/* FONDO DECORATIVO                                         */}
      {/* ========================================================= */}

      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">

        {/* Gradientes principales */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.18),_transparent_35%)]" />

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

      
        <Header raffle={!!raffle} />
    

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

            <p className="text-base font-medium leading-relaxed text-slate-300 sm:text-lg">
              No hay rifas activas por el momento.
            </p>

            <p className="mt-2 text-sm leading-relaxed text-slate-500">
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

          <div className="mb-6 text-center sm:mb-8">

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
              Elige tu número, resérvalo y participa por increíbles premios.
            </p>
          </div>

          {/* ===================================================== */}
          {/* PREMIO                                                */}
          {/* ===================================================== */}

          <div className="mb-5 sm:mb-6">
            <PrizeCard raffle={raffle} />
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

                <span className="shrink-0 font-semibold text-violet-300">
                  {sold} / {total} ({progress}%)
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/5 sm:h-2.5">
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

              <h2 className="text-lg font-bold text-white sm:text-xl">
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
                Selecciona uno de los números disponibles para participar.
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

      {!isLoading && (
        <footer
          className="
            relative
            z-10
            mt-8
            border-t
            border-white/10
            px-4
            py-6
            sm:mt-12
          "
        >
          <p
            className="
              text-center
              text-[11px]
              leading-relaxed
              text-slate-600
              sm:text-xs
            "
          >
            © {new Date().getFullYear()} RifaYA · Todos los derechos reservados
          </p>
        </footer>
      )}

      {/* ========================================================= */}
      {/* MODAL                                                     */}
      {/* ========================================================= */}

      {selected && raffle && (
        <ReservationModal
          raffleId={raffle.id}
          number={selected}
          onClose={() => setSelected(null)}
        />
      )}

    </main>
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
      <div className="relative mb-6 flex h-16 w-16 items-center justify-center">

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
            className="h-7 w-7 animate-spin text-white"
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

      <p className="mt-1 text-xs text-slate-500 sm:text-sm">
        Un momento, estamos preparando todo para ti...
      </p>

      {/* Skeleton */}
      <div className="mt-8 w-full max-w-md space-y-4">

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

        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">

          {Array.from({ length: 12 }).map((_, i) => (
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
                animationDelay: `${i * 60}ms`,
              }}
            />
          ))}

        </div>
      </div>

    </div>
  );
}