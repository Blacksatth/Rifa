"use client";

import { usePathname } from "next/navigation";

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
    <header className="sticky top-0 z-30 border-b border-white/[0.08] bg-[#060713]/80 backdrop-blur-2xl">

      <div className="flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* INFORMACIÓN */}

        <div className="min-w-0">

          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-400">
            Administración
          </p>

          <h2 className="mt-1 truncate text-xl font-bold text-white sm:text-2xl">
            {section.title}
          </h2>

          <p className="hidden text-xs text-slate-500 sm:block">
            {section.description}
          </p>

        </div>

        {/* ESTADO */}

        <div className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-500/10 bg-emerald-500/5 px-3 py-2">

          <span className="relative flex h-2 w-2">

            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />

            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />

          </span>

          <span className="hidden text-xs font-medium text-emerald-400 sm:inline">
            Panel activo
          </span>

        </div>

      </div>

    </header>
  );
}