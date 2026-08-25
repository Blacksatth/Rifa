"use client";

import { useRouter } from "next/navigation";

export default function AdminButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/admin/login")}
      className="
        group
        flex items-center gap-2
        rounded-xl
        border border-white/10
        bg-white/[0.04]
        px-4 py-2.5
        text-sm font-semibold
        text-slate-300
        backdrop-blur-xl
        transition-all duration-300
        hover:border-violet-500/30
        hover:bg-violet-500/10
        hover:text-white
        hover:shadow-lg
        hover:shadow-violet-500/10
      "
    >
      <svg
        className="h-4 w-4 text-violet-400 transition-transform duration-300 group-hover:scale-110"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 15.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06-1.7 1.7-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V20h-2.4v-.3a1.65 1.65 0 00-1-1.51 1.65 1.65 0 00-1.82.33l-.06.06-1.7-1.7.06-.06A1.65 1.65 0 008.6 15a1.65 1.65 0 00-1.51-1H6.8v-2.4h.29a1.65 1.65 0 001.51-1 1.65 1.65 0 00-.33-1.82l-.06-.06 1.7-1.7.06.06a1.65 1.65 0 001.82.33 1.65 1.65 0 001-1.51V5.6h2.4v.3a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06 1.7 1.7-.06.06a1.65 1.65 0 00-.33 1.82 1.65 1.65 0 001.51 1h.29V14h-.29a1.65 1.65 0 00-1.51 1z"
        />
      </svg>

      <span>Admin</span>
    </button>
  );
}