"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Raffle, RaffleNumber } from "@/lib/types";
import StatsPanel from "@/components/admin/StatsPanel";

export default function AdminPage() {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargar rifa activa
  useEffect(() => {
    const q = query(collection(db, "raffles"), where("active", "==", true));

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const d = snap.docs[0];
        if (d) {
          setRaffle({ id: d.id, ...(d.data() as any) });
        } else {
          setRaffle(null);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error cargando rifa:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Cargar números de la rifa
  useEffect(() => {
    if (!raffle) {
      setNumbers([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, "raffles", raffle.id, "numbers"),
      (snap) => {
        setNumbers(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }))
        );
      },
      (error) => {
        console.error("Error cargando números:", error);
      }
    );

    return () => unsubscribe();
  }, [raffle]);

  // ===================== LOADING =====================
  if (loading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="text-center">
          <div className="relative mx-auto mb-6">
            <div className="h-14 w-14 animate-spin rounded-full border-[3px] border-violet-500/20 border-t-violet-500" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-6 w-6 rounded-full bg-violet-500/20" />
            </div>
          </div>
          <p className="text-sm font-medium text-slate-300">
            Cargando panel de administración
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Obteniendo datos de la rifa activa...
          </p>
        </div>
      </div>
    );
  }

  // ===================== SIN RIFA ACTIVA =====================
  if (!raffle) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-dashed border-white/10 bg-gradient-to-br from-slate-900/80 to-slate-950 px-6 py-24 text-center">
        {/* Ambient glow */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-violet-600/10 blur-[80px]" />

        <div className="relative">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-violet-500/20 bg-violet-500/10 shadow-xl shadow-violet-900/20">
            <svg
              className="h-9 w-9 text-violet-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M12 8v8m-4-4h8m5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-white">
            No hay una rifa activa
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
            Actualmente no existe ninguna rifa activa. Crea una nueva desde la
            sección{" "}
            <span className="font-medium text-violet-400">Crear rifa</span> para
            comenzar a vender números.
          </p>

          <div className="mt-8 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 px-4 py-2 text-xs text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-500" />
            Esperando nueva rifa...
          </div>
        </div>
      </div>
    );
  }

  // ===================== CONTENIDO PRINCIPAL =====================
  const soldCount = numbers.filter((n) => n.status === "sold").length;
  const reservedCount = numbers.filter((n) => n.status === "reserved").length;
  const availableCount = numbers.filter((n) => n.status === "available").length;
  const progress =
    raffle.totalNumbers > 0
      ? Math.round((soldCount / raffle.totalNumbers) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* ===================== HEADER DE LA RIFA ===================== */}
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/90 via-slate-900/80 to-slate-950 p-6 shadow-2xl backdrop-blur-xl sm:p-7">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-600/15 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-blue-600/10 blur-[70px]" />

        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          {/* Info principal */}
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/20 to-indigo-500/10 shadow-lg shadow-violet-900/30">
              <svg
                className="h-7 w-7 text-violet-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M12 8v8m-4-4h8m5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-violet-400">
                  Rifa activa
                </p>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-semibold text-emerald-400">
                    En vivo
                  </span>
                </span>
              </div>

              <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-white sm:text-[28px]">
                {raffle.name}
              </h1>

              {raffle.prizeName && (
                <p className="mt-1 text-sm text-slate-400">
                  Premio:{" "}
                  <span className="font-medium text-slate-300">
                    {raffle.prizeName}
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Mini stats rápidas */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-center">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Vendidos
              </p>
              <p className="mt-1 text-xl font-bold text-emerald-400">
                {soldCount}
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-center">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Reservados
              </p>
              <p className="mt-1 text-xl font-bold text-amber-400">
                {reservedCount}
              </p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 text-center">
              <p className="text-[11px] font-medium uppercase tracking-wider text-slate-500">
                Disponibles
              </p>
              <p className="mt-1 text-xl font-bold text-slate-300">
                {availableCount}
              </p>
            </div>
          </div>
        </div>

        {/* Barra de progreso de ventas */}
        <div className="relative mt-6">
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-400">
              Progreso de ventas
            </span>
            <span className="font-bold tabular-nums text-violet-300">
              {progress}% · {soldCount} / {raffle.totalNumbers}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-slate-800/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-500 transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

      {/* ===================== PANEL DE ESTADÍSTICAS ===================== */}
      <StatsPanel raffle={raffle} numbers={numbers} />
    </div>
  );
}