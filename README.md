# RifaYA - Aplicación de Rifas

Sistema completo de gestión de rifas para el mercado colombano. Permite a los visitantes reservar números, pagar vía QR/bank transfer, y enviar el comprobante por WhatsApp. Incluye un panel de administración para gestionar rifas, números y estadísticas.

**Demo en vivo:** [rifa-mocha-mu.vercel.app](https://rifa-mocha-mu.vercel.app)

## Características

- **Selección de números** - Grilla interactiva con búsqueda y filtros por estado
- **Reserva temporal** - Timer de 30 minutos con countdown en tiempo real
- **Múltiples métodos de pago** - Bre-B (QR), Bancolombia, Nequi
- **Confirmación vía WhatsApp** - Envío automático del comprobante de pago
- **Panel de administración** - Dashboard con estadísticas, gestión de números y rifas
- **Tiempo real** - Actualizaciones instantáneas vía Firestore
- **Responsive** - Optimizado para desktop y móvil
- **Tema oscuro** - Interfaz moderna con efectos glassmorphism

## Stack Tecnológico

| Capa | Tecnología | Versión |
|------|-----------|---------|
| Framework | Next.js (App Router) | 16.3.2 |
| UI | React | 19.2.8 |
| Lenguaje | TypeScript | ^5 |
| Estilos | Tailwind CSS | ^4 |
| Base de datos | Firebase Firestore (client + admin) | ^12.18 / ^14.3 |
| Autenticación | Firebase Auth (email + Google) | — |
| Imágenes | Cloudinary | API externa |
| Notificaciones | react-hot-toast | ^2.6.0 |
| Despliegue | Vercel | — |

## Instalación

```bash
# Clonar el repositorio
git clone https://github.com/Blacksatth/Rifa.git
cd Rifa

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local con tus credenciales de Firebase

# Ejecutar en desarrollo
npm run dev
```

## Variables de Entorno

Las siguientes variables deben estar en `.env.local`:

```env
# Firebase Admin SDK (credenciales de servicio)
FIREBASE_PROJECT_ID=tu-project-id
FIREBASE_CLIENT_EMAIL=tu-client-email@tu-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

> **Nota:** Las credenciales de Firebase Admin se obtienen desde la consola de Firebase → Project Settings → Service Accounts → Generate New Private Key.

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm run start` | Iniciar servidor de producción |
| `npm run lint` | Ejecutar linter |

## Arquitectura

### Modelo de Datos (Firestore)

```
/admins/{uid}                      → Documento de autorización de admin
/raffles/{raffleId}                → Datos públicos de la rifa
/raffles/{raffleId}/numbers/{id}   → Números individuales con estado
```

### Estructura del Proyecto

```
rifa-app/
├── app/                          # Páginas Next.js (App Router)
│   ├── layout.tsx                # Layout raíz (fuentes, metadata)
│   ├── page.tsx                  # Página pública (rifa activa)
│   ├── globals.css               # Estilos globales (Tailwind)
│   └── admin/                    # Panel de administración
│       ├── layout.tsx            # Guard de auth + sidebar/header
│       ├── page.tsx              # Dashboard de estadísticas
│       ├── login/page.tsx        # Login (email + Google)
│       ├── numeros/page.tsx      # Gestión de números
│       └── rifa/page.tsx         # Crear/editar rifa
├── components/                   # Componentes reutilizables
│   ├── Header.tsx                # Header público
│   ├── Footer.tsx                # Footer público
│   ├── PrizeCard.tsx             # Tarjeta del premio
│   ├── NumberGrid.tsx            # Grilla de selección de números
│   ├── NumberCell.tsx            # Celda individual de número
│   ├── ReservationModal.tsx      # Modal de reserva + pago
│   └── admin/                    # Componentes del admin
│       ├── AdminSidebar.tsx      # Navegación lateral
│       ├── AdminHeader.tsx       # Header del admin
│       ├── StatsPanel.tsx        # Panel de estadísticas
│       ├── NumbersTable.tsx      # Tabla de gestión de números
│       ├── SearchBar.tsx         # Barra de búsqueda
│       └── rifa/                 # Sub-componentes de rifa
│           ├── RaffleForm.tsx    # Formulario principal
│           ├── RaffleFormFields.tsx  # Campos del formulario
│           └── RafflePreview.tsx     # Preview en tiempo real
├── lib/                          # Lógica compartida
│   ├── types.ts                  # Interfaces TypeScript (Raffle, RaffleNumber)
│   ├── firebase.ts               # SDK cliente de Firebase
│   ├── firebase-admin.ts         # SDK admin de Firebase
│   ├── actions.ts                # Server Actions (reservas, liberaciones)
│   └── reservations.ts           # Utilidades de reserva (cliente)
├── public/                       # Assets estáticos
│   └── images/qr-breb1.png       # Código QR de Bre-B
├── docs/decisions/               # Architecture Decision Records
│   ├── 001-server-side-reservation-logic.md
│   ├── 002-anonymous-visitor-identification.md
│   ├── 003-reservation-timer.md
│   ├── 004-firebase-dual-sdk.md
│   ├── 005-cloudinary-image-hosting.md
│   ├── 006-admin-authentication-authorization.md
│   └── 007-batch-operations-raffle-creation.md
└── firestore.rules               # Reglas de seguridad de Firestore
```

### Decisiones Arquitectónicas (ADRs)

| ADR | Decisión |
|-----|----------|
| [ADR-001](docs/decisions/001-server-side-reservation-logic.md) | Lógica de reservas en el servidor con firebase-admin |
| [ADR-002](docs/decisions/002-anonymous-visitor-identification.md) | Identificación de visitantes con localStorage |
| [ADR-003](docs/decisions/003-reservation-timer.md) | Timer de reserva de 30 minutos |
| [ADR-004](docs/decisions/004-firebase-dual-sdk.md) | Firebase con SDK dual (cliente + admin) |
| [ADR-005](docs/decisions/005-cloudinary-image-hosting.md) | Cloudinary para hosting de imágenes |
| [ADR-006](docs/decisions/006-admin-authentication-authorization.md) | Autenticación y autorización de admins |
| [ADR-007](docs/decisions/007-batch-operations-raffle-creation.md) | Operaciones batch para creación de rifas |

### Flujo de Reserva (Visitante)

1. Visitante selecciona un número disponible en la grilla
2. Se abre el modal de reserva con formulario (nombre, teléfono)
3. Se envía la reserva al servidor vía Server Action
4. El servidor valida y ejecuta una transacción Firestore
5. Se inicia un countdown de 30 minutos
6. Se muestran las instrucciones de pago (Bre-B QR, Bancolombia, Nequi)
7. El visitante paga y envía el comprobante por WhatsApp
8. El admin confirma el pago y marca el número como vendido

### Seguridad

- **Visitantes**: Solo pueden reservar números (vía Server Actions en el servidor)
- **Admins**: Requieren Firebase Auth + documento en `/admins/{uid}`
- **Firestore Rules**: Bloquean escrituras de clientes, permiten lectura pública de números
- **Server Actions**: Usan firebase-admin que ignora las reglas de Firestore
- **Resenas**: Se verifican en el servidor antes de liberar (no se puede liberar la reserva activa de otro)

## Licencia

Todos los derechos reservados. © 2026 RifaYA
