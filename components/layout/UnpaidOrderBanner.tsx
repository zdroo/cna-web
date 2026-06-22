"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getOrders, Order } from "@/lib/api/orders";
import { createPaymentSession } from "@/lib/api/payments";
import { CreditCard, X } from "lucide-react";

export default function UnpaidOrderBanner() {
    const { user, token, isLoaded } = useAuth();
    const [unpaidOrder, setUnpaidOrder] = useState<Order | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isLoaded || !user || !token || user.role === "Admin" || user.role === "Seller") return;

        getOrders(token, 1, 200)
            .then((result) => {
                const pending = result.items.find((o) => !o.isPaid && o.status !== "Cancelled");
                setUnpaidOrder(pending ?? null);
            })
            .catch(() => {});
    }, [isLoaded, user, token]);

    if (!unpaidOrder || dismissed) return null;

    async function handlePay() {
        if (!token || !unpaidOrder) return;
        setLoading(true);
        try {
            const { url } = await createPaymentSession(token, unpaidOrder.orderId);
            window.location.href = url;
        } catch {
            setLoading(false);
        }
    }

    return (
        <div className="bg-yellow-50 dark:bg-yellow-950 border-b border-yellow-200 dark:border-yellow-800">
            <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-300">
                    <CreditCard size={16} className="flex-shrink-0" />
                    <span>Ai o comandă neplatită. Finalizează plata pentru a o procesa.</span>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                    <button
                        onClick={handlePay}
                        disabled={loading}
                        className="text-xs font-semibold bg-yellow-800 dark:bg-yellow-300 text-white dark:text-yellow-900 px-3 py-1.5 rounded-lg hover:bg-yellow-900 dark:hover:bg-yellow-200 transition-colors disabled:opacity-60"
                    >
                        {loading ? "Se încarcă..." : "Finalizează plata"}
                    </button>
                    <button onClick={() => setDismissed(true)} className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-800 dark:hover:text-yellow-200 transition-colors">
                        <X size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
