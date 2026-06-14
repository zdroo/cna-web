"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { resetPassword } from "@/lib/api/auth";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token") ?? "";

    const [password, setPassword]           = useState("");
    const [confirm, setConfirm]             = useState("");
    const [showPassword, setShowPassword]   = useState(false);
    const [showConfirm, setShowConfirm]     = useState(false);
    const [loading, setLoading]             = useState(false);
    const [done, setDone]                   = useState(false);
    const [error, setError]                 = useState<string | null>(null);

    useEffect(() => {
        if (!token) setError("Link invalid. Solicită un nou email de resetare.");
    }, [token]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (password !== confirm) { setError("Parolele nu coincid."); return; }
        if (password.length < 8) { setError("Parola trebuie să aibă cel puțin 8 caractere."); return; }
        if (!/[A-Z]/.test(password)) { setError("Parola trebuie să conțină cel puțin o literă mare."); return; }
        if (!/[0-9]/.test(password)) { setError("Parola trebuie să conțină cel puțin o cifră."); return; }
        setError(null);
        setLoading(true);
        try {
            await resetPassword(token, password);
            setDone(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : "A apărut o eroare.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 w-full max-w-md p-8 flex flex-col gap-6">
                {done && (
                    <button
                        onClick={() => router.push("/auth/login")}
                        className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                        aria-label="Închide"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                )}
                <div className="text-center">
                    <Link href="/" className="text-xl font-bold text-gray-900 dark:text-gray-100">CNA Shop</Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4">Parolă nouă</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Alege o parolă nouă pentru contul tău.</p>
                </div>

                {done ? (
                    <div className="flex flex-col gap-4">
                        <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl px-5 py-4 text-center">
                            <p className="text-sm font-medium text-green-700 dark:text-green-300">
                                Parola a fost schimbată cu succes!
                            </p>
                        </div>
                        <button
                            onClick={() => router.push("/auth/login")}
                            className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                        >
                            Autentifică-te
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Parolă nouă</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 pr-11 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 focus:border-transparent transition"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    tabIndex={-1}
                                    aria-label={showPassword ? "Ascunde parola" : "Afișează parola"}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {password.length > 0 && (
                                <ul className="flex flex-col gap-0.5 mt-1">
                                    {[
                                        { ok: password.length >= 8, label: "Minim 8 caractere" },
                                        { ok: /[A-Z]/.test(password), label: "Cel puțin o literă mare" },
                                        { ok: /[0-9]/.test(password), label: "Cel puțin o cifră" },
                                    ].map(({ ok, label }) => (
                                        <li key={label} className={`text-xs flex items-center gap-1.5 ${ok ? "text-green-600 dark:text-green-400" : "text-gray-400 dark:text-gray-500"}`}>
                                            <span className="text-base leading-none">{ok ? "✓" : "·"}</span>
                                            {label}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirmă parola</label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? "text" : "password"}
                                    required
                                    value={confirm}
                                    onChange={e => setConfirm(e.target.value)}
                                    placeholder="••••••••"
                                    className={`w-full border rounded-xl px-4 py-2.5 pr-11 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:border-transparent transition ${
                                        confirm.length > 0 && confirm !== password
                                            ? "border-red-400 dark:border-red-600 focus:ring-red-400 dark:focus:ring-red-600"
                                            : "border-gray-200 dark:border-gray-700 focus:ring-gray-900 dark:focus:ring-gray-500"
                                    }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((v) => !v)}
                                    tabIndex={-1}
                                    aria-label={showConfirm ? "Ascunde parola" : "Afișează parola"}
                                    className="absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {confirm.length > 0 && confirm !== password && (
                                <p className="text-xs text-red-500 dark:text-red-400">Parolele nu coincid</p>
                            )}
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-4 py-2.5">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !token || confirm !== password}
                            className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                        >
                            {loading ? "Se salvează..." : "Salvează parola"}
                        </button>
                    </form>
                )}

            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense>
            <ResetPasswordForm />
        </Suspense>
    );
}
