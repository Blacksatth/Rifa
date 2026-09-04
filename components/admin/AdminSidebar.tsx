"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

/**
 * Sidebar de navegación del panel de administración.
 *
 * Incluye dos versiones:
 * - **Desktop**: Sidebar fijo de 288px a la izquierda con logo, navegación
 *   y botón de logout
 * - **Mobile**: Barra de navegación fija en la parte inferior con tabs
 *
 * Navegación:
 * - `/admin` → Estadísticas (dashboard)
 * - `/admin/rifa` → Crear/editar rifa
 * - `/admin/numeros` → Gestionar números vendidos
 *
 * Resalta la ruta activa con estilo violeta.
 */
export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await signOut(auth);
      router.replace("/admin/login");
    } catch (error) {
      console.error("Error cerrando sesión:", error);
    }
  }

  const menuItems = [
    {
      href: "/admin",
      label: "Estadísticas",
      shortLabel: "Inicio",
      description: "Resumen de la rifa",
      icon: (
        <svg
          className="h-5 w-5"
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
      ),
    },

    {
      href: "/admin/rifa",
      label: "Crear rifa",
      shortLabel: "Rifa",
      description: "Crear y configurar",
      icon: (
        <svg
          className="h-5 w-5"
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
      ),
    },

    {
      href: "/admin/numeros",
      label: "Números vendidos",
      shortLabel: "Números",
      description: "Gestionar participantes",
      icon: (
        <svg
          className="h-5 w-5"
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
      ),
    },
  ];

  function isActive(href: string) {
    if (href === "/admin") {
      return pathname === "/admin";
    }

    return pathname.startsWith(href);
  }

  return (
    <>
      {/* =====================================================
          SIDEBAR DESKTOP
          ===================================================== */}

      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 border-r border-white/[0.08] bg-[#080916]/90 backdrop-blur-2xl lg:flex lg:flex-col">

        {/* LOGO */}

        <div className="flex h-20 items-center border-b border-white/[0.08] px-6">
          <Link
            href="/admin"
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400 ring-1 ring-violet-500/20">
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 3l2.09 4.26L19 8l-3.5 3.41.83 4.82L12 14l-4.33 2.23.83-4.82L5 8l4.91-.74L12 3z"
                />
              </svg>
            </div>

            <div>
              <h1 className="text-sm font-bold tracking-wide text-white">
                RIFA ADMIN
              </h1>

              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                Panel de control
              </p>
            </div>
          </Link>
        </div>

        {/* NAVEGACIÓN */}

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          <p className="px-3 pb-2 pt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">
            Administración
          </p>

          {menuItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition-all duration-200 ${
                  active
                    ? "border border-violet-500/20 bg-violet-500/10 text-white shadow-lg shadow-violet-950/20"
                    : "border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-white"
                }`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition ${
                    active
                      ? "bg-violet-500/15 text-violet-400"
                      : "bg-white/[0.03] text-slate-500 group-hover:text-slate-300"
                  }`}
                >
                  {item.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {item.label}
                  </p>

                  <p className="mt-0.5 truncate text-[11px] text-slate-600 group-hover:text-slate-500">
                    {item.description}
                  </p>
                </div>

                {active && (
                  <div className="h-2 w-2 rounded-full bg-violet-400 shadow-lg shadow-violet-400/50" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* LOGOUT DESKTOP */}

        <div className="border-t border-white/[0.08] p-4">
          <button
            type="button"
            onClick={handleLogout}
            className="group flex w-full items-center gap-3 rounded-2xl border border-transparent px-3 py-3 text-left text-slate-400 transition hover:border-red-500/10 hover:bg-red-500/5 hover:text-red-300"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] text-slate-500 transition group-hover:bg-red-500/10 group-hover:text-red-400">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
                />
              </svg>
            </div>

            <div>
              <p className="text-sm font-semibold">
                Cerrar sesión
              </p>

              <p className="text-[11px] text-slate-600">
                Salir del panel
              </p>
            </div>
          </button>
        </div>
      </aside>

      {/* =====================================================
          NAVEGACIÓN MOBILE
          ===================================================== */}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-[#080916]/95 px-2 pb-[env(safe-area-inset-bottom)] pt-2 backdrop-blur-2xl lg:hidden">

        <div className="mx-auto flex max-w-md items-center justify-around">

          {menuItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 transition-all ${
                  active
                    ? "text-violet-400"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                    active
                      ? "bg-violet-500/15"
                      : "bg-transparent"
                  }`}
                >
                  {item.icon}
                </div>

                <span
                  className={`max-w-full truncate text-[10px] font-semibold ${
                    active ? "text-violet-400" : "text-slate-500"
                  }`}
                >
                  {item.shortLabel}
                </span>

                {active && (
                  <div className="absolute bottom-1 h-0.5 w-8 rounded-full bg-violet-400" />
                )}
              </Link>
            );
          })}

          {/* LOGOUT MOBILE */}

          <button
            type="button"
            onClick={handleLogout}
            className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-2 py-2 text-slate-500 transition hover:text-red-400"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl">
              <svg
                className="h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1"
                />
              </svg>
            </div>

            <span className="text-[10px] font-semibold">
              Salir
            </span>
          </button>

        </div>
      </nav>
    </>
  );
}

