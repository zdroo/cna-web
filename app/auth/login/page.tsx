"use client";

import { useState } from "react";
import Link from "next/link";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
    const { login, register, loginWithGoogle } = useAuth();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        if (mode === "register" && password !== confirmPassword) {
            setError("Parolele nu coincid");
            return;
        }
        setLoading(true);
        try {
            if (mode === "login") {
                await login(email, password);
            } else {
                await register(email, password);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "A apărut o eroare");
        } finally {
            setLoading(false);
        }
    }

    async function handleGoogleSuccess(credentialResponse: CredentialResponse) {
        if (!credentialResponse.credential) return;
        setError(null);
        setLoading(true);
        try {
            await loginWithGoogle(credentialResponse.credential);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Autentificare Google eșuată");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 w-full max-w-md p-8 flex flex-col gap-6">

                {/* Header */}
                <div className="text-center">
                    <Link href="/" className="text-xl font-bold text-gray-900">CNA Shop</Link>
                    <h1 className="text-2xl font-bold text-gray-900 mt-4">
                        {mode === "login" ? "Bun venit înapoi" : "Creează cont"}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {mode === "login" ? "Intră în contul tău" : "Înregistrează-te pentru a continua"}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="exemplu@email.com"
                            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700">Parolă</label>
                        <input
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                        />
                    </div>

                    {mode === "register" && (
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700">Confirmă parola</label>
                            <input
                                type="password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="••••••••"
                                className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"
                            />
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2.5">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-gray-900 text-white py-2.5 rounded-xl font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                    >
                        {loading ? "Se procesează..." : mode === "login" ? "Intră în cont" : "Creează cont"}
                    </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-gray-100" />
                    <span className="text-xs text-gray-400">sau</span>
                    <div className="flex-1 h-px bg-gray-100" />
                </div>

                {/* Google */}
                <div className="flex justify-center">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError("Autentificare Google eșuată")}
                        text="continue_with"
                        shape="rectangular"
                        size="large"
                        width="368"
                        locale="ro"
                    />
                </div>

                {/* Toggle */}
                <p className="text-center text-sm text-gray-500">
                    {mode === "login" ? "Nu ai cont?" : "Ai deja cont?"}{" "}
                    <button
                        onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); setConfirmPassword(""); }}
                        className="font-semibold text-gray-900 hover:underline"
                    >
                        {mode === "login" ? "Înregistrează-te" : "Autentifică-te"}
                    </button>
                </p>
            </div>
        </div>
    );
}
