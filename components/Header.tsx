"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "@/lib/firebase";

type HeaderProps = {
    /** Si hay una rifa activa, muestra el indicador "Rifa en curso" */
    raffle?: boolean;
};

/**
 * Header público de la aplicación.
 *
 * Barra fija en la parte superior con:
 * - Logo "RifaYA" con enlace al inicio
 * - Indicador "Rifa en curso" (cuando hay rifa activa)
 * - Botón de admin/logout según estado de autenticación
 * - Efecto de scroll: borde inferior y backdrop blur al hacer scroll
 *
 * Usa `onAuthStateChanged` de Firebase Auth para detectar si hay sesión.
 * Cambia el estilo del header al hacer scroll (más compacto, más opaco).
 */
export default function Header({ raffle = false }: HeaderProps) {
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState<User | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);

    /* =========================================================
       SCROLL
    ========================================================= */

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };

        handleScroll();

        window.addEventListener("scroll", handleScroll, {
            passive: true,
        });

        return () => {
            window.removeEventListener("scroll", handleScroll);
        };
    }, []);

    /* =========================================================
       FIREBASE AUTH
    ========================================================= */

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            setUser(currentUser);
        });

        return () => unsubscribe();
    }, []);

    /* =========================================================
       CERRAR SESIÓN
    ========================================================= */

    const handleLogout = async () => {
        try {
            setLoggingOut(true);

            await signOut(auth);

            // Firebase actualizará automáticamente el estado
            // mediante onAuthStateChanged.
        } catch (error) {
            console.error("Error al cerrar sesión:", error);
            setLoggingOut(false);
        }
    };

    /* =========================================================
       DATOS DEL USUARIO
    ========================================================= */

    const userName =
        user?.displayName ||
        user?.email?.split("@")[0] ||
        "Usuario";

    const userEmail = user?.email || "";

    const userInitial = (
        user?.displayName?.charAt(0) ||
        user?.email?.charAt(0) ||
        "U"
    ).toUpperCase();

    return (
        <header
            className={`
        fixed
        inset-x-0
        top-0
        z-[9999]
        w-full
        transition-all
        duration-500
        ${scrolled
                    ? "border-b border-white/10 bg-slate-950/90 py-2 shadow-lg shadow-black/30 backdrop-blur-xl"
                    : "border-b border-transparent bg-slate-950/60 py-2.5 backdrop-blur-md sm:py-3.5"
                }
      `}
        >
            {/* =====================================================
          LÍNEA SUPERIOR
      ===================================================== */}

            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-500/70 to-transparent" />

            <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-3 sm:px-6 lg:px-8">

                {/* =====================================================
            MARCA
        ===================================================== */}

                <Link
                    href="/"
                    className="group flex min-w-0 items-center gap-2"
                    aria-label="Ir al inicio"
                >
                    <div className="relative shrink-0">

                        {/* Glow */}
                        <div className="absolute inset-0 rounded-xl bg-violet-600/40 opacity-0 blur-md transition-opacity duration-500 group-hover:opacity-100" />

                        {/* Logo */}
                        <div
                            className={`
                relative
                flex
                items-center
                justify-center
                rounded-xl
                bg-gradient-to-br
                from-violet-600
                to-blue-600
                shadow-lg
                shadow-violet-600/20
                transition-all
                duration-500
                ${scrolled
                                    ? "h-8 w-8"
                                    : "h-8 w-8 sm:h-9 sm:w-9"
                                }
                group-hover:rotate-[8deg]
                group-hover:scale-105
              `}
                        >
                            <svg
                                className="h-4 w-4 text-white sm:h-4.5 sm:w-4.5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z"
                                />
                            </svg>
                        </div>
                    </div>

                    <span className="truncate bg-gradient-to-r from-white to-slate-300 bg-clip-text text-sm font-bold tracking-tight text-transparent sm:text-base">
                        Rifa
                        <span className="bg-gradient-to-r from-violet-400 to-blue-400 bg-clip-text text-transparent">
                            YA
                        </span>
                    </span>
                </Link>

                {/* =====================================================
            ACCIONES
        ===================================================== */}

                <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">

                    {/* ===================================================
              ESTADO RIFA
          =================================================== */}

                    {raffle && (
                        <span className="hidden items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-400 sm:flex">
                            <span className="relative flex h-1.5 w-1.5">
                                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />

                                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            </span>

                            Rifa en curso
                        </span>
                    )}

                    {/* ===================================================
              USUARIO LOGUEADO
          =================================================== */}

                    {user ? (
                        <div className="flex items-center gap-1.5 sm:gap-2">

                            {/* =========================================
        CUENTA
    ========================================= */}

                            <div className="hidden items-center gap-2 sm:flex">

                                {/* Avatar */}
                                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-xs font-bold text-white shadow-lg shadow-violet-600/20">
                                    {userInitial}
                                </div>

                                {/* Información */}
                                <div className="max-w-[170px]">
                                    <p className="truncate text-xs font-semibold text-white">
                                        {userName}
                                    </p>

                                    <p className="truncate text-[10px] text-slate-500">
                                        {userEmail}
                                    </p>
                                </div>
                            </div>

                            {/* Avatar móvil */}
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-blue-600 text-xs font-bold text-white sm:hidden">
                                {userInitial}
                            </div>

                            {/* =========================================
        PANEL ADMIN
    ========================================= */}

                            <Link
                                href="/admin"
                                aria-label="Ir al panel de administración"
                                className="
        group/admin
        relative
        flex
        items-center
        gap-1.5
        overflow-hidden
        rounded-xl
        border
        border-violet-500/20
        bg-violet-500/[0.06]
        px-2.5
        py-2
        text-xs
        font-medium
        text-violet-300
        transition-all
        duration-300
        hover:border-violet-500/40
        hover:bg-violet-500/15
        hover:text-violet-200
        active:scale-95
        sm:px-3
      "
                            >
                                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover/admin:translate-x-full" />

                                {/* Icono dashboard */}
                                <svg
                                    className="relative h-3.5 w-3.5 sm:h-4 sm:w-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"
                                    />
                                </svg>

                                <span className="relative hidden sm:inline">
                                    Panel
                                </span>
                            </Link>

                            {/* =========================================
        CERRAR SESIÓN
    ========================================= */}

                            <button
                                type="button"
                                onClick={handleLogout}
                                disabled={loggingOut}
                                aria-label="Cerrar sesión"
                                className="
        group/logout
        relative
        flex
        items-center
        gap-1.5
        overflow-hidden
        rounded-xl
        border
        border-red-500/20
        bg-red-500/[0.05]
        px-2.5
        py-2
        text-xs
        font-medium
        text-red-400
        transition-all
        duration-300
        hover:border-red-500/40
        hover:bg-red-500/10
        hover:text-red-300
        active:scale-95
        disabled:cursor-not-allowed
        disabled:opacity-50
        sm:px-3
      "
                            >
                                <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-red-400/10 to-transparent transition-transform duration-700 group-hover/logout:translate-x-full" />

                                {loggingOut ? (
                                    <svg
                                        className="relative h-3.5 w-3.5 animate-spin sm:h-4 sm:w-4"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle
                                            className="opacity-25"
                                            cx="12"
                                            cy="12"
                                            r="9"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                        />

                                        <path
                                            d="M21 12a9 9 0 00-9-9"
                                            stroke="currentColor"
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                ) : (
                                    <svg
                                        className="relative h-3.5 w-3.5 sm:h-4 sm:w-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M15 12H3m0 0l4-4m-4 4l4 4M21 4v16a2 2 0 01-2 2h-7"
                                        />
                                    </svg>
                                )}

                                <span className="relative hidden sm:inline">
                                    {loggingOut ? "Saliendo..." : "Salir"}
                                </span>
                            </button>
                        </div>
                    ) : (
                        /* =========================================
                           NO HAY SESIÓN
                        ========================================= */

                        <Link
                            href="/admin"
                            aria-label="Acceder al panel de administración"
                            className="
      group/admin
      relative
      flex
      items-center
      gap-1.5
      overflow-hidden
      rounded-xl
      border
      border-white/10
      bg-white/[0.04]
      px-2.5
      py-2
      text-xs
      font-medium
      text-slate-400
      transition-all
      duration-300
      hover:border-violet-500/30
      hover:bg-violet-500/10
      hover:text-violet-300
      active:scale-95
      sm:px-3
    "
                        >
                            <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover/admin:translate-x-full" />

                            <svg
                                className="relative h-3.5 w-3.5 sm:h-4 sm:w-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622C17.176 19.29 21 14.591 21 9c0-1.042-.133-2.053-.382-3.016z"
                                />
                            </svg>

                            <span className="relative hidden sm:inline">
                                Admin
                            </span>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}