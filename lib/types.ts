/**
 * Modelo de datos de una rifa.
 *
 * Representa un documento en la colección `/raffles/{raffleId}` de Firestore.
 * Los campos marcados con `?` son opcionales en Firestore (pueden no existir
 * en documentos creados por versions anteriores).
 *
 * @see docs/decisions/004-firebase-dual-sdk.md para el modelo de datos completo
 */
export interface Raffle {
  /** ID del documento Firestore (se asigna al crear) */
  id: string;

  /** Nombre público de la rifa (ej: "Rifa del carro") */
  name: string;

  /** Nombre del premio (ej: "Carro 0km") */
  prizeName: string;

  /** URL de la imagen del premio en Cloudinary */
  prizeImageUrl: string;

  /** Cantidad total de números disponibles en la rifa */
  totalNumbers: number;

  /** Precio por número en COP (pesos colombianos) */
  price: number;

  /** Cantidad de dígitos para formatear los números (ej: 3 → "001") */
  digits: number;

  /** Si la rifa está activa y visible en la página pública */
  active: boolean;

  /** UID del usuario de Firebase que creó la rifa (opcional) */
  userId?: string;

  /** Fecha del sorteo en formato ISO string (ej: "2026-09-15") */
  drawDate: string;

  /** Hora del sorteo (ej: "8:00 PM") */
  drawTime: string;

  /** Método del sorteo (ej: "Lotería de Cundinamarca") */
  drawMethod: string;

  /** Descripción de la rifa (opcional) */
  description: string;

  /** Número de WhatsApp del administrador para contacto */
  whatsapp: string;
}

/**
 * Modelo de datos de un número individual dentro de una rifa.
 *
 * Representa un documento en la subcolección
 * `/raffles/{raffleId}/numbers/{numberId}` de Firestore.
 *
 * Estados posibles:
 * - `"available"`: Disponible para reserva por cualquier visitante
 * - `"reserved"`: Reservado por un visitante (timer de 30 min activo)
 * - `"sold"`: Vendido y confirmado por el administrador
 *
 * @see docs/decisions/003-reservation-timer.md para el flujo de reservas
 * @see docs/decisions/002-anonymous-visitor-identification.md para buyerVisitorId
 */
export interface RaffleNumber {
  /** ID del documento Firestore */
  id: string;

  /** Número formateado como string (ej: "001", "042") */
  number: string;

  /** Estado actual del número */
  status: "available" | "reserved" | "sold";

  /** Nombre del comprador (null si no está reservado/vendido) */
  buyerName: string | null;

  /** Teléfono del comprador (null si no está reservado/vendido) */
  buyerPhone: string | null;

  /**
   * ID anónimo del visitante que reservó el número.
   * Se genera con `crypto.randomUUID()` y se persiste en localStorage.
   * Permite identificar qué reservas pertenecen al visitante actual.
   */
  buyerVisitorId?: string | null;

  /**
   * Timestamp de cuándo se reservó el número.
   * Tipo `unknown` porque Firestore puede devolver `Date`, `Timestamp`, o `{toMillis()}`
   * dependiendo del SDK utilizado (cliente vs admin).
   */
  reservedAt?: unknown;

  /**
   * Timestamp de cuándo expira la reserva (30 min después de reservedAt).
   * Tipo `unknown` por la misma razón que `reservedAt`.
   * Se usa `getExpirationTimeMs()` para normalizar a milisegundos.
   */
  reservationExpiresAt?: unknown;

  /**
   * Timestamp de cuándo el administrador marcó el número como vendido
   * (después de confirmar el pago). Se escribe desde el panel admin
   * (`NumbersTable.markSold`) y se limpia al liberar (`confirmRelease`).
   * Tipo `unknown` por la misma razón que `reservedAt`.
   */
  soldAt?: unknown;
}