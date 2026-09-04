"use server";

/**
 * Server Actions para operaciones de reserva de números.
 *
 * Estas funciones se ejecutan EXCLUSIVAMENTE en el servidor de Next.js
 * y usan firebase-admin, que ignora las reglas de Firestore. Aquí es
 * donde se valida la lógica de negocio y se garantiza la integridad
 * de datos mediante transacciones atómicas.
 *
 * @see docs/decisions/001-server-side-reservation-logic.md
 * @see firestore.rules para las reglas de seguridad del cliente
 */

import { getAdminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

/** Duración de la reserva en minutos (30 min) */
const RESERVATION_TIME_MINUTES = 30;

/** Duración de la reserva en milisegundos */
const RESERVATION_TIME_MS =
  RESERVATION_TIME_MINUTES * 60 * 1000;

type ReservationData = {
  status: string;
  buyerVisitorId?: unknown;
  reservationExpiresAt?: unknown;
};

/**
 * Normaliza el valor de expiración de una reserva a milisegundos.
 *
 * Firestore puede devolver fechas como: `Date`, `number` (timestamp),
 * `string` (ISO), o objetos con `toMillis()` / `toDate()` (Timestamp).
 * Esta función maneja todos los formatos posibles.
 *
 * Nota: Esta función está duplicada en lib/reservations.ts (cliente)
 * porque las Server Actions no pueden importar módulos del cliente.
 *
 * @param value - El valor del campo `reservationExpiresAt` de Firestore
 * @returns Milisegundos desde epoch, o null si no se puede parsear
 */
function getExpirationMs(
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

    if (typeof obj.toMillis === "function") {
      const ms = (obj as { toMillis: () => unknown }).toMillis();
      return typeof ms === "number" ? ms : null;
    }

    if (typeof obj.toDate === "function") {
      const d = (obj as { toDate: () => unknown }).toDate();
      return d instanceof Date && !Number.isNaN(d.getTime())
        ? d.getTime()
        : null;
    }
  }

  return null;
}

/**
 * Verifica si un número está reservado y su reserva ya expiró.
 * Se usa para decidir si se puede liberar un número.
 */
function isReservedAndExpired(
  data: ReservationData
): boolean {
  if (data.status !== "reserved") {
    return false;
  }

  const expiration = getExpirationMs(
    data.reservationExpiresAt
  );

  if (expiration === null) {
    return false;
  }

  return expiration <= Date.now();
}

/**
 * Retorna un objeto con todos los campos de reserva reseteados a null.
 * Se usa al liberar un número reservado.
 */
function clearReservation() {
  return {
    status: "available",
    buyerName: null,
    buyerPhone: null,
    buyerVisitorId: null,
    reservedAt: null,
    reservationExpiresAt: null,
  };
}

/**
 * Reserva un número (transición available -> reserved).
 *
 * Se ejecuta SIEMPRE en el servidor (firebase-admin), que ignora las reglas
 * de Firestore. Aquí es donde se valida la lógica de negocio y se impide que
 * un cliente marque números como vendidos o robe reservas ajenas.
 */
export async function reserveNumber(input: {
  raffleId: string;
  numberId: string;
  visitorId: string;
  name: string;
  phone: string;
}): Promise<{ reservationExpiresAt: number }> {
  if (
    !input.raffleId ||
    !input.numberId ||
    !input.visitorId
  ) {
    throw new Error("Datos de la reserva inválidos.");
  }

  const name = input.name.trim();
  const phone = input.phone.trim();

  if (name.length < 3) {
    throw new Error("El nombre debe tener al menos 3 caracteres");
  }

  if (phone.length < 7) {
    throw new Error("Ingresa un teléfono válido");
  }

  const adminDb = getAdminDb();
  const numberRef = adminDb.doc(
    `raffles/${input.raffleId}/numbers/${input.numberId}`
  );

  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(numberRef);

    if (!snap.exists) {
      throw new Error("El número ya no existe.");
    }

    const data = snap.data() as ReservationData;

    if (data.status === "reserved") {
      throw new Error("Este número ya está reservado.");
    }

    if (data.status === "sold") {
      throw new Error("Este número ya fue vendido.");
    }

    const reservationExpiresAt =
      Date.now() + RESERVATION_TIME_MS;

    tx.update(numberRef, {
      status: "reserved",
      buyerName: name,
      buyerPhone: phone,
      buyerVisitorId: input.visitorId,
      reservedAt: FieldValue.serverTimestamp(),
      reservationExpiresAt: new Date(
        reservationExpiresAt
      ),
    });

    return { reservationExpiresAt };
  });
}

/**
 * Libera un número reservado.
 *
 * Un visitante solo puede liberar su PROPIA reserva cuando YA expiró
 * (validado en el servidor). Así no se puede liberar la reserva activa
 * de otra persona.
 */
export async function releaseReservation(input: {
  raffleId: string;
  numberId: string;
  visitorId: string;
}): Promise<{ ok: boolean }> {
  if (!input.raffleId || !input.numberId) {
    throw new Error("Datos de la liberación inválidos.");
  }

  const adminDb = getAdminDb();
  const numberRef = adminDb.doc(
    `raffles/${input.raffleId}/numbers/${input.numberId}`
  );

  let released = false;

  await adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(numberRef);

    if (!snap.exists) {
      return;
    }

    const data = snap.data() as ReservationData;

    if (data.status !== "reserved") {
      return;
    }

    // Solo liberar si la reserva ya expiró (transición segura).
    if (!isReservedAndExpired(data)) {
      return;
    }

    tx.update(numberRef, clearReservation());
    released = true;
  });

  return { ok: released };
}

/**
 * Libera varios números reservados que YA estén expirados.
 * Lo usa la página pública al cargar (validación de reservas vencidas).
 */
export async function releaseExpiredReservations(input: {
  raffleId: string;
  numberIds: string[];
}): Promise<{ released: number }> {
  if (
    !input.raffleId ||
    !Array.isArray(input.numberIds) ||
    input.numberIds.length === 0
  ) {
    return { released: 0 };
  }

  const uniqueIds = [...new Set(input.numberIds)];

  let released = 0;

  const adminDb = getAdminDb();

  await adminDb.runTransaction(async (tx) => {
    const entries: {
      ref: FirebaseFirestore.DocumentReference;
      data: ReservationData;
    }[] = [];

    for (const numberId of uniqueIds) {
      const ref = adminDb.doc(
        `raffles/${input.raffleId}/numbers/${numberId}`
      );
      const snap = await tx.get(ref);

      if (snap.exists) {
        entries.push({
          ref,
          data: snap.data() as ReservationData,
        });
      }
    }

    for (const { ref, data } of entries) {
      if (isReservedAndExpired(data)) {
        tx.update(ref, clearReservation());
        released += 1;
      }
    }
  });

  return { released };
}
