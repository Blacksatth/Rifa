"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Raffle } from "@/lib/types";
import RaffleForm from "@/components/admin/rifa/RaffleForm";

export default function AdminRifaPage() {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [loading, setLoading] = useState(true);

  /*
   * Cargar rifa activa
   */

  useEffect(() => {
    const q = query(
      collection(db, "raffles"),
      where("active", "==", true)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const d = snap.docs[0];

        if (d) {
          setRaffle({
            id: d.id,
            ...(d.data() as any),
          });
        } else {
          setRaffle(null);
        }

        setLoading(false);
      },
      (error) => {
        console.error(
          "Error cargando rifa:",
          error
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  /*
   * Cargando
   */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">

        <div className="text-center">

          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-violet-500/20 border-t-violet-500" />

          <p className="text-sm text-slate-400">
            Cargando configuración...
          </p>

        </div>

      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ENCABEZADO */}

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-2xl">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400">
              Administración
            </p>

            <h1 className="mt-1 text-xl font-bold text-white">
              {raffle
                ? "Editar rifa"
                : "Crear nueva rifa"}
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              {raffle
                ? "Modifica la información de tu rifa activa."
                : "Configura una nueva rifa para comenzar."}
            </p>

          </div>

          <div className="flex items-center gap-2">

            <span
              className={`h-2 w-2 rounded-full ${
                raffle
                  ? "bg-emerald-400 shadow-lg shadow-emerald-400/50"
                  : "bg-slate-500"
              }`}
            />

            <span
              className={`text-xs font-medium ${
                raffle
                  ? "text-emerald-400"
                  : "text-slate-500"
              }`}
            >
              {raffle
                ? "Rifa activa"
                : "Sin rifa activa"}
            </span>

          </div>

        </div>

      </section>

      {/* FORMULARIO */}

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl">

        <div className="border-b border-white/10 px-6 py-5">

          <h2 className="text-lg font-semibold text-white">
            Configuración de la rifa
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Administra la información, precio,
            premio y configuración.
          </p>

        </div>

        <div className="p-6">

          <RaffleForm existing={raffle} />

        </div>

      </section>

    </div>
  );
}