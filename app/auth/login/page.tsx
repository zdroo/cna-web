"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useAuth } from "@/context/AuthContext";
import { resendConfirmationEmail } from "@/lib/api/auth";

export default function LoginPage() {
    const { login, register, loginWithGoogle, user, isLoaded } = useAuth();
    const router = useRouter();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
    const [resendDone, setResendDone] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

    useEffect(() => {
        if (isLoaded && user) router.replace("/");
    }, [isLoaded, user, router]);

    if (!isLoaded || user) return null;

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setEmailNotConfirmed(false);
        setResendDone(false);
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
                setRegisteredEmail(email);
                return;
            }
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : "A apărut o eroare";
            if (msg === "EMAIL_NOT_CONFIRMED") {
                setEmailNotConfirmed(true);
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    }

    async function handleResend() {
        setResendDone(false);
        await resendConfirmationEmail(email);
        setResendDone(true);
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
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 w-full max-w-md p-8 flex flex-col gap-6">

                {/* Post-registration: check email */}
                {registeredEmail && (
                    <div className="flex flex-col items-center gap-5 py-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-green-50 dark:bg-green-950 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-green-600 dark:text-green-400">
                                <rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Verifică emailul</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Am trimis un link de confirmare la{" "}
                                <span className="font-medium text-gray-700 dark:text-gray-300">{registeredEmail}</span>.
                                Apasă linkul din email pentru a-ți activa contul.
                            </p>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            Nu ai primit emailul?{" "}
                            {resendDone ? (
                                <span className="text-green-600 dark:text-green-400 font-medium">Retrimis!</span>
                            ) : (
                                <button
                                    type="button"
                                    onClick={async () => { await resendConfirmationEmail(registeredEmail); setResendDone(true); }}
                                    className="font-semibold text-gray-700 dark:text-gray-300 hover:underline"
                                >
                                    Retrimite
                                </button>
                            )}
                        </p>
                        <button
                            onClick={() => { setRegisteredEmail(null); setMode("login"); setResendDone(false); }}
                            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                        >
                            Înapoi la autentificare
                        </button>
                    </div>
                )}

                {/* Login / register form */}
                {!registeredEmail && (
                    <>
                        <div className="text-center">
                            <Link href="/" className="text-xl font-bold text-gray-900 dark:text-gray-100">CNA Shop</Link>
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4">
                                {mode === "login" ? "Bun venit înapoi" : "Creează cont"}
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                                {mode === "login" ? "Intră în contul tău" : "Înregistrează-te pentru a continua"}
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="exemplu@email.com"
                                    className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 focus:border-transparent transition"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Parolă</label>
                                    {mode === "login" && (
                                        <Link href="/auth/forgot-password" className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                                            Ai uitat parola?
                                        </Link>
                                    )}
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 focus:border-transparent transition"
                                />
                            </div>

                            {mode === "register" && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirmă parola</label>
                                    <input
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 focus:border-transparent transition"
                                    />
                                </div>
                            )}

                            {error && (
                                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950/40 rounded-lg px-4 py-2.5">{error}</p>
                            )}

                            {emailNotConfirmed && (
                                <div className="bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800 rounded-lg px-4 py-3 text-sm text-yellow-800 dark:text-yellow-300 flex flex-col gap-1.5">
                                    <p>Adresa de email nu a fost confirmată. Verifică inbox-ul.</p>
                                    {resendDone ? (
                                        <p className="font-medium text-green-700 dark:text-green-400">Email retrimis!</p>
                                    ) : (
                                        <button type="button" onClick={handleResend} className="text-left font-semibold underline hover:no-underline">
                                            Retrimite emailul de confirmare
                                        </button>
                                    )}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="bg-gray-900 text-white py-2.5 rounded-xl font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                            >
                                {loading ? "Se procesează..." : mode === "login" ? "Intră în cont" : "Creează cont"}
                            </button>
                        </form>

                        <div className="flex items-center gap-3">
                            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                            <span className="text-xs text-gray-400 dark:text-gray-500">sau</span>
                            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
                        </div>

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

                        <p className="text-center text-sm text-gray-500 dark:text-gray-400">
                            {mode === "login" ? "Nu ai cont?" : "Ai deja cont?"}{" "}
                            <button
                                onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(null); setConfirmPassword(""); }}
                                className="font-semibold text-gray-900 dark:text-gray-100 hover:underline"
                            >
                                {mode === "login" ? "Înregistrează-te" : "Autentifică-te"}
                            </button>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
