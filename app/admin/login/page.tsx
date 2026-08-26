"use client";

import { useState } from "react";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleLogin() {
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/admin");
    } catch {
      setError("El correo o la contraseña no son correctos.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleLogin() {
    setError("");
    setLoading(true);

    try {
      const provider = new GoogleAuthProvider();

      await signInWithPopup(auth, provider);

      router.push("/admin");
    } catch (error) {
      console.error(error);
      setError("No se pudo iniciar sesión con Google.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-10 relative overflow-hidden">

      {/* Fondos decorativos */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-violet-600/30 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/30 rounded-full blur-3xl" />

      {/* Grid decorativo */}
      <div className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
 <Header  raffle />
      {/* Card */}
      <div className="relative w-full max-w-md">

        <div className="absolute -inset-1 bg-gradient-to-r from-violet-600 via-blue-500 to-cyan-400 rounded-3xl blur opacity-20" />

        <div className="relative bg-white/[0.07] backdrop-blur-2xl border border-white/10 rounded-3xl shadow-2xl p-8">

          {/* Logo */}
          <div className="flex justify-center mb-7">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg shadow-violet-600/30">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-7a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2zm10-11V7a4 4 0 00-8 0v3h8z"
                />
              </svg>
            </div>
          </div>

          {/* Título */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Bienvenido
            </h1>

            <p className="text-slate-400 mt-2 text-sm">
              Accede al panel de administración
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3">
              <svg
                className="w-5 h-5 text-red-400 shrink-0 mt-0.5"
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

              <p className="text-sm text-red-300">
                {error}
              </p>
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Correo electrónico
            </label>

            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-3.51 7.12"
                />
              </svg>

              <input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-12 py-3.5 text-white placeholder:text-slate-600 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
              />
            </div>
          </div>

          {/* Password */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Contraseña
            </label>

            <div className="relative">
              <svg
                className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-7a2 2 0 00-2-2H6a2 2 0 00-2 2v7a2 2 0 002 2zm10-11V7a4 4 0 00-8 0v3h8z"
                />
              </svg>

              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleLogin();
                  }
                }}
                className="w-full rounded-xl border border-white/10 bg-black/20 px-12 py-3.5 text-white placeholder:text-slate-600 outline-none transition focus:border-violet-500 focus:ring-4 focus:ring-violet-500/10"
              />
            </div>
          </div>

          {/* Login */}
          <button
            onClick={handleLogin}
            disabled={loading}
            className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3.5 font-semibold text-white shadow-lg shadow-violet-600/20 transition-all duration-300 hover:scale-[1.01] hover:shadow-violet-600/40 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {loading ? (
                <>
                  <svg
                    className="h-5 w-5 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    />
                  </svg>

                  Iniciando sesión...
                </>
              ) : (
                <>
                  Entrar al panel

                  <svg
                    className="w-5 h-5 transition-transform group-hover:translate-x-1"
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

          {/* Separador */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-xs uppercase tracking-wider text-slate-500">
              o continúa con
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/5 py-3.5 font-medium text-white transition-all hover:bg-white/10 hover:border-white/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fill="#4285F4"
                d="M21.35 12.23c0-.79-.07-1.55-.21-2.28H12v4.31h5.23a4.47 4.47 0 0 1-1.94 2.93v2.8h3.14c1.84-1.69 2.92-4.18 2.92-7.76Z"
              />
              <path
                fill="#34A853"
                d="M12 21.7c2.61 0 4.8-.86 6.4-2.34l-3.14-2.8c-.87.58-1.98.92-3.26.92-2.51 0-4.64-1.7-5.4-3.98H3.35v2.89A9.67 9.67 0 0 0 12 21.7Z"
              />
              <path
                fill="#FBBC05"
                d="M6.6 13.5a5.81 5.81 0 0 1 0-3.72V6.89H3.35a9.7 9.7 0 0 0 0 9.5L6.6 13.5Z"
              />
              <path
                fill="#EA4335"
                d="M12 5.92c1.42 0 2.69.49 3.69 1.44l2.77-2.77C16.8 3.04 14.61 2.1 12 2.1a9.67 9.67 0 0 0-8.65 5.3L6.6 10.28C7.36 7.62 9.49 5.92 12 5.92Z"
              />
            </svg>

            Continuar con Google
          </button>

          {/* Footer */}
                <p className="text-center text-xs text-slate-500 mt-7">
        Área exclusiva para administradores
      </p>
    </div>
  </div>
</main>
  );
}
