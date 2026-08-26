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
import ReservationModal from "@/components/ReservationModal";
import Link from "next/link";

export default function HomePage() {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [selected, setSelected] = useState<RaffleNumber | null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "raffles"),
      where("active", "==", true),
      limit(1)
    );

    const unsub = onSnapshot(q, (snap) => {
      const doc = snap.docs[0];

      if (doc) {
        setRaffle({
          id: doc.id,
          ...(doc.data() as any),
        });
      }
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
    };

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!raffle) return;

    const unsub = onSnapshot(
      collection(db, "raffles", raffle.id, "numbers"),
      (snap) => {
        setNumbers(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }))
        );
      }
    );

    return () => unsub();
  }, [raffle]);

  const total = numbers.length;

  const sold = numbers.filter(
    (n) => n.status === "sold" || n.status === "reserved"
  ).length;

  const progress = total > 0 ? Math.round((sold / total) * 100) : 0;

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-slate-950">
      {/* ========================================= */}
      {/* FONDO DECORATIVO */}
      {/* ========================================= */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.18),_transparent_35%)]" />

        {/* Decoración izquierda */}
        <div className="absolute -left-32 -top-32 h-[280px] w-[280px] rounded-full bg-purple-600/20 blur-[90px] sm:-left-40 sm:-top-40 sm:h-[500px] sm:w-[500px] sm:blur-[120px]" />

        {/* Decoración derecha */}
        <div className="absolute -right-32 top-20 h-[280px] w-[280px] rounded-full bg-blue-600/20 blur-[90px] sm:-right-40 sm:h-[450px] sm:w-[450px] sm:blur-[120px]" />

        {/* Decoración inferior */}
        <div className="absolute -bottom-32 left-1/2 h-[280px] w-[280px] -translate-x-1/2 rounded-full bg-fuchsia-600/10 blur-[90px] sm:-bottom-40 sm:left-1/3 sm:h-[450px] sm:w-[450px] sm:translate-x-0 sm:blur-[120px]" />

        <div
          className="
            absolute inset-0
            opacity-[0.10]
            [background-image:radial-gradient(circle,_rgba(255,255,255,0.8)_1px,_transparent_1px)]
            [background-size:24px_24px]
            sm:[background-size:32px_32px]
          "
        />
      </div>

      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <header
        className={`sticky top-0 z-30 transition-all duration-500 ${
          scrolled
            ? "border-b border-white/10 bg-slate-950/85 py-2 shadow-lg shadow-black/20 backdrop-blur-xl"
            : "border-b border-transparent bg-slate-950/40 py-2.5 backdrop-blur-md sm:py-3.5"
        }`}
      >
        {/* Línea superior */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-3 sm:px-6 lg:px-8">
          {/* MARCA */}

          <div className="group flex min-w-0 items-center gap-2">
            <div className="relative shrink-0">
              <div className="absolute inset-0 rounded-xl bg-violet-600/40 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100" />

              <div
                className={`relative flex items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg shadow-violet-600/20 transition-all duration-500 ${
                  scrolled
                    ? "h-8 w-8"
                    : "h-8 w-8 sm:h-9 sm:w-9"
                } group-hover:rotate-[8deg] group-hover:scale-105`}
              >
                <svg
                  className="h-4 w-4 text-white sm:h-4.5 sm:w-4.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                  />
                </svg>
              </div>
            </div>

            <span className="truncate bg-gradient-to-r from-white to-slate-300 bg-clip-text text-sm font-bold tracking-tight text-transparent sm:text-base">
              Rifa
              <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                YA
              </span>
            </span>
          </div>

          {/* ACCIONES */}

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {raffle && (
              <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-all duration-300 sm:flex">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </span>

                Rifa en curso
              </span>
            )}

            <Link
              href="/admin"
              aria-label="Acceder al panel de administración"
              className="group/admin relative flex items-center gap-1.5 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 text-xs font-medium text-slate-400 transition-all duration-300 hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-300 active:scale-95 sm:px-3"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover/admin:translate-x-full" />

              <svg
                className="relative h-3.5 w-3.5 sm:h-4 sm:w-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622C17.176 19.29 21 14.591 21 9c0-1.042-.133-2.053-.382-3.016z"
                />
              </svg>

              <span className="relative hidden sm:inline">
                Admin
              </span>
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================= */}
      {/* CONTENIDO */}
      {/* ========================================= */}

      {!raffle ? (
        <div className="relative z-10 flex min-h-[calc(100vh-64px)] items-center justify-center px-4 py-10">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 px-5 py-6 text-center shadow-2xl backdrop-blur-xl sm:px-8 sm:py-7">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
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
        <div className="relative z-10 mx-auto w-full max-w-5xl px-3 py-6 sm:px-6 sm:py-8 lg:px-8">
          {/* ========================================= */}
          {/* ENCABEZADO DE LA RIFA */}
          {/* ========================================= */}

          <div className="mb-6 text-center sm:mb-8">
            <div className="mb-3 inline-flex items-center rounded-full border border-purple-400/20 bg-purple-500/10 px-3 py-1.5 text-xs font-medium text-purple-300 backdrop-blur-md sm:px-4 sm:text-sm">
              🎟️ Rifa activa
            </div>

            <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl md:text-5xl">
              ¡Participa y gana!
            </h1>

            <p className="mx-auto mt-2 max-w-xl px-2 text-sm leading-relaxed text-slate-400 sm:mt-3 sm:text-base">
              Elige tu número, resérvalo y participa por increíbles premios.
            </p>
          </div>

          {/* ========================================= */}
          {/* PREMIO */}
          {/* ========================================= */}

          <div className="mb-5 sm:mb-6">
            <PrizeCard raffle={raffle} />
          </div>

          {/* ========================================= */}
          {/* PROGRESO */}
          {/* ========================================= */}

          {total > 0 && (
            <div className="mb-5 rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 backdrop-blur-xl sm:mb-6 sm:p-5">
              <div className="mb-2 flex items-center justify-between gap-3 text-xs sm:text-sm">
                <span className="font-medium text-slate-300">
                  Números vendidos
                </span>

                <span className="shrink-0 font-semibold text-violet-300">
                  {sold} / {total} ({progress}%)
                </span>
              </div>

              <div className="h-2 overflow-hidden rounded-full bg-white/5 sm:h-2.5">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-blue-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* NÚMEROS */}
          {/* ========================================= */}

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-3.5 shadow-2xl backdrop-blur-xl sm:rounded-3xl sm:p-6">
            <div className="mb-4 sm:mb-5">
              <h2 className="text-lg font-bold text-white sm:text-xl">
                Elige tu número
              </h2>

              <p className="mt-1 text-xs leading-relaxed text-slate-400 sm:text-sm">
                Selecciona uno de los números disponibles para participar.
              </p>
            </div>

            {/* El grid debe manejar su propio responsive */}
            <div className="w-full overflow-x-auto">
              <NumberGrid
                numbers={numbers}
                onSelect={setSelected}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================= */}
      {/* FOOTER */}
      {/* ========================================= */}

      <footer className="relative z-10 mt-8 border-t border-white/10 px-4 py-6 sm:mt-12">
        <p className="text-center text-[11px] leading-relaxed text-slate-600 sm:text-xs">
          © {new Date().getFullYear()} RifaYA · Todos los derechos reservados
        </p>
      </footer>

      {/* ========================================= */}
      {/* MODAL */}
      {/* ========================================= */}

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