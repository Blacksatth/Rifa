"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import {
  Raffle,
  RaffleNumber,
} from "@/lib/types";

import NumbersTable from "@/components/admin/NumbersTable";
import SearchBar from "@/components/admin/SearchBar";

export default function AdminNumerosPage() {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [search, setSearch] = useState("");
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
   * Cargar números
   */

  useEffect(() => {
    if (!raffle) {
      setNumbers([]);
      return;
    }

    const unsubscribe = onSnapshot(
      collection(
        db,
        "raffles",
        raffle.id,
        "numbers"
      ),
      (snap) => {
        setNumbers(
          snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as any),
          }))
        );
      },
      (error) => {
        console.error(
          "Error cargando números:",
          error
        );
      }
    );

    return () => unsubscribe();
  }, [raffle]);

  /*
   * Filtrar búsqueda
   */

  const filtered = numbers.filter((n) => {
    if (!search) return true;

    const text = search.toLowerCase();

    return (
      n.buyerName
        ?.toLowerCase()
        .includes(text) ||
      n.buyerPhone?.includes(search) ||
      n.number?.includes(search)
    );
  });

  /*
   * Cargando
   */

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">

        <div className="text-center">

          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-violet-500/20 border-t-violet-500" />

          <p className="text-sm text-slate-400">
            Cargando números...
          </p>

        </div>

      </div>
    );
  }

  /*
   * No hay rifa
   */

  if (!raffle) {
    return (
      <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-6 py-20 text-center">

        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10">

          <svg
            className="h-8 w-8 text-violet-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M7 4h10M7 8h10M7 12h10M7 16h6"
            />

            <rect
              x="4"
              y="2"
              width="16"
              height="20"
              rx="2"
              strokeWidth="2"
            />
          </svg>

        </div>

        <h2 className="text-xl font-semibold text-white">
          No hay una rifa activa
        </h2>

        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Crea una rifa primero para poder
          gestionar sus números y participantes.
        </p>

      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ENCABEZADO */}

      <section className="rounded-3xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl shadow-2xl">

        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

          <div>

            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400">
              Rifa activa
            </p>

            <h1 className="mt-1 text-xl font-bold text-white">
              Números vendidos
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Busca y administra los participantes
              de tu rifa.
            </p>

          </div>

          <div className="w-full lg:w-80">

            <SearchBar
              value={search}
              onChange={setSearch}
            />

          </div>

        </div>

      </section>

      {/* TABLA */}

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl">

        <div className="border-b border-white/10 px-6 py-4">

          <div className="flex items-center justify-between">

            <div>

              <h2 className="text-lg font-semibold text-white">
                Participantes
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {filtered.length} resultado
                {filtered.length === 1
                  ? ""
                  : "s"}
              </p>

            </div>

          </div>

        </div>

        <div className="overflow-x-auto">

          <NumbersTable
            raffleId={raffle.id}
            numbers={filtered}
          />

        </div>

      </section>

    </div>
  );
}