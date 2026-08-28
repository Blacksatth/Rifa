// lib/reservations.ts

"use client";

import { RaffleNumber } from "@/lib/types";

const VISITOR_COOKIE_NAME = "raffle_visitor_id";

// 1 año
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

// ============================================================
// GENERAR ID ÚNICO
// ============================================================

function generateVisitorId(): string {
  try {
    if (
      typeof crypto !== "undefined" &&
      typeof crypto.randomUUID === "function"
    ) {
      return crypto.randomUUID();
    }
  } catch {
    // Continuar con fallback
  }

  return (
    "visitor-" +
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).substring(2, 15) +
    "-" +
    Math.random().toString(36).substring(2, 15)
  );
}

// ============================================================
// LEER COOKIE
// ============================================================

function getCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  const cookies = document.cookie.split("; ");

  for (const cookie of cookies) {
    const [key, ...valueParts] = cookie.split("=");

    if (key === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}

// ============================================================
// GUARDAR COOKIE
// ============================================================

function setCookie(
  name: string,
  value: string,
  maxAge: number
) {
  if (typeof document === "undefined") {
    return;
  }

  const secure =
    window.location.protocol === "https:"
      ? "; Secure"
      : "";

  document.cookie =
    `${name}=${encodeURIComponent(value)}` +
    `; Max-Age=${maxAge}` +
    `; Path=/` +
    `; SameSite=Lax` +
    secure;
}

// ============================================================
// OBTENER VISITOR ID
//
// Si ya existe:
//     devuelve el mismo.
//
// Si no existe:
//     crea uno nuevo y lo guarda en cookie.
// ============================================================

export function getVisitorId(): string | null {
  if (typeof document === "undefined") {
    return null;
  }

  let visitorId = getCookie(
    VISITOR_COOKIE_NAME
  );

  if (visitorId) {
    return visitorId;
  }

  visitorId = generateVisitorId();

  setCookie(
    VISITOR_COOKIE_NAME,
    visitorId,
    COOKIE_MAX_AGE
  );

  return visitorId;
}

// ============================================================
// COMPROBAR SI UNA RESERVA ES DEL VISITANTE ACTUAL
// ============================================================

export function isMine(
  data: RaffleNumber
): boolean {
  if (
    !data ||
    data.status !== "reserved"
  ) {
    return false;
  }

  const visitorId = getVisitorId();

  if (!visitorId) {
    return false;
  }

  return (
    data.buyerVisitorId === visitorId
  );
}

// ============================================================
// COMPROBAR USANDO UN VISITOR ID ESPECÍFICO
// ============================================================

export function isReservationMine(
  data: RaffleNumber,
  visitorId: string | null
): boolean {
  if (
    !data ||
    data.status !== "reserved" ||
    !visitorId ||
    !data.buyerVisitorId
  ) {
    return false;
  }

  return (
    data.buyerVisitorId === visitorId
  );
}