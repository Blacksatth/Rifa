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

  if (!raffle) {
    return (
      <main className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center">
        {/* Botón Admin */}
        <Link
          href="/admin"
          className="fixed top-4 right-4 z-20 flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-400 backdrop-blur-md transition-all hover:border-violet-500/20 hover:bg-violet-500/10 hover:text-violet-300"
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
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622C17.176 19.29 21 14.591 21 9c0-1.042-.133-2.053-.382-3.016z"
            />
          </svg>
          Admin
        </Link>

        {/* Luces del fondo */}
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-purple-600/20 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

        <div className="relative z-10 rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-center shadow-2xl backdrop-blur-xl">
          <p className="text-lg font-medium text-slate-300">
            No hay rifas activas.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950">
      {/* Botón Admin */}
      <Link
        href="/admin"
        className="fixed top-4 right-4 z-20 flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-medium text-slate-400 backdrop-blur-md transition-all hover:border-violet-500/20 hover:bg-violet-500/10 hover:text-violet-300"
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
            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622C17.176 19.29 21 14.591 21 9c0-1.042-.133-2.053-.382-3.016z"
          />
        </svg>
        Admin
      </Link>

      {/* ========================================= */}
      {/* FONDO DECORATIVO */}
      {/* ========================================= */}

      {/* Gradiente general */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(124,58,237,0.18),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(37,99,235,0.18),_transparent_35%)]" />

      {/* Luz morada superior izquierda */}
      <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-purple-600/20 blur-[120px]" />

      {/* Luz azul superior derecha */}
      <div className="absolute -right-40 top-20 h-[450px] w-[450px] rounded-full bg-blue-600/20 blur-[120px]" />

      {/* Luz fucsia inferior */}
      <div className="absolute -bottom-40 left-1/3 h-[450px] w-[450px] rounded-full bg-fuchsia-600/10 blur-[120px]" />

      {/* Patrón de puntos */}
      <div
        className="
          absolute inset-0
          opacity-[0.12]
          [background-image:radial-gradient(circle,_rgba(255,255,255,0.8)_1px,_transparent_1px)]
          [background-size:32px_32px]
        "
      />

      {/* ========================================= */}
      {/* CONTENIDO */}
      {/* ========================================= */}

      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Encabezado */}
        <div className="mb-8 text-center">
          <div className="mb-3 inline-flex items-center rounded-full border border-purple-400/20 bg-purple-500/10 px-4 py-1.5 text-sm font-medium text-purple-300 backdrop-blur-md">
            🎟️ Rifa activa
          </div>

          <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
            ¡Participa y gana!
          </h1>

          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-400 sm:text-base">
            Elige tu número, resérvalo y participa por increíbles premios.
          </p>
        </div>

        {/* Tarjeta del premio */}
        <div className="mb-8">
          <PrizeCard raffle={raffle} />
        </div>

        {/* Números */}
        <div
          className="
            rounded-3xl
            border border-white/10
            bg-white/[0.04]
            p-4
            shadow-2xl
            backdrop-blur-xl
            sm:p-6
          "
        >
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">
              Elige tu número
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Selecciona uno de los números disponibles para participar.
            </p>
          </div>

          <NumberGrid
            numbers={numbers}
            onSelect={setSelected}
          />
        </div>
      </div>

      {/* Modal */}
      {selected && (
        <ReservationModal
          raffleId={raffle.id}
          number={selected}
          onClose={() => setSelected(null)}
        />
      )}
    </main>
  );
}