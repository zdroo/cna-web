"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resetPassword } from "@/lib/api/auth";

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token") ?? "";

    const [password, setPassword]           = useState("");
    const [confirm, setConfirm]             = useState("");
    const [loading, setLoading]             = useState(false);
    const [done, setDone]                   = useState(false);
    const [error, setError]                 = useState<string | null>(null);

    useEffect(() => {
        if (!token) setError("Link invalid. Solicită un nou email de resetare.");
    }, [token]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (password !== confirm) { setError("Parolele nu coincid."); return; }
        if (password.length < 6) { setError("Parola trebuie să aibă cel puțin 6 caractere."); return; }
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
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 w-full max-w-md p-8 flex flex-col gap-6">
                <div className="text-center">
                    <Link href="/" className="text-xl font-bold text-gray-900 dark:text-gray-100">CNA Shop</Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4">Parolă nouă</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Alege o parolă nouă pentru contul tău.</p>
                </div>

                {done ? (
                    <div className="flex flex-col gap-4">
                        <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl px-5 py-4 text-center">
                            <p className="text-sm font-medium text-green-700 dark:text-green-300">
                                Parola a fost resetată cu succes!
                            </p>
                        </div>
                        <button
                            onClick={() => router.push("/auth/login")}
                            className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                        >
                            Intră în cont
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Parolă nouă</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 focus:border-transparent transition"
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirmă parola</label>
                            <input
                                type="password"
                                required
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                placeholder="••••••••"
                                className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 focus:border-transparent transition"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-4 py-2.5">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !token}
                            className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                        >
                            {loading ? "Se salvează..." : "Salvează parola"}
                        </button>
                    </form>
                )}

                <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                    <Link href="/auth/login" className="font-semibold text-gray-900 dark:text-gray-100 hover:underline">
                        Înapoi la autentificare
                    </Link>
                </p>
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
