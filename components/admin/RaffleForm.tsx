"use client";

import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  writeBatch,
  doc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "@/lib/firebase";

import { Raffle } from "@/lib/types";

export default function RaffleForm({
  existing,
}: {
  existing: Raffle | null;
}) {
  // ==========================================
  // ESTADOS
  // ==========================================

  const [name, setName] = useState(
    existing?.name ?? ""
  );

  const [prizeName, setPrizeName] = useState(
    existing?.prizeName ?? ""
  );

  const [total, setTotal] = useState(
    existing?.totalNumbers ?? 100
  );

  const [price, setPrice] = useState(
    existing?.price ?? 1
  );

  const [file, setFile] = useState<File | null>(
    null
  );

  const [preview, setPreview] = useState(
    existing?.prizeImageUrl ?? ""
  );

  const [loading, setLoading] = useState(false);

  const [step, setStep] = useState("");

  const [error, setError] = useState("");

  // ==========================================
  // PREVIEW DE IMAGEN
  // ==========================================

  useEffect(() => {
    if (!file) return;

    const url = URL.createObjectURL(file);

    setPreview(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // ==========================================
  // SUBIR IMAGEN A CLOUDINARY
  // ==========================================

  async function uploadToCloudinary(
    file: File
  ): Promise<string> {
    const cloudName =
      process.env
        .NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

    const uploadPreset =
      process.env
        .NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    // ------------------------------------------
    // VALIDAR VARIABLES
    // ------------------------------------------

    if (!cloudName) {
      throw new Error(
        "Falta NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME en .env.local"
      );
    }

    if (!uploadPreset) {
      throw new Error(
        "Falta NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET en .env.local"
      );
    }

    // ------------------------------------------
    // FORM DATA
    // ------------------------------------------

    const formData = new FormData();

    formData.append(
      "file",
      file
    );

    formData.append(
      "upload_preset",
      uploadPreset
    );

    // Carpeta donde Cloudinary guardará
    // las imágenes
    formData.append(
      "folder",
      "rifas"
    );

    // ------------------------------------------
    // REQUEST
    // ------------------------------------------

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    // ------------------------------------------
    // RESPUESTA
    // ------------------------------------------

    const data = await response.json();

    console.log(
      "Respuesta Cloudinary:",
      data
    );

    // ------------------------------------------
    // ERROR
    // ------------------------------------------

    if (!response.ok) {
      throw new Error(
        data?.error?.message ||
          "No se pudo subir la imagen a Cloudinary."
      );
    }

    // ------------------------------------------
    // VALIDAR URL
    // ------------------------------------------

    if (!data?.secure_url) {
      throw new Error(
        "Cloudinary no devolvió la URL de la imagen."
      );
    }

    return data.secure_url;
  }

  // ==========================================
  // CREAR RIFA
  // ==========================================

  async function handleCreate() {
    // Evitar doble click
    if (loading) return;

    setError("");
    setStep("");

    // ==========================================
    // VALIDACIONES
    // ==========================================

    if (!name.trim()) {
      setError(
        "Escribe el nombre de la rifa."
      );
      return;
    }

    if (!prizeName.trim()) {
      setError(
        "Escribe el nombre del premio."
      );
      return;
    }

    if (
      !Number.isInteger(total) ||
      total < 2
    ) {
      setError(
        "La cantidad de números debe ser un número entero mayor a 1."
      );
      return;
    }

    if (total > 10000) {
      setError(
        "La cantidad máxima es de 10.000 números por rifa."
      );
      return;
    }

    if (!price || price <= 0) {
      setError(
        "El precio debe ser mayor que 0."
      );
      return;
    }

    // ==========================================
    // VALIDAR IMAGEN
    // ==========================================

    if (file) {
      const maxSize =
        5 * 1024 * 1024;

      if (file.size > maxSize) {
        setError(
          "La imagen no puede superar los 5 MB."
        );
        return;
      }

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (
        !allowedTypes.includes(
          file.type
        )
      ) {
        setError(
          "Solo puedes subir imágenes JPG, PNG o WEBP."
        );
        return;
      }
    }

    // ==========================================
    // INICIAR
    // ==========================================

    setLoading(true);

    try {
      // ========================================
      // 1. SUBIR IMAGEN
      // ========================================

      let imageUrl =
        existing?.prizeImageUrl ?? "";

      if (file) {
        setStep(
          "Subiendo imagen a Cloudinary..."
        );

        imageUrl =
          await uploadToCloudinary(
            file
          );

        console.log(
          "Imagen subida:",
          imageUrl
        );
      }

      // ========================================
      // 2. CREAR RIFA EN FIRESTORE
      // ========================================

      setStep(
        "Creando rifa..."
      );

      // Ejemplo:
      //
      // 100 números
      // 0 - 99
      // digits = 2
      //
      // 1000 números
      // 0 - 999
      // digits = 3

      const digits = Math.max(
        2,
        String(total - 1).length
      );

      const raffleRef =
        await addDoc(
          collection(
            db,
            "raffles"
          ),
          {
            name:
              name.trim(),

            prizeName:
              prizeName.trim(),

            // URL DE CLOUDINARY
            prizeImageUrl:
              imageUrl,

            totalNumbers:
              total,

            price:

              Number(price),

            digits,

            active:
              true,

            createdAt:
              serverTimestamp(),
          }
        );

      console.log(
        "Rifa creada:",
        raffleRef.id
      );

      // ========================================
      // 3. CREAR NÚMEROS
      // ========================================

      let batch =
        writeBatch(db);

      let batchCount = 0;

      for (
        let i = 0;
        i < total;
        i++
      ) {
        const numStr =
          String(i).padStart(
            digits,
            "0"
          );

        const numberRef =
          doc(
            db,
            "raffles",
            raffleRef.id,
            "numbers",
            numStr
          );

        batch.set(
          numberRef,
          {
            number:
              numStr,

            status:
              "available",

            buyerName:
              null,

            buyerPhone:
              null,
          }
        );

        batchCount++;

        // ======================================
        // FIRESTORE MAX 500 OPERACIONES
        // ======================================

        if (
          batchCount === 500
        ) {
          setStep(
            `Creando números... ${
              i + 1
            } / ${total}`
          );

          await batch.commit();

          batch =
            writeBatch(db);

          batchCount = 0;
        }
      }

      // ========================================
      // ÚLTIMO LOTE
      // ========================================

      if (
        batchCount > 0
      ) {
        setStep(
          `Creando números... ${total} / ${total}`
        );

        await batch.commit();
      }

      // ========================================
      // FINALIZADO
      // ========================================

      setStep(
        "¡Rifa creada correctamente!"
      );

      alert(
        `🎉 Rifa creada correctamente.\n\n` +
          `Rifa: ${name}\n` +
          `Premio: ${prizeName}\n` +
          `Números: ${total}`
      );

      // ========================================
      // LIMPIAR FORMULARIO
      // ========================================

      setName("");

      setPrizeName("");

      setTotal(100);

      setPrice(1);

      setFile(null);

      setPreview("");

      setStep("");
    } catch (err: any) {
      console.error(
        "================================"
      );

      console.error(
        "ERROR CREANDO RIFA"
      );

      console.error(
        err
      );

      console.error(
        "Código:",
        err?.code
      );

      console.error(
        "Mensaje:",
        err?.message
      );

      console.error(
        "================================"
      );

      let message =
        "No se pudo crear la rifa.";

      // ========================================
      // ERRORES FIREBASE
      // ========================================

      if (
        err?.code ===
        "permission-denied"
      ) {
        message =
          "Firebase rechazó la operación por permisos. Revisa las reglas de Firestore.";
      }

      // ========================================
      // ERRORES CLOUDINARY
      // ========================================

      else if (
        err?.message?.toLowerCase().includes(
          "cloudinary"
        )
      ) {
        message =
          err.message;
      }

      // ========================================
      // ERROR GENÉRICO
      // ========================================

      else if (
        err?.message
      ) {
        message =
          err.message;
      }

      setError(
        message
      );

      setStep("");
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // JSX
  // ==========================================

  return (
    <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 shadow-2xl">

      {/* =====================================
          GLOW
      ====================================== */}

      <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-violet-600/10 blur-3xl" />

      <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />

      <div className="relative p-6 sm:p-8">

        {/* ===================================
            HEADER
        ==================================== */}

        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex items-center gap-4">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-violet-500/20 bg-violet-500/10 shadow-lg shadow-violet-900/20">

              <svg
                className="h-6 w-6 text-violet-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v8m-4-4h8m5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>

            </div>

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
                Configuración
              </p>

              <h2 className="mt-1 text-xl font-bold text-white">
                Nueva rifa
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Configura los detalles de tu próxima rifa.
              </p>

            </div>

          </div>

          <div className="flex w-fit items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1.5">

            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />

            <span className="text-[11px] font-bold tracking-wide text-emerald-400">
              {loading
                ? "PROCESANDO"
                : "LISTO"}
            </span>

          </div>

        </div>

        {/* ===================================
            ERROR
        ==================================== */}

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">

            <div className="flex gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-500/10">

                <svg
                  className="h-5 w-5 text-red-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>

              </div>

              <div>

                <p className="font-semibold text-red-300">
                  No se pudo completar
                </p>

                <p className="mt-1 text-sm leading-6 text-red-400/80">
                  {error}
                </p>

              </div>

            </div>

          </div>
        )}

        {/* ===================================
            PROGRESO
        ==================================== */}

        {loading && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-violet-500/20 bg-violet-500/5">

            <div className="flex items-center gap-3 px-4 py-3">

              <svg
                className="h-5 w-5 animate-spin text-violet-400"
                fill="none"
                viewBox="0 0 24 24"
              >

                <circle
                  className="opacity-20"
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

              <p className="text-sm font-medium text-violet-300">
                {step ||
                  "Procesando..."}
              </p>

            </div>

            <div className="h-1 bg-slate-800">

              <div className="h-full w-1/2 animate-pulse bg-gradient-to-r from-violet-600 to-blue-500" />

            </div>

          </div>
        )}

        {/* ===================================
            GRID
        ==================================== */}

        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">

          {/* =================================
              FORMULARIO
          ================================== */}

          <div className="space-y-6">

            {/* NOMBRE */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Nombre de la rifa
              </label>

              <input
                type="text"
                value={name}
                disabled={loading}
                placeholder="Ej. Gran Rifa de Verano"
                onChange={(e) =>
                  setName(
                    e.target.value
                  )
                }
                className="
                  w-full rounded-xl
                  border border-slate-700
                  bg-slate-950
                  px-4 py-3.5
                  text-sm text-white
                  placeholder:text-slate-600
                  shadow-inner shadow-black/20
                  outline-none
                  transition
                  hover:border-slate-600
                  focus:border-violet-500
                  focus:ring-4
                  focus:ring-violet-500/10
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              />

            </div>

            {/* PREMIO */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Nombre del premio
              </label>

              <input
                type="text"
                value={prizeName}
                disabled={loading}
                placeholder="Ej. iPhone 17 Pro Max"
                onChange={(e) =>
                  setPrizeName(
                    e.target.value
                  )
                }
                className="
                  w-full rounded-xl
                  border border-slate-700
                  bg-slate-950
                  px-4 py-3.5
                  text-sm text-white
                  placeholder:text-slate-600
                  shadow-inner shadow-black/20
                  outline-none
                  transition
                  hover:border-slate-600
                  focus:border-violet-500
                  focus:ring-4
                  focus:ring-violet-500/10
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              />

            </div>

            {/* NUMEROS + PRECIO */}

            <div className="grid gap-4 sm:grid-cols-2">

              {/* NUMEROS */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Cantidad de números
                </label>

                <input
                  type="number"
                  min={2}
                  max={10000}
                  value={total}
                  disabled={loading}
                  onChange={(e) =>
                    setTotal(
                      Number(
                        e.target.value
                      )
                    )
                  }
                  className="
                    w-full rounded-xl
                    border border-slate-700
                    bg-slate-950
                    px-4 py-3.5
                    text-sm text-white
                    outline-none
                    transition
                    hover:border-slate-600
                    focus:border-violet-500
                    focus:ring-4
                    focus:ring-violet-500/10
                    disabled:opacity-60
                  "
                />

                <p className="mt-2 text-xs text-slate-500">
                  Ej. 100 números → 00 hasta 99
                </p>

              </div>

              {/* PRECIO */}

              <div>

                <label className="mb-2 block text-sm font-semibold text-slate-300">
                  Precio por número
                </label>

                <div className="relative">

                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-500">
                    $
                  </span>

                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={price}
                    disabled={loading}
                    onChange={(e) =>
                      setPrice(
                        Number(
                          e.target.value
                        )
                      )
                    }
                    className="
                      w-full rounded-xl
                      border border-slate-700
                      bg-slate-950
                      py-3.5 pl-9 pr-4
                      text-sm text-white
                      outline-none
                      transition
                      hover:border-slate-600
                      focus:border-violet-500
                      focus:ring-4
                      focus:ring-violet-500/10
                      disabled:opacity-60
                    "
                  />

                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Precio por participación.
                </p>

              </div>

            </div>

            {/* =================================
                IMAGEN
            ================================== */}

            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Imagen del premio
              </label>

              <label
                htmlFor="prize-image"
                className="
                  group flex cursor-pointer
                  items-center gap-4
                  rounded-2xl
                  border border-dashed
                  border-slate-700
                  bg-slate-950
                  p-5
                  transition
                  hover:border-violet-500/60
                  hover:bg-violet-500/5
                "
              >

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-slate-700 bg-slate-900">

                  <svg
                    className="h-6 w-6 text-slate-500 transition group-hover:text-violet-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >

                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />

                  </svg>

                </div>

                <div className="min-w-0">

                  <p className="truncate text-sm font-medium text-slate-300">
                    {file?.name ||
                      "Seleccionar imagen"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    PNG, JPG o WEBP · Máximo 5 MB
                  </p>

                </div>

                <input
                  id="prize-image"
                  type="file"
                  disabled={loading}
                  accept="image/png,image/jpeg,image/webp"
                  className="hidden"
                  onChange={(e) =>
                    setFile(
                      e.target.files?.[0] ??
                        null
                    )
                  }
                />

              </label>

            </div>

            {/* =================================
                BOTÓN
            ================================== */}

            <button
              type="button"
              disabled={loading}
              onClick={handleCreate}
              className="
                group relative w-full
                overflow-hidden rounded-xl
                bg-gradient-to-r
                from-violet-600
                via-indigo-600
                to-blue-600
                px-6 py-4
                font-semibold text-white
                shadow-xl shadow-violet-600/20
                transition-all duration-300
                hover:-translate-y-0.5
                hover:shadow-violet-600/40
                active:translate-y-0
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >

              <span className="relative flex items-center justify-center gap-2">

                {loading ? (
                  <>
                    <svg
                      className="h-5 w-5 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >

                      <circle
                        cx="12"
                        cy="12"
                        r="9"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="opacity-25"
                      />

                      <path
                        d="M21 12a9 9 0 00-9-9"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />

                    </svg>

                    {step ||
                      "Procesando..."}

                  </>
                ) : (
                  <>
                    Crear nueva rifa

                    <svg
                      className="h-5 w-5 transition-transform group-hover:translate-x-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >

                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />

                    </svg>

                  </>
                )}

              </span>

            </button>

          </div>

          {/* =================================
              PREVIEW
          ================================== */}

          <div>

            <div className="sticky top-6 overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 shadow-xl">

              <div className="border-b border-slate-800 px-5 py-4">

                <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-500">
                  Vista previa
                </p>

              </div>

              <div className="p-4">

                {/* IMAGEN */}

                <div className="aspect-[4/3] overflow-hidden rounded-xl border border-slate-800 bg-slate-900">

                  {preview ? (
                    <img
                      src={preview}
                      alt="Vista previa del premio"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full flex-col items-center justify-center">

                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800">

                        <svg
                          className="h-7 w-7 text-slate-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >

                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />

                        </svg>

                      </div>

                      <p className="text-sm text-slate-600">
                        Imagen del premio
                      </p>

                    </div>
                  )}

                </div>

                {/* DATOS */}

                <div className="mt-5">

                  <p className="text-xs font-bold uppercase tracking-wider text-violet-400">
                    {name ||
                      "Nombre de la rifa"}
                  </p>

                  <h3 className="mt-1 text-lg font-bold text-white">
                    {prizeName ||
                      "Nombre del premio"}
                  </h3>

                </div>

                {/* ESTADÍSTICAS */}

                <div className="mt-5 grid grid-cols-2 gap-3">

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">

                    <p className="text-xs text-slate-500">
                      Números
                    </p>

                    <p className="mt-1 text-lg font-bold text-white">
                      {total}
                    </p>

                  </div>

                  <div className="rounded-xl border border-slate-800 bg-slate-900 p-3">

                    <p className="text-xs text-slate-500">
                      Precio
                    </p>

                    <p className="mt-1 text-lg font-bold text-emerald-400">
                      $
                      {Number(
                        price
                      ).toFixed(2)}
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
