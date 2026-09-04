/**
 * Utilidades de reserva para el cliente.
 *
 * Funciones helper que se ejecutan en el navegador para:
 * - Parsear fechas de expiración de Firestore
 * - Verificar si una reserva ha expirado
 * - Identificar al visitante actual (localStorage)
 * - Determinar si una reserva pertenece al visitante actual
 *
 * @see docs/decisions/002-anonymous-visitor-identification.md
 * @see docs/decisions/003-reservation-timer.md
 */

import { RaffleNumber } from "@/lib/types";

/**
 * Normaliza el valor de expiración de una reserva a milisegundos.
 *
 * Firestore puede devolver fechas en múltiples formatos dependiendo
 * del SDK utilizado (cliente vs admin) y la versión del SDK.
 * Esta función los maneja todos de forma unificada.
 *
 * @param value - Valor del campo `reservationExpiresAt` de Firestore
 * @returns Milisegundos desde epoch, o null si no se puede parsear
 */
export function getExpirationTimeMs(
  value: unknown
): number | null {
  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = new Date(value).getTime();

    return Number.isNaN(parsed)
      ? null
      : parsed;
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

      return typeof ms === "number"
        ? ms
        : null;
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
}

/**
 * Verifica si la reserva de un número ya expiró.
 *
 * @param data - Datos del número de la rifa
 * @param now - Timestamp actual en ms (default: Date.now())
 * @returns true si el número está reservado y su tiempo de expiración ya pasó
 */
export function isReservationExpired(
  data: RaffleNumber,
  now: number = Date.now()
): boolean {
  if (data.status !== "reserved") {
    return false;
  }

  const expiration =
    getExpirationTimeMs(
      data.reservationExpiresAt
    );

  if (expiration === null) {
    return false;
  }

  return expiration <= now;
}

/**
 * Clave de localStorage donde se almacena el ID del visitante.
 * @see docs/decisions/002-anonymous-visitor-identification.md
 */
const VISITOR_ID_KEY =
  "raffle_visitor_id";

/**
 * Obiene o genera el ID único del visitante actual.
 *
 * El ID se almacena en localStorage para persistir entre sesiones.
 * Se genera con `crypto.randomUUID()` cuando está disponible,
 * con un fallback a `Date.now() + Math.random()` para compatibilidad.
 *
 * @returns El ID del visitante, o string vacío si no está en el navegador
 */
export function getVisitorId(): string {
  if (
    typeof window === "undefined"
  ) {
    return "";
  }

  try {
    let visitorId =
      localStorage.getItem(
        VISITOR_ID_KEY
      );

    if (visitorId) {
      return visitorId;
    }

    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID ===
        "function"
    ) {
      visitorId =
        crypto.randomUUID();
    } else {
      visitorId =
        `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}-${Math.random()
          .toString(36)
          .substring(2, 15)}`;
    }

    localStorage.setItem(
      VISITOR_ID_KEY,
      visitorId
    );

    return visitorId;
  } catch (error) {
    console.error(
      "Error obteniendo visitorId:",
      error
    );

    return "";
  }
}

/**
 * Verifica si una reserva pertenece al visitante actual.
 *
 * Compara el `buyerVisitorId` del número con el `visitorId` proporcionado.
 * Se usa en NumberCell para decidir si mostrar el número con estilo
 * "Tu reserva" y permitir abrir el modal.
 *
 * @param data - Datos del número de la rifa
 * @param visitorId - ID del visitante actual (de localStorage)
 * @returns true si la reserva pertenece al visitante
 */
export function isReservationMine(
  data: RaffleNumber,
  visitorId: string | null
): boolean {
  if (!visitorId) {
    return false;
  }

  if (
    data.status !== "reserved"
  ) {
    return false;
  }

  return (
    data.buyerVisitorId ===
    visitorId
  );
}

