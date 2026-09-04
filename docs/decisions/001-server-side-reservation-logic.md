# ADR-001: Lógica de reservas en el servidor con firebase-admin

## Status
Accepted

## Date
2026-09-03

## Context
La aplicación de rifas permite a visitantes anónimos reservar números por 30 minutos antes de realizar el pago. Se necesitaba una forma segura de manejar las transiciones de estado de los números (disponible → reservado → vendido) sin exponer la lógica de negocio al cliente.

Firebase Firestore tiene reglas de seguridad que controlan lecturas y escrituras desde el cliente. Sin embargo, las reglas de Firestore son limitadas para expresar lógica transaccional compleja (verificar que un número esté disponible ANTES de reservarlo, dentro de una transacción atómica).

## Decision
Implementar todas las operaciones de reserva y liberación de números como **Next.js Server Actions** que usan **firebase-admin** (el SDK de servidor de Firebase), que ignora las reglas de Firestore.

Las Server Actions se definen en `lib/actions.ts` con la directiva `"use server"` y se ejecutan exclusivamente en el servidor de Next.js. Utilizan `adminDb.runTransaction()` para garantizar atomicidad.

### Flujo de reserva:
1. El cliente llama a `reserveNumber()` desde el modal de reserva
2. El servidor valida los datos de entrada (nombre ≥ 3 chars, teléfono ≥ 7 chars)
3. Se ejecuta una transacción Firestore:
   - Se lee el documento del número
   - Se verifica que el estado sea "available"
   - Se actualiza a "reserved" con datos del comprador y expiración
4. Se retorna la fecha de expiración al cliente

### Flujo de liberación:
- `releaseReservation()`: Libera un número individual si ya expiró
- `releaseExpiredReservations()`: Libera múltiples números expirados en batch

## Alternatives Considered

### Firestore Rules con validación en cliente
- Pros: Sin necesidad de Server Actions
- Cons: Las reglas de Firestore no pueden ejecutar lógica transaccional compleja; un cliente malicioso podría manipular el estado directamente
- Rechazado: No garantiza integridad de datos

### Firebase Cloud Functions
- Pros: Lógica de negocio en el servidor, escalable
- Cons: Agrega latencia adicional, requiere configuración de functions, facturación separada
- Rechazado: Las Server Actions de Next.js son más simples para este caso de uso

### API Routes de Next.js
- Pros: Control total del servidor
- Cons: Más verboso que Server Actions, requiere manejo manual de serialización
- Rechazado: Server Actions ofrecen la misma funcionalidad con menos boilerplate

## Consequences
- Todas las escrituras de visitantes pasan por el servidor, lo que permite validar lógica de negocio de forma atómica
- Las reglas de Firestore bloquean escrituras de clientes no autenticados (seguridad por defecto)
- El admin panel sigue escribiendo desde el cliente con el SDK normal (requiere auth de Firebase + documento en `/admins/{uid}`)
- Se duplica la función `getExpirationMs` en `lib/actions.ts` (servidor) y `lib/reservations.ts` (cliente) porque no se puede importar entre contextos de ejecución
