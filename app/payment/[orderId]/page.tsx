"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { createPaymentSession } from "@/lib/api/payments";
import { XCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentPage({ params }: { params: Promise<{ orderId: string }> }) {
    const { orderId } = use(params);
    const router = useRouter();
    const { user, token, isLoaded } = useAuth();
    const [cancelled, setCancelled] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (typeof window !== "undefined") {
            setCancelled(new URLSearchParams(window.location.search).get("cancelled") === "true");
        }
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) { router.replace("/auth/login"); return; }
        if (cancelled) return;

        createPaymentSession(token!, orderId)
            .then(({ url }) => { window.location.href = url; })
            .catch(() => setError("Nu s-a putut iniția plata. Încearcă din nou."));
    }, [isLoaded, user, token, orderId, cancelled, router]);

    if (!isLoaded || !user) return null;

    if (cancelled) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center">
                    <XCircle size={32} className="text-yellow-600" />
                </div>
                <div className="flex flex-col gap-2">
                    <h1 className="text-2xl font-bold text-gray-900">Plată anulată</h1>
                    <p className="text-gray-500 text-sm max-w-sm">
                        Comanda ta a fost salvată. Poți relua plata oricând.
                    </p>
                </div>
                <div className="flex gap-3">
                    <a
                        href={`/payment/${orderId}`}
                        className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm"
                    >
                        Încearcă din nou
                    </a>
                    <Link
                        href="/orders"
                        className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
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
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    {error}
                </p>
                <Link href="/orders" className="text-sm text-gray-500 hover:text-gray-700 underline">
                    Vezi comenzile mele
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-500">
            <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
            <p className="text-sm">Se încarcă pagina de plată...</p>
        </div>
    );
}
