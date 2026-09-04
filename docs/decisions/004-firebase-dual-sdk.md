# ADR-004: Firebase con SDK dual (cliente + admin)

## Status
Accepted

## Date
2026-09-03

## Context
La aplicación necesita:
1. **Lecturas en tiempo real** desde el cliente (página pública y admin muestran datos actualizados)
2. **Escrituras seguras** que validen lógica de negocio (reservas de visitantes)
3. **Escrituras directas** desde el admin panel (crear/editar rifas, marcar números como vendidos)

Firebase ofrece dos SDKs:
- **Cliente** (`firebase`): Se ejecuta en el navegador, respeta Firestore rules
- **Admin** (`firebase-admin`): Se ejecuta en el servidor, ignora Firestore rules

## Decision
Usar ambos SDKs simultáneamente:

### SDK Cliente (`lib/firebase.ts`):
- Inicializa la app Firebase con configuración pública (API key, project ID)
- Exporta `db` (Firestore), `auth` (Firebase Auth), `storage` (Firebase Storage)
- Usado por: componentes React para lecturas en tiempo real, auth, subida de imágenes a Cloudinary

### SDK Admin (`lib/firebase-admin.ts`):
- Inicializa con credenciales de servicio (variables de entorno: `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)
- Exporta `adminDb` (Firestore admin)
- Usado por: Server Actions en `lib/actions.ts` para reservas y liberaciones

## Data Model en Firestore

```
/admins/{uid}                      → Documento de autorización de admin
/raffles/{raffleId}                → Datos públicos de la rifa
/raffles/{raffleId}/numbers/{id}   → Números individuales con estado y datos del comprador
```

## Firestore Rules (firestore.rules):
- Lectura de raffles: pública (necesario para la página de compra)
- Escritura de raffles: solo admins autenticados
- Lectura de numbers: pública (para dibujar la grilla)
- Escritura de numbers: solo admins autenticados (las reservas de visitantes van por firebase-admin)
- `/admins/{uid}`: solo el propio admin puede leer su documento

## Alternatives Considered

### Solo SDK Cliente
- Pros: Más simple, un solo SDK
- Cons: No se puede ejecutar lógica de negocio transaccional; las reglas de Firestore son insuficientes para validaciones complejas
- Rechazado: Riesgo de integridad de datos

### Solo SDK Admin
- Pros: Control total del servidor
- Cons: No hay lecturas en tiempo real desde el cliente; requeriría API routes para cada lectura
- Rechazado: Pierde la funcionalidad en tiempo real de Firestore

### Firebase con Cloud Functions
- Pros: Lógica de negocio encapsulada, escalable
- Cons: Más complejo de configurar y mantener, latencia adicional
- Rechazado: Las Server Actions de Next.js cubren el caso de uso

## Consequences
- Las credenciales de servicio del admin deben estar en variables de entorno (nunca en el código fuente)
- `firebase-admin-key.json` está en `.gitignore` para evitar comprometer credenciales
- Hay dos inicializaciones de Firebase app: una en `lib/firebase.ts` (cliente) y otra en `lib/firebase-admin.ts` (servidor)
- El guard `getApps().length` previene la doble inicialización en hot reloads durante desarrollo
