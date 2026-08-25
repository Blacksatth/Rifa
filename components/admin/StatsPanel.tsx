"use client";

import { Raffle, RaffleNumber } from "@/lib/types";

interface StatsPanelProps {
  raffle: Raffle;
  numbers: RaffleNumber[];
}

export default function StatsPanel({
  raffle,
  numbers,
}: StatsPanelProps) {
  const sold = numbers.filter(
    (n) => n.status === "sold"
  ).length;

  const reserved = numbers.filter(
    (n) => n.status === "reserved"
  ).length;

  const available = numbers.filter(
    (n) => n.status === "available"
  ).length;

  const total = raffle.totalNumbers || numbers.length || 0;

  const recaudado = sold * Number(raffle.price || 0);

  const soldPercentage =
    total > 0 ? Math.round((sold / total) * 100) : 0;

  const reservedPercentage =
    total > 0 ? Math.round((reserved / total) * 100) : 0;

  const availablePercentage =
    total > 0 ? Math.round((available / total) * 100) : 0;

  const currency = new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  });

  return (
    <section className="space-y-4">

      {/* ========================================= */}
      {/* HEADER */}
      {/* ========================================= */}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400">
            Resumen
          </p>

          <h2 className="mt-1 text-lg font-bold tracking-tight text-white sm:text-xl">
            Estado de la rifa
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Resumen en tiempo real de tus números.
          </p>
        </div>

        {/* Total */}

        <div className="flex w-fit items-center gap-2 rounded-full border border-white/[0.07] bg-white/[0.03] px-3 py-2 backdrop-blur-xl">

          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/10">
            <svg
              className="h-3.5 w-3.5 text-violet-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
          </span>

          <span className="text-xs font-medium text-slate-400">
            {total.toLocaleString("es-MX")} números
          </span>

        </div>

      </div>

      {/* ========================================= */}
      {/* CARDS */}
      {/* ========================================= */}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">

        {/* VENDIDOS */}

        <StatCard
          label="Vendidos"
          value={sold}
          percentage={soldPercentage}
          color="emerald"
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />

        {/* RESERVADOS */}

        <StatCard
          label="Reservados"
          value={reserved}
          percentage={reservedPercentage}
          color="amber"
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M12 8v4l2.5 2.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />

        {/* DISPONIBLES */}

        <StatCard
          label="Disponibles"
          value={available}
          percentage={availablePercentage}
          color="blue"
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M12 4v16m8-8H4"
              />
            </svg>
          }
        />

        {/* RECAUDADO */}

        <StatCard
          label="Recaudado"
          value={currency.format(recaudado)}
          color="violet"
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.8"
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-10v1m0 10v1m9-5a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          }
        />

      </div>

      {/* ========================================= */}
      {/* PROGRESO GENERAL */}
      {/* ========================================= */}

      <div className="overflow-hidden rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4 backdrop-blur-xl sm:p-5">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <p className="text-xs font-semibold text-slate-300">
              Progreso de ventas
            </p>

            <p className="mt-1 text-xs text-slate-500">
              {sold} de {total} números vendidos
            </p>
          </div>

          <div className="flex items-center gap-2">

            <span className="text-xl font-bold text-white">
              {soldPercentage}%
            </span>

            <span className="text-xs text-slate-500">
              completado
            </span>

          </div>

        </div>

        {/* Barra */}

        <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">

          <div
            className="
              h-full rounded-full
              bg-gradient-to-r
              from-emerald-500
              via-teal-400
              to-cyan-400
              shadow-lg shadow-emerald-500/20
              transition-all duration-700
            "
            style={{
              width: `${Math.min(soldPercentage, 100)}%`,
            }}
          />

        </div>

        {/* Leyenda */}

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">

          <Legend
            color="bg-emerald-400"
            label="Vendidos"
            value={sold}
          />

          <Legend
            color="bg-amber-400"
            label="Reservados"
            value={reserved}
          />

          <Legend
            color="bg-blue-400"
            label="Disponibles"
            value={available}
          />

        </div>

      </div>

    </section>
  );
}

/* ========================================= */
/* STAT CARD */
/* ========================================= */

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
      icon:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
      glow: "bg-emerald-500/10",
      progress: "bg-emerald-400",
      value: "text-emerald-400",
    },

    amber: {
      icon:
        "border-amber-500/20 bg-amber-500/10 text-amber-400",
      glow: "bg-amber-500/10",
      progress: "bg-amber-400",
      value: "text-amber-400",
    },

    blue: {
      icon:
        "border-blue-500/20 bg-blue-500/10 text-blue-400",
      glow: "bg-blue-500/10",
      progress: "bg-blue-400",
      value: "text-blue-400",
    },

    violet: {
      icon:
        "border-violet-500/20 bg-violet-500/10 text-violet-400",
      glow: "bg-violet-500/10",
      progress: "bg-violet-400",
      value: "text-violet-400",
    },
  };

  const style = styles[color];

  return (
    <div
      className="
        group relative overflow-hidden
        rounded-2xl
        border border-white/[0.07]
        bg-white/[0.025]
        p-4
        backdrop-blur-xl
        transition-all duration-300
        hover:-translate-y-1
        hover:border-white/[0.12]
        hover:bg-white/[0.04]
        hover:shadow-2xl
        hover:shadow-black/20
      "
    >

      {/* Glow */}

      <div
        className={`
          pointer-events-none
          absolute -right-10 -top-10
          h-24 w-24 rounded-full
          ${style.glow}
          opacity-50 blur-2xl
          transition-opacity
          duration-300
          group-hover:opacity-100
        `}
      />

      <div className="relative">

        {/* TOP */}

        <div className="flex items-start justify-between">

          <div
            className={`
              flex h-10 w-10
              items-center justify-center
              rounded-xl border
              ${style.icon}
              transition-transform
              duration-300
              group-hover:scale-110
            `}
          >
            {icon}
          </div>

          {percentage !== undefined && (
            <span className="rounded-full border border-white/[0.06] bg-black/20 px-2 py-1 text-[10px] font-bold text-slate-500">
              {percentage}%
            </span>
          )}

        </div>

        {/* VALUE */}

        <div className="mt-5">

          <p className="text-xs font-medium text-slate-500">
            {label}
          </p>

          <p
            className={`
              mt-1
              text-2xl
              font-bold
              tracking-tight
              ${style.value}
            `}
          >
            {typeof value === "number"
              ? value.toLocaleString("es-MX")
              : value}
          </p>

        </div>

        {/* MINI PROGRESS */}

        {percentage !== undefined && (
          <div className="mt-4 h-1 overflow-hidden rounded-full bg-slate-800">

            <div
              className={`
                h-full rounded-full
                ${style.progress}
                transition-all duration-700
              `}
              style={{
                width: `${Math.min(percentage, 100)}%`,
              }}
            />

          </div>
        )}

      </div>

    </div>
  );
}

/* ========================================= */
/* LEGEND */
/* ========================================= */

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

      <span
        className={`h-2 w-2 rounded-full ${color}`}
      />

      <span className="text-xs text-slate-500">
        {label}
      </span>

      <span className="text-xs font-semibold text-slate-300">
        {value.toLocaleString("es-CO")}
      </span>

    </div>
  );
}
