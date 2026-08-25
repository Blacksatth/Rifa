"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RaffleNumber } from "@/lib/types";
import { Space_Grotesk } from "next/font/google";

// Display face used for the ticket numerals / headings. Move this import to
// your root layout.tsx if you want it shared across the whole app instead of
// re-loaded per component.
const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-ticket",
});

type Props = {
  raffleId: string;
  numbers: RaffleNumber[];
};

type Status = "available" | "reserved" | "sold";

const STATUS_CONFIG: Record<
  Status,
  { label: string; short: string; text: string; bg: string; ring: string; dot: string }
> = {
  available: {
    label: "Disponible",
    short: "Disp.",
    text: "text-emerald-300",
    bg: "bg-emerald-400/10",
    ring: "ring-emerald-400/25",
    dot: "bg-emerald-400",
  },
  reserved: {
    label: "Reservado",
    short: "Reserv.",
    text: "text-amber-300",
    bg: "bg-amber-400/10",
    ring: "ring-amber-400/25",
    dot: "bg-amber-400",
  },
  sold: {
    label: "Vendido",
    short: "Vend.",
    text: "text-violet-300",
    bg: "bg-violet-400/10",
    ring: "ring-violet-400/25",
    dot: "bg-violet-400",
  },
};

type ToastKind = "success" | "error";
type ToastItem = { id: number; kind: ToastKind; message: string };

type ModalState =
  | { type: "release"; number: RaffleNumber }
  | { type: "edit"; number: RaffleNumber }
  | null;

let toastSeq = 0;

export default function NumbersTable({ raffleId, numbers }: Props) {
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [modal, setModal] = useState<ModalState>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");

  function pushToast(kind: ToastKind, message: string) {
    const id = ++toastSeq;
    setToasts((t) => [...t, { id, kind, message }]);
    window.setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  }

  function dismissToast(id: number) {
    setToasts((t) => t.filter((x) => x.id !== id));
  }

  async function markSold(n: RaffleNumber) {
    if (processingId) return;
    try {
      setProcessingId(n.id);
      await updateDoc(doc(db, "raffles", raffleId, "numbers", n.id), {
        status: "sold",
        soldAt: new Date(),
      });
      pushToast("success", `Número ${n.number} marcado como vendido.`);
    } catch (err) {
      console.error("Error marcando número como vendido:", err);
      pushToast("error", "No se pudo marcar el número como vendido.");
    } finally {
      setProcessingId(null);
    }
  }

  async function confirmRelease(n: RaffleNumber) {
    if (processingId) return;
    try {
      setProcessingId(n.id);
      await updateDoc(doc(db, "raffles", raffleId, "numbers", n.id), {
        status: "available",
        buyerName: null,
        buyerPhone: null,
        soldAt: null,
      });
      pushToast("success", `Número ${n.number} liberado.`);
      setModal(null);
    } catch (err) {
      console.error("Error liberando número:", err);
      pushToast("error", "No se pudo liberar el número.");
    } finally {
      setProcessingId(null);
    }
  }

  async function saveBuyer(n: RaffleNumber, name: string, phone: string) {
    if (processingId) return;
    try {
      setProcessingId(n.id);
      await updateDoc(doc(db, "raffles", raffleId, "numbers", n.id), {
        buyerName: name.trim(),
        buyerPhone: phone.trim(),
      });
      pushToast("success", `Comprador del número ${n.number} actualizado.`);
      setModal(null);
    } catch (err) {
      console.error("Error editando comprador:", err);
      pushToast("error", "No se pudo actualizar la información del comprador.");
    } finally {
      setProcessingId(null);
    }
  }

  const counts = useMemo(() => {
    const base = { available: 0, reserved: 0, sold: 0 };
    for (const n of numbers) {
      const s = n.status as Status;
      if (s in base) base[s]++;
    }
    return { ...base, total: numbers.length };
  }, [numbers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return numbers.filter((n) => {
      if (statusFilter !== "all" && n.status !== statusFilter) return false;
      if (!q) return true;
      return (
        String(n.number).toLowerCase().includes(q) ||
        (n.buyerName ?? "").toLowerCase().includes(q) ||
        (n.buyerPhone ?? "").toLowerCase().includes(q)
      );
    });
  }, [numbers, search, statusFilter]);

  return (
    <div className={`${display.variable} relative`}>
      <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0B0D13] shadow-2xl shadow-black/40">
        {/* ================= TOP BAR: stats + filters ================= */}
        <div className="border-b border-white/[0.07] bg-gradient-to-b from-white/[0.03] to-transparent px-4 py-4 sm:px-6">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <StatPill label="Total" value={counts.total} tone="neutral" />
            <StatPill label="Disponibles" value={counts.available} tone="available" />
            <StatPill label="Reservados" value={counts.reserved} tone="reserved" />
            <StatPill label="Vendidos" value={counts.sold} tone="sold" />
          </div>

          <div className="mt-4 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <svg
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-4.35-4.35M18 11a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por número, comprador o teléfono…"
                className="w-full rounded-xl border border-white/[0.08] bg-black/25 py-2.5 pl-10 pr-3 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition focus:border-white/20 focus:bg-black/40"
              />
            </div>

            <div className="flex gap-1.5 overflow-x-auto">
              <FilterChip active={statusFilter === "all"} onClick={() => setStatusFilter("all")}>
                Todos
              </FilterChip>
              {(["available", "reserved", "sold"] as Status[]).map((s) => (
                <FilterChip
                  key={s}
                  active={statusFilter === s}
                  onClick={() => setStatusFilter(s)}
                  dotClassName={STATUS_CONFIG[s].dot}
                >
                  {STATUS_CONFIG[s].label}
                </FilterChip>
              ))}
            </div>
          </div>
        </div>

        {/* ================= EMPTY STATE ================= */}
        {filtered.length === 0 && (
          <EmptyState hasAnyNumbers={numbers.length > 0} />
        )}

        {/* ================= MOBILE CARDS ================= */}
        {filtered.length > 0 && (
          <div className="space-y-3 p-4 md:hidden">
            {filtered.map((n) => (
              <TicketCard
                key={n.id}
                n={n}
                processing={processingId === n.id}
                onMarkSold={() => markSold(n)}
                onEdit={() => setModal({ type: "edit", number: n })}
                onRelease={() => setModal({ type: "release", number: n })}
              />
            ))}
          </div>
        )}

        {/* ================= DESKTOP TABLE ================= */}
        {filtered.length > 0 && (
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[780px] text-sm">
              <thead>
                <tr className="border-b border-white/[0.07] bg-black/15">
                  <th className="px-6 py-4 text-left">
                    <HeaderLabel>Número</HeaderLabel>
                  </th>
                  <th className="px-4 py-4 text-left">
                    <HeaderLabel>Estado</HeaderLabel>
                  </th>
                  <th className="px-4 py-4 text-left">
                    <HeaderLabel>Comprador</HeaderLabel>
                  </th>
                  <th className="px-4 py-4 text-left">
                    <HeaderLabel>Teléfono</HeaderLabel>
                  </th>
                  <th className="px-6 py-4 text-right">
                    <HeaderLabel>Acciones</HeaderLabel>
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((n) => (
                  <TicketRow
                    key={n.id}
                    n={n}
                    processing={processingId === n.id}
                    onMarkSold={() => markSold(n)}
                    onEdit={() => setModal({ type: "edit", number: n })}
                    onRelease={() => setModal({ type: "release", number: n })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ================= FOOTER ================= */}
        <div className="flex flex-col gap-2 border-t border-white/[0.07] bg-black/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-xs text-slate-500">
            Mostrando <span className="font-semibold text-slate-300">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "número" : "números"}
            {filtered.length !== numbers.length && (
              <span className="text-slate-600"> de {numbers.length}</span>
            )}
          </p>
          <div className="flex items-center gap-4">
            <Legend color="bg-emerald-400" label="Disponible" />
            <Legend color="bg-amber-400" label="Reservado" />
            <Legend color="bg-violet-400" label="Vendido" />
          </div>
        </div>
      </div>

      {/* ================= MODALS ================= */}
      {modal?.type === "release" && (
        <ReleaseModal
          number={modal.number}
          processing={processingId === modal.number.id}
          onCancel={() => setModal(null)}
          onConfirm={() => confirmRelease(modal.number)}
        />
      )}
      {modal?.type === "edit" && (
        <EditBuyerModal
          number={modal.number}
          processing={processingId === modal.number.id}
          onCancel={() => setModal(null)}
          onSave={(name, phone) => saveBuyer(modal.number, name, phone)}
        />
      )}

      {/* ================= TOASTS ================= */}
      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

/* ================================================================== */
/* TICKET PERFORATION — signature element: dashed tear-line with       */
/* punched notch holes, echoing a real raffle ticket stub.             */
/* ================================================================== */

function Perforation({ orientation }: { orientation: "vertical" | "horizontal" }) {
  const isVertical = orientation === "vertical";
  return (
    <div
      className={`relative shrink-0 ${isVertical ? "w-px self-stretch" : "h-px w-full"}`}
      aria-hidden="true"
    >
      <div
        className={isVertical ? "absolute inset-y-2 left-0 w-px" : "absolute inset-x-2 top-0 h-px"}
        style={{
          backgroundImage: isVertical
            ? "repeating-linear-gradient(to bottom, rgba(255,255,255,0.16) 0 5px, transparent 5px 10px)"
            : "repeating-linear-gradient(to right, rgba(255,255,255,0.16) 0 5px, transparent 5px 10px)",
        }}
      />
      <span
        className={
          isVertical
            ? "absolute -left-[5px] -top-[5px] h-2.5 w-2.5 rounded-full bg-[#0B0D13]"
            : "absolute -left-[5px] -top-[5px] h-2.5 w-2.5 rounded-full bg-[#0B0D13]"
        }
      />
      <span
        className={
          isVertical
            ? "absolute -left-[5px] -bottom-[5px] h-2.5 w-2.5 rounded-full bg-[#0B0D13]"
            : "absolute -right-[5px] -top-[5px] h-2.5 w-2.5 rounded-full bg-[#0B0D13]"
        }
      />
    </div>
  );
}

function NumberStub({ number }: { number: RaffleNumber["number"] }) {
  return (
    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-white/[0.09] bg-gradient-to-b from-white/[0.05] to-transparent">
      <span
        style={{ fontFamily: "var(--font-ticket)" }}
        className="text-base font-bold leading-none tracking-tight text-white"
      >
        {number}
      </span>
    </div>
  );
}

/* ================================================================== */
/* MOBILE CARD                                                         */
/* ================================================================== */

function TicketCard({
  n,
  processing,
  onMarkSold,
  onEdit,
  onRelease,
}: {
  n: RaffleNumber;
  processing: boolean;
  onMarkSold: () => void;
  onEdit: () => void;
  onRelease: () => void;
}) {
  const status = STATUS_CONFIG[(n.status as Status) ?? "available"] ?? STATUS_CONFIG.available;

  return (
    <div className="group overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] shadow-lg shadow-black/10 transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.04]">
      <div className="flex items-center gap-3 border-b border-white/[0.06] px-4 py-3.5">
        <NumberStub number={n.number} />
        <Perforation orientation="vertical" />
        <div className="min-w-0 flex-1 pl-1">
          <p className="text-[10px] uppercase tracking-wider text-slate-600">Boleto</p>
          <p className="mt-0.5 truncate text-sm font-semibold text-slate-300">
            {n.buyerName || "Sin comprador"}
          </p>
        </div>
        <StatusBadge status={n.status as Status} />
      </div>

      <div className="grid grid-cols-2 gap-3 p-4">
        <InfoCell label="Comprador" value={n.buyerName || "Sin comprador"} />
        <InfoCell label="Teléfono" value={n.buyerPhone || "Sin teléfono"} mono />
      </div>

      {n.status !== "available" && (
        <div className="flex gap-2 border-t border-white/[0.06] bg-black/10 p-3">
          {n.status === "reserved" && (
            <ActionButton variant="success" disabled={processing} loading={processing} onClick={onMarkSold}>
              <CheckIcon />
              <span>Vendido</span>
            </ActionButton>
          )}
          <ActionButton variant="neutral" disabled={processing} onClick={onEdit}>
            <EditIcon />
            <span>Editar</span>
          </ActionButton>
          <ActionButton variant="danger" disabled={processing} onClick={onRelease}>
            <UnlockIcon />
            <span>Liberar</span>
          </ActionButton>
        </div>
      )}
    </div>
  );
}

function InfoCell({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="rounded-xl border border-white/[0.05] bg-black/20 p-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-600">{label}</p>
      <p className={`mt-1 truncate text-sm font-medium text-slate-300 ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </p>
    </div>
  );
}

/* ================================================================== */
/* DESKTOP ROW                                                         */
/* ================================================================== */

function TicketRow({
  n,
  processing,
  onMarkSold,
  onEdit,
  onRelease,
}: {
  n: RaffleNumber;
  processing: boolean;
  onMarkSold: () => void;
  onEdit: () => void;
  onRelease: () => void;
}) {
  return (
    <tr className="group border-b border-white/[0.045] transition-colors duration-150 hover:bg-white/[0.025]">
      <td className="px-6 py-3.5">
        <div className="flex items-center gap-3">
          <NumberStub number={n.number} />
          <span className="font-mono text-xs text-slate-500">#{n.number}</span>
        </div>
      </td>

      <td className="px-4 py-3.5">
        <StatusBadge status={n.status as Status} />
      </td>

      <td className="px-4 py-3.5">
        {n.buyerName ? (
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-xs font-bold text-violet-300">
              {n.buyerName.charAt(0).toUpperCase()}
            </div>
            <p className="max-w-[180px] truncate font-medium text-slate-300">{n.buyerName}</p>
          </div>
        ) : (
          <span className="text-slate-600">Sin comprador</span>
        )}
      </td>

      <td className="px-4 py-3.5">
        {n.buyerPhone ? (
          <span className="font-mono text-xs text-slate-400">{n.buyerPhone}</span>
        ) : (
          <span className="text-slate-600">—</span>
        )}
      </td>

      <td className="px-6 py-3.5">
        <div className="flex justify-end gap-2">
          {n.status === "reserved" && (
            <IconButton title="Marcar como vendido" variant="success" disabled={processing} loading={processing} onClick={onMarkSold}>
              <CheckIcon />
            </IconButton>
          )}
          {n.status !== "available" && (
            <>
              <IconButton title="Editar comprador" variant="neutral" disabled={processing} onClick={onEdit}>
                <EditIcon />
              </IconButton>
              <IconButton title="Liberar número" variant="danger" disabled={processing} onClick={onRelease}>
                <UnlockIcon />
              </IconButton>
            </>
          )}
          {n.status === "available" && (
            <span className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 text-xs text-slate-600">
              Sin acciones
            </span>
          )}
        </div>
      </td>
    </tr>
  );
}

/* ================================================================== */
/* MODALS                                                               */
/* ================================================================== */

function ModalShell({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />
      <div
        className={`relative w-full max-w-sm overflow-hidden rounded-2xl border border-white/[0.1] bg-[#12151E] shadow-2xl shadow-black/50 transition-all duration-200 ${
          visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-2 scale-[0.98] opacity-0"
        }`}
      >
        {children}
      </div>
    </div>
  );
}

function ReleaseModal({
  number,
  processing,
  onCancel,
  onConfirm,
}: {
  number: RaffleNumber;
  processing: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell onClose={onCancel}>
      <div className="p-5">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-red-500/10">
          <UnlockIcon className="h-5 w-5 text-red-400" />
        </div>
        <h3 className="text-base font-semibold text-white">¿Liberar el número {number.number}?</h3>
        <p className="mt-1.5 text-sm leading-5 text-slate-400">
          El comprador asociado será eliminado y el número volverá a estar disponible.
        </p>
      </div>
      <div className="flex gap-2 border-t border-white/[0.07] bg-black/15 p-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={processing}
          className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.07] disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={processing}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/15 px-4 py-2.5 text-sm font-semibold text-red-300 transition hover:bg-red-500/25 disabled:opacity-50"
        >
          {processing ? <Spinner /> : "Liberar"}
        </button>
      </div>
    </ModalShell>
  );
}

function EditBuyerModal({
  number,
  processing,
  onCancel,
  onSave,
}: {
  number: RaffleNumber;
  processing: boolean;
  onCancel: () => void;
  onSave: (name: string, phone: string) => void;
}) {
  const [name, setName] = useState(number.buyerName ?? "");
  const [phone, setPhone] = useState(number.buyerPhone ?? "");
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameRef.current?.focus();
  }, []);

  return (
    <ModalShell onClose={onCancel}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave(name, phone);
        }}
      >
        <div className="p-5">
          <h3 className="text-base font-semibold text-white">Editar comprador — número {number.number}</h3>
          <p className="mt-1 text-sm text-slate-500">Actualiza los datos asociados a este boleto.</p>

          <div className="mt-4 space-y-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Nombre
              </label>
              <input
                ref={nameRef}
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nombre del comprador"
                className="w-full rounded-xl border border-white/[0.09] bg-black/25 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition focus:border-violet-400/40"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Teléfono
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Teléfono del comprador"
                className="w-full rounded-xl border border-white/[0.09] bg-black/25 px-3.5 py-2.5 text-sm text-slate-200 placeholder:text-slate-600 outline-none transition focus:border-violet-400/40"
              />
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-white/[0.07] bg-black/15 p-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={processing}
            className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.07] disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={processing}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-violet-400/30 bg-violet-500/20 px-4 py-2.5 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/30 disabled:opacity-50"
          >
            {processing ? <Spinner /> : "Guardar"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ================================================================== */
/* TOASTS                                                               */
/* ================================================================== */

function ToastStack({ toasts, onDismiss }: { toasts: ToastItem[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 sm:items-end sm:right-6 sm:left-auto">
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastItem; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const isError = toast.kind === "error";

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border p-3.5 shadow-xl shadow-black/30 backdrop-blur transition-all duration-300 ${
        visible ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
      } ${
        isError
          ? "border-red-500/20 bg-red-950/70"
          : "border-emerald-500/20 bg-emerald-950/70"
      }`}
    >
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          isError ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"
        }`}
      >
        {isError ? <AlertIcon /> : <CheckIcon />}
      </div>
      <p className="mt-1 flex-1 text-sm leading-5 text-slate-200">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="text-slate-500 transition hover:text-slate-300"
        aria-label="Cerrar notificación"
      >
        <XIcon className="h-4 w-4" />
      </button>
    </div>
  );
}

/* ================================================================== */
/* SMALL UI PRIMITIVES                                                  */
/* ================================================================== */

function StatusBadge({ status }: { status: Status }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.available;
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide ring-1 ring-inset ${config.bg} ${config.text} ${config.ring}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "neutral" | Status;
}) {
  const dot =
    tone === "neutral" ? "bg-slate-400" : STATUS_CONFIG[tone].dot;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-white/[0.07] bg-white/[0.02] px-3 py-2">
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      <span style={{ fontFamily: "var(--font-ticket)" }} className="text-sm font-bold text-white">
        {value}
      </span>
      <span className="text-[11px] text-slate-500">{label}</span>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
  dotClassName,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dotClassName?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-white/20 bg-white/10 text-white"
          : "border-white/[0.07] bg-transparent text-slate-500 hover:border-white/15 hover:text-slate-300"
      }`}
    >
      {dotClassName && <span className={`h-1.5 w-1.5 rounded-full ${dotClassName}`} />}
      {children}
    </button>
  );
}

function HeaderLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-600">{children}</span>
  );
}

function ActionButton({
  children,
  onClick,
  variant,
  disabled,
  loading,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant: "success" | "danger" | "neutral";
  disabled?: boolean;
  loading?: boolean;
}) {
  const styles = {
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20",
    danger: "border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20",
    neutral: "border-white/[0.08] bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]",
  };
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${styles[variant]}`}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

function IconButton({
  children,
  onClick,
  variant,
  disabled,
  loading,
  title,
}: {
  children: React.ReactNode;
  onClick: () => void;
  variant: "success" | "danger" | "neutral";
  disabled?: boolean;
  loading?: boolean;
  title: string;
}) {
  const styles = {
    success: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/30",
    danger: "border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/30",
    neutral: "border-white/[0.08] bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-white",
  };
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]}`}
    >
      {loading ? <Spinner /> : children}
    </button>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="text-[10px] text-slate-600">{label}</span>
    </div>
  );
}

function EmptyState({ hasAnyNumbers }: { hasAnyNumbers: boolean }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
        <svg className="h-7 w-7 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.8"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      </div>
      <h3 className="text-base font-semibold text-white">No hay números para mostrar</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        {hasAnyNumbers
          ? "No encontramos números que coincidan con tu búsqueda o filtro."
          : "Todavía no se han generado números para esta rifa."}
      </p>
    </div>
  );
}

function Spinner() {
  return <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />;
}

/* ================================================================== */
/* ICONS                                                                */
/* ================================================================== */

function CheckIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function EditIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.5-9.5a2.121 2.121 0 013 3L12 14l-4 1 1-4 7.5-7.5z"
      />
    </svg>
  );
}

function UnlockIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M7 10V7a5 5 0 019.9-1M5 10h14a1 1 0 011 1v9a1 1 0 01-1 1H5a1 1 0 01-1-1v-9a1 1 0 011-1z"
      />
    </svg>
  );
}

function AlertIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M12 9v3m0 4h.01M10.29 3.86l-8.82 15a2 2 0 001.72 3h17.62a2 2 0 001.72-3l-8.82-15a2 2 0 00-3.42 0z"
      />
    </svg>
  );
}

function XIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}