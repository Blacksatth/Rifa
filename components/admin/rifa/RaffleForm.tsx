"use client";

import { useEffect, useState, useMemo } from "react";
import {
  addDoc,
  collection,
  writeBatch,
  doc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Raffle } from "@/lib/types";
import RaffleFormFields from "./RaffleFormFields";
import RafflePreview from "./RafflePreview";

export default function RaffleForm({ existing }: { existing: Raffle | null }) {
  // ==========================================
  // ESTADOS
  // ==========================================
  const [name, setName] = useState(existing?.name ?? "");
  const [prizeName, setPrizeName] = useState(existing?.prizeName ?? "");
  const [total, setTotal] = useState(existing?.totalNumbers ?? 100);
  const [price, setPrice] = useState(existing?.price ?? 1);

  const [drawDate, setDrawDate] = useState((existing as any)?.drawDate ?? "");
  const [drawTime, setDrawTime] = useState((existing as any)?.drawTime ?? "");
  const [drawMethod, setDrawMethod] = useState((existing as any)?.drawMethod ?? "");
  const [description, setDescription] = useState((existing as any)?.description ?? "");
  const [whatsapp, setWhatsapp] = useState((existing as any)?.whatsapp ?? "");

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState(existing?.prizeImageUrl ?? "");

  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState("");
  const [progress, setProgress] = useState(0); // 0 - 100
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // ==========================================
  // PREVIEW DE IMAGEN
  // ==========================================
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // ==========================================
  // SUBIR IMAGEN A CLOUDINARY
  // ==========================================
  async function uploadToCloudinary(file: File): Promise<string> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName) throw new Error("Falta NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME en .env.local");
    if (!uploadPreset) throw new Error("Falta NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET en .env.local");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    formData.append("folder", "rifas");

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.error?.message || "No se pudo subir la imagen a Cloudinary.");
    }
    if (!data?.secure_url) {
      throw new Error("Cloudinary no devolvió la URL de la imagen.");
    }

    return data.secure_url;
  }

  // ==========================================
  // FORMATEAR DINERO
  // ==========================================
  function formatCOP(value: number) {
    return Number(value || 0).toLocaleString("es-CO", {
      style: "currency",
      currency: "COP",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  // ==========================================
  // VALOR TOTAL (memoizado)
  // ==========================================
  const totalValue = useMemo(
    () => Number(total || 0) * Number(price || 0),
    [total, price]
  );

  // ==========================================
  // GUARDAR / EDITAR RIFA
  // ==========================================
  async function handleCreate() {
    if (loading) return;

    setError("");
    setSuccess("");
    setStep("");
    setProgress(0);

    // VALIDACIONES
    if (!name.trim()) return setError("Escribe el nombre de la rifa.");
    if (!prizeName.trim()) return setError("Escribe el nombre del premio.");
    if (!Number.isInteger(total) || total < 2)
      return setError("La cantidad de números debe ser un número entero mayor a 1.");
    if (total > 10000)
      return setError("La cantidad máxima es de 10.000 números por rifa.");
    if (!price || price <= 0) return setError("El precio debe ser mayor que 0.");
    if (!drawDate) return setError("Selecciona la fecha del sorteo.");
    if (!drawTime) return setError("Selecciona la hora del sorteo.");
    if (!drawMethod.trim()) return setError("Especifica cómo se realizará el sorteo.");
    if (!description.trim()) return setError("Escribe una descripción de la rifa.");

    if (whatsapp.trim()) {
      const cleanWhatsapp = whatsapp.replace(/\D/g, "");
      if (cleanWhatsapp.length < 7 || cleanWhatsapp.length > 15) {
        return setError("El número de WhatsApp no parece válido.");
      }
    }

    if (file) {
      if (file.size > 5 * 1024 * 1024) return setError("La imagen no puede superar los 5 MB.");
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        return setError("Solo puedes subir imágenes JPG, PNG o WEBP.");
      }
    }

    setLoading(true);

    try {
      // 1. SUBIR IMAGEN
      let imageUrl = existing?.prizeImageUrl ?? "";
      if (file) {
        setStep("Subiendo imagen...");
        setProgress(8);
        imageUrl = await uploadToCloudinary(file);
        setProgress(18);
      }

      const digits = Math.max(2, String(total - 1).length);

      const raffleData = {
        name: name.trim(),
        prizeName: prizeName.trim(),
        prizeImageUrl: imageUrl,
        totalNumbers: total,
        price: Number(price),
        digits,
        drawDate,
        drawTime,
        drawMethod: drawMethod.trim(),
        description: description.trim(),
        whatsapp: whatsapp.trim(),
        updatedAt: serverTimestamp(),
      };

      // 3. EDITAR
      if (existing?.id) {
        setStep("Guardando cambios...");
        setProgress(40);
        await updateDoc(doc(db, "raffles", existing.id), raffleData);
        setProgress(100);
        setSuccess("¡Rifa actualizada correctamente!");
        setStep("");
        return;
      }

      // 4. CREAR NUEVA RIFA
      setStep("Creando rifa...");
      setProgress(22);

      const raffleRef = await addDoc(collection(db, "raffles"), {
        ...raffleData,
        active: true,
        createdAt: serverTimestamp(),
      });

      // 5. CREAR NÚMEROS CON PROGRESO REAL
      setStep("Generando números...");
      let batch = writeBatch(db);
      let batchCount = 0;
      const totalNumbers = total;

      for (let i = 0; i < totalNumbers; i++) {
        const numStr = String(i).padStart(digits, "0");
        const numberRef = doc(db, "raffles", raffleRef.id, "numbers", numStr);

        batch.set(numberRef, {
          number: numStr,
          status: "available",
          buyerName: null,
          buyerPhone: null,
        });

        batchCount++;

        // Actualizar progreso cada ~2% o cada 500
        if (batchCount === 500 || i === totalNumbers - 1) {
          const currentProgress = 22 + Math.round(((i + 1) / totalNumbers) * 70);
          setProgress(Math.min(currentProgress, 92));
          setStep(`Creando números... ${i + 1} / ${totalNumbers}`);

          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      setProgress(100);
      setStep("");
      setSuccess(
        `¡Rifa creada con éxito! ${total} números generados • ${formatCOP(Number(price))} c/u`
      );

      // Limpiar formulario
      setName("");
      setPrizeName("");
      setTotal(100);
      setPrice(1);
      setDrawDate("");
      setDrawTime("");
      setDrawMethod("");
      setDescription("");
      setWhatsapp("");
      setFile(null);
      setPreview("");
    } catch (err: any) {
      console.error("ERROR CREANDO RIFA", err);

      let message = "No se pudo crear la rifa.";
      if (err?.code === "permission-denied") {
        message = "Firebase rechazó la operación por permisos. Revisa las reglas de Firestore.";
      } else if (err?.message?.toLowerCase().includes("cloudinary")) {
        message = err.message;
      } else if (err?.message) {
        message = err.message;
      }

      setError(message);
      setStep("");
      setProgress(0);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // ELIMINAR RIFA
  // ==========================================
  async function handleDelete() {
    if (!existing?.id || loading) return;

    const confirmed = window.confirm(
      `¿Seguro que quieres eliminar la rifa "${existing.name}"?\n\nTambién se eliminarán todos sus números. Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setLoading(true);
    setError("");
    setSuccess("");
    setStep("Eliminando rifa...");
    setProgress(15);

    try {
      const numbersRef = collection(db, "raffles", existing.id, "numbers");
      const snapshot = await getDocs(numbersRef);

      let batch = writeBatch(db);
      let batchCount = 0;
      const totalDocs = snapshot.docs.length;

      for (let i = 0; i < snapshot.docs.length; i++) {
        batch.delete(snapshot.docs[i].ref);
        batchCount++;

        if (batchCount === 500 || i === totalDocs - 1) {
          setProgress(15 + Math.round(((i + 1) / Math.max(totalDocs, 1)) * 70));
          await batch.commit();
          batch = writeBatch(db);
          batchCount = 0;
        }
      }

      setProgress(90);
      await deleteDoc(doc(db, "raffles", existing.id));
      setProgress(100);
      setSuccess("Rifa eliminada correctamente.");
      setStep("");
    } catch (err: any) {
      console.error("Error eliminando rifa:", err);
      setError(
        err?.code === "permission-denied"
          ? "Firebase rechazó la eliminación. Revisa las reglas de Firestore."
          : err?.message || "No se pudo eliminar la rifa."
      );
      setStep("");
      setProgress(0);
    } finally {
      setLoading(false);
    }
  }

  // ==========================================
  // JSX
  // ==========================================
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 shadow-2xl">
      {/* Ambient glows */}
      <div className="pointer-events-none absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full bg-violet-600/15 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[420px] w-[420px] rounded-full bg-blue-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-[80px]" />

      <div className="relative p-5 sm:p-8 lg:p-10">
        {/* HEADER */}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-500/20 to-indigo-500/10 shadow-lg shadow-violet-900/30">
              <svg className="h-7 w-7 text-violet-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M12 8v8m-4-4h8m5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="absolute -right-1 -top-1 h-3 w-3 animate-pulse rounded-full bg-violet-400 shadow-lg shadow-violet-400/50" />
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-violet-400/90">
                Configuración
              </p>
              <h2 className="mt-1.5 text-2xl font-bold tracking-tight text-white sm:text-[28px]">
                {existing ? "Editar rifa" : "Nueva rifa"}
              </h2>
              <p className="mt-1.5 max-w-md text-sm leading-relaxed text-slate-400">
                {existing
                  ? "Modifica los datos de esta rifa. Los números ya creados se mantienen."
                  : "Configura todos los detalles de tu próxima rifa de forma rápida y clara."}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div
            className={`flex w-fit items-center gap-2.5 rounded-full border px-4 py-2 transition-all duration-300 ${
              loading
                ? "border-amber-500/30 bg-amber-500/10"
                : success
                ? "border-emerald-500/30 bg-emerald-500/10"
                : "border-emerald-500/20 bg-emerald-500/10"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                loading
                  ? "animate-pulse bg-amber-400"
                  : success
                  ? "bg-emerald-400"
                  : "animate-pulse bg-emerald-400"
              }`}
            />
            <span
              className={`text-[11px] font-bold tracking-wider ${
                loading ? "text-amber-300" : success ? "text-emerald-300" : "text-emerald-400"
              }`}
            >
              {loading ? "PROCESANDO" : success ? "LISTO" : "LISTO"}
            </span>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 backdrop-blur-sm">
            <div className="flex gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15">
                <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-red-200">No se pudo completar</p>
                <p className="mt-1 text-sm leading-relaxed text-red-300/80">{error}</p>
              </div>
              <button
                onClick={() => setError("")}
                className="shrink-0 rounded-lg p-1.5 text-red-400/60 transition hover:bg-red-500/10 hover:text-red-300"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {success && !loading && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 backdrop-blur-sm">
            <div className="flex gap-3.5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15">
                <svg className="h-5 w-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-emerald-200">¡Éxito!</p>
                <p className="mt-1 text-sm leading-relaxed text-emerald-300/80">{success}</p>
              </div>
              <button
                onClick={() => setSuccess("")}
                className="shrink-0 rounded-lg p-1.5 text-emerald-400/60 transition hover:bg-emerald-500/10 hover:text-emerald-300"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* PROGRESO REAL */}
        {loading && (
          <div className="mb-7 overflow-hidden rounded-2xl border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm">
            <div className="flex items-center justify-between gap-3 px-5 py-3.5">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <svg className="h-5 w-5 animate-spin text-violet-400" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-20" cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" />
                    <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-violet-200">{step || "Procesando..."}</p>
              </div>
              <span className="text-sm font-bold tabular-nums text-violet-300">{progress}%</span>
            </div>

            <div className="h-1.5 bg-slate-800/80">
              <div
                className="h-full rounded-r-full bg-gradient-to-r from-violet-600 via-indigo-500 to-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* GRID PRINCIPAL */}
        <div className="grid gap-8 lg:grid-cols-[1fr_340px] xl:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            <RaffleFormFields
              name={name}
              setName={setName}
              prizeName={prizeName}
              setPrizeName={setPrizeName}
              total={total}
              setTotal={setTotal}
              price={price}
              setPrice={setPrice}
              drawDate={drawDate}
              setDrawDate={setDrawDate}
              drawTime={drawTime}
              setDrawTime={setDrawTime}
              drawMethod={drawMethod}
              setDrawMethod={setDrawMethod}
              description={description}
              setDescription={setDescription}
              whatsapp={whatsapp}
              setWhatsapp={setWhatsapp}
              file={file}
              setFile={setFile}
              loading={loading}
              totalValue={totalValue}
              formatCOP={formatCOP}
            />

            {/* BOTONES DE ACCIÓN */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleCreate}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-6 py-4.5 font-semibold text-white shadow-xl shadow-violet-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-violet-600/40 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {/* Shine effect */}
                <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                <span className="relative flex items-center justify-center gap-2.5">
                  {loading ? (
                    <>
                      <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                        <path d="M21 12a9 9 0 00-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                      </svg>
                      <span className="truncate">{step || "Procesando..."}</span>
                    </>
                  ) : (
                    <>
                      <span>{existing ? "Guardar cambios" : "Crear nueva rifa"}</span>
                      <svg
                        className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </span>
              </button>

              {existing && (
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleDelete}
                  className="group w-full rounded-2xl border border-red-500/25 bg-red-500/10 px-6 py-3.5 font-semibold text-red-400 transition-all duration-300 hover:border-red-500/40 hover:bg-red-500/15 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4.5 w-4.5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminar rifa
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* PREVIEW - Sticky en desktop */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <RafflePreview
              name={name}
              prizeName={prizeName}
              preview={preview}
              drawDate={drawDate}
              drawTime={drawTime}
              drawMethod={drawMethod}
              description={description}
              total={total}
              price={price}
              totalValue={totalValue}
              whatsapp={whatsapp}
              formatCOP={formatCOP}
            />
          </div>
        </div>
      </div>
    </div>
  );
}