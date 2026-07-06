"use client";

import { Fragment, useEffect, useState } from "react";
import PageSpinner from "@/components/ui/PageSpinner";
import { ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Package, MessageSquarePlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTokenRef } from "@/hooks/useTokenRef";
import {
    adminGetOrders,
    adminUpdateOrderStatus,
    adminDispatchOrder,
    adminCancelOrder,
    adminMarkB2BPaid,
    adminGetOrderNotes,
    adminAddOrderNote,
    adminPartialDispatch,
    type OrderAdmin,
    type OrderStatus,
    type OrderNote,
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
    const { token, user } = useAuth();
    const tokenRef = useTokenRef();
    const isAdmin = user?.role === "Admin";
    const [orders, setOrders] = useState<OrderAdmin[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [activeTab, setActiveTab] = useState<OrderStatus | undefined>(undefined);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [updating, setUpdating] = useState<string | null>(null);
    const [notes, setNotes] = useState<Record<string, OrderNote[]>>({});
    const [newNote, setNewNote] = useState<Record<string, string>>({});
    const [partialDispatchIds, setPartialDispatchIds] = useState<Record<string, string[]>>({});
    const [partialAwb, setPartialAwb] = useState<Record<string, string>>({});
    const [partialCarrier, setPartialCarrier] = useState<Record<string, string>>({});
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const PAGE_SIZE = 20;

    useEffect(() => {
        const t = tokenRef.current;
        if (!t) return;
        let cancelled = false;
        setLoading(true);
        setLoadError(false);
        adminGetOrders(t, { status: activeTab, page, pageSize: PAGE_SIZE })
            .then((data) => {
                if (cancelled) return;
                setOrders(data.items);
                setTotalPages(data.totalPages);
                setTotalCount(data.totalCount);
            })
            .catch(() => { if (!cancelled) setLoadError(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [activeTab, page]);

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

    async function handleMarkB2BPaid(orderId: string) {
        if (!token) return;
        if (!window.confirm("Marchezi această comandă B2B ca plătită?")) return;
        setUpdating(orderId);
        try {
            await adminMarkB2BPaid(token, orderId);
            setOrders((prev) => prev.map((o) => o.orderId === orderId ? { ...o, isPaid: true } : o));
        } catch { alert("Operația a eșuat."); }
        finally { setUpdating(null); }
    }

    async function handleLoadNotes(orderId: string) {
        if (!token || notes[orderId]) return;
        try {
            const data = await adminGetOrderNotes(token, orderId);
            setNotes((prev) => ({ ...prev, [orderId]: data }));
        } catch { /* silent */ }
    }

    async function handleAddNote(orderId: string) {
        if (!token) return;
        const text = newNote[orderId]?.trim();
        if (!text) return;
        try {
            await adminAddOrderNote(token, orderId, text);
            const fresh = await adminGetOrderNotes(token, orderId);
            setNotes((prev) => ({ ...prev, [orderId]: fresh }));
            setNewNote((prev) => ({ ...prev, [orderId]: "" }));
        } catch { alert("Nota nu a putut fi adăugată."); }
    }

    async function handlePartialDispatch(orderId: string) {
        if (!token) return;
        const ids = partialDispatchIds[orderId] ?? [];
        const awb = partialAwb[orderId]?.trim();
        const carrier = partialCarrier[orderId]?.trim();
        if (!ids.length || !awb || !carrier) { alert("Selectează produse, AWB și transportator."); return; }
        setUpdating(orderId);
        try {
            const { allDispatched } = await adminPartialDispatch(token, orderId, ids, awb, carrier);
            setOrders((prev) => prev.map((o) => o.orderId === orderId
                ? { ...o, status: allDispatched ? "Shipped" as OrderStatus : o.status }
                : o));
            setPartialDispatchIds((prev) => ({ ...prev, [orderId]: [] }));
            setPartialAwb((prev) => ({ ...prev, [orderId]: "" }));
            setPartialCarrier((prev) => ({ ...prev, [orderId]: "" }));
        } catch { alert("Expedierea parțială a eșuat."); }
        finally { setUpdating(null); }
    }

    function toggleExpand(id: string) {
        setExpandedId((prev) => {
            const next = prev === id ? null : id;
            if (next) handleLoadNotes(next);
            return next;
        });
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
                            onClick={() => { setActiveTab(tab.value); setPage(1); }}
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
                ) : loadError ? (
                    <div className="py-16 text-center text-red-500 dark:text-red-400 text-sm">Nu s-au putut încărca comenzile.</div>
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
                                            {order.amountDue.toFixed(2)} lei
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

                                                {isAdmin && order.isB2B && !order.isPaid && order.paymentMethod === "NetPayment" && (
                                                    <button
                                                        onClick={() => handleMarkB2BPaid(order.orderId)}
                                                        disabled={updating === order.orderId}
                                                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors disabled:opacity-50"
                                                    >
                                                        Marchează plătit
                                                    </button>
                                                )}

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
                                                            onClick={() => handleStatusUpdate(order.orderId, "Delivered")}
                                                            disabled={updating === order.orderId}
                                                            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900 transition-colors disabled:opacity-50"
                                                        >
                                                            Marchează livrată
                                                        </button>
                                                    </>
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
                                                <div className="flex flex-col gap-4">
                                                    {/* B2B due date */}
                                                    {order.isB2B && order.dueDate && (
                                                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                                                            Scadență net-30: {new Date(order.dueDate).toLocaleDateString("ro-RO")}
                                                        </p>
                                                    )}

                                                    {/* Items */}
                                                    <div className="flex flex-col gap-2">
                                                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Produse comandate</p>
                                                        <div className="flex flex-col gap-1.5">
                                                            {order.items.map((item) => {
                                                                const selected = (partialDispatchIds[order.orderId] ?? []).includes(item.orderItemId);
                                                                const alreadyDispatched = !!item.dispatchedAt;
                                                                return (
                                                                    <div key={item.orderItemId} className="flex items-center gap-3">
                                                                        {order.status === "Confirmed" && (
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={selected}
                                                                                disabled={alreadyDispatched}
                                                                                title={alreadyDispatched ? `Expediat${item.itemAwbNumber ? ` (AWB: ${item.itemAwbNumber})` : ""}` : undefined}
                                                                                onChange={(e) => {
                                                                                    const ids = partialDispatchIds[order.orderId] ?? [];
                                                                                    setPartialDispatchIds((prev) => ({
                                                                                        ...prev,
                                                                                        [order.orderId]: e.target.checked
                                                                                            ? [...ids, item.orderItemId]
                                                                                            : ids.filter((id) => id !== item.orderItemId),
                                                                                    }));
                                                                                }}
                                                                                className="rounded disabled:opacity-40"
                                                                            />
                                                                        )}
                                                                        <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center shrink-0">
                                                                            <Package size={13} className="text-gray-400 dark:text-gray-500" />
                                                                        </div>
                                                                        <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{item.productName}</span>
                                                                        <span className="text-xs text-gray-400 dark:text-gray-500 font-mono">{item.variantSlug}</span>
                                                                        <span className="text-xs text-gray-500 dark:text-gray-400">×{item.quantity}</span>
                                                                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 w-24 text-right">{item.total.toFixed(2)} lei</span>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>

                                                    {/* Partial dispatch form */}
                                                    {order.status === "Confirmed" && (
                                                        <div className="flex flex-wrap items-end gap-2 pt-1">
                                                            <div className="flex flex-col gap-1">
                                                                <label className="text-xs text-gray-500 dark:text-gray-400">AWB</label>
                                                                <input
                                                                    value={partialAwb[order.orderId] ?? ""}
                                                                    onChange={(e) => setPartialAwb((p) => ({ ...p, [order.orderId]: e.target.value }))}
                                                                    placeholder="AWB..."
                                                                    className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 w-36"
                                                                />
                                                            </div>
                                                            <div className="flex flex-col gap-1">
                                                                <label className="text-xs text-gray-500 dark:text-gray-400">Transportator</label>
                                                                <input
                                                                    value={partialCarrier[order.orderId] ?? ""}
                                                                    onChange={(e) => setPartialCarrier((p) => ({ ...p, [order.orderId]: e.target.value }))}
                                                                    placeholder="Fan Courier..."
                                                                    className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 w-36"
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => handlePartialDispatch(order.orderId)}
                                                                disabled={updating === order.orderId}
                                                                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900 transition-colors disabled:opacity-50"
                                                            >
                                                                Expediază selectate
                                                            </button>
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
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
                                                            Total: {order.amountDue.toFixed(2)} lei
                                                        </span>
                                                    </div>

                                                    {/* Order notes */}
                                                    <div className="flex flex-col gap-2 pt-1">
                                                        <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Note interne</p>
                                                        {(notes[order.orderId] ?? []).length === 0 && (
                                                            <p className="text-xs text-gray-400 dark:text-gray-500">Nicio notă.</p>
                                                        )}
                                                        {(notes[order.orderId] ?? []).map((n) => (
                                                            <div key={n.id} className="bg-white dark:bg-gray-900 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-800">
                                                                <p className="text-xs text-gray-700 dark:text-gray-300">{n.text}</p>
                                                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{formatDate(n.createdAt)}</p>
                                                            </div>
                                                        ))}
                                                        <div className="flex gap-2 mt-1">
                                                            <input
                                                                value={newNote[order.orderId] ?? ""}
                                                                onChange={(e) => setNewNote((p) => ({ ...p, [order.orderId]: e.target.value }))}
                                                                placeholder="Adaugă o notă..."
                                                                className="flex-1 px-3 py-1.5 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                                onKeyDown={(e) => { if (e.key === "Enter") handleAddNote(order.orderId); }}
                                                            />
                                                            <button
                                                                onClick={() => handleAddNote(order.orderId)}
                                                                className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                                                                title="Adaugă notă"
                                                            >
                                                                <MessageSquarePlus size={14} />
                                                            </button>
                                                        </div>
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
