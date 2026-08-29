"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    /*
     * LOGIN NO NECESITA AUTORIZACIÓN
     */

    if (pathname === "/admin/login") {
      setChecking(false);
      setAuthorized(false);
      return;
    }

    setChecking(true);
    setAuthorized(false);

    const unsubscribe = onAuthStateChanged(
      auth,
      async (user) => {
        /*
         * No existe usuario
         */

        if (!user) {
          setAuthorized(false);
          setChecking(false);

          router.replace("/admin/login");
          return;
        }

        try {
          /*
           * El ID usado aquí es SIEMPRE:
           *
           * user.uid
           *
           * No uses user.email como ID.
           */

          const adminRef = doc(
            db,
            "admins",
            user.uid
          );

          const adminSnap = await getDoc(adminRef);

          if (!adminSnap.exists()) {
            console.warn(
              "Usuario autenticado pero no existe en admins:",
              user.uid
            );

            setAuthorized(false);
            setChecking(false);

            router.replace("/admin/login");
            return;
          }

          /*
           * Usuario autorizado
           */

          setAuthorized(true);
          setChecking(false);

        } catch (error) {
          console.error(
            "Error verificando administrador:",
            error
          );

          setAuthorized(false);
          setChecking(false);

          router.replace("/admin/login");
        }
      }
    );

    return () => unsubscribe();
  }, [pathname, router]);

  /*
   * La página de login se muestra siempre.
   */

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  /*
   * Pantalla de verificación
   */

  if (checking) {
    return (
      <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#060713] px-6 text-white">

        <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-violet-600/20 blur-[100px]" />

        <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-600/15 blur-[100px]" />

        <div className="relative w-full max-w-sm">

          <div className="rounded-[2rem] border border-white/[0.08] bg-white/[0.035] p-8 text-center shadow-2xl backdrop-blur-2xl">

            <div className="relative mx-auto mb-6 h-14 w-14">

              <div className="absolute inset-0 rounded-full bg-violet-500/20 blur-xl" />

              <div className="relative h-14 w-14 animate-spin rounded-full border-2 border-white/10 border-t-violet-400" />

            </div>

            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-violet-400">
              Seguridad
            </p>

            <h1 className="mt-2 text-lg font-bold">
              Verificando acceso
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Comprobando tus permisos de administrador...
            </p>

          </div>

        </div>

      </main>
    );
  }

  /*
   * Mientras redirecciona, no mostramos contenido privado.
   */

  if (!authorized) {
    return null;
  }

  /*
   * Usuario autorizado.
   *
   * Aquí comienza el nuevo panel administrativo.
   */

  return (
    <div className="min-h-screen bg-[#060713] text-white">

      {/* Fondo general */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full bg-violet-600/10 blur-3xl" />

        <div className="absolute -right-40 top-1/2 h-[500px] w-[500px] rounded-full bg-blue-600/10 blur-3xl" />

        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

      </div>

      <div className="relative flex min-h-screen">

        {/* SIDEBAR */}

        <AdminSidebar />

        {/* CONTENIDO */}

        <div className="flex min-w-0 flex-1 flex-col">

          {/* HEADER */}

          <AdminHeader />

          {/* PÁGINA */}

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">

            <div className="mx-auto w-full max-w-7xl">

              {children}

            </div>

          </main>

        </div>

      </div>

    </div>
  );
}