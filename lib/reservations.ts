import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RaffleNumber } from "@/lib/types";

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

export async function releaseExpiredReservation(
  raffleId: string,
  number: RaffleNumber
): Promise<boolean> {
  if (!isReservationExpired(number)) {
    return false;
  }

  try {
    const numberRef = doc(
      db,
      "raffles",
      raffleId,
      "numbers",
      number.id
    );

    const snapshot = await getDoc(numberRef);

    if (!snapshot.exists()) {
      return false;
    }

    const data = snapshot.data();

    if (
      data.status !== "reserved" ||
      !isReservationExpired(
        data as RaffleNumber
      )
    ) {
      return false;
    }

    await updateDoc(numberRef, {
      status: "available",
      buyerName: null,
      buyerPhone: null,
      buyerVisitorId: null,
      reservedAt: null,
      reservationExpiresAt: null,
    });

    return true;
  } catch (error) {
    console.error(
      "Error liberando reserva expirada:",
      error
    );

    return false;
  }
}

const VISITOR_ID_KEY =
  "raffle_visitor_id";

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

