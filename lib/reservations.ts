
import { RaffleNumber } from "@/lib/types";

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

