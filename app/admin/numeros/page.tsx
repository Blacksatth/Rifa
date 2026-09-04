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

import NumbersTable, {
  NumbersTableFilter,
} from "@/components/admin/NumbersTable";

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

/**
 * Página de gestión de números (`/admin/numeros`).
 *
 * Muestra la tabla completa de números de la rifa activa con:
 * - Buscador por nombre, teléfono o número
 * - Filtros por estado
 * - Acciones CRUD: marcar como vendido, liberar, editar datos
 *
 * Usa `onSnapshot` para actualizaciones en tiempo real.
 */
export default function AdminNumerosPage() {
  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [numbers, setNumbers] = useState<RaffleNumber[]>([]);
  const [loading, setLoading] = useState(true);

  /*
   * Filtro activo (lo gestiona NumbersTable y se refleja aquí
   * para poder exportar según el filtro).
   */

  const [filter, setFilter] = useState<
    NumbersTableFilter | null
  >(null);

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
          const data = d.data() as Omit<Raffle, "id">;
          setRaffle({ id: d.id, ...data });
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
    if (!raffle) return;

    const unsubscribe = onSnapshot(
      collection(
        db,
        "raffles",
        raffle.id,
        "numbers"
      ),
      (snap) => {
        setNumbers(
          snap.docs.map(
            (d) =>
              ({
                id: d.id,
                ...(d.data() as Omit<RaffleNumber, "id">),
              } as RaffleNumber)
          )
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
   * Filtrar según el filtro activo (para exportar y contar).
   */

  const filtered = numbers.filter((n) => {
    const status = filter?.status ?? "all";

    if (status !== "all" && n.status !== status) {
      return false;
    }

    const q = filter?.search?.trim().toLowerCase() ?? "";

    if (!q) return true;

    return (
      String(n.number)
        .toLowerCase()
        .includes(q) ||
      (n.buyerName ?? "")
        .toLowerCase()
        .includes(q) ||
      (n.buyerPhone ?? "")
        .toLowerCase()
        .includes(q)
    );
  });

  /*
   * Exportación CSV / PDF (según el filtro activo).
   */

  const statusLabel = (s: RaffleNumber["status"]) =>
    s === "available"
      ? "Disponible"
      : s === "reserved"
        ? "Reservado"
        : "Vendido";

  function exportCsv() {
    const header = [
      "Número",
      "Estado",
      "Comprador",
      "Teléfono",
    ];

    const rows = filtered.map((n) => [
      n.number,
      statusLabel(n.status),
      n.buyerName ?? "",
      n.buyerPhone ?? "",
    ]);

    const escape = (v: string) => {
      if (/[",\n]/.test(v)) {
        return `"${v.replace(/"/g, '""')}"`;
      }
      return v;
    };

    const csv = [header, ...rows]
      .map((row) => row.map(escape).join(","))
      .join("\r\n");

    const blob = new Blob(["\uFEFF" + csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `participantes-${raffle?.name ?? "rifa"}-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function exportPdf() {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4",
    });

    const title = raffle?.name ?? "Participantes";
    const subtitle = `Rifa: ${title} — ${
      filtered.length
    } participante${filtered.length === 1 ? "" : "s"}`;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(subtitle, 40, 40);

    autoTable(doc, {
      startY: 56,
      head: [
        ["Número", "Estado", "Comprador", "Teléfono"],
      ],
      body: filtered.map((n) => [
        n.number,
        statusLabel(n.status),
        n.buyerName ?? "",
        n.buyerPhone ?? "",
      ]),
      theme: "striped",
      headStyles: {
        fillColor: [91, 33, 182],
        fontSize: 10,
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 6,
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 90 },
        2: { cellWidth: "auto" },
        3: { cellWidth: 120 },
      },
    });

    doc.save(
      `participantes-${raffle?.name ?? "rifa"}-${Date.now()}.pdf`
    );
  }

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

      {/* TABLA */}

      <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl shadow-2xl">

        <div className="border-b border-white/10 px-6 py-4">

          <div className="flex flex-wrap items-center justify-between gap-3">

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

            <div className="flex items-center gap-2">

              <button
                type="button"
                onClick={exportCsv}
                disabled={filtered.length === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v12m0 0l-4-4m4 4l4-4M4 20h16"
                  />
                </svg>
                CSV
              </button>

              <button
                type="button"
                onClick={exportPdf}
                disabled={filtered.length === 0}
                className="inline-flex items-center gap-2 rounded-xl border border-violet-500/25 bg-violet-500/10 px-3.5 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2zM12 3v6h6"
                  />
                </svg>
                PDF
              </button>

            </div>

          </div>

        </div>

        <div className="overflow-x-auto">

          <NumbersTable
            raffleId={raffle.id}
            numbers={numbers}
            onFilterChange={setFilter}
          />

        </div>

      </section>

    </div>
  );
}