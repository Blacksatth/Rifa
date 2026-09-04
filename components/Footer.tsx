"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Footer público de la aplicación.
 *
 * Incluye:
 * - Logo y descripción de RifaYA
 * - Enlaces de navegación (Inicio, Panel de administración)
 * - Redes sociales (TikTok, Facebook)
 * - Botón "Volver arriba" (aparece al hacer scroll > 400px)
 * - Copyright dinámico con el año actual
 */
export default function Footer() {
  const year = new Date().getFullYear();
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 400);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="relative z-20 mt-12 overflow-hidden border-t border-white/10 bg-slate-950/80 backdrop-blur-xl">
      {/* Brillo superior */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/60 to-transparent" />

      {/* Brillos decorativos */}
      <div className="pointer-events-none absolute -left-32 top-0 h-64 w-64 rounded-full bg-violet-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-64 w-64 rounded-full bg-blue-600/10 blur-[100px]" />

      <div className="relative mx-auto w-full max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        {/* ===================================================== */}
        {/* CONTENIDO PRINCIPAL                                   */}
        {/* ===================================================== */}
        <div className="grid gap-10 lg:grid-cols-12">
          {/* MARCA */}
          <div className="lg:col-span-6">
            <Link
              href="/"
              className="group inline-flex items-center gap-3"
              aria-label="Ir al inicio"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-xl bg-violet-600/40 opacity-0 blur-lg transition-opacity duration-300 group-hover:opacity-100" />

                <div className="relative flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg shadow-violet-600/20 transition-transform duration-300 group-hover:scale-105">
                  <TicketIcon className="h-6 w-6 text-white" />
                </div>
              </div>

              <span className="text-xl font-black tracking-tight text-white">
                Rifa
                <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                  YA
                </span>
              </span>
            </Link>

            <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
              Elige tu número, participa y vive la emoción de ganar.
            </p>

            {/* Redes sociales */}
            <div className="mt-6 flex items-center gap-3">
              <a
                href="https://www.tiktok.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.08] hover:text-white hover:shadow-lg hover:shadow-white/5"
              >
                <TikTokIcon className="h-4.5 w-4.5 transition-transform duration-300 group-hover:scale-110" />
              </a>

              <a
                href="https://www.facebook.com/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-400 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/30 hover:bg-blue-500/10 hover:text-blue-400 hover:shadow-lg hover:shadow-blue-500/10"
              >
                <FacebookIcon className="h-4.5 w-4.5 transition-transform duration-300 group-hover:scale-110" />
              </a>
            </div>
          </div>

          {/* ENLACES */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Navegación
            </h3>

            <div className="mt-4 flex flex-col gap-3">
              <Link
                href="/"
                className="w-fit text-sm text-slate-500 transition-colors hover:text-violet-400"
              >
                Inicio
              </Link>

              <Link
                href="/admin"
                className="w-fit text-sm text-slate-500 transition-colors hover:text-violet-400"
              >
                Panel de administración
              </Link>
            </div>
          </div>

          {/* AYUDA / CONTACTO */}
          <div className="lg:col-span-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              ¿Dudas?
            </h3>

            <p className="mt-4 text-sm leading-relaxed text-slate-500">
              Escríbenos por redes sociales y te Asesoramos.
            </p>
          </div>
        </div>

        {/* SEPARADOR */}
        <div className="my-8 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* ===================================================== */}
        {/* PARTE INFERIOR                                        */}
        {/* ===================================================== */}
        <div className="flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
          <p className="text-[11px] text-slate-600 sm:text-xs">
            © {year} RifaYA. Todos los derechos reservados.
          </p>

          <button
            onClick={scrollToTop}
            aria-label="Volver arriba"
            className={`group flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-2 text-[11px] font-medium text-slate-400 transition-all duration-500 hover:border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-300 sm:text-xs ${
              showTop
                ? "translate-y-0 opacity-100"
                : "pointer-events-none translate-y-2 opacity-0"
            }`}
          >
            Volver arriba
            <svg
              className="h-3 w-3 -rotate-90 transition-transform duration-300 group-hover:-translate-y-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.5"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>
    </footer>
  );
}

/* ================================================================
   ICONO TICKET
================================================================ */

function TicketIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M4 8a2 2 0 012-2h12a2 2 0 012 2v2a2 2 0 100 4v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2a2 2 0 100-4V8z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M13 7v10"
        strokeDasharray="1.5 2.5"
      />
    </svg>
  );
}

/* ================================================================
   TIKTOK
================================================================ */

function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.6 5.82c-.94-.83-1.53-2.02-1.6-3.32h-3.09v13.02c0 1.5-1.21 2.7-2.7 2.7a2.7 2.7 0 0 1-2.7-2.7 2.7 2.7 0 0 1 2.7-2.7c.27 0 .53.04.78.11V9.65a6.4 6.4 0 0 0-.78-.05A6.32 6.32 0 0 0 3 15.92a6.32 6.32 0 0 0 6.21 6.32 6.32 6.32 0 0 0 6.32-6.32V9.01a8.34 8.34 0 0 0 4.32 1.2v-3.1a5.03 5.03 0 0 1-3.25-1.29z" />
    </svg>
  );
}

/* ================================================================
   FACEBOOK
================================================================ */

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 12.07C22 6.5 17.52 2 12 2S2 6.5 2 12.07c0 5.02 3.66 9.18 8.44 9.93v-7.02H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.23.2 2.23.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.44 2.91h-2.34v7.02C18.34 21.25 22 17.09 22 12.07z" />
    </svg>
  );
}