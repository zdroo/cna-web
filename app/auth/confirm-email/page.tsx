"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { confirmEmail } from "@/lib/api/auth";

function ConfirmEmailContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token") ?? "";

    const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) { setStatus("error"); setError("Link invalid."); return; }
        confirmEmail(token)
            .then(() => setStatus("success"))
            .catch(err => { setStatus("error"); setError(err instanceof Error ? err.message : "A apărut o eroare."); });
    }, [token]);

    return (
        <div className="min-h-[70vh] flex items-center justify-center">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 w-full max-w-md p-8 flex flex-col gap-6 text-center">
                <Link href="/" className="text-xl font-bold text-gray-900 dark:text-gray-100">CNA Shop</Link>

                {status === "loading" && (
                    <div className="flex flex-col gap-3 items-center">
                        <div className="w-8 h-8 rounded-full border-2 border-gray-200 border-t-gray-900 animate-spin" />
                        <p className="text-sm text-gray-500 dark:text-gray-400">Se verifică emailul...</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="flex flex-col gap-4">
                        <div className="bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-xl px-5 py-4">
                            <p className="text-sm font-medium text-green-700 dark:text-green-300">
                                Adresa de email a fost confirmată! Contul tău este acum activ.
                            </p>
                        </div>
                        <button
                            onClick={() => router.push("/auth/login")}
                            className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2.5 rounded-xl font-semibold hover:opacity-90 transition-opacity"
                        >
                            Intră în cont
                        </button>
                    </div>
                )}

                {status === "error" && (
                    <div className="flex flex-col gap-4">
                        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl px-5 py-4">
                            <p className="text-sm font-medium text-red-700 dark:text-red-300">
                                {error ?? "Link invalid sau expirat."}
                            </p>
                        </div>
                        <Link
                            href="/auth/login"
                            className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:underline"
                        >
                            Înapoi la autentificare
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function ConfirmEmailPage() {
    return (
        <Suspense>
            <ConfirmEmailContent />
        </Suspense>
    );
}
