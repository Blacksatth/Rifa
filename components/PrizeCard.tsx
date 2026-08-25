import { Raffle } from "@/lib/types";
import { Space_Grotesk } from "next/font/google";

// Same display face used across the admin components. If it's already
// declared once in app/layout.tsx, import that shared instance instead.
const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-ticket",
});

export default function PrizeCard({ raffle }: { raffle: Raffle }) {
  const formattedPrice = formatPrice(raffle.price);

  return (
    <article
      className={`${display.variable} group relative mb-6 overflow-hidden rounded-3xl border border-white/10 bg-[#12141c] shadow-xl shadow-black/30 transition-transform duration-300 hover:-translate-y-0.5`}
    >
      {/* ================= PRIZE IMAGE ================= */}
      <div className="relative h-56 w-full overflow-hidden">
        {raffle.prizeImageUrl ? (
          <img
            src={raffle.prizeImageUrl}
            alt={raffle.prizeName ? `Premio: ${raffle.prizeName}` : "Premio de la rifa"}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-violet-600/40 to-blue-600/40">
            <TicketIcon className="h-9 w-9 text-white/70" />
            <span className="text-xs font-medium text-white/60">Sin imagen del premio</span>
          </div>
        )}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/10" />

        <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-sm">
          <TicketIcon className="h-3.5 w-3.5" />
          Premio oficial
        </span>
      </div>

      {/* ================= PERFORATION ================= */}
      <div
        className="relative h-0 w-full"
        style={{
          backgroundImage:
            "repeating-linear-gradient(to right, rgba(255,255,255,0.18) 0 6px, transparent 6px 12px)",
          height: "1px",
        }}
        aria-hidden="true"
      />

      {/* ================= STUB ================= */}
      <div className="relative px-5 pb-5 pt-6 sm:px-6">
        {/* price stamp */}
        <div className="absolute -top-5 right-5 -rotate-6 rounded-xl border border-dashed border-amber-400/40 bg-[#12141c] px-3 py-1.5 shadow-lg shadow-black/30 sm:right-6">
          <p
            style={{ fontFamily: "var(--font-ticket)" }}
            className="text-sm font-bold leading-none tracking-tight text-amber-300"
          >
            {formattedPrice}
          </p>
          <p className="mt-0.5 text-center text-[8px] font-semibold uppercase tracking-wider text-amber-400/70">
            por número
          </p>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-400">Rifa</p>

        <h1
          style={{ fontFamily: "var(--font-ticket)" }}
          className="mt-1 text-2xl font-bold leading-tight tracking-tight text-white"
        >
          {raffle.name}
        </h1>

        <div className="mt-3 flex items-start gap-2.5 text-sm text-slate-400">
          <GiftIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
          <p>
            Premio: <span className="font-medium text-slate-200">{raffle.prizeName}</span>
          </p>
        </div>
      </div>
    </article>
  );
}

function formatPrice(price: Raffle["price"]) {
  const value = typeof price === "string" ? Number(price) : price;
  if (typeof value === "number" && !Number.isNaN(value)) {
    return `$${value.toLocaleString("es-CO")}`;
  }
  return `$${price}`;
}

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

function GiftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
        d="M20 12v9H4v-9M2 7h20v5H2V7zm10 0V4a2 2 0 10-2 2h2zm0 0V4a2 2 0 112 2h-2z"
      />
    </svg>
  );
}