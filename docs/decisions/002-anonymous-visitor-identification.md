# ADR-002: Identificación de visitantes anónimos con localStorage

## Status
Accepted

## Date
2026-09-03

## Context
Los visitantes de la página pública pueden reservar números sin crear una cuenta. Se necesita identificar al visitante para:
1. Permitirle ver y interactuar con sus propias reservas
2. Evitar que un visitante libere la reserva activa de otra persona
3. Vincular la reserva al navegador para el flujo de pago

No se requiere autenticación para los visitantes (sería una fricción innecesaria para una rifa).

## Decision
Usar `localStorage` con una clave `raffle_visitor_id` para generar y persistir un identificador único por navegador. La función `getVisitorId()` en `lib/reservations.ts`:

1. Verifica que esté en el navegador (`typeof window !== "undefined"`)
2. Busca el ID existente en `localStorage`
3. Si no existe, genera uno nuevo con `crypto.randomUUID()` (con fallback a `Date.now() + Math.random()`)
4. Lo guarda en `localStorage` para futuras visitas

El `buyerVisitorId` se almacena en el documento del número en Firestore, permitiendo verificar propiedad de la reserva en el servidor.

## Alternatives Considered

### Firebase Authentication anónima
- Pros: ID persistente, integración nativa con Firebase
- Cons: Requiere inicializar Auth, agrega latencia, genera documentos innecesarios en Firebase
- Rechazado: Complejidad innecesaria para el caso de uso

### Cookies
- Pros: Persistentes entre sesiones, envían automáticamente al servidor
- Cons: Requieren manejo de CORS, no accesibles fácilmente desde el cliente para lógica UI
- Rechazado: localStorage es más simple para este caso

### Session Storage
- Pros: Similar a localStorage pero por pestaña
- Cons: Se pierde al cerrar la pestaña, lo que rompería la identificación de reservas
- Rechazado: Necesitamos persistencia entre sesiones

## Consequences
- El ID se pierde si el usuario borra los datos del navegador o usa modo incógnito
- No hay forma de recuperar un ID perdido (el usuario tendría que reservar de nuevo)
- El ID es pseudo-anónimo: no contiene información personal, solo un UUID
- Se usa `crypto.randomUUID()` cuando está disponible (browsers modernos), con fallback para compatibilidad
