"use client";

import { Fragment, useEffect, useState } from "react";
import PageSpinner from "@/components/ui/PageSpinner";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Package } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
    adminGetOrders,
    adminUpdateOrderStatus,
    adminDispatchOrder,
    adminCancelOrder,
    type OrderAdmin,
    type OrderStatus,
} from "@/lib/api/admin";

const STATUS_LABEL: Record<OrderStatus, string> = {
    Pending:   "În așteptare",
    Confirmed: "Confirmată",
    Shipped:   "Expediată",
    Delivered: "Livrată",
    Cancelled: "Anulată",
};

const STATUS_COLOR: Record<OrderStatus, string> = {
    Pending:   "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400",
    Confirmed: "bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-400",
    Shipped:   "bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400",
    Delivered: "bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400",
    Cancelled: "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400",
};

const PREV_STATUS: Partial<Record<OrderStatus, OrderStatus>> = {
    Confirmed: "Pending",
    Shipped:   "Confirmed",
    Delivered: "Shipped",
};

const TABS: { label: string; value: OrderStatus | undefined }[] = [
    { label: "Toate",        value: undefined    },
    { label: "În așteptare", value: "Pending"    },
    { label: "Confirmate",   value: "Confirmed"  },
    { label: "Expediate",    value: "Shipped"    },
    { label: "Livrate",      value: "Delivered"  },
    { label: "Anulate",      value: "Cancelled"  },
];

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
    const [activeTab, setActiveTab] = useState<OrderStatus | undefined>(undefined);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 20;

    useEffect(() => { setPage(1); }, [activeTab]);

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        adminGetOrders(token, { status: activeTab, page, pageSize: PAGE_SIZE })
            .then((data) => {
                setOrders(data.items);
                setTotalPages(data.totalPages);
                setTotalCount(data.totalCount);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token, activeTab, page]);

    async function handleStatusUpdate(orderId: string, newStatus: OrderStatus) {
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
                prev.map((o) => o.orderId === orderId ? { ...o, status: "Shipped" as OrderStatus, awbNumber, carrierName } : o)
            );
        } catch (e) {
            console.error(e);
            alert("Expedierea a eșuat.");
        } finally {
            setUpdating(null);
        }
    }

    async function handleStatusBack(orderId: string, currentStatus: OrderStatus) {
        const targetStatus = PREV_STATUS[currentStatus];
        if (!targetStatus) return;
        const currentLabel = STATUS_LABEL[currentStatus];
        const targetLabel = STATUS_LABEL[targetStatus];
        if (!window.confirm(`Ești sigur că vrei să reverți comanda din "${currentLabel}" înapoi în "${targetLabel}"?`)) return;
        await handleStatusUpdate(orderId, targetStatus);
    }

    async function handleCancel(orderId: string) {
        if (!token) return;
        if (!window.confirm("Anulezi această comandă? Stocul va fi refăcut.")) return;
        setUpdating(orderId);
        try {
            await adminCancelOrder(token, orderId);
            setOrders((prev) =>
                prev.map((o) => o.orderId === orderId ? { ...o, status: "Cancelled" as OrderStatus } : o)
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

    return (
        <div className="flex flex-col gap-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Comenzi</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">{totalCount} comenzi</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit flex-wrap">
                {TABS.map((tab) => {
                    const active = activeTab === tab.value;
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
                            {active && !loading && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                    {totalCount}
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
                            <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                <th className="px-6 py-4 font-semibold text-left">Comandă</th>
                                <th className="px-6 py-4 font-semibold text-center">Data</th>
                                <th className="px-6 py-4 font-semibold text-center">Total</th>
                                <th className="px-6 py-4 font-semibold text-center">Plată</th>
                                <th className="px-6 py-4 font-semibold text-center">Status</th>
                                <th className="px-6 py-4 font-semibold text-center">Acțiuni</th>
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
                                        <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400 text-xs whitespace-nowrap">
                                            {formatDate(order.createdAt)}
                                        </td>
                                        <td className="px-6 py-4 text-center font-semibold text-gray-900 dark:text-gray-100">
                                            {order.totalAmount.toFixed(2)} lei
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${order.isPaid ? "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400" : "bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-400"}`}>
                                                {order.isPaid ? "Plătită" : "Neplătită"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[order.status]}`}>
                                                {STATUS_LABEL[order.status]}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center gap-2 flex-wrap">

                                                {order.status === "Pending" && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusUpdate(order.orderId, "Confirmed")}
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

                                                {order.status === "Confirmed" && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusBack(order.orderId, "Confirmed")}
                                                            disabled={updating === order.orderId}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                                                        >
                                                            ← În așteptare
                                                        </button>
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

                                                {order.status === "Shipped" && (
                                                    <>
                                                        <button
                                                            onClick={() => handleStatusBack(order.orderId, "Shipped")}
                                                            disabled={updating === order.orderId}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                                                        >
                                                            ← Confirmată
                                                        </button>
                                                        <button
                                                            onClick={() => handleStatusUpdate(order.orderId, "Delivered")}
                                                            disabled={updating === order.orderId}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 transition-colors disabled:opacity-50"
                                                        >
                                                            Marchează livrată
                                                        </button>
                                                    </>
                                                )}

                                                {order.status === "Delivered" && (
                                                    <button
                                                        onClick={() => handleStatusBack(order.orderId, "Delivered")}
                                                        disabled={updating === order.orderId}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                                                    >
                                                        ← Expediată
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
                                                                <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
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

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3">
                    <button
                        onClick={() => setPage((p) => p - 1)}
                        disabled={page <= 1 || loading}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Pagina {page} din {totalPages}
                    </span>
                    <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={page >= totalPages || loading}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
