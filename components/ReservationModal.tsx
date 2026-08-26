"use client";

import { useState } from "react";
import {
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Raffle, RaffleNumber } from "@/lib/types";
import toast from "react-hot-toast";

// ============================================================
// WHATSAPP DEL ADMINISTRADOR
// ============================================================
// Colombia = 57
//
// EJEMPLO:
// 573001234567
//
// SIN +, SIN ESPACIOS Y SIN GUIONES
// ============================================================

const ADMIN_WHATSAPP = "573025636290";

export default function ReservationModal({
  raffleId,
  raffle,
  number,
  onClose,
}: {
  raffleId: string;
  raffle: Raffle;
  number: RaffleNumber;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // ============================================================
  // INFORMACIÓN DE LA RIFA
  // ============================================================

  const raffleData = raffle as Raffle & {
    name?: string;
    title?: string;
    price?: number;
    ticketPrice?: number;
  };

  const raffleName = raffleData.name || raffleData.title || "Rifa";

  const ticketPrice = raffleData.price ?? raffleData.ticketPrice ?? null;

  function formatPrice(price: number | null) {
    if (price === null) return "Consultar precio";
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(price);
  }

  // ============================================================
  // RESERVAR
  // ============================================================

  async function handleSubmit() {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      toast.error("Ingresa tu nombre completo");
      return;
    }
    if (cleanName.length < 3) {
      toast.error("El nombre debe tener al menos 3 caracteres");
      return;
    }
    if (!cleanPhone) {
      toast.error("Ingresa tu número de teléfono");
      return;
    }
    if (cleanPhone.length < 7) {
      toast.error("Ingresa un teléfono válido");
      return;
    }
    if (loading) return;

    setLoading(true);

    try {
      await updateDoc(doc(db, "raffles", raffleId, "numbers", number.id), {
        status: "reserved",
        buyerName: cleanName,
        buyerPhone: cleanPhone,
        reservedAt: serverTimestamp(),
      });

      const whatsappMessage = `
🎟️ *NUEVA RESERVA DE RIFA*

━━━━━━━━━━━━━━━━━━━━

🎰 *Rifa:* ${raffleName}

🔢 *Número:* ${number.number}

👤 *Nombre:* ${cleanName}

📱 *Teléfono:* ${cleanPhone}

💰 *Valor:* ${formatPrice(ticketPrice)}

━━━━━━━━━━━━━━━━━━━━

💳 *PAGO PENDIENTE*

Hola, acabo de reservar el número *${number.number}*.

Quiero realizar el pago correspondiente.

Por favor indícame los datos para realizar la consignación.

Después de realizar el pago enviaré el comprobante por este mismo medio para que puedan verificarlo y validar definitivamente mi número.

¡Gracias! 🎟️
      `.trim();

      const whatsappUrl =
        `https://wa.me/${ADMIN_WHATSAPP}?text=` +
        encodeURIComponent(whatsappMessage);

      toast.success(
        "Número reservado. Continúa en WhatsApp para realizar el pago."
      );

      window.open(whatsappUrl, "_blank", "noopener,noreferrer");

      onClose();
    } catch (error) {
      console.error("Error reservando número:", error);
      toast.error("No se pudo reservar el número. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm animate-in fade-in duration-200 sm:p-4"
      onMouseDown={handleOverlayClick}
    >
      {/* Oculta la barra de scroll mientras conserva el desplazamiento en pantallas muy pequeñas */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ==================================================== */}
      {/* MODAL                                                  */}
      {/* ==================================================== */}
      <div
        className="
          relative flex w-full max-w-[420px] flex-col
          overflow-hidden rounded-2xl border border-white/10
          bg-[#0b0e1a] shadow-2xl shadow-black/50
          animate-in zoom-in-95 duration-200
          max-h-[calc(100dvh-24px)]
        "
      >
        {/* Acabado sutil */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-violet-600/10 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-blue-600/10 blur-[80px]" />

        {/* ==================================================== */}
        {/* HEADER                                                 */}
        {/* ==================================================== */}
        <div className="relative flex shrink-0 items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3.5 sm:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-violet-500/20 bg-violet-500/10">
              <svg className="h-4.5 w-4.5 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 6v12m6-6H6" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-violet-400/90">
                Reserva
              </p>
              <h2 className="truncate text-[15px] font-bold leading-tight text-white sm:text-base">
                Reservar número
              </h2>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.03] text-slate-500 transition-colors duration-150 hover:border-white/10 hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* ==================================================== */}
        {/* CONTENIDO                                              */}
        {/* ==================================================== */}
        <div className="no-scrollbar relative min-h-0 flex-1 space-y-3.5 overflow-y-auto p-4 sm:p-5">
          {/* Número + precio, en una sola fila para ahorrar espacio */}
          <div className="flex items-center gap-3 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.06] px-3.5 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-emerald-500/20 bg-black/20">
              <svg className="h-4.5 w-4.5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622C17.176 19.29 21 14.591 21 9c0-1.042-.133-2.053-.382-3.016z" />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">
                Número seleccionado
              </p>
              <div className="mt-0.5 flex items-baseline gap-2">
                <span className="font-mono text-xl font-black tracking-wide text-white">
                  {number.number}
                </span>
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-400">
                  Disponible
                </span>
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[9px] font-semibold uppercase tracking-[0.1em] text-slate-500">
                Valor
              </p>
              <p className="text-sm font-bold text-emerald-400">
                {formatPrice(ticketPrice)}
              </p>
            </div>
          </div>

          {/* Aviso de pago, compacto */}
          <div className="flex items-start gap-2.5 rounded-xl border border-amber-500/15 bg-amber-500/[0.06] px-3.5 py-3">
            <span className="mt-0.5 shrink-0 text-sm">💳</span>
            <p className="text-[11.5px] leading-[1.35] text-slate-400">
              <span className="font-semibold text-amber-300">Reserva pendiente de validación. </span>
              Realiza la consignación y envía el comprobante por WhatsApp para confirmar tu número.
            </p>
          </div>

          {/* Datos del comprador */}
          <div className="space-y-3 pt-0.5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-slate-500">
              Datos del comprador
            </p>

            {/* Nombre */}
            <div>
              <label htmlFor="reservation-name" className="mb-1.5 block text-xs font-medium text-slate-300">
                Nombre completo
              </label>
              <div className="group relative">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21a8 8 0 0116 0" />
                </svg>
                <input
                  id="reservation-name"
                  type="text"
                  autoComplete="name"
                  disabled={loading}
                  placeholder="Ej. Juan Pérez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full rounded-lg border border-white/[0.08] bg-slate-950/70 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-700 outline-none transition-colors duration-150 hover:border-white/[0.14] focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
            </div>

            {/* Teléfono */}
            <div>
              <label htmlFor="reservation-phone" className="mb-1.5 block text-xs font-medium text-slate-300">
                Número de teléfono
              </label>
              <div className="group relative">
                <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-600 transition-colors group-focus-within:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M3 5a2 2 0 012-2h3.28a2 2 0 011.94 1.515l.7 2.8a2 2 0 01-.53 1.94L8.7 10.95a16 16 0 006.35 6.35l1.695-1.69a2 2 0 011.94-.53l2.8.7A2 2 0 0123 17.72V21a2 2 0 01-2 2h-1C10.268 23 1 13.732 1 3V2a2 2 0 012-2z" />
                </svg>
                <input
                  id="reservation-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  disabled={loading}
                  placeholder="Ej. 300 123 4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                  className="w-full rounded-lg border border-white/[0.08] bg-slate-950/70 py-2.5 pl-9 pr-3 text-sm text-white placeholder:text-slate-700 outline-none transition-colors duration-150 hover:border-white/[0.14] focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>
              <p className="mt-1.5 text-[10px] leading-4 text-slate-600">
                Usaremos este número para confirmar tu reserva.
              </p>
            </div>
          </div>
        </div>

        {/* ==================================================== */}
        {/* FOOTER — acciones + aviso                              */}
        {/* ==================================================== */}
        <div className="relative shrink-0 space-y-2.5 border-t border-white/[0.06] bg-black/20 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[100px_1fr]">
            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="order-2 flex h-11 w-full items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-sm font-semibold text-slate-400 transition-colors duration-150 hover:border-white/[0.14] hover:bg-white/[0.07] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:order-1"
            >
              Cancelar
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="order-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 text-sm font-semibold text-white shadow-md shadow-emerald-950/30 transition-colors duration-150 hover:bg-emerald-500 active:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60 sm:order-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  <span>Reservando...</span>
                </>
              ) : (
                <>
                  <svg className="h-4 w-4 shrink-0" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                  </svg>
                  <span className="truncate">Reservar por WhatsApp</span>
                </>
              )}
            </button>
          </div>

          <p className="text-center text-[10px] leading-4 text-slate-500">
            La reserva no se valida como compra hasta verificar el comprobante de pago.
          </p>
        </div>
      </div>
    </div>
  );
}