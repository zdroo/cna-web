"use client";

import { useEffect, useState, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createPaymentSession } from "@/lib/api/payments";
import { XCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
    const { orderId } = use(params);
    const router = useRouter();
    const { user, token, isLoaded } = useAuth();
    const searchParams = useSearchParams();
    const cancelled = searchParams.get("cancelled") === "true";
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoaded) return;
        if (!user || !token) { router.replace("/auth/login"); return; }
        if (cancelled) return;

        createPaymentSession(token, orderId)
            .then(({ url }) => { window.location.href = url; })
            .catch(() => setError("Nu s-a putut iniția plata. Încearcă din nou."));
    }, [isLoaded, user, token, orderId, cancelled, router]);

    if (!isLoaded || !user) return null;

    if (cancelled) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
                <div className="w-16 h-16 bg-yellow-100 dark:bg-yellow-950 rounded-full flex items-center justify-center">
                    <XCircle size={32} className="text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Plată anulată</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm">
                        Comanda ta a fost salvată. Poți relua plata oricând.
                    </p>
                </div>
                <div className="flex gap-3">
                    <a
                        href={`/payment/${orderId}`}
                        className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors text-sm"
                    >
                        Încearcă din nou
                    </a>
                    <Link
                        href="/comenzi"
                        className="border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                    >
                        Comenzile mele
                    </Link>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
                <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
                    {error}
                </p>
                <Link href="/comenzi" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline">
                    Vezi comenzile mele
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-500 dark:text-gray-400">
            <div className="w-8 h-8 border-2 border-gray-300 dark:border-gray-600 border-t-gray-900 dark:border-t-gray-100 rounded-full animate-spin" />
            <p className="text-sm">Se încarcă pagina de plată...</p>
        </div>
    );
}
