"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
    getAdminReturnRequests,
    updateReturnStatus,
    type AdminReturnRequest,
    type ReturnStatus,
    RETURN_STATUS_LABEL,
    RETURN_STATUS_STYLE,
} from "@/lib/api/returns";
import { ChevronDown, ChevronUp, Loader2, RotateCcw, Truck } from "lucide-react";
import { RETURN_REASON_LABEL, type ReturnReasonCode } from "@/lib/api/returns";
import PageSpinner from "@/components/ui/PageSpinner";

const TABS: { label: string; value: ReturnStatus | undefined }[] = [
    { label: "Toate",         value: undefined },
    { label: "În așteptare",  value: "Pending" },
    { label: "Aprobate",      value: "Approved" },
    { label: "În tranzit",    value: "InTransit" },
    { label: "Primite",       value: "Received" },
    { label: "Rambursate",    value: "Refunded" },
    { label: "Respinse",      value: "Rejected" },
];

const PAGE_SIZE = 20;

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("ro-RO", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function shortId(id: string) {
    return id.slice(0, 8).toUpperCase();
}

export default function AdminReturnsPage() {
    const { token } = useAuth();
    const [items, setItems] = useState<AdminReturnRequest[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<ReturnStatus | undefined>(undefined);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [notes, setNotes] = useState<Record<string, string>>({});
    const [rmaAwb, setRmaAwb] = useState<Record<string, string>>({});
    const [rmaCarrier, setRmaCarrier] = useState<Record<string, string>>({});
    const [updating, setUpdating] = useState<string | null>(null);
    const [confirmReceived, setConfirmReceived] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        setLoading(true);
        getAdminReturnRequests(token, page, PAGE_SIZE, activeTab)
            .then((res) => {
                setItems(res.items);
                setTotalCount(res.totalCount);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token, activeTab, page]);

    function handleTabChange(val: ReturnStatus | undefined) {
        setActiveTab(val);
        setPage(1);
        setExpandedId(null);
        setConfirmReceived(null);
    }

    async function handleUpdateStatus(id: string, status: ReturnStatus) {
        if (!token) return;
        setUpdating(id);
        try {
            const awb = rmaAwb[id]?.trim();
            const carrier = rmaCarrier[id]?.trim();
            const rma = awb && carrier ? { awb, carrierName: carrier } : undefined;
            await updateReturnStatus(token, id, status, notes[id], rma);
            setItems((prev) =>
                prev.map((r) =>
                    r.returnRequestId === id
                        ? { ...r, status, adminNotes: notes[id] ?? r.adminNotes, returnAwb: awb ?? r.returnAwb, returnCarrierName: carrier ?? r.returnCarrierName }
                        : r
                )
            );
            setExpandedId(null);
        } catch (e) {
            console.error(e);
            alert("Actualizarea statusului a eșuat.");
        } finally {
            setUpdating(null);
        }
    }

    const totalPages = Math.ceil(totalCount / PAGE_SIZE);

    if (loading && items.length === 0) return <PageSpinner />;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <RotateCcw size={20} className="text-gray-500" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Cereri de retur</h1>
                <span className="ml-auto text-sm text-gray-400">{totalCount} total</span>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1 w-fit">
                {TABS.map((tab) => (
                    <button
                        key={String(tab.value)}
                        onClick={() => handleTabChange(tab.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                            activeTab === tab.value
                                ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                                : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>
            ) : items.length === 0 ? (
                <div className="text-center py-16 text-gray-400">Nicio cerere de retur.</div>
            ) : (
                <div className="flex flex-col gap-3">
                    {items.map((r) => {
                        const expanded = expandedId === r.returnRequestId;
                        const isUpdating = updating === r.returnRequestId;
                        const isActionable = r.status === "Pending" || r.status === "Approved" || r.status === "InTransit" || r.status === "Received";
                        return (
                            <div
                                key={r.returnRequestId}
                                className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden"
                            >
                                {/* Row header */}
                                <button
                                    className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    onClick={() => setExpandedId(expanded ? null : r.returnRequestId)}
                                >
                                    <div className="flex flex-col gap-0.5 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="font-mono text-xs font-semibold text-gray-500 dark:text-gray-400">
                                                RET-{shortId(r.returnRequestId)}
                                            </span>
                                            <span className="text-xs text-gray-400">·</span>
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                                Comandă #{shortId(r.orderId)}
                                            </span>
                                            <span className="text-xs text-gray-400">·</span>
                                            <span className="text-xs text-gray-400">{formatDate(r.createdAt)}</span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300 truncate">
                                            {r.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
                                        </p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{r.userEmail}</p>
                                    </div>
                                    <div className="ml-auto flex items-center gap-2 shrink-0">
                                        {r.refundAmount > 0 && (
                                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                                {r.refundAmount.toFixed(2)} lei
                                            </span>
                                        )}
                                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${RETURN_STATUS_STYLE[r.status]}`}>
                                            {RETURN_STATUS_LABEL[r.status]}
                                        </span>
                                    </div>
                                    {expanded ? <ChevronUp size={16} className="shrink-0 text-gray-400" /> : <ChevronDown size={16} className="shrink-0 text-gray-400" />}
                                </button>

                                {/* Expanded panel */}
                                {expanded && (
                                    <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-4 flex flex-col gap-4">
                                        {/* Items + refund amount */}
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Produse</p>
                                            <div className="flex flex-col gap-1">
                                                {r.items.map((item) => (
                                                    <div key={item.orderItemId} className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-700 dark:text-gray-300">{item.productName}</span>
                                                        <span className="text-gray-500 dark:text-gray-400">×{item.quantity}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            {r.refundAmount > 0 && (
                                                <div className="mt-2 pt-2 border-t border-gray-50 dark:border-gray-800 flex justify-between text-sm">
                                                    <span className="text-gray-500 dark:text-gray-400">Total de rambursat</span>
                                                    <span className="font-semibold text-gray-900 dark:text-gray-100">{r.refundAmount.toFixed(2)} lei</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Reason */}
                                        <div>
                                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Motiv</p>
                                            <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">
                                                {r.reasonCode ? RETURN_REASON_LABEL[r.reasonCode as ReturnReasonCode] : r.reason}
                                            </p>
                                        </div>

                                        {/* RMA tracking info */}
                                        {r.returnAwb && (
                                            <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                                <Truck size={13} />
                                                <span>AWB retur: <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">{r.returnAwb}</span></span>
                                                {r.returnCarrierName && <span>({r.returnCarrierName})</span>}
                                            </div>
                                        )}

                                        {/* Existing admin notes */}
                                        {r.adminNotes && (
                                            <div>
                                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Note admin</p>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2">{r.adminNotes}</p>
                                            </div>
                                        )}

                                        {/* User + Order */}
                                        <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                                            <span>Client: <span className="font-medium text-gray-600 dark:text-gray-300">{r.userEmail}</span></span>
                                            <span>Comandă: <span className="font-mono font-medium text-gray-600 dark:text-gray-300">#{shortId(r.orderId)}</span></span>
                                        </div>

                                        {/* Actions */}
                                        {isActionable && (
                                            <div className="flex flex-col gap-3 pt-1 border-t border-gray-100 dark:border-gray-800">
                                                {r.status === "Pending" && (
                                                    <div className="flex gap-2 flex-wrap">
                                                        <div className="flex flex-col gap-1 flex-1 min-w-35">
                                                            <label className="text-xs text-gray-400">AWB retur (opțional)</label>
                                                            <input
                                                                value={rmaAwb[r.returnRequestId] ?? ""}
                                                                onChange={(e) => setRmaAwb((p) => ({ ...p, [r.returnRequestId]: e.target.value }))}
                                                                placeholder="AWB curier..."
                                                                className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                            />
                                                        </div>
                                                        <div className="flex flex-col gap-1 flex-1 min-w-35">
                                                            <label className="text-xs text-gray-400">Transportator</label>
                                                            <input
                                                                value={rmaCarrier[r.returnRequestId] ?? ""}
                                                                onChange={(e) => setRmaCarrier((p) => ({ ...p, [r.returnRequestId]: e.target.value }))}
                                                                placeholder="Fan Courier..."
                                                                className="px-2 py-1 text-xs border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                                                            />
                                                        </div>
                                                    </div>
                                                )}
                                                <textarea
                                                    rows={2}
                                                    placeholder="Note opționale pentru client..."
                                                    value={notes[r.returnRequestId] ?? ""}
                                                    onChange={(e) => setNotes((prev) => ({ ...prev, [r.returnRequestId]: e.target.value }))}
                                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 resize-none"
                                                />
                                                <div className="flex gap-2 flex-wrap">
                                                    {r.status === "Pending" && (
                                                        <>
                                                            <button
                                                                disabled={isUpdating}
                                                                onClick={() => handleUpdateStatus(r.returnRequestId, "Approved")}
                                                                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-semibold transition-colors"
                                                            >
                                                                {isUpdating ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Aprobă"}
                                                            </button>
                                                            <button
                                                                disabled={isUpdating}
                                                                onClick={() => handleUpdateStatus(r.returnRequestId, "Rejected")}
                                                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-semibold transition-colors"
                                                            >
                                                                {isUpdating ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Respinge"}
                                                            </button>
                                                        </>
                                                    )}
                                                    {r.status === "Approved" && (
                                                        <>
                                                            <button
                                                                disabled={isUpdating}
                                                                onClick={() => handleUpdateStatus(r.returnRequestId, "InTransit")}
                                                                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-semibold transition-colors"
                                                            >
                                                                {isUpdating ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Preluat de curier"}
                                                            </button>
                                                            <button
                                                                disabled={isUpdating}
                                                                onClick={() => handleUpdateStatus(r.returnRequestId, "Rejected")}
                                                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-semibold transition-colors"
                                                            >
                                                                {isUpdating ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Respinge"}
                                                            </button>
                                                        </>
                                                    )}
                                                    {r.status === "InTransit" && (
                                                        confirmReceived === r.returnRequestId ? (
                                                            <div className="flex-1 flex flex-col gap-2 bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 rounded-xl p-3">
                                                                <p className="text-sm font-medium text-purple-900 dark:text-purple-200">Confirmi că ai primit coletul de la curier?</p>
                                                                <div className="flex gap-2">
                                                                    <button
                                                                        disabled={isUpdating}
                                                                        onClick={() => { setConfirmReceived(null); handleUpdateStatus(r.returnRequestId, "Received"); }}
                                                                        className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-1.5 rounded-lg text-sm font-semibold transition-colors"
                                                                    >
                                                                        {isUpdating ? <Loader2 size={14} className="animate-spin mx-auto" /> : "Da, am primit"}
                                                                    </button>
                                                                    <button
                                                                        onClick={() => setConfirmReceived(null)}
                                                                        className="flex-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 py-1.5 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                                                                    >
                                                                        Anulează
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                disabled={isUpdating}
                                                                onClick={() => setConfirmReceived(r.returnRequestId)}
                                                                className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-semibold transition-colors"
                                                            >
                                                                Colet primit
                                                            </button>
                                                        )
                                                    )}
                                                    {r.status === "Received" && (
                                                        <button
                                                            disabled={isUpdating}
                                                            onClick={() => handleUpdateStatus(r.returnRequestId, "Refunded")}
                                                            className="flex-1 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white py-2 rounded-xl text-sm font-semibold transition-colors"
                                                        >
                                                            {isUpdating ? <Loader2 size={14} className="animate-spin mx-auto" /> : `Rambursează ${r.refundAmount.toFixed(2)} lei`}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => { setPage((p) => p - 1); setConfirmReceived(null); }}
                        className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Anterior
                    </button>
                    <span className="text-sm text-gray-500">{page} / {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => { setPage((p) => p + 1); setConfirmReceived(null); }}
                        className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Următor
                    </button>
                </div>
            )}
        </div>
    );
}
