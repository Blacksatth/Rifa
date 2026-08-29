"use client";

import { useEffect, useState } from "react";
import { doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Raffle, RaffleNumber } from "@/lib/types";
import toast from "react-hot-toast";

interface StatsPanelProps {
  raffle: Raffle;
  numbers: RaffleNumber[];
}

const RESERVATION_TIME_MS = 30 * 60 * 1000;

export default function StatsPanel({ raffle, numbers }: StatsPanelProps) {
  const [now, setNow] = useState(Date.now());
  const [releasingId, setReleasingId] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  // ===================== ESTADÍSTICAS =====================
  const sold = numbers.filter((n) => n.status === "sold").length;
  const reserved = numbers.filter((n) => n.status === "reserved").length;
  const available = numbers.filter((n) => n.status === "available").length;
  const total = raffle.totalNumbers || numbers.length || 0;
  const recaudado = sold * Number(raffle.price || 0);

  const soldPercentage = total > 0 ? Math.round((sold / total) * 100) : 0;
  const reservedPercentage = total > 0 ? Math.round((reserved / total) * 100) : 0;
  const availablePercentage = total > 0 ? Math.round((available / total) * 100) : 0;

  const currency = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  });

  const reservedNumbers = numbers
    .filter((n) => n.status === "reserved")
    .sort((a, b) =>
      String(a.number).localeCompare(String(b.number), undefined, { numeric: true })
    );

  // ===================== HELPERS =====================
  function getExpirationTime(
    reservationExpiresAt: unknown,
    reservedAt?: unknown
  ): number | null {
    if (reservationExpiresAt instanceof Timestamp) return reservationExpiresAt.toMillis();
    if (reservationExpiresAt instanceof Date) return reservationExpiresAt.getTime();
    if (
      reservationExpiresAt &&
      typeof reservationExpiresAt === "object" &&
      "toMillis" in reservationExpiresAt &&
      typeof (reservationExpiresAt as any).toMillis === "function"
    ) {
      return (reservationExpiresAt as { toMillis: () => number }).toMillis();
    }
    if (typeof reservationExpiresAt === "string") {
      const parsed = new Date(reservationExpiresAt).getTime();
      if (!Number.isNaN(parsed)) return parsed;
    }
    if (typeof reservationExpiresAt === "number") return reservationExpiresAt;

    // Fallback con reservedAt
    let reservedTime: number | null = null;
    if (reservedAt instanceof Timestamp) reservedTime = reservedAt.toMillis();
    else if (reservedAt instanceof Date) reservedTime = reservedAt.getTime();
    else if (
      reservedAt &&
      typeof reservedAt === "object" &&
      "toMillis" in reservedAt &&
      typeof (reservedAt as any).toMillis === "function"
    ) {
      reservedTime = (reservedAt as { toMillis: () => number }).toMillis();
    } else if (typeof reservedAt === "string") {
      const parsed = new Date(reservedAt).getTime();
      if (!Number.isNaN(parsed)) reservedTime = parsed;
    } else if (typeof reservedAt === "number") reservedTime = reservedAt;

    return reservedTime ? reservedTime + RESERVATION_TIME_MS : null;
  }

  function formatTime(ms: number) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  async function releaseReservation(number: RaffleNumber) {
    if (releasingId) return;

    const confirmed = window.confirm(
      `¿Quieres liberar el número ${number.number}?\n\nEl número volverá a estar disponible.`
    );
    if (!confirmed) return;

    setReleasingId(number.id);

    try {
      const numberRef = doc(db, "raffles", raffle.id, "numbers", number.id);
      await updateDoc(numberRef, {
        status: "available",
        buyerName: "",
        buyerPhone: "",
        buyerVisitorId: "",
        reservedAt: null,
        reservationExpiresAt: null,
      });
      toast.success(`Número ${number.number} liberado correctamente`);
    } catch (error) {
      console.error("Error liberando reserva:", error);
      toast.error("No se pudo liberar el número.");
    } finally {
      setReleasingId(null);
    }
  }

  // ===================== RENDER =====================
  return (
    <section className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-400">
            Resumen
          </p>
          <h2 className="mt-1 text-xl font-bold tracking-tight text-white sm:text-2xl">
            Estado de la rifa
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Datos en tiempo real de tus números
          </p>
        </div>

        <div className="flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 backdrop-blur-xl">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/15">
            <svg className="h-3.5 w-3.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </span>
          <span className="text-xs font-medium text-slate-400">
            {total.toLocaleString("es-CO")} números
          </span>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Vendidos"
          value={sold}
          percentage={soldPercentage}
          color="emerald"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Reservados"
          value={reserved}
          percentage={reservedPercentage}
          color="amber"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Disponibles"
          value={available}
          percentage={availablePercentage}
          color="blue"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 4v16m8-8H4" />
            </svg>
          }
        />
        <StatCard
          label="Recaudado"
          value={currency.format(recaudado)}
          color="violet"
          icon={
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-10v1m0 10v1m9-5a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>

      {/* RESERVAS ACTIVAS */}
      <div className="overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/[0.04] to-transparent backdrop-blur-xl">
        {/* Header */}
        <div className="border-b border-white/[0.06] px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white">Reservas activas</p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Tiempo restante de cada comprador
                </p>
              </div>
            </div>

            <div className="w-fit rounded-full border border-amber-500/25 bg-amber-500/10 px-3.5 py-1.5">
              <span className="text-xs font-bold text-amber-400">
                {reserved} {reserved === 1 ? "reserva" : "reservas"}
              </span>
            </div>
          </div>
        </div>

        {/* Lista */}
        {reservedNumbers.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.06] bg-white/[0.03]">
              <svg className="h-7 w-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="mt-4 text-sm font-medium text-slate-400">
              No hay números reservados
            </p>
            <p className="mt-1 text-xs text-slate-600">
              Las reservas aparecerán aquí automáticamente
            </p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.05]">
            {reservedNumbers.map((item) => {
              const data = item as RaffleNumber & {
                buyerName?: string;
                buyerPhone?: string;
                reservedAt?: unknown;
                reservationExpiresAt?: unknown;
              };

              const expirationTime = getExpirationTime(
                data.reservationExpiresAt,
                data.reservedAt
              );
              const remaining = expirationTime !== null ? expirationTime - now : null;
              const expired = remaining !== null && remaining <= 0;
              const percentage =
                remaining !== null
                  ? Math.max(0, Math.min(100, (remaining / RESERVATION_TIME_MS) * 100))
                  : 0;

              const isUrgent = remaining !== null && remaining <= 5 * 60 * 1000 && !expired;

              return (
                <div
                  key={item.id}
                  className={`p-4 transition-colors sm:p-5 ${
                    expired
                      ? "bg-red-500/[0.04]"
                      : isUrgent
                      ? "bg-orange-500/[0.03]"
                      : "hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    {/* Info del comprador */}
                    <div className="flex min-w-0 items-start gap-3.5">
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border font-mono text-sm font-black ${
                          expired
                            ? "border-red-500/25 bg-red-500/10 text-red-400"
                            : isUrgent
                            ? "border-orange-500/25 bg-orange-500/10 text-orange-400"
                            : "border-amber-500/25 bg-amber-500/10 text-amber-400"
                        }`}
                      >
                        {item.number}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-white">
                            {data.buyerName || "Comprador sin nombre"}
                          </p>
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                              expired
                                ? "border-red-500/25 bg-red-500/10 text-red-400"
                                : "border-emerald-500/25 bg-emerald-500/10 text-emerald-400"
                            }`}
                          >
                            {expired ? "Expirada" : "Activa"}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                          {data.buyerPhone || "Sin teléfono"}
                        </p>
                      </div>
                    </div>

                    {/* Contador + botón */}
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center lg:justify-end">
                      <div className="min-w-[170px]">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                            Tiempo restante
                          </span>
                          <span
                            className={`font-mono text-lg font-black tabular-nums ${
                              expired
                                ? "text-red-400"
                                : isUrgent
                                ? "text-orange-400"
                                : "text-amber-400"
                            }`}
                          >
                            {remaining === null ? "--:--" : formatTime(remaining)}
                          </span>
                        </div>

                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-800">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ${
                              expired
                                ? "bg-red-500"
                                : isUrgent
                                ? "bg-orange-400"
                                : "bg-amber-400"
                            }`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={releasingId === item.id}
                        onClick={() => releaseReservation(item)}
                        className="flex h-10 items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-4 text-xs font-bold text-red-400 transition-all hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {releasingId === item.id ? (
                          <>
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-400/30 border-t-red-400" />
                            Liberando...
                          </>
                        ) : (
                          "Liberar"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* PROGRESO GENERAL */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-200">Progreso de ventas</p>
            <p className="mt-1 text-xs text-slate-500">
              {sold.toLocaleString("es-CO")} de {total.toLocaleString("es-CO")} números vendidos
            </p>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold tabular-nums text-white">
              {soldPercentage}%
            </span>
            <span className="text-xs text-slate-500">completado</span>
          </div>
        </div>

        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 shadow-lg shadow-emerald-500/20 transition-all duration-700"
            style={{ width: `${Math.min(soldPercentage, 100)}%` }}
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2">
          <Legend color="bg-emerald-400" label="Vendidos" value={sold} />
          <Legend color="bg-amber-400" label="Reservados" value={reserved} />
          <Legend color="bg-blue-400" label="Disponibles" value={available} />
        </div>
      </div>
    </section>
  );
}

/* ===================== STAT CARD ===================== */
function StatCard({
  label,
  value,
  percentage,
  color,
  icon,
}: {
  label: string;
  value: string | number;
  percentage?: number;
  color: "emerald" | "amber" | "blue" | "violet";
  icon: React.ReactNode;
}) {
  const styles = {
    emerald: {
      icon: "border-emerald-500/25 bg-emerald-500/10 text-emerald-400",
      glow: "bg-emerald-500/15",
      progress: "bg-emerald-400",
      value: "text-emerald-400",
    },
    amber: {
      icon: "border-amber-500/25 bg-amber-500/10 text-amber-400",
      glow: "bg-amber-500/15",
      progress: "bg-amber-400",
      value: "text-amber-400",
    },
    blue: {
      icon: "border-blue-500/25 bg-blue-500/10 text-blue-400",
      glow: "bg-blue-500/15",
      progress: "bg-blue-400",
      value: "text-blue-400",
    },
    violet: {
      icon: "border-violet-500/25 bg-violet-500/10 text-violet-400",
      glow: "bg-violet-500/15",
      progress: "bg-violet-400",
      value: "text-violet-400",
    },
  };

  const style = styles[color];

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.05] hover:shadow-xl hover:shadow-black/20">
      <div
        className={`pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full ${style.glow} opacity-40 blur-2xl transition-opacity duration-300 group-hover:opacity-80`}
      />

      <div className="relative">
        <div className="flex items-start justify-between">
          <div
            className={`flex h-11 w-11 items-center justify-center rounded-xl border ${style.icon} transition-transform duration-300 group-hover:scale-110`}
          >
            {icon}
          </div>

          {percentage !== undefined && (
            <span className="rounded-full border border-white/10 bg-black/30 px-2.5 py-1 text-[11px] font-bold tabular-nums text-slate-400">
              {percentage}%
            </span>
          )}
        </div>

        <div className="mt-5">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className={`mt-1.5 text-2xl font-bold tracking-tight ${style.value}`}>
            {typeof value === "number" ? value.toLocaleString("es-CO") : value}
          </p>
        </div>

        {percentage !== undefined && (
          <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full rounded-full ${style.progress} transition-all duration-700`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
}

/* ===================== LEGEND ===================== */
function Legend({
  color,
  label,
  value,
}: {
  color: string;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-semibold tabular-nums text-slate-300">
        {value.toLocaleString("es-CO")}
      </span>
    </div>
  );
}