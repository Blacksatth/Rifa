# ADR-006: Autenticación y autorización de administradores

## Status
Accepted

## Date
2026-09-03

## Context
Se necesita proteger el panel de administración para que solo los administradores autorizados puedan:
- Crear/editar/eliminar rifas
- Marcar números como vendidos
- Liberar reservas
- Ver datos personales de compradores (nombre, teléfono)

## Decision
Usar un sistema de doble verificación:

### 1. Firebase Authentication (autenticación)
- Login con email/password o Google Sign-In
- La sesión se gestiona con el SDK cliente de Firebase Auth
- `onAuthStateChanged` monitorea el estado de autenticación en tiempo real

### 2. Firestore `/admins/{uid}` (autorización)
- Solo los UIDs que tengan un documento en la colección `admins` son considerados administradores
- El documento se crea manualmente (por consola de Firebase o por el servidor)
- La verificación se hace en `app/admin/layout.tsx`:
  1. Se verifica que `user` exista (autenticado)
  2. Se busca el documento `admins/{user.uid}` en Firestore
  3. Si no existe, se redirige a `/admin/login`

### 3. Firestore Rules
- `isAdmin()`: función helper que verifica `request.auth != null && exists(/admins/$(request.auth.uid))`
- Escrituras en `/raffles` y `/raffles/{id}/numbers`: solo `isAdmin()`
- Lectura de `/admins/{uid}`: solo el propio admin (`request.auth.uid == uid`)

## Alternatives Considered

### Custom claims en Firebase Auth
- Pros: La información de rol está en el token, no requiere consulta adicional
- Cons: Requiere Firebase Admin SDK para setear claims, más complejo
- Rechazado: Para un sistema con pocos admins, un documento en Firestore es más simple

### Middleware de Next.js
- Pros: Protección a nivel de ruta, más eficiente
- Cons: No tiene acceso directo a Firestore rules, requiere lógica adicional
- Rechazado: El layout admin ya funciona como guard

### JWT propio
- Pros: Control total
- Cons: Requiere infraestructura de tokens, refresh tokens, etc.
- Rechazado: Firebase Auth ya resuelve esto

## Consequences
- Los admins deben tener cuenta de Firebase Auth Y documento en `/admins/{uid}`
- Si un admin es desactivado, basta con eliminar su documento en `/admins/{uid}`
- El layout admin hace una consulta a Firestore en cada carga para verificar autorización
- No hay roles jerárquicos: todos los admins tienen los mismos permisos
