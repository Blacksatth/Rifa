
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

/**
 * Header superior del panel de administración.
 *
 * Barra sticky que muestra:
 * - Título y descripción de la sección actual (basado en la ruta)
 * - Indicador "Panel activo" con dot verde animado
 * - Enlace a la página principal pública
 * - Icono de administrador
 *
 * Determina la sección actual mediante `usePathname()` de Next.js.
 */
export default function AdminHeader() {
  const pathname = usePathname();

  function getTitle() {
    if (pathname === "/admin") {
      return {
        title: "Estadísticas",
        description: "Resumen y rendimiento de tu rifa.",
      };
    }

    if (pathname.startsWith("/admin/rifa")) {
      return {
        title: "Crear rifa",
        description: "Configura y administra la información de tu rifa.",
      };
    }

    if (pathname.startsWith("/admin/numeros")) {
      return {
        title: "Números vendidos",
        description: "Gestiona los números y participantes.",
      };
    }

    return {
      title: "Panel administrativo",
      description: "Administra tu plataforma de rifas.",
    };
  }

  const section = getTitle();

  return (
    <header
      className="
        sticky
        top-0
        z-40
        border-b
        border-white/[0.08]
        bg-[#060713]/85
        backdrop-blur-2xl
      "
    >
      {/* Línea superior decorativa */}

      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

      <div className="flex min-h-[76px] items-center justify-between gap-3 px-3 sm:px-6 lg:px-8">

        {/* =====================================================
            INFORMACIÓN DE LA SECCIÓN
            ===================================================== */}

        <div className="min-w-0 flex-1">

          <div className="flex items-center gap-2">

            <div className="hidden h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400 sm:flex">
              {pathname === "/admin" ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M3 13h4v8H3v-8zm7-6h4v14h-4V7zm7-4h4v18h-4V3z"
                  />
                </svg>
              ) : pathname.startsWith("/admin/rifa") ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 4h10M7 8h10M7 12h10M7 16h6"
                  />

                  <rect
                    x="4"
                    y="2"
                    width="16"
                    height="20"
                    rx="2"
                    strokeWidth="2"
                  />
                </svg>
              )}
            </div>

            <p className="truncate text-[9px] font-bold uppercase tracking-[0.22em] text-violet-400 sm:text-[10px]">
              Administración
            </p>

          </div>

          <h2 className="mt-1 truncate text-lg font-bold tracking-tight text-white sm:text-2xl">
            {section.title}
          </h2>

          <p className="hidden truncate text-xs text-slate-500 sm:block">
            {section.description}
          </p>

        </div>

        {/* =====================================================
            ACCIONES
            ===================================================== */}

        <div className="flex shrink-0 items-center gap-2">

          {/* =================================================
              ESTADO DEL PANEL
              ================================================= */}

          <div
            className="
              hidden
              items-center
              gap-2
              rounded-full
              border
              border-emerald-500/15
              bg-emerald-500/[0.06]
              px-3
              py-2
              sm:flex
            "
          >
            <span className="relative flex h-2 w-2">

              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />

              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />

            </span>

            <span className="text-xs font-medium text-emerald-400">
              Panel activo
            </span>
          </div>

          {/* =================================================
              IR A PÁGINA PRINCIPAL
              ================================================= */}

          <Link
            href="/"
            aria-label="Ir a la página principal"
            title="Ir a la página principal"
            className="
              group
              relative
              flex
              h-10
              items-center
              justify-center
              gap-2
              overflow-hidden
              rounded-xl
              border
              border-blue-500/20
              bg-blue-500/[0.06]
              px-3
              text-blue-300
              transition-all
              duration-300
              hover:border-blue-500/40
              hover:bg-blue-500/10
              hover:text-blue-200
              active:scale-95
              sm:px-3.5
            "
          >

            {/* Efecto */}

            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

            {/* Icono */}

            <svg
              className="relative h-4 w-4 shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 10.5L12 3l9 7.5M5 9v10a2 2 0 002 2h10a2 2 0 002-2V9M9 21v-6h6v6"
              />
            </svg>

            <span className="relative hidden text-xs font-semibold sm:inline">
              Página principal
            </span>

          </Link>

          {/* =================================================
              SEPARADOR
              ================================================= */}

          <div className="hidden h-7 w-px bg-white/10 sm:block" />

          {/* =================================================
              ADMIN
              ================================================= */}

          <div
            className="
              flex
              h-10
              w-10
              items-center
              justify-center
              rounded-xl
              border
              border-violet-500/20
              bg-violet-500/[0.06]
              text-violet-300
            "
            title="Administrador"
          >
            <svg
              className="h-4.5 w-4.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 15a3 3 0 100-6 3 3 0 000 6z"
              />

              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19.4 15a1.7 1.7 0 00.34 1.88l.06.06-1.41 1.41-.06-.06a1.7 1.7 0 00-1.88-.34 1.7 1.7 0 00-1.03 1.56V20h-2v-.09a1.7 1.7 0 00-1.03-1.56 1.7 1.7 0 00-1.88.34l-.06.06-1.41-1.41.06-.06A1.7 1.7 0 009.4 15a1.7 1.7 0 00-1.56-1.03H7v-2h.84A1.7 1.7 0 009.4 11a1.7 1.7 0 00-.34-1.88L9 9.06l1.41-1.41.06.06A1.7 1.7 0 0012.35 8.05 1.7 1.7 0 0013.38 6.5V6h2v.5a1.7 1.7 0 001.03 1.56 1.7 1.7 0 001.88-.34l.06-.06 1.41 1.41-.06.06A1.7 1.7 0 0019.4 11a1.7 1.7 0 001.56 1.03H21v2h-.04A1.7 1.7 0 0019.4 15z"
              />
            </svg>
          </div>

        </div>

      </div>
    </header>
  );
}

