"use client";

import { useState, useEffect, useCallback } from "react";
import PageSpinner from "@/components/ui/PageSpinner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getOrders, cancelOrder, Order, OrderStatus } from "@/lib/api/orders";
import { PackageSearch, X, RotateCcw, Clock, BadgeCheck, Truck, PackageCheck, Check } from "lucide-react";
import Link from "next/link";

const STATUS_LABEL: Record<OrderStatus, string> = {
    0: "În așteptare",
    1: "Confirmată",
    2: "Expediată",
    3: "Livrată",
    4: "Anulată",
};

const STATUS_STYLE: Record<OrderStatus, string> = {
    0: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
    1: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    2: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
    3: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    4: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const STEPS = [
    { status: 0, label: "Plasată",    Icon: Clock },
    { status: 1, label: "Confirmată", Icon: BadgeCheck },
    { status: 2, label: "Expediată",  Icon: Truck },
    { status: 3, label: "Livrată",    Icon: PackageCheck },
] as const;

function StatusStepper({ status }: { status: OrderStatus }) {
    return (
        <div className="flex items-start">
            {STEPS.map(({ status: stepStatus, label, Icon }, i) => {
                const reached = status >= stepStatus;
                const current = status === stepStatus;
                const isLast  = i === STEPS.length - 1;
                return (
                    <div key={stepStatus} className="flex items-start flex-1">
                        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                reached
                                    ? "bg-gray-900 dark:bg-gray-100"
                                    : "bg-gray-100 dark:bg-gray-800"
                            }`}>
                                {reached
                                    ? <Icon size={14} className="text-white dark:text-gray-900" />
                                    : <Icon size={14} className="text-gray-300 dark:text-gray-600" />
                                }
                            </div>
                            <span className={`text-xs text-center leading-tight ${
                                current
                                    ? "font-semibold text-gray-900 dark:text-gray-100"
                                    : reached
                                        ? "text-gray-500 dark:text-gray-400"
                                        : "text-gray-300 dark:text-gray-600"
                            }`}>
                                {label}
                            </span>
                        </div>
                        {!isLast && (
                            <div className={`flex-1 h-0.5 mt-4 mx-1.5 rounded-full transition-colors ${
                                status > stepStatus
                                    ? "bg-gray-900 dark:bg-gray-100"
                                    : "bg-gray-100 dark:bg-gray-800"
                            }`} />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

export default function ComenziPage() {
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Comenzile mele</h1>

            {error && (
                <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
                    {error}
                </p>
            )}

            {loading ? (
                <PageSpinner />
            ) : orders.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400 dark:text-gray-500">
                    <PackageSearch size={48} className="text-gray-300 dark:text-gray-600" />
                    <p className="text-lg font-medium">Nu ai nicio comandă încă</p>
                    <Link
                        href="/produse"
                        className="mt-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors text-sm"
                    >
                        Explorează produse
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {orders.map((order) => (
                        <div key={order.orderId} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">

                            {/* Header */}
                            <div className="flex items-start justify-between gap-4 p-5 flex-wrap">
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                                        #{order.orderId.split("-")[0].toUpperCase()}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        {new Date(order.createdAt).toLocaleDateString("ro-RO", {
                                            day: "2-digit", month: "long", year: "numeric",
                                            hour: "2-digit", minute: "2-digit",
                                        })}
                                    </p>
                                    <p className="text-xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                                        {order.totalAmount.toFixed(2)} lei
                                    </p>
                                </div>
                                <div className="flex flex-col items-end gap-1.5">
                                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${STATUS_STYLE[order.status]}`}>
                                        {STATUS_LABEL[order.status]}
                                    </span>
                                    {order.isPaid ? (
                                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400">
                                            <Check size={10} />
                                            Plătită
                                        </span>
                                    ) : (
                                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-400">
                                            Neplătită
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Status stepper — only for active orders */}
                            {order.status !== 4 && (
                                <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4">
                                    <StatusStepper status={order.status} />
                                </div>
                            )}

                            {/* AWB tracking */}
                            {order.awbNumber && (
                                <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-3 flex items-center gap-2 text-sm">
                                    <span className="text-gray-400 dark:text-gray-500">AWB:</span>
                                    {order.trackingUrl ? (
                                        <a
                                            href={order.trackingUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="font-mono font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                                        >
                                            {order.awbNumber}
                                        </a>
                                    ) : (
                                        <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{order.awbNumber}</span>
                                    )}
                                    {order.carrierName && <span className="text-xs text-gray-400 dark:text-gray-500">({order.carrierName})</span>}
                                </div>
                            )}

                            {/* Items */}
                            <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-3 flex flex-col gap-2">
                                {order.items.map((item, idx) => (
                                    <div key={idx} className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                                        <Link
                                            href={`/produse/${item.productSlug}/${item.variantSlug}`}
                                            className="hover:text-gray-900 dark:hover:text-gray-100 hover:underline transition-colors"
                                        >
                                            {item.productName}{" "}
                                            <span className="text-gray-400 dark:text-gray-500">× {item.quantity}</span>
                                        </Link>
                                        <span className="flex-shrink-0 font-medium text-gray-900 dark:text-gray-100 ml-4">
                                            {item.total.toFixed(2)} lei
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Actions */}
                            {(order.status < 2 || order.status === 3) && (
                                <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-3 flex items-center justify-end gap-3">
                                    {order.status < 2 && (
                                        <button
                                            onClick={() => handleCancel(order.orderId)}
                                            disabled={cancelling === order.orderId}
                                            className="flex items-center gap-1.5 text-sm text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-50"
                                        >
                                            <X size={14} />
                                            {cancelling === order.orderId ? "Se anulează..." : "Anulează"}
                                        </button>
                                    )}
                                    {order.status === 3 && (
                                        <button
                                            disabled
                                            className="flex items-center gap-1.5 text-sm text-gray-400 dark:text-gray-500 border border-gray-200 dark:border-gray-700 px-3 py-1.5 rounded-lg opacity-60 cursor-not-allowed"
                                            title="Disponibil în curând"
                                        >
                                            <RotateCcw size={14} />
                                            Solicită retur
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
