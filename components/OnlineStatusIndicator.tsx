"use client";

import { useEffect, useState } from "react";

const isServer = typeof window === "undefined";

/**
 * Indicador de estado de conexión.
 *
 * Muestra una barra fija (amarilla) cuando el navegador pierde la conexión,
 * y la oculta automáticamente al volver a estar en línea.
 *
 * Usa `navigator.onLine` + los eventos `online`/`offline` del navegador,
 * así que no requiere ninguna librería adicional.
 */
export default function OnlineStatusIndicator() {
  const [online, setOnline] = useState(
    () => !isServer && navigator.onLine
  );

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (online) {
    return null;
  }

  return (
    <div
      role="alert"
      className="
        fixed
        inset-x-0
        top-0
        z-[70]
        bg-amber-500
        px-4
        py-2
        text-center
        text-xs
        font-bold
        text-slate-900
        shadow-lg
        animate-in
        slide-in-from-top
        fade-in
        duration-300
      "
    >
      📡 Sin conexión: algunos datos podrían no
      estar actualizados. Revisa tu internet.
    </div>
  );
}
