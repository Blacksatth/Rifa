# ADR-003: Timer de reserva de 30 minutos

## Status
Accepted

## Date
2026-09-03

## Context
Cuando un visitante reserva un número, se necesita un mecanismo para:
1. Dar tiempo al visitante para realizar el pago
2. Liberar automáticamente números si el pago no se concreta
3. Evitar que números se queden reservados indefinidamente sin pago

## Decision
Implementar un timer de 30 minutos (`RESERVATION_TIME_MS = 30 * 60 * 1000`) que opera tanto en cliente como en servidor:

### Servidor (lib/actions.ts):
- Al reservar: se guarda `reservationExpiresAt = Date.now() + RESERVATION_TIME_MS` como `Date` en Firestore
- Al liberar: se verifica que `reservationExpiresAt <= Date.now()` antes de liberar

### Cliente (components/ReservationModal.tsx):
- Se ejecuta un `setInterval` cada segundo que actualiza `timeLeft`
- Cuando `timeLeft <= 0`, se llama a `releaseReservation()` server action
- Se muestra un countdown visual en el modal

### Página pública (app/page.tsx):
- Al cargar, se recogen los IDs de números reservados expirados
- Se llama a `releaseExpiredReservations()` para limpiarlos en batch

## Alternatives Considered

### Timer exclusivamente del lado del servidor (cron job)
- Pros: Más confiable, no depende del cliente
- Cons: Requiere configurar un cron job (Vercel Cron, Google Cloud Scheduler), más complejo de mantener
- Rechazado: El enfoque híbrido (servidor valida + cliente muestra) es suficiente para el caso de uso

### Timer en Firestore con TTL
- Pros: Firestore soporta eliminación automática por TTL
- Cons: Firestore TTL solo elimina documentos, no puede cambiar su estado; no sirve para transiciones de estado
- Rechazado: No resuelve el problema de transición

### Sin timer (liberación manual por admin)
- Pros: Simple
- Cons: Los números quedarían reservados indefinidamente, mala UX
- Rechazado: No es viable para un sistema de rifas

## Consequences
- La fecha de expiración se guarda como `Date` en Firestore, pero el tipo TypeScript es `unknown` porque Firestore puede devolver `Timestamp`, `Date`, o `{toMillis()}` dependiendo del SDK
- Se necesita la función `getExpirationMs()` para normalizar estos formatos (duplicada en servidor y cliente)
- Si el visitante cierra el navegador, la reserva expirará y se limpiará en la próxima carga de la página
- Si el servidor falla al liberar, el cliente reintentará en el próximo intervalo
