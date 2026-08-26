"use client";

import { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
} from "firebase/firestore";
import { signOut } from "firebase/auth";
import { db, auth } from "@/lib/firebase";
import { Raffle, RaffleNumber } from "@/lib/types";
import RaffleForm from "@/components/admin/RaffleForm";
import NumbersTable from "@/components/admin/NumbersTable";
import Header from "@/components/Header";
import SearchBar from "@/components/admin/SearchBar";
import StatsPanel from "@/components/admin/StatsPanel";
import { useRouter } from "next/navigation";
export default function AdminPage() {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const router = useRouter();

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
        console.error("Error cargando rifa:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

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
        console.error("Error cargando números:", error);
      }
    );

    return () => unsubscribe();
  }, [raffle]);

  const filtered = numbers.filter((n) => {
    if (!search) return true;

    const text = search.toLowerCase();

    return (
      n.buyerName?.toLowerCase().includes(text) ||
      n.buyerPhone?.includes(search) ||
      n.number?.includes(search)
    );
  });

  async function handleLogout() {
    await signOut(auth);
    router.replace("/admin/login");
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">

      {/* Fondos */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl" />

        <div className="absolute top-1/2 -right-40 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* HEADER */}
      

          <Header  raffle />

      

        {/* CONTENIDO */}
        {loading ? (

          <div className="flex items-center justify-center py-32">

            <div className="text-center">

              <div className="w-12 h-12 border-4 border-violet-500/20 border-t-violet-500 rounded-full animate-spin mx-auto mb-5" />

              <p className="text-slate-400">
                Cargando panel...
              </p>

            </div>

          </div>

        ) : (

          <div className="space-y-6">

            {/* RIFA */}
            <section className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl overflow-hidden">

              <div className="px-6 py-5 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">

                <div>
                  <h2 className="font-semibold text-lg">
                    Configuración de la rifa
                  </h2>

                  <p className="text-sm text-slate-500 mt-1">
                    Administra la información de tu rifa activa.
                  </p>
                </div>

                <div className="flex items-center gap-2">

                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />

                  <span className="text-xs font-medium text-emerald-400">
                    {raffle ? "Rifa activa" : "Sin rifa activa"}
                  </span>

                </div>

              </div>

              <div className="p-6">
                <RaffleForm existing={raffle} />
              </div>

            </section>

            {raffle ? (
              <>
                {/* ESTADÍSTICAS */}
                <section>
                  <StatsPanel
                    raffle={raffle}
                    numbers={numbers}
                  />
                </section>

                {/* TABLA */}
                <section className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl overflow-hidden">

                  <div className="p-6 border-b border-white/10">

                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

                      <div>
                        <h2 className="text-lg font-semibold">
                          Números vendidos
                        </h2>

                        <p className="text-sm text-slate-500 mt-1">
                          Busca y administra los participantes.
                        </p>
                      </div>

                      <div className="w-full lg:w-80">
                        <SearchBar
                          value={search}
                          onChange={setSearch}
                        />
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
              </>
            ) : (

              /* SIN RIFA */
              <div className="rounded-3xl border border-dashed border-white/10 bg-white/[0.03] py-20 px-6 text-center">

                <div className="w-16 h-16 mx-auto rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center mb-5">

                  <svg
                    className="w-8 h-8 text-violet-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v8m-4-4h8m5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>

                </div>

                <h2 className="text-xl font-semibold">
                  No hay una rifa activa
                </h2>

                <p className="text-slate-500 mt-2 max-w-md mx-auto">
                  Crea una nueva rifa utilizando el formulario superior
                  para comenzar a gestionar números y participantes.
                </p>

              </div>

            )}

          </div>

        )}

      </div>
    </main>
  );
}
