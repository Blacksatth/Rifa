
"use client";

import { useEffect, useMemo, useState } from "react";
import {
  collection,
  limit,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Raffle, RaffleNumber } from "@/lib/types";
import { isReservationExpired } from "@/lib/reservations";
import { releaseExpiredReservations } from "@/lib/actions";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PrizeCard from "@/components/PrizeCard";
import NumberGrid from "@/components/NumberGrid";
import ReservationModal from "@/components/ReservationModal";
import ReservationBanner from "@/components/ReservationBanner";

/**
 * Página principal pública de la aplicación.
 *
 * Muestra la rifa activa y permite a los visitantes:
 * 1. Ver la información del premio y la rifa
 * 2. Navegar la grilla de números
 * 3. Seleccionar un número para reservarlo
 *
 * Flujo de datos:
 * - Consulta Firestore en tiempo real para la rifa activa (`active == true`)
 * - Carga los números de la subcolección en tiempo real
 * - Al cargar, limpia las reservas expiradas vía Server Actions
 * - Al seleccionar un número, abre el ReservationModal
 *
 * Sub-componentes inline:
 * - Background: gradientes decorativos de fondo
 * - InfoCard: tarjetas con información del sorteo (fecha, hora, método)
 * - LoadingScreen: pantalla de carga animada
 * - EmptyRaffle: mensaje cuando no hay rifa activa
 * - formatReadMore: utilidad para formatear fechas legibles
 */
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
    const rafflesRef = collection(db, "raffles");

    const q = query(
      rafflesRef,
      where("active", "==", true),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const raffleDoc = snapshot.docs[0];

        if (!raffleDoc) {
          setRaffle(null);
          setNumbers([]);
          setLoadingNumbers(false);
          setLoadingRaffle(false);
          return;
        }

        const data = raffleDoc.data() as Raffle;

        setRaffle({
          ...data,
          id: raffleDoc.id,
        });

        setLoadingRaffle(false);
      },
      (error) => {
        console.error("Error obteniendo la rifa:", error);

        setRaffle(null);
        setNumbers([]);
        setLoadingRaffle(false);
        setLoadingNumbers(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /* ================================================================
     OBTENER NÚMEROS DE LA RIFA
  ================================================================= */

  useEffect(() => {
    if (!raffle?.id) {
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

    const unsubscribe = onSnapshot(
      numbersRef,
      (snapshot) => {
        const raffleNumbers = snapshot.docs.map((doc) => ({
          ...(doc.data() as RaffleNumber),
          id: doc.id,
        }));

        setNumbers(raffleNumbers);
        setLoadingNumbers(false);
      },
      (error) => {
        console.error("Error obteniendo números:", error);
        setNumbers([]);
        setLoadingNumbers(false);
      }
    );

    return () => unsubscribe();
  }, [raffle?.id]);

  /* ================================================================
     VALIDAR RESERVAS EXPIRADAS
     ================================================================
     Cuando el contador llega a 0 (o cuando alguien recarga la
     página), liberamos cualquier reserva vencida para que el
     número vuelva a estar disponible automáticamente.
  ================================================================= */

  useEffect(() => {
    if (!raffle?.id) {
      return;
    }

    // Liberar cualquier reserva vencida. Se delega al servidor, que
    // valida (transaccional) que cada numero este reservado y haya
    // expirado realmente antes de liberarlo.
    const releaseExpired = () => {
      const expiredIds = numbers
        .filter((n) => isReservationExpired(n))
        .map((n) => n.id);

      if (expiredIds.length === 0) {
        return;
      }

      releaseExpiredReservations({
        raffleId: raffle.id,
        numberIds: expiredIds,
      }).catch((error) => {
        console.error(
          "Error liberando reservas expiradas:",
          error
        );
      });
    };

    // Liberar al cargar y cuando cambian los numeros.
    releaseExpired();

    // Tambien liberar cuando el contador de cualquier reserva llega a 0,
    // aunque no haya habido cambios en Firestore. Asi el numero vuelve a
    // estar disponible automaticamente, sin que el admin tenga que
    // liberarlo a mano.
    const interval = setInterval(releaseExpired, 1000);

    return () => clearInterval(interval);
  }, [raffle?.id, numbers]);

  /* ================================================================
     ESTADÍSTICAS
  ================================================================= */

  const { total, sold, progress } = useMemo(() => {
    const totalNumbers = numbers.length;

    const occupiedNumbers = numbers.filter(
      (number) =>
        number.status === "sold" ||
        number.status === "reserved"
    ).length;

    const percentage =
      totalNumbers > 0
        ? Math.round((occupiedNumbers / totalNumbers) * 100)
        : 0;

    return {
      total: totalNumbers,
      sold: occupiedNumbers,
      progress: percentage,
    };
  }, [numbers]);

  const isLoading =
    loadingRaffle ||
    (raffle !== null && loadingNumbers);

  /* ================================================================
     RENDER
  ================================================================= */

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-950">

      {/* ============================================================
          FONDO
      ============================================================ */}

      <Background />

      {/* ============================================================
          HEADER
      ============================================================ */}

      <div className="relative z-50">
        <Header raffle={!!raffle} />
      </div>

      {/* ============================================================
          CONTENIDO
      ============================================================ */}

      {isLoading ? (
        <LoadingScreen />
      ) : !raffle ? (
        <EmptyRaffle />
      ) : (
        <section className="relative z-10 w-full pt-16 sm:pt-20">

          <div
           className="
  mx-auto
  w-full
  max-w-6xl
  px-4
  pb-14
  pt-4
  sm:px-6
  sm:pb-16
  sm:pt-6
  lg:px-8
"
          >

            {/* ======================================================
                HERO
            ====================================================== */}

            <header className="mx-auto mb-8 max-w-3xl text-center sm:mb-10">

              <div
                className="
                  mb-4
                  inline-flex
                  items-center
                  gap-2
                  rounded-full
                  border
                  border-violet-400/20
                  bg-violet-500/10
                  px-4
                  py-2
                  text-xs
                  font-bold
                  uppercase
                  tracking-[0.16em]
                  text-violet-300
                  shadow-lg
                  shadow-violet-950/20
                "
              >
                <span className="text-sm">🎟️</span>
                Rifa activa
              </div>

              <h1
                className="
                  text-3xl
                  font-black
                  tracking-tight
                  text-white
                  sm:text-4xl
                  md:text-5xl
                  lg:text-6xl
                "
              >
                ¡Participa y gana!
              </h1>

              <p
                className="
                  mx-auto
                  mt-3
                  max-w-2xl
                  text-sm
                  leading-6
                  text-slate-400
                  sm:mt-4
                  sm:text-base
                  sm:leading-7
                "
              >
                Elige tu número, resérvalo y participa
                por increíbles premios.
              </p>

            </header>

            {/* ======================================================
                PREMIO
            ====================================================== */}

            <section className="mb-6 sm:mb-8">
              <PrizeCard raffle={raffle} />
            </section>

            {/* ======================================================
                INFORMACIÓN DEL SORTEO
            ====================================================== */}

            <section
              className="
                mb-6
                overflow-hidden
                rounded-3xl
                border
                border-white/10
                bg-white/[0.035]
                p-4
                shadow-xl
                shadow-black/10
                backdrop-blur-xl
                sm:mb-8
                sm:p-6
              "
            >

              <div
                className="
                  mb-5
                  flex
                  flex-col
                  gap-2
                  sm:mb-6
                  sm:flex-row
                  sm:items-end
                  sm:justify-between
                "
              >

                <div>

                  <div
                    className="
                      flex
                      items-center
                      gap-2
                      text-xs
                      font-bold
                      uppercase
                      tracking-[0.18em]
                      text-violet-400
                    "
                  >
                    <span>🎰</span>
                    Fecha del sorteo
                  </div>

                  <p className="mt-1.5 text-sm text-slate-500">
                    Estos son los datos programados para el sorteo.
                  </p>

                </div>

              </div>

              <div className="grid gap-3 sm:grid-cols-3">

                <InfoCard
                  icon="📅"
                  label="Fecha"
                  value={formatDrawDate(raffle.drawDate)}
                />

                <InfoCard
                  icon="🕐"
                  label="Hora"
                  value={raffle.drawTime || "No definida"}
                />

                <InfoCard
                  icon="🎟️"
                  label="Método"
                  value={raffle.drawMethod || "No definido"}
                />

              </div>

            </section>

            {/* ======================================================
                PROGRESO
            ====================================================== */}

            {total > 0 && (
              <section
                className="
                  mb-6
                  rounded-3xl
                  border
                  border-white/10
                  bg-white/[0.035]
                  p-4
                  shadow-xl
                  shadow-black/10
                  backdrop-blur-xl
                  sm:mb-8
                  sm:p-5
                "
              >

                <div
                  className="
                    mb-3
                    flex
                    items-center
                    justify-between
                    gap-4
                  "
                >

                  <div>
                    <p className="text-sm font-semibold text-white">
                      Números vendidos
                    </p>

                    <p className="mt-0.5 text-xs text-slate-500">
                      Progreso de la rifa
                    </p>
                  </div>

                  <span
                    className="
                      shrink-0
                      rounded-full
                      bg-violet-500/10
                      px-3
                      py-1
                      text-xs
                      font-bold
                      text-violet-300
                      sm:text-sm
                    "
                  >
                    {sold} / {total} · {progress}%
                  </span>

                </div>

                <div
                  className="
                    h-2.5
                    overflow-hidden
                    rounded-full
                    bg-white/[0.06]
                  "
                >

                  <div
                    className="
                      h-full
                      rounded-full
                      bg-gradient-to-r
                      from-violet-500
                      via-purple-500
                      to-blue-500
                      transition-all
                      duration-700
                      ease-out
                    "
                    style={{
                      width: `${progress}%`,
                    }}
                  />

                </div>

              </section>
            )}

            {/* ======================================================
                NÚMEROS
            ====================================================== */}

            <section
              className="
                overflow-hidden
                rounded-3xl
                border
                border-white/10
                bg-white/[0.035]
                shadow-2xl
                shadow-black/20
                backdrop-blur-xl
              "
            >

              {/* Encabezado */}

              <div
                className="
                  border-b
                  border-white/[0.07]
                  px-4
                  py-5
                  sm:px-6
                  sm:py-6
                "
              >

                <div
                  className="
                    flex
                    flex-col
                    gap-1
                    sm:flex-row
                    sm:items-end
                    sm:justify-between
                  "
                >

                  <div>

                    <h2
                      className="
                        text-xl
                        font-bold
                        tracking-tight
                        text-white
                        sm:text-2xl
                      "
                    >
                      Elige tu número
                    </h2>

                    <p
                      className="
                        mt-1.5
                        max-w-xl
                        text-xs
                        leading-5
                        text-slate-400
                        sm:text-sm
                      "
                    >
                      Selecciona uno de los números disponibles
                      para participar.
                    </p>

                  </div>

                  {total > 0 && (
                    <div
                      className="
                        hidden
                        rounded-full
                        border
                        border-emerald-400/10
                        bg-emerald-400/5
                        px-3
                        py-1.5
                        text-xs
                        font-semibold
                        text-emerald-300
                        sm:block
                      "
                    >
                      {total - sold} disponibles
                    </div>
                  )}

                </div>

              </div>

              {/* Grid */}

              <div
                className="
                  p-3
                  sm:p-5
                  md:p-6
                "
              >

                <div className="w-full overflow-x-auto">
                  <NumberGrid
                    numbers={numbers}
                    onSelect={setSelected}
                  />
                </div>

              </div>

            </section>

          </div>

        </section>
      )}

      {/* ============================================================
          FOOTER
      ============================================================ */}

      {!isLoading && <Footer />}

      {/* ============================================================
          MODAL
      ============================================================ */}

      {selected && raffle && (
        <ReservationModal
          raffleId={raffle.id}
          raffle={raffle}
          number={selected}
          onClose={() => setSelected(null)}
        />
      )}

      {/* ============================================================
          BANNER DE RESERVA ACTIVA
      ============================================================ */}

      {raffle && (
        <ReservationBanner
          numbers={numbers}
          raffle={raffle}
          onOpenNumber={setSelected}
        />
      )}

    </main>
  );
}

/* ==================================================================
   FONDO DECORATIVO
================================================================== */

function Background() {
  return (
    <div
      className="
        pointer-events-none
        fixed
        inset-0
        z-0
        overflow-hidden
      "
      aria-hidden="true"
    >

      {/* Gradientes */}

      <div
        className="
          absolute
          inset-0
          bg-[radial-gradient(circle_at_top,rgba(124,58,237,0.16),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(37,99,235,0.14),transparent_34%)]
        "
      />

      {/* Luz superior izquierda */}

      <div
        className="
          absolute
          -left-32
          -top-32
          h-[320px]
          w-[320px]
          rounded-full
          bg-purple-600/15
          blur-[100px]
          sm:-left-48
          sm:-top-48
          sm:h-[520px]
          sm:w-[520px]
          sm:blur-[130px]
        "
      />

      {/* Luz superior derecha */}

      <div
        className="
          absolute
          -right-32
          top-16
          h-[300px]
          w-[300px]
          rounded-full
          bg-blue-600/15
          blur-[100px]
          sm:-right-48
          sm:top-20
          sm:h-[500px]
          sm:w-[500px]
          sm:blur-[130px]
        "
      />

      {/* Luz inferior */}

      <div
        className="
          absolute
          -bottom-40
          left-1/2
          h-[350px]
          w-[350px]
          -translate-x-1/2
          rounded-full
          bg-fuchsia-600/10
          blur-[110px]
          sm:-bottom-56
          sm:left-1/3
          sm:h-[520px]
          sm:w-[520px]
          sm:translate-x-0
          sm:blur-[140px]
        "
      />

      {/* Puntos */}

      <div
        className="
          absolute
          inset-0
          opacity-[0.07]
          [background-image:radial-gradient(circle,rgba(255,255,255,0.8)_1px,transparent_1px)]
          [background-size:26px_26px]
          sm:[background-size:32px_32px]
        "
      />

    </div>
  );
}

/* ==================================================================
   TARJETA DE INFORMACIÓN
================================================================== */

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        border-white/[0.07]
        bg-black/10
        p-4
        transition-colors
        hover:border-white/10
        hover:bg-white/[0.035]
      "
    >

      <div className="flex items-center gap-3">

        <div
          className="
            flex
            h-11
            w-11
            shrink-0
            items-center
            justify-center
            rounded-xl
            border
            border-white/[0.06]
            bg-white/[0.04]
            text-lg
          "
        >
          {icon}
        </div>

        <div className="min-w-0">

          <p
            className="
              text-[11px]
              font-medium
              uppercase
              tracking-wider
              text-slate-500
            "
          >
            {label}
          </p>

          <p
            className="
              mt-1
              truncate
              text-sm
              font-semibold
              text-white
            "
            title={value}
          >
            {value}
          </p>

        </div>

      </div>

    </div>
  );
}

/* ==================================================================
   FORMATEAR FECHA
================================================================== */

function formatDrawDate(drawDate: unknown): string {
  if (drawDate === null || drawDate === undefined || drawDate === "") {
    return "No definida";
  }

  try {
    let date: Date;

    if (drawDate instanceof Date) {
      date = drawDate;
    } else if (
      typeof drawDate === "object" &&
      drawDate !== null &&
      "toDate" in drawDate &&
      typeof (drawDate as { toDate?: unknown }).toDate === "function"
    ) {
      date = (drawDate as { toDate: () => Date }).toDate();
    } else {
      const str = String(drawDate);

      /*
       * Si es una fecha pura "YYYY-MM-DD" (sin hora), la descomponemos
       * y construimos una fecha LOCAL (new Date(year, month, day)) en vez
       * de "YYYY-MM-DD" que JavaScript interpreta como medianoche UTC.
       *
       * De lo contrario, al formatear en America/Bogota (UTC-5), un
       * "2026-09-26" se mostraría como 25 de septiembre.
       */

      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);

      if (m) {
        date = new Date(
          Number(m[1]),
          Number(m[2]) - 1,
          Number(m[3])
        );
      } else {
        date = new Date(str);
      }
    }

    if (Number.isNaN(date.getTime())) {
      return "No definida";
    }

    return new Intl.DateTimeFormat("es-CO", {
      timeZone: "America/Bogota",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch {
    return "No definida";
  }
}

/* ==================================================================
   SIN RIFA
================================================================== */

function EmptyRaffle() {
  return (
    <section
      className="
        relative
        z-10
        flex
        min-h-[calc(100vh-64px)]
        items-center
        justify-center
        px-4
        py-12
      "
    >

      <div
        className="
          w-full
          max-w-md
          rounded-3xl
          border
          border-white/10
          bg-white/[0.04]
          p-6
          text-center
          shadow-2xl
          shadow-black/20
          backdrop-blur-xl
          sm:p-8
        "
      >

        <div
          className="
            mx-auto
            mb-5
            flex
            h-14
            w-14
            items-center
            justify-center
            rounded-2xl
            border
            border-white/10
            bg-white/[0.05]
          "
        >

          <svg
            className="h-7 w-7 text-slate-400"
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

        <h1
          className="
            text-lg
            font-bold
            text-white
            sm:text-xl
          "
        >
          No hay rifas activas
        </h1>

        <p
          className="
            mt-2
            text-sm
            leading-6
            text-slate-500
          "
        >
          No hay rifas disponibles por el momento.
          Vuelve pronto, ¡ya viene otra ronda!
        </p>

      </div>

    </section>
  );
}

/* ==================================================================
   PANTALLA DE CARGA
================================================================== */

function LoadingScreen() {
  return (
    <section
      className="
        relative
        z-10
        flex
        min-h-[calc(100vh-64px)]
        flex-col
        items-center
        justify-center
        px-4
        py-12
      "
    >

      {/* Spinner */}

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
            bg-violet-600/20
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
            shadow-xl
            shadow-violet-600/20
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
          text-white
          sm:text-base
        "
      >
        Cargando la rifa
      </p>

      <p
        className="
          mt-1
          text-center
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
          max-w-lg
          space-y-4
        "
      >

        <div
          className="
            h-32
            animate-pulse
            rounded-3xl
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

          {Array.from({ length: 12 }).map((_, index) => (
            <div
              key={index}
              className="
                h-10
                animate-pulse
                rounded-lg
                border
                border-white/[0.06]
                bg-white/[0.03]
              "
              style={{
                animationDelay: `${index * 60}ms`,
              }}
            />
          ))}

        </div>

      </div>

    </section>
  );
}

