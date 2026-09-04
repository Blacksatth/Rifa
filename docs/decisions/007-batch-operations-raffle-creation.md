# ADR-007: Operaciones batch para creación de rifas

## Status
Accepted

## Date
2026-09-03

## Context
Cuando un admin crea una rifa, se deben generar documentos individuales para cada número en la subcolección `/raffles/{id}/numbers/`. Una rifa puede tener desde 100 hasta 10,000+ números.

Firestore tiene un límite de **500 operaciones por batch**. Crear 1,000 números de una sola vez excedería este límite.

## Decision
Usar **Firestore Write Batches** con un máximo de 500 operaciones por batch, procesados secuencialmente.

### Implementación (en `RaffleForm.tsx`):
1. Se calcula el total de números a crear (`raffleData.totalNumbers`)
2. Se crean batches de hasta 500 writes
3. Cada batch se ejecuta secuencialmente (no en paralelo, para no sobrecargar)
4. Se reporta progreso en tiempo real al admin (números creados / total)
5. Se usa `setCreatingProgress()` para actualizar una barra de progreso en la UI

### Flujo de edición:
Si el admin cambia el conteo de números o la cantidad de dígitos:
1. Se identifican los números que ya existen (se mantienen)
2. Se crean los números nuevos que faltan
3. Se eliminan los números que sobran

### Flujo de eliminación:
1. Se leen todos los IDs de números de la rifa
2. Se eliminan en batches de 500

## Alternatives Considered

### Firestore Bulk Writer
- Pros: API nativa para operaciones batch, maneja rate limiting automáticamente
- Cons: Requiere firebase-admin SDK (no disponible en el cliente donde se ejecuta la creación)
- Rechazado: La creación se hace desde el cliente con el SDK normal

### Crear números bajo demanda (lazy creation)
- Pros: No se crean documentos hasta que alguien reserve
- Cons: Complica la lógica de la grilla, no se puede contar el total real
- Rechazado: La grilla necesita mostrar todos los números disponibles

### Cloud Functions para creación
- Pros: Puede usar firebase-admin con Bulk Writer
- Cons: Agrega complejidad, requiere desplegar functions separadas
- Rechazado: Los batches desde el cliente son suficientes

## Consequences
- Para 1,000 números: 2 batches secuenciales
- Para 10,000 números: 20 batches secuenciales (puede tardar varios segundos)
- Se muestra una barra de progreso durante la creación para que el admin sepa que está en curso
- Si un batch falla, se muestra un error pero los números creados anteriormente se mantienen (no hay rollback automático)
- El admin puede cancelar la operación, pero los números ya escritos no se eliminan
