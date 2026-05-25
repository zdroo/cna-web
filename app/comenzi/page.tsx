"use client";

import { useState, useEffect, useCallback } from "react";
import PageSpinner from "@/components/ui/PageSpinner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getOrders, cancelOrder, downloadInvoice, Order, OrderStatus } from "@/lib/api/orders";
import { createReturnRequest } from "@/lib/api/returns";
import { PackageSearch, X, RotateCcw, Clock, BadgeCheck, Truck, PackageCheck, Check, Loader2, Building2, FileText, Download, ChevronLeft, ChevronRight } from "lucide-react";
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

// ── Return request modal ──────────────────────────────────────────────────────

interface ReturnItemState {
    orderItemId: string;
    productName: string;
    maxQuantity: number;
    selected: boolean;
    quantity: number;
}

interface ReturnModalProps {
    order: Order;
    token: string;
    onClose: () => void;
    onSuccess: () => void;
}

function ReturnModal({ order, token, onClose, onSuccess }: ReturnModalProps) {
    const [items, setItems] = useState<ReturnItemState[]>(
        order.items.map((i) => ({
            orderItemId: i.orderItemId,
            productName: i.productName,
            maxQuantity: i.quantity,
            selected: false,
            quantity: 1,
        }))
    );
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedItems = items.filter((i) => i.selected);
    const canSubmit = selectedItems.length > 0 && reason.trim().length >= 10;

    function toggleItem(idx: number) {
        setItems((prev) =>
            prev.map((item, i) => (i === idx ? { ...item, selected: !item.selected } : item))
        );
    }

    function setQty(idx: number, value: number) {
        setItems((prev) =>
            prev.map((item, i) =>
                i === idx
                    ? { ...item, quantity: Math.max(1, Math.min(value, item.maxQuantity)) }
                    : item
            )
        );
    }

    async function handleSubmit() {
        setSubmitting(true);
        setError(null);
        try {
            await createReturnRequest(token, {
                orderId: order.orderId,
                reason: reason.trim(),
                items: selectedItems.map((i) => ({ orderItemId: i.orderItemId, quantity: i.quantity })),
            });
            onSuccess();
        } catch (e: unknown) {
            setError(e instanceof Error ? e.message : "Eroare necunoscută.");
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-xl flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
                    <div>
                        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Solicită retur</h2>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            Comanda #{order.orderId.split("-")[0].toUpperCase()}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 transition-colors">
                        <X size={18} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">

                    {/* Item selection */}
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Selectează produsele de returnat
                        </p>
                        <div className="flex flex-col gap-2">
                            {items.map((item, idx) => (
                                <div
                                    key={item.orderItemId}
                                    className={`flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer select-none ${
                                        item.selected
                                            ? "border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-800"
                                            : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    }`}
                                    onClick={() => toggleItem(idx)}
                                >
                                    <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                                        item.selected
                                            ? "bg-gray-900 dark:bg-gray-100 border-gray-900 dark:border-gray-100"
                                            : "border-gray-300 dark:border-gray-600"
                                    }`}>
                                        {item.selected && <Check size={11} className="text-white dark:text-gray-900" />}
                                    </div>
                                    <span className="flex-1 text-sm text-gray-800 dark:text-gray-200">{item.productName}</span>
                                    {item.selected && item.maxQuantity > 1 && (
                                        <div
                                            className="flex items-center gap-1"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                onClick={() => setQty(idx, item.quantity - 1)}
                                            >−</button>
                                            <span className="w-5 text-center text-sm font-medium text-gray-900 dark:text-gray-100">{item.quantity}</span>
                                            <button
                                                className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 flex items-center justify-center text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                                onClick={() => setQty(idx, item.quantity + 1)}
                                            >+</button>
                                        </div>
                                    )}
                                    {(!item.selected || item.maxQuantity === 1) && (
                                        <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">× {item.maxQuantity}</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1.5">
                            Motivul returului <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Descrie motivul returului (minim 10 caractere)..."
                            rows={3}
                            className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 resize-none transition-colors"
                        />
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{reason.length} / minim 10 caractere</p>
                    </div>

                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
                            {error}
                        </p>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                    <button
                        onClick={onClose}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Anulează
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={!canSubmit || submitting}
                        className="flex-1 py-2.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                    >
                        {submitting && <Loader2 size={15} className="animate-spin" />}
                        {submitting ? "Se trimite..." : "Trimite cererea"}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ComenziPage() {
    const router = useRouter();
    const { user, token, isLoaded } = useAuth();

    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [cancelling, setCancelling] = useState<string | null>(null);
    const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [returnOrder, setReturnOrder] = useState<Order | null>(null);
    const [returnSuccess, setReturnSuccess] = useState<string | null>(null);

    const fetchOrders = useCallback(async (p: number) => {
        setLoading(true);
        try {
            const data = await getOrders(token!, p);
            setOrders(data.items);
            setTotalPages(data.totalPages);
        } catch {
            setError("Nu s-au putut încărca comenzile.");
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) { router.replace("/auth/login"); return; }
        fetchOrders(page);
    }, [isLoaded, user, router, fetchOrders, page]);

    async function handleCancel(orderId: string) {
        setCancelling(orderId);
        setError(null);
        try {
            await cancelOrder(token!, orderId);
            await fetchOrders(page);
        } catch {
            setError("Nu s-a putut anula comanda.");
        } finally {
            setCancelling(null);
        }
    }

    async function handleDownloadInvoice(orderId: string) {
        setDownloadingInvoice(orderId);
        try {
            await downloadInvoice(token!, orderId);
        } catch {
            setError("Nu s-a putut descărca factura.");
        } finally {
            setDownloadingInvoice(null);
        }
    }

    function handleReturnSuccess() {
        setReturnOrder(null);
        setReturnSuccess("Cererea de retur a fost trimisă cu succes!");
        setTimeout(() => setReturnSuccess(null), 5000);
        fetchOrders(page);
    }

    if (!isLoaded || !user) return null;

    const isWithin30Days = (order: Order) => {
        const placed = new Date(order.createdAt).getTime();
        return Date.now() - placed <= 30 * 24 * 60 * 60 * 1000;
    };

    return (
        <div className="flex flex-col gap-8">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Comenzile mele</h1>

            {(error || returnSuccess) && (
                <p className={`text-sm px-4 py-3 rounded-lg border ${
                    returnSuccess
                        ? "text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                        : "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                }`}>
                    {returnSuccess ?? error}
                </p>
            )}

            {loading ? (
                <PageSpinner />
            ) : orders.length === 0 && page === 1 ? (
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

                            {/* Status stepper */}
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

                            {/* B2B invoice info */}
                            {order.isB2B && (
                                <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-3 flex flex-col gap-1.5">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">
                                        <Building2 size={13} />
                                        Factură fiscală
                                    </div>
                                    {order.invoiceNumber && (
                                        <div className="flex items-center gap-1.5 text-sm">
                                            <FileText size={14} className="text-gray-400 dark:text-gray-500" />
                                            <span className="font-mono font-semibold text-gray-800 dark:text-gray-200">{order.invoiceNumber}</span>
                                            {order.invoiceDate && (
                                                <span className="text-xs text-gray-400 dark:text-gray-500">
                                                    · {new Date(order.invoiceDate).toLocaleDateString("ro-RO")}
                                                </span>
                                            )}
                                            <button
                                                onClick={() => handleDownloadInvoice(order.orderId)}
                                                disabled={downloadingInvoice === order.orderId}
                                                className="ml-1 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50"
                                            >
                                                {downloadingInvoice === order.orderId
                                                    ? <Loader2 size={11} className="animate-spin" />
                                                    : <Download size={11} />}
                                                Descarcă
                                            </button>
                                        </div>
                                    )}
                                    {order.companySnapshot && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            {order.companySnapshot.companyName} · CUI: {order.companySnapshot.cui}
                                            {order.companySnapshot.isVATRegistered && " · Plătitor TVA"}
                                        </p>
                                    )}
                                    <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                        <span>Valoare fără TVA: <strong className="text-gray-700 dark:text-gray-300">{order.netAmount.toFixed(2)} lei</strong></span>
                                        <span>TVA ({(order.vatRate * 100).toFixed(0)}%): <strong className="text-gray-700 dark:text-gray-300">{order.vatAmount.toFixed(2)} lei</strong></span>
                                    </div>
                                    {order.paymentMethod === "NetPayment" && (
                                        <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 w-fit">
                                            Plată la termen (net-30)
                                        </span>
                                    )}
                                </div>
                            )}

                            {/* Items */}
                            <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-3 flex flex-col gap-2">
                                {order.items.map((item) => (
                                    <div key={item.orderItemId} className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
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
                            {(order.status < 2 || (order.status === 3 && isWithin30Days(order))) && (
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
                                    {order.status === 3 && isWithin30Days(order) && (
                                        <button
                                            onClick={() => setReturnOrder(order)}
                                            className="flex items-center gap-1.5 text-sm text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 px-3 py-1.5 rounded-lg hover:bg-orange-50 dark:hover:bg-orange-950 transition-colors"
                                        >
                                            <RotateCcw size={14} />
                                            Solicită retur
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                onClick={() => setPage((p) => p - 1)}
                                disabled={page <= 1}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                                Pagina {page} din {totalPages}
                            </span>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page >= totalPages}
                                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            )}

            {returnOrder && (
                <ReturnModal
                    order={returnOrder}
                    token={token!}
                    onClose={() => setReturnOrder(null)}
                    onSuccess={handleReturnSuccess}
                />
            )}
        </div>
    );
}
