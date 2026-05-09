"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CheckCircle, Package, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getOrderById, type Order } from "@/lib/api/orders";

const STATUS_LABEL: Record<number, string> = {
    0: "În așteptare",
    1: "Confirmată",
    2: "Expediată",
    3: "Livrată",
    4: "Anulată",
};

function shortId(id: string) {
    return id.slice(0, 8).toUpperCase();
}

export default function ConfirmationPage() {
    const { orderId } = useParams<{ orderId: string }>();
    const { token, isLoaded } = useAuth();
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isLoaded || !token || !orderId) return;
        getOrderById(token, orderId)
            .then(setOrder)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [isLoaded, token, orderId]);

    return (
        <div className="max-w-lg mx-auto py-16 flex flex-col gap-8">

            {/* Success header */}
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-950 rounded-full flex items-center justify-center">
                    <CheckCircle size={36} className="text-green-600 dark:text-green-400" />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Comandă plasată cu succes!</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Îți mulțumim! Vei primi un email de confirmare în scurt timp.
                    </p>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-6 py-3 flex flex-col items-center gap-0.5">
                    <p className="text-xs text-gray-400 uppercase tracking-wide">Număr comandă</p>
                    <p className="font-mono text-sm font-bold text-gray-800 dark:text-gray-200">#{shortId(orderId)}</p>
                </div>
            </div>

            {/* Order details */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                    <Package size={16} className="text-gray-400" />
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-sm">Detalii comandă</h2>
                </div>

                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 size={22} className="animate-spin text-gray-400" />
                    </div>
                ) : order ? (
                    <div className="flex flex-col divide-y divide-gray-50 dark:divide-gray-800">
                        {order.items.map((item) => (
                            <div key={item.orderItemId} className="flex items-center justify-between px-5 py-3.5 gap-4">
                                <div className="flex flex-col gap-0.5 min-w-0">
                                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">{item.productName}</p>
                                    <p className="text-xs text-gray-400">× {item.quantity}</p>
                                </div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 shrink-0">
                                    {item.total.toFixed(2)} lei
                                </p>
                            </div>
                        ))}
                        <div className="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-gray-800/50">
                            <span className="text-sm font-bold text-gray-900 dark:text-gray-100">Total</span>
                            <span className="text-base font-bold text-gray-900 dark:text-gray-100">
                                {order.totalAmount.toFixed(2)} lei
                            </span>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 text-center py-8">Nu s-au putut încărca detaliile comenzii.</p>
                )}
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Link
                    href="/comenzi"
                    className="flex-1 text-center bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors text-sm"
                >
                    Comenzile mele
                </Link>
                <Link
                    href="/produse"
                    className="flex-1 text-center border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-6 py-2.5 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm"
                >
                    Continuă cumpărăturile
                </Link>
            </div>

        </div>
    );
}
