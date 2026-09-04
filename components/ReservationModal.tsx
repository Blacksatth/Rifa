"use client";

import { useEffect, useState } from "react";
import {
  doc,
  getDoc,
} from "firebase/firestore";

import { db } from "@/lib/firebase";
import { Raffle, RaffleNumber } from "@/lib/types";
import { getVisitorId } from "@/lib/reservations";
import {
  reserveNumber,
  releaseReservation as releaseReservationAction,
} from "@/lib/actions";
import toast from "react-hot-toast";

const getExpirationTimeMs = (
  value: unknown
): number | null => {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value).getTime();
    return Number.isNaN(parsed) ? null : parsed;
  }

  if (
    value &&
    typeof value === "object"
  ) {
    const obj = value as {
      toMillis?: unknown;
      toDate?: unknown;
    };

    if (
      typeof obj.toMillis === "function"
    ) {
      const ms = (
        obj as { toMillis: () => unknown }
      ).toMillis();
      return typeof ms === "number" ? ms : null;
    }

    if (
      typeof obj.toDate === "function"
    ) {
      const d = (
        obj as { toDate: () => unknown }
      ).toDate();
      return d instanceof Date &&
        !Number.isNaN(d.getTime())
        ? d.getTime()
        : null;
    }
  }

  return null;
};

// ============================================================
// WHATSAPP DEL ADMINISTRADOR
// ============================================================

const ADMIN_WHATSAPP = "573025636290";

// ============================================================
// TIEMPO DE RESERVA
// ============================================================

const RESERVATION_TIME_MINUTES = 30;

const RESERVATION_TIME_MS =
  RESERVATION_TIME_MINUTES * 60 * 1000;

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

  const [reserved, setReserved] = useState(false);

  const [expiresAt, setExpiresAt] =
    useState<number | null>(null);

  const [timeLeft, setTimeLeft] = useState(0);

  // ============================================================
  // NUEVO:
  // MIENTRAS FIREBASE COMPRUEBA LA RESERVA
  // ============================================================

  const [checkingReservation, setCheckingReservation] =
    useState(true);

  // ============================================================
  // INFORMACIÓN RIFA
  // ============================================================

  const raffleData = raffle as Raffle & {
    name?: string;
    title?: string;
    price?: number;
    ticketPrice?: number;
  };

  const raffleName =
    raffleData.name ||
    raffleData.title ||
    "Rifa";

  const ticketPrice =
    raffleData.price ??
    raffleData.ticketPrice ??
    null;

  // ============================================================
  // PRECIO
  // ============================================================

  function formatPrice(price: number | null) {
    if (price === null) {
      return "Consultar precio";
    }

    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }).format(price);
  }

  // ============================================================
  // TIEMPO
  // ============================================================

  function formatTime(milliseconds: number) {
    const totalSeconds = Math.max(
      0,
      Math.floor(milliseconds / 1000)
    );

    const minutes = Math.floor(
      totalSeconds / 60
    );

    const seconds = totalSeconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  }

  // ============================================================
  // CARGAR RESERVA EXISTENTE
  // ============================================================

  useEffect(() => {
    let mounted = true;

    async function loadExistingReservation() {
      try {
        // ======================================================
        // VISITOR ID
        // ======================================================

        const visitorId = getVisitorId();

        if (!visitorId) {
          if (mounted) {
            setReserved(false);
            setExpiresAt(null);
            setTimeLeft(0);
            setCheckingReservation(false);
          }

          return;
        }

        // ======================================================
        // REFERENCIA DEL NÚMERO
        // ======================================================

        const numberRef = doc(
          db,
          "raffles",
          raffleId,
          "numbers",
          number.id
        );

        // ======================================================
        // CONSULTAR FIREBASE
        // ======================================================

        const snapshot = await getDoc(numberRef);

        if (!snapshot.exists()) {
          if (mounted) {
            setReserved(false);
            setExpiresAt(null);
            setTimeLeft(0);
            setCheckingReservation(false);
          }

          return;
        }

        const data = snapshot.data();

        // ======================================================
        // COMPROBAR SI ES RESERVA DE ESTE NAVEGADOR
        // ======================================================

        if (
          data.status !== "reserved" ||
          data.buyerVisitorId !== visitorId
        ) {
          if (mounted) {
            setReserved(false);
            setExpiresAt(null);
            setTimeLeft(0);
            setCheckingReservation(false);
          }

          return;
        }

        // ======================================================
        // CARGAR DATOS DEL COMPRADOR
        // ======================================================

        if (mounted) {
          setName(data.buyerName || "");
          setPhone(data.buyerPhone || "");
        }

        // ======================================================
        // OBTENER FECHA DE EXPIRACIÓN
        // ======================================================

        const expirationTime =
          getExpirationTimeMs(
            data.reservationExpiresAt
          );

        // ======================================================
        // NO EXISTE FECHA DE EXPIRACIÓN
        // ======================================================

        if (!expirationTime) {
          if (mounted) {
            setReserved(true);
            setExpiresAt(null);
            setTimeLeft(0);
            setCheckingReservation(false);
          }

          return;
        }

        // ======================================================
        // CALCULAR TIEMPO RESTANTE
        // ======================================================

        const remaining =
          expirationTime - Date.now();

        // ======================================================
        // RESERVA YA EXPIRADA
        // ======================================================

        if (remaining <= 0) {
          // ==================================================
          // LIBERAR LA RESERVA EXPIRADA
          //
          // Se delega al servidor, que valida que la reserva
          // realmente haya expirado antes de liberarla.
          // ==================================================

          try {
            await releaseReservationAction({
              raffleId,
              numberId: number.id,
              visitorId,
            });
          } catch (error) {
            console.error(
              "Error liberando reserva expirada:",
              error
            );
          }

          if (mounted) {
            setReserved(false);
            setExpiresAt(null);
            setTimeLeft(0);
            setCheckingReservation(false);
          }

          return;
        }

        // ======================================================
        // RESERVA ACTIVA
        // ======================================================

        if (mounted) {
          setReserved(true);

          setExpiresAt(
            expirationTime
          );

          setTimeLeft(
            remaining
          );

          setCheckingReservation(false);
        }
      } catch (error) {
        console.error(
          "Error cargando reserva:",
          error
        );

        if (mounted) {
          setCheckingReservation(false);
        }
      }
    }

    loadExistingReservation();

    return () => {
      mounted = false;
    };
  }, [
    raffleId,
    number.id,
  ]);

  // ============================================================
  // CONTADOR
  // ============================================================

  useEffect(() => {
    if (
      !reserved ||
      !expiresAt
    ) {
      return;
    }

    let released = false;

    // ============================================================
    // LIBERAR RESERVA
    // ============================================================

    const releaseReservation =
      async () => {
        if (released) {
          return;
        }

        released = true;

        const visitorId =
          getVisitorId();

        if (!visitorId) {
          return;
        }

        try {
          // ======================================================
          // LIBERAR EN EL SERVIDOR
          //
          // El servidor solo libera si la reserva realmente expiró,
          // por lo que no es posible liberar la reserva activa de
          // otra persona manipulando el cliente.
          // ======================================================

          await releaseReservationAction({
            raffleId,
            numberId: number.id,
            visitorId,
          });

          // ======================================================
          // ACTUALIZAR UI
          // ======================================================

          setReserved(false);

          setExpiresAt(null);

          setTimeLeft(0);

          toast.error(
            "El tiempo de reserva terminó. El número fue liberado."
          );
        } catch (error) {
          console.error(
            "Error liberando reserva:",
            error
          );

          // Permitimos reintentar si el servidor falló.
          released = false;
        }
      };

    // ============================================================
    // ACTUALIZAR CONTADOR
    // ============================================================

    const updateTimer = () => {
      const remaining =
        expiresAt - Date.now();

      if (remaining <= 0) {
        setTimeLeft(0);

        void releaseReservation();

        return true;
      }

      setTimeLeft(remaining);

      return false;
    };

    // ============================================================
    // EJECUTAR INMEDIATAMENTE
    // ============================================================

    const alreadyExpired =
      updateTimer();

    if (alreadyExpired) {
      return;
    }

    // ============================================================
    // ACTUALIZAR CADA SEGUNDO
    // ============================================================

    const interval =
      setInterval(() => {
        updateTimer();
      }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [
    reserved,
    expiresAt,
    raffleId,
    number.id,
  ]);

  // ============================================================
  // RESERVAR
  // ============================================================

  async function handleSubmit() {
    const cleanName =
      name.trim();

    const cleanPhone =
      phone.trim();

    if (loading) {
      return;
    }

    if (!cleanName) {
      toast.error(
        "Ingresa tu nombre completo"
      );

      return;
    }

    if (
      cleanName.length < 3
    ) {
      toast.error(
        "El nombre debe tener al menos 3 caracteres"
      );

      return;
    }

    if (!cleanPhone) {
      toast.error(
        "Ingresa tu número de teléfono"
      );

      return;
    }

    if (
      cleanPhone.length < 7
    ) {
      toast.error(
        "Ingresa un teléfono válido"
      );

      return;
    }

    // ============================================================
    // VISITOR ID
    // ============================================================

    const visitorId =
      getVisitorId();

    if (!visitorId) {
      toast.error(
        "No se pudo identificar tu navegador. Recarga la página e intenta nuevamente."
      );

      return;
    }

    setLoading(true);

    try {
      // ==========================================================
      // GUARDAR RESERVA EN EL SERVIDOR
      //
      // El servidor valida la disponibilidad y el estado del
      // número (no reservado, no vendido) de forma transaccional,
      // e impide marcar números como vendidos desde el cliente.
      // ==========================================================

      const result = await reserveNumber({
        raffleId,
        numberId: number.id,
        visitorId,
        name: cleanName,
        phone: cleanPhone,
      });

      const reservationExpiresAt =
        result.reservationExpiresAt;

      // ==========================================================
      // ACTUALIZAR UI
      // ==========================================================

      setName(cleanName);

      setPhone(cleanPhone);

      setExpiresAt(
        reservationExpiresAt
      );

      setTimeLeft(
        RESERVATION_TIME_MS
      );

      setReserved(true);

      toast.success(
        "¡Número reservado correctamente!"
      );
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

  // ============================================================
  // WHATSAPP
  // ============================================================

  function handleWhatsApp() {
    if (timeLeft <= 0) {
      toast.error(
        "El tiempo de reserva ha terminado."
      );

      return;
    }

    const whatsappMessage = `
🎟️ *COMPROBANTE DE PAGO - RIFA*

━━━━━━━━━━━━━━━━━━━━

🎰 *Rifa:* ${raffleName}

🔢 *Número:* ${number.number}

👤 *Nombre:* ${name.trim()}

📱 *Teléfono:* ${phone.trim()}

💰 *Valor:* ${formatPrice(ticketPrice)}

━━━━━━━━━━━━━━━━━━━━

Hola 👋

Acabo de realizar el pago de mi número reservado.

Adjunto en este chat el comprobante de pago para que puedan verificarlo y confirmar definitivamente mi número.

¡Gracias! 🎟️
    `.trim();

    const whatsappUrl =
      `https://wa.me/${ADMIN_WHATSAPP}?text=` +
      encodeURIComponent(
        whatsappMessage
      );

    window.open(
      whatsappUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  // ============================================================
  // CERRAR
  // ============================================================

  function handleClose() {
    if (loading) {
      return;
    }

    onClose();
  }

  // ============================================================
  // OVERLAY
  // ============================================================

  function handleOverlayClick(
    e: React.MouseEvent<HTMLDivElement>
  ) {
    if (
      e.target ===
        e.currentTarget &&
      !loading
    ) {
      onClose();
    }
  }

  // ============================================================
  // EXPIRADA
  // ============================================================

  const reservationExpired =
    reserved &&
    expiresAt !== null &&
    timeLeft <= 0;

  // ============================================================
  // PANTALLA DE ESPERA
  // ============================================================

  if (checkingReservation) {
    return (
      <div
        className="
          fixed inset-0 z-50
          flex items-center justify-center
          bg-black/70
          p-4
          backdrop-blur-sm
          animate-in
          fade-in
          duration-200
        "
      >
        <div
          className="
            relative
            w-full
            max-w-sm
            overflow-hidden
            rounded-2xl
            border
            border-white/10
            bg-[#0b0e1a]
            p-6
            text-center
            shadow-2xl
            shadow-black/50
            animate-in
            zoom-in-95
            duration-200
          "
        >
          {/* GLOW */}

          <div
            className="
              pointer-events-none
              absolute
              -right-20
              -top-20
              h-40
              w-40
              rounded-full
              bg-violet-600/10
              blur-[70px]
            "
          />

          <div
            className="
              pointer-events-none
              absolute
              -bottom-20
              -left-20
              h-40
              w-40
              rounded-full
              bg-blue-600/10
              blur-[70px]
            "
          />

          {/* ICONO */}

          <div
            className="
              relative
              mx-auto
              flex
              h-14
              w-14
              items-center
              justify-center
              rounded-full
              border
              border-violet-500/20
              bg-violet-500/10
            "
          >
            <span
              className="
                h-6
                w-6
                animate-spin
                rounded-full
                border-2
                border-violet-400/20
                border-t-violet-400
              "
            />
          </div>

          {/* TEXTO */}

          <h3
            className="
              relative
              mt-4
              text-base
              font-bold
              text-white
            "
          >
            Comprobando reserva
          </h3>

          <p
            className="
              relative
              mt-2
              text-xs
              leading-5
              text-slate-500
            "
          >
            Estamos verificando el estado
            del número. Un momento...
          </p>

          {/* PUNTOS */}

          <div
            className="
              relative
              mt-4
              flex
              justify-center
              gap-1.5
            "
          >
            <span
              className="
                h-1.5
                w-1.5
                animate-pulse
                rounded-full
                bg-violet-400
              "
            />

            <span
              className="
                h-1.5
                w-1.5
                animate-pulse
                rounded-full
                bg-violet-400
              "
              style={{
                animationDelay: "150ms",
              }}
            />

            <span
              className="
                h-1.5
                w-1.5
                animate-pulse
                rounded-full
                bg-violet-400
              "
              style={{
                animationDelay: "300ms",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className="
        fixed inset-0 z-50
        flex items-center justify-center
        bg-black/70
        p-3
        backdrop-blur-sm
        animate-in
        fade-in
        duration-200
        sm:p-4
      "
      onMouseDown={
        handleOverlayClick
      }
    >
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }

        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>

      <div
        className="
          relative
          flex
          w-full
          max-w-[420px]
          flex-col
          overflow-hidden
          rounded-2xl
          border
          border-white/10
          bg-[#0b0e1a]
          shadow-2xl
          shadow-black/50
          animate-in
          zoom-in-95
          duration-200
          max-h-[calc(100dvh-24px)]
        "
      >
        {/* GLOW */}

        <div
          className="
            pointer-events-none
            absolute
            -right-24
            -top-24
            h-56
            w-56
            rounded-full
            bg-violet-600/10
            blur-[80px]
          "
        />

        <div
          className="
            pointer-events-none
            absolute
            -bottom-24
            -left-24
            h-56
            w-56
            rounded-full
            bg-blue-600/10
            blur-[80px]
          "
        />

        {/* ==================================================== */}
        {/* HEADER */}
        {/* ==================================================== */}

        <div
          className="
            relative
            flex
            shrink-0
            items-center
            justify-between
            gap-3
            border-b
            border-white/[0.06]
            px-4
            py-3.5
            sm:px-5
          "
        >
          <div
            className="
              flex
              min-w-0
              items-center
              gap-2.5
            "
          >
            <div
              className="
                flex
                h-9
                w-9
                shrink-0
                items-center
                justify-center
                rounded-lg
                border
                border-violet-500/20
                bg-violet-500/10
              "
            >
              {reserved ? (
                <svg
                  className="
                    h-4.5
                    w-4.5
                    text-emerald-400
                  "
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.8"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              ) : (
                <svg
                  className="
                    h-4.5
                    w-4.5
                    text-violet-400
                  "
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
              )}
            </div>

            <div className="min-w-0">
              <p
                className="
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-[0.14em]
                  text-violet-400/90
                "
              >
                {reserved
                  ? "Reserva realizada"
                  : "Reserva"}
              </p>

              <h2
                className="
                  truncate
                  text-[15px]
                  font-bold
                  leading-tight
                  text-white
                  sm:text-base
                "
              >
                {reserved
                  ? "Tu número está reservado"
                  : "Reservar número"}
              </h2>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleClose}
            aria-label="Cerrar"
            className="
              flex
              h-8
              w-8
              shrink-0
              items-center
              justify-center
              rounded-lg
              border
              border-white/[0.06]
              bg-white/[0.03]
              text-slate-500
              transition-colors
              duration-150
              hover:border-white/10
              hover:bg-white/[0.07]
              hover:text-white
              disabled:cursor-not-allowed
              disabled:opacity-40
            "
          >
            <svg
              className="h-4 w-4"
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

        {/* ==================================================== */}
        {/* CONTENIDO */}
        {/* ==================================================== */}

        <div
          className="
            no-scrollbar
            relative
            min-h-0
            flex-1
            space-y-4
            overflow-y-auto
            p-4
            sm:p-5
          "
        >
          {reserved ? (
            <>
              {/* ÉXITO */}

              <div
                className="
                  rounded-2xl
                  border
                  border-emerald-500/20
                  bg-emerald-500/[0.06]
                  p-4
                  text-center
                "
              >
                <div
                  className="
                    mx-auto
                    mb-3
                    flex
                    h-12
                    w-12
                    items-center
                    justify-center
                    rounded-full
                    border
                    border-emerald-500/30
                    bg-emerald-500/10
                  "
                >
                  <svg
                    className="
                      h-6
                      w-6
                      text-emerald-400
                    "
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>

                <h3
                  className="
                    text-lg
                    font-black
                    text-white
                  "
                >
                  {reservationExpired
                    ? "La reserva ha expirado"
                    : "¡Tu número está reservado!"}
                </h3>

                <p
                  className="
                    mt-1
                    text-xs
                    leading-5
                    text-slate-400
                  "
                >
                  {reservationExpired
                    ? "El tiempo para realizar el pago terminó."
                    : "Realiza el pago dentro del tiempo indicado para conservar tu número."}
                </p>
              </div>

              {/* NÚMERO / PRECIO */}

              <div
                className="
                  grid
                  grid-cols-2
                  gap-3
                "
              >
                <div
                  className="
                    rounded-xl
                    border
                    border-white/[0.08]
                    bg-white/[0.03]
                    p-3
                  "
                >
                  <p
                    className="
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-[0.12em]
                      text-slate-500
                    "
                  >
                    🎟️ Número
                  </p>

                  <p
                    className="
                      mt-1
                      font-mono
                      text-2xl
                      font-black
                      tracking-wider
                      text-white
                    "
                  >
                    {number.number}
                  </p>
                </div>

                <div
                  className="
                    rounded-xl
                    border
                    border-white/[0.08]
                    bg-white/[0.03]
                    p-3
                  "
                >
                  <p
                    className="
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-[0.12em]
                      text-slate-500
                    "
                  >
                    💰 Valor
                  </p>

                  <p
                    className="
                      mt-1
                      text-lg
                      font-black
                      text-emerald-400
                    "
                  >
                    {formatPrice(
                      ticketPrice
                    )}
                  </p>
                </div>
              </div>

              {/* CONTADOR */}

              {!reservationExpired ? (
                <div
                  className="
                    rounded-xl
                    border
                    border-amber-500/20
                    bg-amber-500/[0.06]
                    p-4
                    text-center
                  "
                >
                  <p
                    className="
                      text-[10px]
                      font-bold
                      uppercase
                      tracking-[0.14em]
                      text-amber-400
                    "
                  >
                    ⏱️ Tiempo para realizar
                    el pago
                  </p>

                  <p
                    className="
                      mt-1
                      font-mono
                      text-3xl
                      font-black
                      tracking-wider
                      text-white
                    "
                  >
                    {formatTime(
                      timeLeft
                    )}
                  </p>

                  <p
                    className="
                      mt-1
                      text-[10px]
                      text-slate-500
                    "
                  >
                    Tu reserva tiene una
                    duración de 30 minutos.
                  </p>
                </div>
              ) : (
                <div
                  className="
                    rounded-xl
                    border
                    border-red-500/20
                    bg-red-500/[0.06]
                    p-4
                    text-center
                  "
                >
                  <div className="text-2xl">
                    ⏰
                  </div>

                  <p
                    className="
                      mt-1
                      text-sm
                      font-bold
                      text-red-400
                    "
                  >
                    Tiempo agotado
                  </p>

                  <p
                    className="
                      mt-1
                      text-[11px]
                      leading-5
                      text-slate-500
                    "
                  >
                    La reserva ya no puede
                    utilizarse para realizar
                    el pago.
                  </p>
                </div>
              )}

              {/* PAGOS */}

              {!reservationExpired && (
                <>
                  <div className="text-center">
                    <p
                      className="
                        text-xs
                        font-bold
                        text-white
                      "
                    >
                      📲 Realiza tu pago con Bre-B
                    </p>

                    <p
                      className="
                        mt-1
                        text-[10px]
                        text-slate-500
                      "
                    >
                      Escanea el código QR para
                      realizar el pago.
                    </p>
                  </div>

                  <div className="flex justify-center">
                    <div
                      className="
                        rounded-2xl
                        border
                        border-white/10
                        bg-white
                        p-3
                        shadow-xl
                        shadow-black/20
                      "
                    >
                      <img
                        src="/images/qr-breb1.png"
                        alt="Código QR para realizar el pago mediante Bre-B"
                        className="
                          h-72
                          w-72
                          max-w-full
                          object-contain
                          sm:h-80
                          sm:w-80
                        "
                      />
                    </div>
                  </div>

                  {/* MÉTODOS DE PAGO */}

                  <div className="space-y-3">
                    <div className="text-center">
                      <p
                        className="
                          text-xs
                          font-bold
                          text-white
                        "
                      >
                        💳 También puedes pagar
                        por transferencia
                      </p>

                      <p
                        className="
                          mt-1
                          text-[10px]
                          text-slate-500
                        "
                      >
                        Utiliza cualquiera de
                        estas opciones para
                        realizar el pago.
                      </p>
                    </div>

                    <div
                      className="
                        grid
                        grid-cols-1
                        gap-3
                        sm:grid-cols-2
                      "
                    >
                      {/* BANCOLOMBIA */}

                      <div
                        className="
                          rounded-xl
                          border
                          border-yellow-500/20
                          bg-yellow-500/[0.05]
                          p-3.5
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            gap-2.5
                          "
                        >
                          <div
                            className="
                              flex
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-lg
                              border
                              border-yellow-500/20
                              bg-yellow-500/10
                              text-lg
                            "
                          >
                            🏦
                          </div>

                          <div className="min-w-0">
                            <p
                              className="
                                text-[9px]
                                font-bold
                                uppercase
                                tracking-[0.12em]
                                text-yellow-400
                              "
                            >
                              Bancolombia
                            </p>

                            <p
                              className="
                                mt-0.5
                                text-[10px]
                                text-slate-500
                              "
                            >
                              Cuenta de ahorros
                            </p>
                          </div>
                        </div>

                        <div
                          className="
                            mt-3
                            rounded-lg
                            border
                            border-white/[0.06]
                            bg-black/20
                            px-3
                            py-2.5
                            text-center
                          "
                        >
                          <p
                            className="
                              break-all
                              font-mono
                              text-sm
                              font-black
                              tracking-wider
                              text-white
                              sm:text-base
                            "
                          >
                            91255816182
                          </p>
                        </div>
                      </div>

                      {/* NEQUI */}

                      <div
                        className="
                          rounded-xl
                          border
                          border-pink-500/20
                          bg-pink-500/[0.05]
                          p-3.5
                        "
                      >
                        <div
                          className="
                            flex
                            items-center
                            gap-2.5
                          "
                        >
                          <div
                            className="
                              flex
                              h-9
                              w-9
                              shrink-0
                              items-center
                              justify-center
                              rounded-lg
                              border
                              border-pink-500/20
                              bg-pink-500/10
                              text-lg
                            "
                          >
                            📱
                          </div>

                          <div className="min-w-0">
                            <p
                              className="
                                text-[9px]
                                font-bold
                                uppercase
                                tracking-[0.12em]
                                text-pink-400
                              "
                            >
                              Nequi
                            </p>

                            <p
                              className="
                                mt-0.5
                                text-[10px]
                                text-slate-500
                              "
                            >
                              Número de celular
                            </p>
                          </div>
                        </div>

                        <div
                          className="
                            mt-3
                            rounded-lg
                            border
                            border-white/[0.06]
                            bg-black/20
                            px-3
                            py-2.5
                            text-center
                          "
                        >
                          <p
                            className="
                              break-all
                              font-mono
                              text-sm
                              font-black
                              tracking-wider
                              text-white
                              sm:text-base
                            "
                          >
                            302 563 6290
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* AVISO */}

                    <div
                      className="
                        flex
                        items-start
                        gap-2.5
                        rounded-xl
                        border
                        border-violet-500/15
                        bg-violet-500/[0.05]
                        px-3.5
                        py-3
                      "
                    >
                      <span className="mt-0.5 shrink-0 text-sm">
                        💡
                      </span>

                      <p
                        className="
                          text-[10.5px]
                          leading-[1.5]
                          text-slate-400
                        "
                      >
                        Puedes pagar mediante{" "}
                        <span className="font-semibold text-yellow-300">
                          Bancolombia
                        </span>
                        ,{" "}
                        <span className="font-semibold text-pink-300">
                          Nequi
                        </span>{" "}
                        o escaneando el código
                        QR de{" "}
                        <span className="font-semibold text-white">
                          Bre-B
                        </span>
                        . Después de realizar
                        el pago, envía el
                        comprobante por
                        WhatsApp.
                      </p>
                    </div>
                  </div>

                  {/* AVISO */}

                  <div
                    className="
                      flex
                      items-start
                      gap-2.5
                      rounded-xl
                      border
                      border-blue-500/15
                      bg-blue-500/[0.05]
                      px-3.5
                      py-3
                    "
                  >
                    <span className="mt-0.5 shrink-0 text-sm">
                      ℹ️
                    </span>

                    <p
                      className="
                        text-[11px]
                        leading-[1.45]
                        text-slate-400
                      "
                    >
                      Después de realizar el
                      pago, envía el comprobante
                      por WhatsApp para que
                      podamos verificarlo y
                      confirmar definitivamente
                      tu número.
                    </p>
                  </div>
                </>
              )}

              {/* DATOS */}

              <div
                className="
                  rounded-xl
                  border
                  border-white/[0.06]
                  bg-black/20
                  p-3
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-3
                  "
                >
                  <div>
                    <p
                      className="
                        text-[9px]
                        font-semibold
                        uppercase
                        tracking-[0.1em]
                        text-slate-600
                      "
                    >
                      Comprador
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-xs
                        font-medium
                        text-slate-300
                      "
                    >
                      {name}
                    </p>
                  </div>

                  <div className="text-right">
                    <p
                      className="
                        text-[9px]
                        font-semibold
                        uppercase
                        tracking-[0.1em]
                        text-slate-600
                      "
                    >
                      Teléfono
                    </p>

                    <p
                      className="
                        mt-0.5
                        text-xs
                        font-medium
                        text-slate-300
                      "
                    >
                      {phone}
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* NÚMERO */}

              <div
                className="
                  flex
                  items-center
                  gap-3
                  rounded-xl
                  border
                  border-emerald-500/15
                  bg-emerald-500/[0.06]
                  px-3.5
                  py-3
                "
              >
                <div
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-emerald-500/20
                    bg-black/20
                  "
                >
                  <svg
                    className="
                      h-4.5
                      w-4.5
                      text-emerald-400
                    "
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.8"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 00-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622C17.176 19.29 21 14.591 21 9c0-1.042-.133-2.053-.382-3.016z"
                    />
                  </svg>
                </div>

                <div
                  className="
                    min-w-0
                    flex-1
                  "
                >
                  <p
                    className="
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-[0.12em]
                      text-slate-500
                    "
                  >
                    Número seleccionado
                  </p>

                  <div
                    className="
                      mt-0.5
                      flex
                      items-baseline
                      gap-2
                    "
                  >
                    <span
                      className="
                        font-mono
                        text-xl
                        font-black
                        tracking-wide
                        text-white
                      "
                    >
                      {number.number}
                    </span>

                    <span
                      className="
                        rounded-full
                        border
                        border-emerald-500/20
                        bg-emerald-500/10
                        px-1.5
                        py-0.5
                        text-[8px]
                        font-bold
                        uppercase
                        tracking-wide
                        text-emerald-400
                      "
                    >
                      Disponible
                    </span>
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <p
                    className="
                      text-[9px]
                      font-semibold
                      uppercase
                      tracking-[0.1em]
                      text-slate-500
                    "
                  >
                    Valor
                  </p>

                  <p
                    className="
                      text-sm
                      font-bold
                      text-emerald-400
                    "
                  >
                    {formatPrice(
                      ticketPrice
                    )}
                  </p>
                </div>
              </div>

              {/* AVISO */}

              <div
                className="
                  flex
                  items-start
                  gap-2.5
                  rounded-xl
                  border
                  border-amber-500/15
                  bg-amber-500/[0.06]
                  px-3.5
                  py-3
                "
              >
                <span className="mt-0.5 shrink-0 text-sm">
                  ⏱️
                </span>

                <p
                  className="
                    text-[11.5px]
                    leading-[1.35]
                    text-slate-400
                  "
                >
                  <span
                    className="
                      font-semibold
                      text-amber-300
                    "
                  >
                    Reserva por 30 minutos.
                  </span>{" "}
                  Tendrás este tiempo para
                  realizar el pago y enviar
                  el comprobante.
                </p>
              </div>

              {/* DATOS */}

              <div className="space-y-3 pt-0.5">
                <p
                  className="
                    text-[11px]
                    font-semibold
                    uppercase
                    tracking-[0.1em]
                    text-slate-500
                  "
                >
                  Datos del comprador
                </p>

                {/* NOMBRE */}

                <div>
                  <label
                    htmlFor="reservation-name"
                    className="
                      mb-1.5
                      block
                      text-xs
                      font-medium
                      text-slate-300
                    "
                  >
                    Nombre completo
                  </label>

                  <input
                    id="reservation-name"
                    type="text"
                    autoComplete="name"
                    disabled={loading}
                    placeholder="Ej. Juan Pérez"
                    value={name}
                    onChange={(e) =>
                      setName(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter"
                      ) {
                        handleSubmit();
                      }
                    }}
                    className="
                      w-full
                      rounded-lg
                      border
                      border-white/[0.08]
                      bg-slate-950/70
                      px-3
                      py-2.5
                      text-sm
                      text-white
                      placeholder:text-slate-700
                      outline-none
                      transition-colors
                      hover:border-white/[0.14]
                      focus:border-violet-500/60
                      focus:ring-2
                      focus:ring-violet-500/10
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  />
                </div>

                {/* TELÉFONO */}

                <div>
                  <label
                    htmlFor="reservation-phone"
                    className="
                      mb-1.5
                      block
                      text-xs
                      font-medium
                      text-slate-300
                    "
                  >
                    Número de teléfono
                  </label>

                  <input
                    id="reservation-phone"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    disabled={loading}
                    placeholder="Ej. 300 123 4567"
                    value={phone}
                    onChange={(e) =>
                      setPhone(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter"
                      ) {
                        handleSubmit();
                      }
                    }}
                    className="
                      w-full
                      rounded-lg
                      border
                      border-white/[0.08]
                      bg-slate-950/70
                      px-3
                      py-2.5
                      text-sm
                      text-white
                      placeholder:text-slate-700
                      outline-none
                      transition-colors
                      hover:border-white/[0.14]
                      focus:border-violet-500/60
                      focus:ring-2
                      focus:ring-violet-500/10
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  />

                  <p
                    className="
                      mt-1.5
                      text-[10px]
                      leading-4
                      text-slate-600
                    "
                  >
                    Usaremos este número para
                    confirmar tu reserva.
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* ==================================================== */}
        {/* FOOTER */}
        {/* ==================================================== */}

        <div
          className="
            relative
            shrink-0
            space-y-2.5
            border-t
            border-white/[0.06]
            bg-black/20
            p-4
            sm:p-5
          "
        >
          {reserved ? (
            <>
              {!reservationExpired && (
                <button
                  type="button"
                  onClick={
                    handleWhatsApp
                  }
                  className="
                    flex
                    h-12
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    bg-emerald-600
                    text-sm
                    font-bold
                    text-white
                    shadow-md
                    shadow-emerald-950/30
                    transition-all
                    hover:bg-emerald-500
                    hover:shadow-lg
                    active:scale-[0.99]
                    active:bg-emerald-700
                  "
                >
                  <span>
                    📲 Enviar comprobante
                    por WhatsApp
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={handleClose}
                className="
                  flex
                  h-10
                  w-full
                  items-center
                  justify-center
                  rounded-lg
                  border
                  border-white/[0.08]
                  bg-white/[0.03]
                  text-sm
                  font-semibold
                  text-slate-400
                  transition-colors
                  hover:border-white/[0.14]
                  hover:bg-white/[0.07]
                  hover:text-white
                "
              >
                Cerrar
              </button>

              {!reservationExpired && (
                <p
                  className="
                    text-center
                    text-[10px]
                    leading-4
                    text-slate-500
                  "
                >
                  Recuerda enviar el comprobante
                  después de realizar el pago.
                  Tu número quedará pendiente
                  de validación hasta verificar
                  el pago.
                </p>
              )}
            </>
          ) : (
            <>
              <div
                className="
                  grid
                  grid-cols-1
                  gap-2
                  sm:grid-cols-[100px_1fr]
                "
              >
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleClose}
                  className="
                    order-2
                    flex
                    h-11
                    w-full
                    items-center
                    justify-center
                    rounded-lg
                    border
                    border-white/[0.08]
                    bg-white/[0.03]
                    text-sm
                    font-semibold
                    text-slate-400
                    transition-colors
                    hover:border-white/[0.14]
                    hover:bg-white/[0.07]
                    hover:text-white
                    disabled:cursor-not-allowed
                    disabled:opacity-40
                    sm:order-1
                  "
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="
                    order-1
                    flex
                    h-11
                    w-full
                    items-center
                    justify-center
                    gap-2
                    rounded-lg
                    bg-emerald-600
                    text-sm
                    font-semibold
                    text-white
                    shadow-md
                    shadow-emerald-950/30
                    transition-colors
                    hover:bg-emerald-500
                    active:bg-emerald-700
                    disabled:cursor-not-allowed
                    disabled:opacity-60
                    sm:order-2
                  "
                >
                  {loading ? (
                    <>
                      <span
                        className="
                          h-4
                          w-4
                          shrink-0
                          animate-spin
                          rounded-full
                          border-2
                          border-white/30
                          border-t-white
                        "
                      />

                      <span>
                        Reservando...
                      </span>
                    </>
                  ) : (
                    <>
                      <span>
                        ✓
                      </span>

                      <span>
                        Reservar número
                      </span>
                    </>
                  )}
                </button>
              </div>

              <p
                className="
                  text-center
                  text-[10px]
                  leading-4
                  text-slate-500
                "
              >
                Al reservar tendrás 30 minutos
                para realizar el pago y enviar
                el comprobante.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}