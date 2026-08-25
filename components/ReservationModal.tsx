"use client";

import { useState } from "react";
import {
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RaffleNumber } from "@/lib/types";
import toast from "react-hot-toast";

export default function ReservationModal({
  raffleId,
  number,
  onClose,
}: {
  raffleId: string;
  number: RaffleNumber;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();

    if (!cleanName) {
      toast.error("Ingresa tu nombre completo");
      return;
    }

    if (!cleanPhone) {
      toast.error("Ingresa tu número de teléfono");
      return;
    }

    if (cleanName.length < 3) {
      toast.error("El nombre debe tener al menos 3 caracteres");
      return;
    }

    if (cleanPhone.length < 7) {
      toast.error("Ingresa un teléfono válido");
      return;
    }

    if (loading) return;

    setLoading(true);

    try {
      /*
       * IMPORTANTE:
       * Usamos number.id como ID del documento.
       *
       * raffles/{raffleId}/numbers/{number.id}
       */

      await updateDoc(
        doc(
          db,
          "raffles",
          raffleId,
          "numbers",
          number.id
        ),
        {
          status: "reserved",
          buyerName: cleanName,
          buyerPhone: cleanPhone,
          reservedAt: serverTimestamp(),
        }
      );

      toast.success(
        "¡Número reservado correctamente!"
      );

      onClose();
    } catch (error) {
      console.error(
        "Error reservando número:",
        error
      );

      toast.error(
        "No se pudo reservar el número. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleOverlayClick(
    e: React.MouseEvent<HTMLDivElement>
  ) {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  }

  return (
    <div
      className="
        fixed
        inset-0
        z-50
        flex
        items-center
        justify-center
        overflow-y-auto
        bg-black/70
        p-4
        backdrop-blur-md
        animate-in
        fade-in
        duration-200
      "
      onMouseDown={handleOverlayClick}
    >

      {/* ========================================= */}
      {/* MODAL */}
      {/* ========================================= */}

      <div
        className="
          relative
          w-full
          max-w-md
          overflow-hidden
          rounded-[28px]
          border
          border-white/[0.10]
          bg-[#0c1020]
          shadow-2xl
          shadow-black/50
          animate-in
          zoom-in-95
          duration-200
        "
      >

        {/* ========================================= */}
        {/* GLOWS */}
        {/* ========================================= */}

        <div className="pointer-events-none absolute -right-32 -top-32 h-72 w-72 rounded-full bg-violet-600/20 blur-[90px]" />

        <div className="pointer-events-none absolute -bottom-32 -left-32 h-72 w-72 rounded-full bg-blue-600/15 blur-[90px]" />

        {/* ========================================= */}
        {/* HEADER */}
        {/* ========================================= */}

        <div className="relative border-b border-white/[0.07] px-5 py-5 sm:px-6">

          <div className="flex items-start justify-between gap-4">

            <div className="flex items-center gap-3">

              {/* ICON */}

              <div className="relative shrink-0">

                <div className="absolute inset-0 rounded-2xl bg-violet-500/30 blur-lg" />

                <div className="
                  relative
                  flex
                  h-12
                  w-12
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  border-violet-500/20
                  bg-gradient-to-br
                  from-violet-500/20
                  to-blue-500/10
                ">
                  <svg
                    className="h-6 w-6 text-violet-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M12 6v12m6-6H6"
                    />
                  </svg>
                </div>

              </div>

              <div>

                <p className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.18em]
                  text-violet-400
                ">
                  Reserva
                </p>

                <h2 className="
                  mt-0.5
                  text-lg
                  font-bold
                  tracking-tight
                  text-white
                  sm:text-xl
                ">
                  Reservar número
                </h2>

              </div>

            </div>

            {/* CLOSE */}

            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              aria-label="Cerrar"
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-xl
                border
                border-white/[0.07]
                bg-white/[0.04]
                text-slate-500
                transition-all
                duration-200
                hover:border-white/[0.12]
                hover:bg-white/[0.08]
                hover:text-white
                active:scale-90
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

          </div>

        </div>

        {/* ========================================= */}
        {/* CONTENT */}
        {/* ========================================= */}

        <div className="relative p-5 sm:p-6">

          {/* ========================================= */}
          {/* NUMBER CARD */}
          {/* ========================================= */}

          <div className="
            relative
            mb-6
            overflow-hidden
            rounded-2xl
            border
            border-emerald-500/20
            bg-gradient-to-br
            from-emerald-500/10
            via-slate-900/50
            to-blue-500/5
            p-4
          ">

            <div className="
              absolute
              -right-8
              -top-8
              h-24
              w-24
              rounded-full
              bg-emerald-500/10
              blur-2xl
            " />

            <div className="relative flex items-center justify-between">

              <div>

                <p className="
                  text-[10px]
                  font-bold
                  uppercase
                  tracking-[0.15em]
                  text-slate-500
                ">
                  Número seleccionado
                </p>

                <div className="mt-1 flex items-center gap-2">

                  <span className="
                    font-mono
                    text-3xl
                    font-black
                    tracking-wider
                    text-white
                  ">
                    {number.number}
                  </span>

                  <span className="
                    rounded-full
                    border
                    border-emerald-500/20
                    bg-emerald-500/10
                    px-2
                    py-1
                    text-[9px]
                    font-bold
                    uppercase
                    tracking-wide
                    text-emerald-400
                  ">
                    Disponible
                  </span>

                </div>

              </div>

              <div className="
                hidden
                h-12
                w-12
                items-center
                justify-center
                rounded-xl
                border
                border-white/[0.06]
                bg-black/20
                sm:flex
              ">
                <svg
                  className="h-6 w-6 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622C17.176 19.29 21 14.591 21 9c0-1.042-.133-2.053-.382-3.016z"
                  />
                </svg>
              </div>

            </div>

          </div>

          {/* ========================================= */}
          {/* DESCRIPTION */}
          {/* ========================================= */}

          <div className="mb-5">

            <h3 className="text-sm font-semibold text-white">
              Datos del comprador
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-500">
              Completa tus datos para que podamos identificar
              tu reserva.
            </p>

          </div>

          {/* ========================================= */}
          {/* NAME */}
          {/* ========================================= */}

          <div className="mb-4">

            <label
              htmlFor="reservation-name"
              className="
                mb-2
                block
                text-xs
                font-semibold
                text-slate-300
              "
            >
              Nombre completo
            </label>

            <div className="group relative">

              <div className="
                pointer-events-none
                absolute
                left-3.5
                top-1/2
                flex
                -translate-y-1/2
                items-center
                justify-center
                text-slate-600
                transition
                group-focus-within:text-violet-400
              ">
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM4 21a8 8 0 0116 0"
                  />
                </svg>
              </div>

              <input
                id="reservation-name"
                type="text"
                autoComplete="name"
                disabled={loading}
                placeholder="Ej. Juan Pérez"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
                className="
                  w-full
                  rounded-xl
                  border
                  border-white/[0.08]
                  bg-slate-950/80
                  py-3.5
                  pl-11
                  pr-4
                  text-sm
                  text-white
                  placeholder:text-slate-700
                  outline-none
                  transition-all
                  duration-200
                  hover:border-white/[0.12]
                  focus:border-violet-500/60
                  focus:bg-slate-950
                  focus:ring-4
                  focus:ring-violet-500/10
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              />

            </div>

          </div>

          {/* ========================================= */}
          {/* PHONE */}
          {/* ========================================= */}

          <div className="mb-6">

            <label
              htmlFor="reservation-phone"
              className="
                mb-2
                block
                text-xs
                font-semibold
                text-slate-300
              "
            >
              Número de teléfono
            </label>

            <div className="group relative">

              <div className="
                pointer-events-none
                absolute
                left-3.5
                top-1/2
                flex
                -translate-y-1/2
                items-center
                justify-center
                text-slate-600
                transition
                group-focus-within:text-violet-400
              ">
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
                    d="M3 5a2 2 0 012-2h3.28a2 2 0 011.94 1.515l.7 2.8a2 2 0 01-.53 1.94L8.7 10.95a16 16 0 006.35 6.35l1.695-1.69a2 2 0 011.94-.53l2.8.7A2 2 0 0123 17.72V21a2 2 0 01-2 2h-1C10.268 23 1 13.732 1 3V2a2 2 0 012-2z"
                  />
                </svg>
              </div>

              <input
                id="reservation-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                disabled={loading}
                placeholder="Ej. 300 123 4567"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value)
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSubmit();
                  }
                }}
                className="
                  w-full
                  rounded-xl
                  border
                  border-white/[0.08]
                  bg-slate-950/80
                  py-3.5
                  pl-11
                  pr-4
                  text-sm
                  text-white
                  placeholder:text-slate-700
                  outline-none
                  transition-all
                  duration-200
                  hover:border-white/[0.12]
                  focus:border-violet-500/60
                  focus:bg-slate-950
                  focus:ring-4
                  focus:ring-violet-500/10
                  disabled:cursor-not-allowed
                  disabled:opacity-50
                "
              />

            </div>

            <p className="mt-2 flex items-center gap-1.5 text-[10px] text-slate-600">

              <svg
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M12 15v2m-6 4h12a2 2 0 002-2V9a8 8 0 10-16 0v10a2 2 0 002 2z"
                />
              </svg>

              Usaremos este número para confirmar tu reserva.

            </p>

          </div>

          {/* ========================================= */}
          {/* BUTTONS */}
          {/* ========================================= */}

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

            {/* CANCEL */}

            <button
              type="button"
              disabled={loading}
              onClick={onClose}
              className="
                order-2
                flex
                min-h-[48px]
                items-center
                justify-center
                gap-2
                rounded-xl
                border
                border-white/[0.08]
                bg-white/[0.03]
                px-4
                text-sm
                font-semibold
                text-slate-400
                transition-all
                duration-200
                hover:border-white/[0.12]
                hover:bg-white/[0.07]
                hover:text-white
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-40
                sm:order-1
              "
            >
              Cancelar
            </button>

            {/* RESERVE */}

            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="
                group
                relative
                order-1
                flex
                min-h-[48px]
                items-center
                justify-center
                gap-2
                overflow-hidden
                rounded-xl
                bg-gradient-to-r
                from-emerald-500
                via-emerald-600
                to-teal-600
                px-4
                text-sm
                font-bold
                text-white
                shadow-lg
                shadow-emerald-900/30
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:shadow-xl
                hover:shadow-emerald-900/40
                active:translate-y-0
                active:scale-[0.98]
                disabled:cursor-not-allowed
                disabled:opacity-50
                sm:order-2
              "
            >

              {/* shine */}

              <span className="
                pointer-events-none
                absolute
                inset-0
                -translate-x-full
                bg-gradient-to-r
                from-transparent
                via-white/20
                to-transparent
                transition-transform
                duration-700
                group-hover:translate-x-full
              " />

              <span className="relative flex items-center gap-2">

                {loading ? (
                  <>
                    <span className="
                      h-4
                      w-4
                      animate-spin
                      rounded-full
                      border-2
                      border-white/30
                      border-t-white
                    " />

                    Reservando...
                  </>
                ) : (
                  <>
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>

                    Confirmar reserva
                  </>
                )}

              </span>

            </button>

          </div>

        </div>

        {/* ========================================= */}
        {/* FOOTER */}
        {/* ========================================= */}

        <div className="
          relative
          border-t
          border-white/[0.06]
          bg-black/10
          px-5
          py-3.5
          text-center
          sm:px-6
        ">

          <p className="text-[10px] leading-4 text-slate-600">
            Al reservar este número, aceptas que el administrador
            se comunique contigo para confirmar la compra.
          </p>

        </div>

      </div>
    </div>
  );
}
