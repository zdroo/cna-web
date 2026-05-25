"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/api/auth";

export default function ForgotPasswordPage() {
    const [email, setEmail]       = useState("");
    const [loading, setLoading]   = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError]       = useState<string | null>(null);

    function isValidEmail(value: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim());
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (!isValidEmail(email)) {
            setError("Adresa de email nu este validă.");
            return;
        }
        setLoading(true);
        try {
            await forgotPassword(email);
            setSubmitted(true);
        } catch {
            setError("A apărut o eroare. Încearcă din nou.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 w-full max-w-md p-8 flex flex-col gap-6">
                <div className="text-center">
                    <Link href="/" className="text-xl font-bold text-gray-900 dark:text-gray-100">CNA Shop</Link>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4">Resetare parolă</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                        Introdu adresa de email și îți vom trimite un link de resetare.
                    </p>
                </div>

                {submitted ? (
                    <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl px-5 py-4 text-center">
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">
                            Dacă adresa există în sistem, vei primi un email cu instrucțiuni în câteva minute.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="exemplu@email.com"
                                className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 focus:border-transparent transition"
                            />
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-4 py-2.5">{error}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                        >
                            {loading ? "Se trimite..." : "Trimite link de resetare"}
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
