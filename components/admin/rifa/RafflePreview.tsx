"use client";

/**
 * Props del preview en tiempo real de la rifa.
 */
interface RafflePreviewProps {
  name: string;
  prizeName: string;
  preview: string;
  drawDate: string;
  drawTime: string;
  drawMethod: string;
  description: string;
  total: number;
  price: number;
  totalValue: number;
  whatsapp: string;
  formatCOP: (value: number) => string;
}

/**
 * Preview en tiempo real de la rifa que se está configurando.
 *
 * Tarjeta sticky en el sidebar que muestra cómo se verá la rifa
 * con los datos actuales del formulario:
 * - Imagen del premio (o placeholder)
 * - Nombre de la rifa
 * - Nombre del premio
 * - Descripción
 * - Información del sorteo (fecha, hora, método)
 * - Total de números y valor total recaudable
 * - Contacto WhatsApp
 *
 * Se actualiza instantáneamente al modificar cualquier campo del formulario.
 */
export default function RafflePreview({
  name,
  prizeName,
  preview,
  drawDate,
  drawTime,
  drawMethod,
  description,
  total,
  price,
  totalValue,
  whatsapp,
  formatCOP,
}: RafflePreviewProps) {
  const hasContent =
    name || prizeName || preview || drawDate || description || total > 0;

  const formattedDate = drawDate
    ? new Date(drawDate + "T00:00:00").toLocaleDateString("es-CO", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="space-y-4">
      {/* Header del preview */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-violet-400" />
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Vista previa
          </p>
        </div>
        <span className="rounded-full border border-slate-700 bg-slate-800/80 px-2.5 py-1 text-[10px] font-medium text-slate-400">
          En vivo
        </span>
      </div>

      {/* Card principal */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-slate-800/80 to-slate-900/90 shadow-2xl shadow-black/40 backdrop-blur-sm transition-all duration-500">
        {/* Imagen del premio */}
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-950">
          {preview ? (
            <>
              <img
                src={preview}
                alt={prizeName || "Premio"}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-900 to-slate-950">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/50">
                <svg
                  className="h-8 w-8 text-slate-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-8h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm text-slate-500">Sin imagen</p>
            </div>
          )}

          {/* Badge de precio */}
          {price > 0 && (
            <div className="absolute right-3 top-3">
              <div className="rounded-xl border border-white/10 bg-black/60 px-3 py-1.5 backdrop-blur-md">
                <p className="text-[10px] font-medium uppercase tracking-wider text-slate-300">
                  Por número
                </p>
                <p className="text-sm font-bold text-white">
                  {formatCOP(price)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Contenido */}
        <div className="space-y-4 p-5">
          {/* Título y premio */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-400">
              {name || "Nombre de la rifa"}
            </p>
            <h3 className="mt-1.5 text-xl font-bold leading-tight text-white">
              {prizeName || "Nombre del premio"}
            </h3>
          </div>

          {/* Descripción */}
          {description ? (
            <p className="line-clamp-3 text-sm leading-relaxed text-slate-400">
              {description}
            </p>
          ) : (
            <p className="text-sm italic text-slate-600">
              La descripción aparecerá aquí...
            </p>
          )}

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent" />

          {/* Info del sorteo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Números
              </p>
              <p className="mt-1 text-lg font-bold text-white">
                {total > 0 ? total.toLocaleString("es-CO") : "—"}
              </p>
            </div>

            <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-3">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Valor total
              </p>
              <p className="mt-1 text-lg font-bold text-emerald-400">
                {totalValue > 0 ? formatCOP(totalValue) : "—"}
              </p>
            </div>
          </div>

          {/* Fecha y método */}
          <div className="space-y-2.5 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3.5">
            <div className="flex items-start gap-2.5">
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400/80">
                  Sorteo
                </p>
                <p className="mt-0.5 text-sm font-medium text-white">
                  {formattedDate || "Fecha por definir"}
                  {drawTime && (
                    <span className="text-slate-400"> · {drawTime}</span>
                  )}
                </p>
              </div>
            </div>

            {drawMethod && (
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/15 text-violet-400">
                  <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-violet-400/80">
                    Método
                  </p>
                  <p className="mt-0.5 text-sm font-medium text-white">
                    {drawMethod}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* WhatsApp */}
          {whatsapp && (
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400/80">
                  Contacto
                </p>
                <p className="text-sm font-medium text-white">{whatsapp}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Empty state helper */}
      {!hasContent && (
        <p className="text-center text-xs text-slate-500">
          Completa el formulario para ver la vista previa
        </p>
      )}
    </div>
  );
}