"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
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

const MAX_NUMBERS = 10000;
const BATCH_LIMIT = 500;

// ==========================================
// FORMATEAR DINERO (fuera del componente: no depende de props/estado)
// ==========================================
function formatCOP(value: number) {
  return Number(value || 0).toLocaleString("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

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
  // AVISO AL CERRAR LA PESTAÑA MIENTRAS SE PROCESA
  // (crear/eliminar una rifa grande puede tardar por los batches de Firestore)
  // ==========================================
  useEffect(() => {
    if (!loading) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [loading]);

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
  // VALOR TOTAL (memoizado)
  // ==========================================
  const totalValue = useMemo(
    () => Number(total || 0) * Number(price || 0),
    [total, price]
  );

  // ==========================================
  // GENERAR NÚMEROS EN BATCHES, CON PROGRESO
  // ==========================================
  async function generateNumbers(raffleId: string, totalNumbers: number, digits: number) {
    let batch = writeBatch(db);
    let batchCount = 0;

    for (let i = 0; i < totalNumbers; i++) {
      const numStr = String(i).padStart(digits, "0");
      const numberRef = doc(db, "raffles", raffleId, "numbers", numStr);

      batch.set(numberRef, {
        number: numStr,
        status: "available",
        buyerName: null,
        buyerPhone: null,
      });

      batchCount++;

      if (batchCount === BATCH_LIMIT || i === totalNumbers - 1) {
        const currentProgress = 22 + Math.round(((i + 1) / totalNumbers) * 70);
        setProgress(Math.min(currentProgress, 92));
        setStep(`Creando números... ${i + 1} / ${totalNumbers}`);

        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    }
  }

  // ==========================================
  // AJUSTAR NÚMEROS AL EDITAR (subir o bajar la cantidad)
  // ==========================================
  // Si sube la cantidad: crea los números nuevos como disponibles.
  // Si baja la cantidad: primero verifica que ninguno de los números que
  // se eliminarían esté vendido/reservado; si lo está, aborta sin escribir nada.
  // Si cambia el ancho de dígitos (ej. de 2 a 3 porque pasó de 100 a 1000
  // números), "renombra" los números que sobreviven al nuevo formato para
  // que todos queden con el mismo padding, conservando su estado y comprador.
  async function syncNumbersOnEdit(
    raffleId: string,
    oldTotal: number,
    newTotal: number,
    oldDigits: number,
    newDigits: number
  ) {
    if (newTotal === oldTotal && newDigits === oldDigits) return;

    setStep("Verificando números existentes...");
    setProgress(25);

    const numbersRef = collection(db, "raffles", raffleId, "numbers");
    const snapshot = await getDocs(numbersRef);

    // Índice numérico -> datos actuales, sin importar el padding con el
    // que estén guardados hoy.
    const byIndex = new Map<
      number,
      { status: string; buyerName: string | null; buyerPhone: string | null }
    >();
    snapshot.docs.forEach((d) => {
      const idx = Number(d.id);
      if (!Number.isNaN(idx)) {
        const data = d.data() as any;
        byIndex.set(idx, {
          status: data?.status ?? "available",
          buyerName: data?.buyerName ?? null,
          buyerPhone: data?.buyerPhone ?? null,
        });
      }
    });

    // No se puede reducir si alguno de los números a eliminar ya está vendido/reservado.
    if (newTotal < oldTotal) {
      const taken: number[] = [];
      for (let i = newTotal; i < oldTotal; i++) {
        const entry = byIndex.get(i);
        if (entry && entry.status !== "available") taken.push(i);
      }
      if (taken.length > 0) {
        const example = String(taken[0]).padStart(oldDigits, "0");
        throw new Error(
          `No puedes reducir a ${newTotal} números: ${taken.length} de los que se eliminarían ya están vendidos o reservados (ej. el ${example}). Libéralos primero o elige una cantidad mayor.`
        );
      }
    }

    setStep("Ajustando números...");

    let batch = writeBatch(db);
    let batchCount = 0;
    const flush = async () => {
      if (batchCount > 0) {
        await batch.commit();
        batch = writeBatch(db);
        batchCount = 0;
      }
    };

    // 1. Borrar los que quedan fuera del nuevo rango.
    for (let i = newTotal; i < oldTotal; i++) {
      const oldId = String(i).padStart(oldDigits, "0");
      batch.delete(doc(db, "raffles", raffleId, "numbers", oldId));
      batchCount++;
      if (batchCount >= BATCH_LIMIT) await flush();
    }
    await flush();

    // 2. Si cambió el ancho de dígitos, migrar los que sobreviven al nuevo formato.
    if (newDigits !== oldDigits) {
      const survivingCount = Math.min(oldTotal, newTotal);
      for (let i = 0; i < survivingCount; i++) {
        const oldId = String(i).padStart(oldDigits, "0");
        const newId = String(i).padStart(newDigits, "0");
        if (oldId === newId) continue;

        const entry = byIndex.get(i) ?? { status: "available", buyerName: null, buyerPhone: null };
        batch.set(doc(db, "raffles", raffleId, "numbers", newId), {
          number: newId,
          status: entry.status,
          buyerName: entry.buyerName,
          buyerPhone: entry.buyerPhone,
        });
        batch.delete(doc(db, "raffles", raffleId, "numbers", oldId));
        batchCount += 2;
        if (batchCount >= BATCH_LIMIT) await flush();
      }
      await flush();
    }

    // 3. Crear los números nuevos si subió la cantidad.
    for (let i = oldTotal; i < newTotal; i++) {
      const newId = String(i).padStart(newDigits, "0");
      batch.set(doc(db, "raffles", raffleId, "numbers", newId), {
        number: newId,
        status: "available",
        buyerName: null,
        buyerPhone: null,
      });
      batchCount++;
      if (batchCount >= BATCH_LIMIT) await flush();
    }
    await flush();

    setProgress(90);
  }

  // ==========================================
  // GUARDAR / EDITAR RIFA
  // ==========================================
  async function handleCreate() {
    if (loading) return;

    setError("");
    setSuccess("");
    setStep("");
    setProgress(0);

    // Normalizamos primero, porque el estado puede llegar como string
    // desde algunos inputs controlados.
    const totalNum = Number(total);
    const priceNum = Number(price);

    // VALIDACIONES
    if (!name.trim()) return setError("Escribe el nombre de la rifa.");
    if (!prizeName.trim()) return setError("Escribe el nombre del premio.");
    if (!Number.isInteger(totalNum) || totalNum < 2)
      return setError("La cantidad de números debe ser un número entero mayor a 1.");
    if (totalNum > MAX_NUMBERS)
      return setError(`La cantidad máxima es de ${MAX_NUMBERS.toLocaleString("es-CO")} números por rifa.`);
    if (!Number.isFinite(priceNum) || priceNum <= 0)
      return setError("El precio debe ser mayor que 0.");
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

      const digits = Math.max(2, String(totalNum - 1).length);

      const raffleData = {
        name: name.trim(),
        prizeName: prizeName.trim(),
        prizeImageUrl: imageUrl,
        totalNumbers: totalNum,
        price: priceNum,
        digits,
        drawDate,
        drawTime,
        drawMethod: drawMethod.trim(),
        description: description.trim(),
        whatsapp: whatsapp.trim(),
        updatedAt: serverTimestamp(),
      };

      // 2. EDITAR
      if (existing?.id) {
        const oldTotal = existing.totalNumbers;
        const oldDigits = (existing as any).digits ?? Math.max(2, String(oldTotal - 1).length);

        if (totalNum !== oldTotal || digits !== oldDigits) {
          try {
            await syncNumbersOnEdit(existing.id, oldTotal, totalNum, oldDigits, digits);
          } catch (err: any) {
            // No tocamos el documento de la rifa si el ajuste de números falló
            // (p.ej. porque intentabas reducir números ya vendidos).
            throw new Error(err?.message || "No se pudo ajustar la cantidad de números.");
          }
        }

        setStep("Guardando cambios...");
        setProgress(95);
        await updateDoc(doc(db, "raffles", existing.id), raffleData);
        setProgress(100);
        setSuccess("¡Rifa actualizada correctamente!");
        setStep("");
        return;
      }

      // 3. CREAR NUEVA RIFA
      setStep("Creando rifa...");
      setProgress(22);

      let raffleId: string;
      try {
        const raffleRef = await addDoc(collection(db, "raffles"), {
          ...raffleData,
          active: true,
          createdAt: serverTimestamp(),
        });
        raffleId = raffleRef.id;
      } catch (err: any) {
        throw new Error(
          err?.code === "permission-denied"
            ? "Firebase rechazó la creación de la rifa. Revisa las reglas de Firestore."
            : err?.message || "No se pudo crear el registro de la rifa."
        );
      }

      // 4. CREAR NÚMEROS CON PROGRESO REAL
      setStep("Generando números...");
      try {
        await generateNumbers(raffleId, totalNum, digits);
      } catch (err: any) {
        // Rollback: si fallan los números, no dejamos una rifa huérfana
        // sin (o con solo parte de) sus números.
        try {
          await deleteDoc(doc(db, "raffles", raffleId));
        } catch {
          // Si ni el rollback funciona, al menos avisamos con detalle abajo.
        }
        throw new Error(
          (err?.message ? err.message + " " : "") +
            "No se pudieron generar los números y se revirtió la creación de la rifa. Intenta de nuevo."
        );
      }

      setProgress(100);
      setStep("");
      setSuccess(
        `¡Rifa creada con éxito! ${totalNum} números generados • ${formatCOP(priceNum)} c/u`
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

        if (batchCount === BATCH_LIMIT || i === totalDocs - 1) {
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

  const dismissError = useCallback(() => setError(""), []);
  const dismissSuccess = useCallback(() => setSuccess(""), []);

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
                : "border-emerald-500/20 bg-emerald-500/10"
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                loading ? "animate-pulse bg-amber-400" : "animate-pulse bg-emerald-400"
              }`}
            />
            <span
              className={`text-[11px] font-bold tracking-wider ${
                loading ? "text-amber-300" : "text-emerald-400"
              }`}
            >
              {loading ? "PROCESANDO" : "LISTO"}
            </span>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div
            role="alert"
            aria-live="assertive"
            className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300 rounded-2xl border border-red-500/25 bg-red-500/10 p-4 backdrop-blur-sm"
          >
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
                type="button"
                onClick={dismissError}
                aria-label="Cerrar mensaje de error"
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
          <div
            role="status"
            aria-live="polite"
            className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 backdrop-blur-sm"
          >
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
                type="button"
                onClick={dismissSuccess}
                aria-label="Cerrar mensaje de éxito"
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
          <div
            role="status"
            aria-live="polite"
            className="mb-7 overflow-hidden rounded-2xl border border-violet-500/20 bg-violet-500/5 backdrop-blur-sm"
          >
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
              isEditing={!!existing}
            />

            {/* BOTONES DE ACCIÓN */}
            <div className="flex flex-col gap-3 pt-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleCreate}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-6 py-4 font-semibold text-white shadow-xl shadow-violet-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-violet-600/40 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
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
                    <svg className="h-5 w-5 transition-transform group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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