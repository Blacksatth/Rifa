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
        <header className="mb-8">

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">

            <div className="flex items-center gap-4">

              {/* Logo */}
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-600/20">

                <svg
                  className="w-7 h-7 text-white"
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

              </div>

              <div>
                <div className="flex items-center gap-2">

                  <span className="text-xs font-bold tracking-widest text-violet-400">
                    ADMINISTRACIÓN
                  </span>

                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400">
                    ADMIN
                  </span>

                </div>

                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1">
                  Panel de administración
                </h1>

                <p className="text-sm text-slate-500 mt-1">
                  Gestiona tu rifa y controla los números vendidos.
                </p>
              </div>

            </div>

            {/* Usuario / logout */}
            <div className="flex items-center gap-3">

              <div className="hidden sm:block text-right">
                <p className="text-xs text-slate-500">
                  Sesión iniciada como
                </p>

                <p className="text-sm text-slate-300 font-medium">
                  {auth.currentUser?.email}
                </p>
              </div>

              <button
                onClick={handleLogout}
                className="group flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-red-500/10 hover:border-red-500/20 transition-all"
              >
                <svg
                  className="w-4 h-4 text-slate-400 group-hover:text-red-400 transition-colors"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>

                <span className="text-sm text-slate-300 group-hover:text-red-400">
                  Salir
                </span>
              </button>

            </div>

          </div>

        </header>

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
