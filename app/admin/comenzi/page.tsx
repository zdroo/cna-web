"use client";

import { Fragment, useEffect, useState } from "react";
import PageSpinner from "@/components/ui/PageSpinner";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
    adminGetOrders,
    adminUpdateOrderStatus,
    adminDispatchOrder,
    adminCancelOrder,
    type OrderAdmin,
} from "@/lib/api/admin";

// 0=Pending 1=Confirmed 2=Shipped 3=Delivered 4=Cancelled
const STATUS_LABEL: Record<number, string> = {
    0: "În așteptare",
    1: "Confirmată",
    2: "Expediată",
    3: "Livrată",
    4: "Anulată",
};

const STATUS_COLOR: Record<number, string> = {
    0: "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400",
    1: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400",
    2: "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400",
    3: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400",
    4: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
};

const TABS = [
    { label: "Toate", value: undefined },
    { label: "În așteptare", value: 0 },
    { label: "Confirmate", value: 1 },
    { label: "Expediate", value: 2 },
    { label: "Livrate", value: 3 },
    { label: "Anulate", value: 4 },
] as const;

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("ro-RO", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function shortId(id: string) {
    return id.slice(0, 8).toUpperCase();
}

export default function AdminComenziPage() {
    const { token } = useAuth();
    const [orders, setOrders] = useState<OrderAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<number | undefined>(undefined);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        adminGetOrders(token, activeTab !== undefined ? { status: activeTab } : undefined)
            .then(setOrders)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token, activeTab]);

    async function handleStatusUpdate(orderId: string, newStatus: number) {
        if (!token) return;
        setUpdating(orderId);
        try {
            await adminUpdateOrderStatus(token, orderId, newStatus);
            setOrders((prev) =>
                prev.map((o) => o.orderId === orderId ? { ...o, status: newStatus } : o)
            );
        } catch (e) {
            console.error(e);
            alert("Actualizarea statusului a eșuat.");
        } finally {
            setUpdating(null);
        }
    }

    async function handleDispatch(orderId: string) {
        if (!token) return;
        setUpdating(orderId);
        try {
            const { awbNumber, carrierName } = await adminDispatchOrder(token, orderId);
            setOrders((prev) =>
                prev.map((o) => o.orderId === orderId ? { ...o, status: 2, awbNumber, carrierName } : o)
            );
        } catch (e) {
            console.error(e);
            alert("Expedierea a eșuat.");
        } finally {
            setUpdating(null);
        }
    }

    async function handleCancel(orderId: string) {
        if (!token) return;
        if (!window.confirm("Anulezi această comandă? Stocul va fi refăcut.")) return;
        setUpdating(orderId);
        try {
            await adminCancelOrder(token, orderId);
            setOrders((prev) =>
                prev.map((o) => o.orderId === orderId ? { ...o, status: 4 } : o)
            );
        } catch (e) {
            console.error(e);
            alert("Anularea a eșuat.");
        } finally {
            setUpdating(null);
        }
    }

    function toggleExpand(id: string) {
        setExpandedId((prev) => (prev === id ? null : id));
    }

    const counts = TABS.slice(1).reduce<Record<number, number>>((acc, tab) => {
        acc[tab.value] = orders.filter((o) => o.status === tab.value).length;
        return acc;
    }, {});

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Comenzi</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{orders.length} comenzi</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit flex-wrap">
                {TABS.map((tab) => {
                    const active = activeTab === tab.value;
                    const count = tab.value !== undefined ? counts[tab.value] ?? 0 : orders.length;
                    return (
                        <button
                            key={String(tab.value)}
                            onClick={() => setActiveTab(tab.value)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                active
                                    ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                            }`}
                        >
                            {tab.label}
                            {!loading && (
                                <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                {loading ? (
                    <PageSpinner className="py-16" />
                ) : orders.length === 0 ? (
                    <div className="py-16 text-center text-gray-400 dark:text-gray-500">Nicio comandă găsită.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                <th className="px-6 py-4 font-semibold">Comandă</th>
                                <th className="px-6 py-4 font-semibold">Data</th>
                                <th className="px-6 py-4 font-semibold">Total</th>
                                <th className="px-6 py-4 font-semibold">Plată</th>
                                <th className="px-6 py-4 font-semibold">Status</th>
                                <th className="px-6 py-4 font-semibold text-right">Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => (
                                <Fragment key={order.orderId}>
                                    <tr
                                        className={`border-b border-gray-50 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer ${expandedId === order.orderId ? "bg-gray-50 dark:bg-gray-800/50" : ""}`}
                                        onClick={() => toggleExpand(order.orderId)}
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-gray-500 dark:text-gray-400">#{shortId(order.orderId)}</span>
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                    {order.items.length} {order.items.length === 1 ? "produs" : "produse"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">
                                            {formatDate(order.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                                            {order.totalAmount.toFixed(2)} lei
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${order.isPaid ? "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-400"}`}>
                                                {order.isPaid ? "Plătită" : "Neplătită"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[order.status]}`}>
                                                {STATUS_LABEL[order.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-end gap-2">
                                                {order.status === 0 && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(order.orderId, 1)}
                                                            disabled={updating === order.orderId}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900 transition-colors disabled:opacity-50"
                                                        >
                                                            Confirmă
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel(order.orderId)}
                                                            disabled={updating === order.orderId}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition-colors disabled:opacity-50"
                                                        >
                                                            Anulează
                                                        </button>
                                                    </>
                                                )}
                                                {order.status === 1 && (
                                                    <>
                                                        <button
                                                            onClick={() => handleDispatch(order.orderId)}
                                                            disabled={updating === order.orderId}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors disabled:opacity-50"
                                                        >
                                                            {updating === order.orderId ? "Se expediază..." : "Expediază"}
                                                        </button>
                                                        <button
                                                            onClick={() => handleCancel(order.orderId)}
                                                            disabled={updating === order.orderId}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 transition-colors disabled:opacity-50"
                                                        >
                                                            Anulează
                                                        </button>
                                                    </>
                                                )}
                                                {order.status === 2 && (
                                                    <button
                                                        onClick={() => handleStatusUpdate(order.orderId, 3)}
                                                        disabled={updating === order.orderId}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 transition-colors disabled:opacity-50"
                                                    >
                                                        Marchează livrată
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => toggleExpand(order.orderId)}
                                                    className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                >
                                                    {expandedId === order.orderId ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {expandedId === order.orderId && (
                                        <tr className="bg-gray-50 dark:bg-gray-800/30">
                                            <td colSpan={6} className="px-6 py-4">
                                                <div className="flex flex-col gap-2">
                                                    <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">Produse comandate</p>
                                                    <div className="flex flex-col gap-1.5">
                                                        {order.items.map((item) => (
                                                            <div key={item.productVariantId} className="flex items-center gap-3">
                                                                <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0">
                                                                    <Package size={13} className="text-gray-400 dark:text-gray-500" />
                                                                </div>
                                                                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{item.productName}</span>
                                                                <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{item.variantSlug}</span>
                                                                <span className="text-xs text-gray-500 dark:text-gray-400">×{item.quantity}</span>
                                                                <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-24 text-right">{item.total.toFixed(2)} lei</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700 mt-1">
                                                        {order.awbNumber ? (
                                                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                                                AWB:
                                                                {order.trackingUrl ? (
                                                                    <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer" className="font-mono font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                                                                        {order.awbNumber}
                                                                    </a>
                                                                ) : (
                                                                    <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{order.awbNumber}</span>
                                                                )}
                                                                {order.carrierName && <span className="text-gray-400 dark:text-gray-500">({order.carrierName})</span>}
                                                            </span>
                                                        ) : <span />}
                                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                                            Total: {order.totalAmount.toFixed(2)} lei
                                                        </span>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </Fragment>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
