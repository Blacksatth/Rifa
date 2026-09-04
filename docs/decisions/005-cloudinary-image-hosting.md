# ADR-005: Cloudinary para hosting de imágenes de premios

## Status
Accepted

## Date
2026-09-03

## Context
Las rifas tienen una imagen del premio que se muestra en la página pública y en el admin panel. Se necesita:
1. Almacenar imágenes de premios de forma persistente
2. Servir imágenes optimizadas (diferentes tamaños, formatos modernos)
3. No saturar el servidor de Next.js con archivos estáticos

## Decision
Usar **Cloudinary** como servicio de hosting de imágenes. Las imágenes se suben directamente desde el cliente mediante la API de Cloudinary, manteniendo al servidor de Next.js stateless.

### Flujo de subida (en `RaffleForm.tsx`):
1. El admin selecciona una imagen desde su navegador
2. Se crea un `FormData` con la imagen y los parámetros de Cloudinary
3. Se hace un `fetch` directo a la API de upload de Cloudinary
4. Se retorna la URL de la imagen subida
5. La URL se guarda en el documento de la rifa en Firestore

## Alternatives Considered

### Firebase Storage
- Pros: Integración nativa con Firebase, reglas de seguridad
- Cons: Requiere configurar reglas de Storage, más complejo de usar que Cloudinary para optimización de imágenes
- Rechazado: Cloudinary ofrece mejor optimización automática

### Imágenes embebidas en Firestore (base64)
- Pros: Todo en un solo lugar
- Cons: Firestore tiene límite de 1MB por documento; base64 increase el tamaño ~33%
- Rechazado: No escalable

### Upload al servidor de Next.js
- Pros: Control total
- Cons: El servidor de Vercel es serverless; los archivos subidos se pierden entre cold starts
- Rechazado: No persistente en Vercel

### Supabase Storage
- Pros: Alternativa open-source
- Cons: Agrega otro proveedor; Cloudinary ya está integrado
- Rechazado: Cloudinary es más maduro para imágenes

## Consequences
- Las credenciales de Cloudinary están en el cliente (upload preset), lo cual es seguro para uploads públicos
- Las imágenes se sirven desde CDN de Cloudinary, mejorando la velocidad de carga
- No hay límite de almacenamiento en el servidor de Next.js
- Si Cloudinary cae, las imágenes no se cargan pero la app funciona (usa placeholder)
