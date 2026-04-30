"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getOrders, cancelOrder, Order, OrderStatus } from "@/lib/api/orders";
import { PackageSearch, X } from "lucide-react";
import Link from "next/link";

const STATUS_LABEL: Record<OrderStatus, string> = {
    0: "În așteptare",
    1: "Confirmată",
    2: "Expediată",
    3: "Livrată",
    4: "Anulată",
};

const STATUS_STYLE: Record<OrderStatus, string> = {
    0: "bg-yellow-100 text-yellow-800",
    1: "bg-blue-100 text-blue-800",
    2: "bg-purple-100 text-purple-800",
    3: "bg-green-100 text-green-800",
    4: "bg-gray-100 text-gray-500",
};

function canCancel(status: OrderStatus) {
    return status < 2;
}

export default function OrdersPage() {
    const router = useRouter();
    const { user, token, isLoaded } = useAuth();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchOrders = useCallback(async () => {
        try {
            const data = await getOrders(token!);
            setOrders(data);
        } catch {
            setError("Nu s-au putut încărca comenzile.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) { router.replace("/auth/login"); return; }
        fetchOrders();
    }, [isLoaded, user, router, fetchOrders]);

    async function handleCancel(orderId: string) {
        setCancelling(orderId);
        setError(null);
        try {
            await cancelOrder(token!, orderId);
            setOrders((prev) =>
                prev.map((o) => o.orderId === orderId ? { ...o, status: 4 } : o)
            );
        } catch {
            setError("Nu s-a putut anula comanda.");
        } finally {
            setCancelling(null);
        }
    }

    if (!isLoaded || !user) return null;

    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-2xl font-bold text-gray-900">Comenzile mele</h1>

            {error && (
                <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                    {error}
                </p>
            )}

            {loading ? (
                <div className="flex justify-center py-24 text-gray-400">Se încarcă...</div>
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
                    <PackageSearch size={48} className="text-gray-300" />
                    <p className="text-lg font-medium">Nu ai nicio comandă încă</p>
                    <Link
                        href="/products"
                        className="mt-2 bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                    >
                        Explorează produse
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {orders.map((order) => (
                        <div key={order.orderId} className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4">
                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                <div className="flex flex-col gap-1">
                                    <p className="text-xs text-gray-400 font-mono">{order.orderId}</p>
                                    <p className="text-lg font-bold text-gray-900">{order.totalAmount.toFixed(2)} lei</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLE[order.status]}`}>
                                        {STATUS_LABEL[order.status]}
                                    </span>
                                    {canCancel(order.status) && (
                                        <button
                                            onClick={() => handleCancel(order.orderId)}
                                            disabled={cancelling === order.orderId}
                                            className="flex items-center gap-1.5 text-sm text-red-500 border border-red-200 px-3 py-1 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50"
                                        >
                                            <X size={14} />
                                            {cancelling === order.orderId ? "Se anulează..." : "Anulează"}
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-3 flex flex-col gap-2">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm text-gray-600">
                                        <Link
                                            href={`/products/${item.productSlug}/${item.variantSlug}`}
                                            className="hover:text-gray-900 hover:underline transition-colors"
                                        >
                                            {item.productName} <span className="text-gray-400">× {item.quantity}</span>
                                        </Link>
                                        <span className="flex-shrink-0 font-medium text-gray-900">{item.total.toFixed(2)} lei</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
