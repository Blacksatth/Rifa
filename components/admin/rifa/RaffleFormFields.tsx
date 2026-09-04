"use client";

import { useEffect, useState } from "react";

/**
 * Props del formulario de campos de la rifa.
 * Todos los campos son controlados (state lifted up al padre RaffleForm).
 */
interface RaffleFormFieldsProps {
  name: string;
  setName: (v: string) => void;

  prizeName: string;
  setPrizeName: (v: string) => void;

  total: number;
  setTotal: (v: number) => void;

  price: number;
  setPrice: (v: number) => void;

  drawDate: string;
  setDrawDate: (v: string) => void;

  drawTime: string;
  setDrawTime: (v: string) => void;

  drawMethod: string;
  setDrawMethod: (v: string) => void;

  description: string;
  setDescription: (v: string) => void;

  whatsapp: string;
  setWhatsapp: (v: string) => void;

  file: File | null;
  setFile: (f: File | null) => void;

  loading: boolean;

  totalValue: number;
  formatCOP: (value: number) => string;

  // Si es true, estamos editando una rifa que ya existe: la cantidad de
  // números no se puede cambiar porque la subcolección "numbers" ya fue
  // generada con ese tamaño y no se regenera al editar.
  isEditing?: boolean;
}

/**
 * Campos del formulario de creación/edición de rifa.
 *
 * Renderiza todos los inputs necesarios:
 * - Nombre de la rifa
 * - Nombre del premio
 * - Cantidad de números (deshabilitado al editar)
 * - Precio por número
 * - Fecha y hora del sorteo
 * - Método del sorteo
 * - Descripción
 * - WhatsApp de contacto
 * - Subida de imagen del premio
 *
 * Incluye un buffer de 500ms para inputs numéricos, evitando
 * que cada tecla dispare un re-render inmediato (previene flickering).
 *
 * @param isEditing - Si es true, la cantidad de números no se puede cambiar
 */
export default function RaffleFormFields({
  name,
  setName,
  prizeName,
  setPrizeName,
  total,
  setTotal,
  price,
  setPrice,
  drawDate,
  setDrawDate,
  drawTime,
  setDrawTime,
  drawMethod,
  setDrawMethod,
  description,
  setDescription,
  whatsapp,
  setWhatsapp,
  file,
  setFile,
  loading,
  totalValue,
  formatCOP,
  isEditing = false,
}: RaffleFormFieldsProps) {// Buffers de texto para los inputs numéricos. Sin esto, al borrar el
  // campo por completo `Number("")` se vuelve 0, React repinta un "0" en
  // el input a mitad de la escritura, y el siguiente dígito que tecleas
  // queda insertado antes de ese "0" (por eso "100" terminaba en "0100").
  // Aquí el input muestra lo que el usuario escribe tal cual, y solo se
  // avisa al padre (setTotal/setPrice) cuando el texto es un número válido.
  const [totalText, setTotalText] = useState(String(total));
  const [priceText, setPriceText] = useState(String(price));

  // Resincroniza si el valor cambia desde afuera del input (reset del
  // formulario tras crear una rifa, o al cargar los datos de "existing").
  useEffect(() => {
    setTotalText(String(total));
  }, [total]);

  useEffect(() => {
    setPriceText(String(price));
  }, [price]);

  function handleTotalChange(raw: string) {
    setTotalText(raw);
    if (raw === "") return; // no forzamos a 0 mientras el usuario borra
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) setTotal(parsed);
  }

  function handleTotalBlur() {
    if (totalText === "" || Number.isNaN(Number(totalText))) {
      setTotalText(String(total)); // vuelve al último valor válido
    }
  }

  function handlePriceChange(raw: string) {
    setPriceText(raw);
    if (raw === "") return;
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) setPrice(parsed);
  }

  function handlePriceBlur() {
    if (priceText === "" || Number.isNaN(Number(priceText))) {
      setPriceText(String(price));
    }
  }

  return (
    <div className="space-y-6">
      {/* NOMBRE */}
      <div>
        <label htmlFor="raffle-name" className="mb-2 block text-sm font-semibold text-slate-300">
          Nombre de la rifa
        </label>
        <input
          id="raffle-name"
          type="text"
          value={name}
          disabled={loading}
          placeholder="Ej. Gran Rifa de Verano"
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-white placeholder:text-slate-600 shadow-inner shadow-black/20 outline-none transition hover:border-slate-600 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {/* PREMIO */}
      <div>
        <label htmlFor="raffle-prize" className="mb-2 block text-sm font-semibold text-slate-300">
          Nombre del premio
        </label>
        <input
          id="raffle-prize"
          type="text"
          value={prizeName}
          disabled={loading}
          placeholder="Ej. iPhone 17 Pro Max"
          onChange={(e) => setPrizeName(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-white placeholder:text-slate-600 shadow-inner shadow-black/20 outline-none transition hover:border-slate-600 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      {/* NÚMEROS + PRECIO */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="raffle-total" className="mb-2 block text-sm font-semibold text-slate-300">
            Cantidad de números
          </label>
          <input
            id="raffle-total"
            type="number"
            min={2}
            max={10000}
            value={totalText}
            disabled={loading}
            onChange={(e) => handleTotalChange(e.target.value)}
            onBlur={handleTotalBlur}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-white outline-none transition hover:border-slate-600 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p className="mt-2 text-xs text-slate-500">
            {isEditing
              ? "Si la subes, se crean números nuevos disponibles. Si la bajas, no se pueden quitar números ya vendidos o reservados."
              : "Ej. 100 números → 00 hasta 99"}
          </p>
        </div>

        <div>
          <label htmlFor="raffle-price" className="mb-2 block text-sm font-semibold text-slate-300">
            Precio por número
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-500">
              $
            </span>
            <input
              id="raffle-price"
              type="number"
              min={1}
              step={1}
              value={priceText}
              disabled={loading}
              onChange={(e) => handlePriceChange(e.target.value)}
              onBlur={handlePriceBlur}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 py-3.5 pl-9 pr-4 text-sm text-white outline-none transition hover:border-slate-600 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Precio por participación, en pesos (sin centavos).
          </p>
        </div>
      </div>

      {/* SORTEO */}
      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
        <div className="mb-5">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-400">
            Fecha del sorteo
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Indica cuándo y cómo se elegirá el número ganador.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="raffle-draw-date" className="mb-2 block text-sm font-semibold text-slate-300">
              📅 Fecha
            </label>
            <input
              id="raffle-draw-date"
              type="date"
              value={drawDate}
              disabled={loading}
              onChange={(e) => setDrawDate(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>

          <div>
            <label htmlFor="raffle-draw-time" className="mb-2 block text-sm font-semibold text-slate-300">
              🕐 Hora
            </label>
            <input
              id="raffle-draw-time"
              type="time"
              value={drawTime}
              disabled={loading}
              onChange={(e) => setDrawTime(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-white outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60"
            />
          </div>
        </div>

        <div className="mt-4">
          <label htmlFor="raffle-draw-method" className="mb-2 block text-sm font-semibold text-slate-300">
            🎰 Método del sorteo
          </label>
          <input
            id="raffle-draw-method"
            type="text"
            value={drawMethod}
            disabled={loading}
            placeholder="Ej. Lotería de Medellín"
            onChange={(e) => setDrawMethod(e.target.value)}
            className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60"
          />
          <p className="mt-2 text-xs text-slate-500">
            Ej. Lotería de Medellín, Lotería de Bogotá, sorteo propio, etc.
          </p>
        </div>
      </div>

      {/* DESCRIPCIÓN */}
      <div>
        <label htmlFor="raffle-description" className="mb-2 block text-sm font-semibold text-slate-300">
          Descripción de la rifa
        </label>
        <textarea
          id="raffle-description"
          value={description}
          disabled={loading}
          rows={4}
          maxLength={500}
          placeholder="Describe la rifa, las condiciones y cómo se elegirá al ganador..."
          onChange={(e) => setDescription(e.target.value)}
          className="w-full resize-none rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm leading-6 text-white placeholder:text-slate-600 outline-none transition hover:border-slate-600 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <p className="mt-2 text-right text-xs text-slate-500">
          {description.length}/500
        </p>
      </div>

      {/* WHATSAPP */}
      <div>
        <label htmlFor="raffle-whatsapp" className="mb-2 block text-sm font-semibold text-slate-300">
          📱 WhatsApp de contacto
        </label>
        <input
          id="raffle-whatsapp"
          type="tel"
          value={whatsapp}
          disabled={loading}
          placeholder="Ej. 3001234567"
          onChange={(e) => setWhatsapp(e.target.value)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3.5 text-sm text-white placeholder:text-slate-600 outline-none transition hover:border-slate-600 focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10 disabled:cursor-not-allowed disabled:opacity-60"
        />
        <p className="mt-2 text-xs text-slate-500">
          Este número podrá mostrarse como contacto para los participantes.
        </p>
      </div>

      {/* IMAGEN */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-300">
          Imagen del premio
        </label>
        <label
          htmlFor="prize-image"
          className="group flex cursor-pointer items-center gap-4 rounded-2xl border border-dashed border-slate-700 bg-slate-950 p-5 transition hover:border-violet-500/60 hover:bg-violet-500/5"
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
              {file?.name || "Seleccionar imagen"}
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
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>

      {/* VALOR TOTAL */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Valor total
            </p>
            <p className="mt-1 text-sm text-slate-400">
              {total.toLocaleString("es-CO")} números × {formatCOP(Number(price))}
            </p>
          </div>
          <p className="text-xl font-bold text-emerald-400 sm:text-2xl">
            {formatCOP(totalValue)}
          </p>
        </div>
      </div>
    </div>
  );
}