export interface Raffle {
  id: string;
  name: string;
  prizeName: string;
  prizeImageUrl: string;
  totalNumbers: number;
  price: number;
  digits: number;
  active: boolean;

  userId?: string;

  drawDate: string;
  drawTime: string;
  drawMethod: string;
  description: string;
  whatsapp: string;
}

export interface RaffleNumber {
  id: string;
  number: string;

  status:
    | "available"
    | "reserved"
    | "sold";

  buyerName: string | null;
  buyerPhone: string | null;

  // Identificador del visitante
  buyerVisitorId?: string | null;

  reservedAt?: unknown;
  reservationExpiresAt?: unknown;
}