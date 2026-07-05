"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PageSpinner from "@/components/ui/PageSpinner";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getOrders, cancelOrder, downloadInvoice, Order, OrderStatus, STATUS_ORDER } from "@/lib/api/orders";
import { createReturnRequest, getUserReturnRequests, ReturnRequest } from "@/lib/api/returns";
import { PackageSearch, X, RotateCcw, Clock, BadgeCheck, Truck, PackageCheck, Check, Loader2, Building2, FileText, Download, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import Link from "next/link";

const STATUS_LABEL: Record<OrderStatus, string> = {
    Pending:   "În așteptare",
    Confirmed: "Confirmată",
    Shipped:   "Expediată",
    Delivered: "Livrată",
    Cancelled: "Anulată",
};

const STATUS_STYLE: Record<OrderStatus, string> = {
    Pending:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
    Confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    Shipped:   "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
    Delivered: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    Cancelled: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400",
};

const STEPS: { status: OrderStatus; label: string; Icon: React.ElementType }[] = [
    { status: "Pending",   label: "Plasată",    Icon: Clock },
    { status: "Confirmed", label: "Confirmată", Icon: BadgeCheck },
    { status: "Shipped",   label: "Expediată",  Icon: Truck },
    { status: "Delivered", label: "Livrată",    Icon: PackageCheck },
];

function StatusStepper({ status }: { status: OrderStatus }) {
    const currentOrder = STATUS_ORDER[status];
    return (
        <div className="flex items-start">
            {STEPS.map(({ status: stepStatus, label, Icon }, i) => {
                const stepOrder = STATUS_ORDER[stepStatus];
                const reached = currentOrder >= stepOrder;
                const current = status === stepStatus;
                const isLast  = i === STEPS.length - 1;
                return (
                    <div key={stepStatus} className="flex items-start flex-1">
                        <div className="flex flex-col items-center gap-1.5 shrink-0">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                reached ? "bg-gray-900 dark:bg-gray-100" : "bg-gray-100 dark:bg-gray-800"
                            }`}>
                                <Icon size={14} className={reached ? "text-white dark:text-gray-900" : "text-gray-300 dark:text-gray-600"} />
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
                                currentOrder > stepOrder ? "bg-gray-900 dark:bg-gray-100" : "bg-gray-100 dark:bg-gray-800"
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
    isReturnable: boolean;
}

interface ReturnModalProps {
    order: Order;
    token: string;
    existingReturns: ReturnRequest[];
    onClose: () => void;
    onSuccess: () => void;
}

function ReturnModal({ order, token, existingReturns, onClose, onSuccess }: ReturnModalProps) {
    const activeReturnItemIds = new Set(
        existingReturns
            .filter((r) => r.orderId === order.orderId && (r.status === "Pending" || r.status === "Approved" || r.status === "InTransit" || r.status === "Received"))
            .flatMap((r) => r.items.map((i) => i.orderItemId))
    );
    const refundedItemIds = new Set(
        existingReturns
            .filter((r) => r.orderId === order.orderId && r.status === "Refunded")
            .flatMap((r) => r.items.map((i) => i.orderItemId))
    );

    const [items, setItems] = useState<ReturnItemState[]>(
        order.items.map((i) => ({
            orderItemId: i.orderItemId,
            productName: i.productName,
            maxQuantity: i.quantity,
            selected: false,
            quantity: 1,
            isReturnable: i.isReturnable,
        }))
    );
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedItems = items.filter((i) => i.selected);
    const hasItems = selectedItems.length > 0;
    const hasReason = reason.trim().length >= 10;
    const canSubmit = hasItems && hasReason;

    function toggleItem(idx: number) {
        setItems((prev) => prev.map((item, i) => i === idx ? { ...item, selected: !item.selected } : item));
    }

    function setQty(idx: number, value: number) {
        setItems((prev) =>
            prev.map((item, i) =>
                i === idx ? { ...item, quantity: Math.max(1, Math.min(value, item.maxQuantity)) } : item
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
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Selectează produsele de returnat
                        </p>
                        <div className="flex flex-col gap-2">
                            {items.map((item, idx) => {
                                const hasActiveReturn = activeReturnItemIds.has(item.orderItemId);
                                const alreadyRefunded = refundedItemIds.has(item.orderItemId);
                                const blocked = hasActiveReturn || alreadyRefunded || !item.isReturnable;
                                return (
                                    <div
                                        key={item.orderItemId}
                                        className={`flex items-center gap-3 p-3 rounded-xl border transition-colors select-none ${
                                            hasActiveReturn
                                                ? "border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/40 cursor-default opacity-75"
                                                : alreadyRefunded
                                                    ? "border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/40 cursor-default opacity-75"
                                                    : !item.isReturnable
                                                        ? "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 cursor-default opacity-60"
                                                        : item.selected
                                                            ? "border-gray-900 dark:border-gray-100 bg-gray-50 dark:bg-gray-800 cursor-pointer"
                                                            : "border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                                        }`}
                                        onClick={() => { if (!blocked) toggleItem(idx); }}
                                    >
                                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                                            hasActiveReturn
                                                ? "border-orange-300 dark:border-orange-700 bg-orange-100 dark:bg-orange-900"
                                                : alreadyRefunded
                                                    ? "border-green-300 dark:border-green-700 bg-green-100 dark:bg-green-900"
                                                    : !item.isReturnable
                                                        ? "border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700"
                                                        : item.selected
                                                            ? "bg-gray-900 dark:bg-gray-100 border-gray-900 dark:border-gray-100"
                                                            : "border-gray-300 dark:border-gray-600"
                                        }`}>
                                            {hasActiveReturn
                                                ? <RotateCcw size={10} className="text-orange-500 dark:text-orange-400" />
                                                : alreadyRefunded
                                                    ? <Check size={11} className="text-green-600 dark:text-green-400" />
                                                    : !item.isReturnable
                                                        ? null
                                                        : item.selected && <Check size={11} className="text-white dark:text-gray-900" />
                                            }
                                        </div>
                                        <span className={`flex-1 text-sm ${
                                            hasActiveReturn ? "text-orange-700 dark:text-orange-300"
                                            : alreadyRefunded ? "text-green-700 dark:text-green-300"
                                            : !item.isReturnable ? "text-gray-400 dark:text-gray-500"
                                            : "text-gray-800 dark:text-gray-200"
                                        }`}>
                                            {item.productName}
                                        </span>
                                        {hasActiveReturn ? (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-400 shrink-0">
                                                Retur deschis
                                            </span>
                                        ) : alreadyRefunded ? (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 shrink-0">
                                                Rambursat
                                            </span>
                                        ) : !item.isReturnable ? (
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 shrink-0">
                                                Nereturabil
                                            </span>
                                        ) : item.selected && item.maxQuantity > 1 ? (
                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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
                                        ) : !blocked ? (
                                            <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">× {item.maxQuantity}</span>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

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

                <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 flex flex-col gap-2">
                    {!canSubmit && !submitting && (
                        <ul className="text-xs text-gray-400 dark:text-gray-500 list-disc list-inside space-y-0.5">
                            {!hasItems && <li>Selectează cel puțin un produs</li>}
                            {!hasReason && <li>Motivul trebuie să aibă minim 10 caractere</li>}
                        </ul>
                    )}
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            Anulează
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={!canSubmit || submitting}
                            className="flex-1 py-2.5 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold enabled:hover:bg-gray-600 enabled:hover:shadow-md dark:enabled:hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {submitting && <Loader2 size={15} className="animate-spin" />}
                            {submitting ? "Se trimite..." : "Trimite cererea"}
                        </button>
                    </div>
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
    const [existingReturns, setExistingReturns] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [cancelling, setCancelling] = useState<string | null>(null);
    const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [returnOrder, setReturnOrder] = useState<Order | null>(null);
    const [returnSuccess, setReturnSuccess] = useState<string | null>(null);
    const returnSuccessTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const tokenRef = useRef(token);
    useEffect(() => { tokenRef.current = token; }, [token]);

    const fetchOrders = useCallback(async (p: number) => {
        const t = tokenRef.current;
        if (!t) return;
        setLoading(true);
        try {
            const [data, returns] = await Promise.all([
                getOrders(t, p),
                getUserReturnRequests(t),
            ]);
            setOrders(data.items);
            setTotalPages(data.totalPages);
            setExistingReturns(returns);
        } catch {
            setError("Nu s-au putut încărca comenzile.");
        } finally {
            setLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) { router.replace("/auth/login"); return; }
        fetchOrders(page);
    }, [isLoaded, user, fetchOrders, page, router]);

    useEffect(() => {
        return () => { if (returnSuccessTimerRef.current) clearTimeout(returnSuccessTimerRef.current); };
    }, []);

    async function handleCancel(orderId: string) {
        if (!token) return;
        setCancelling(orderId);
        setError(null);
        try {
            await cancelOrder(token, orderId);
            await fetchOrders(page);
        } catch {
            setError("Nu s-a putut anula comanda.");
        } finally {
            setCancelling(null);
        }
    }

    async function handleDownloadInvoice(orderId: string) {
        if (!token) return;
        setDownloadingInvoice(orderId);
        try {
            await downloadInvoice(token, orderId);
        } catch {
            setError("Nu s-a putut descărca factura.");
        } finally {
            setDownloadingInvoice(null);
        }
    }

    function handleReturnSuccess() {
        setReturnOrder(null);
        setError(null);
        setReturnSuccess("Cererea de retur a fost trimisă cu succes!");
        if (returnSuccessTimerRef.current) clearTimeout(returnSuccessTimerRef.current);
        returnSuccessTimerRef.current = setTimeout(() => setReturnSuccess(null), 5000);
        fetchOrders(page);
    }

    if (!isLoaded || !user || !token) return null;

    const isWithin30Days = (order: Order) => {
        if (!order.deliveredAt) return false;
        return Date.now() - new Date(order.deliveredAt).getTime() <= 30 * 24 * 60 * 60 * 1000;
    };

    const canCancel = (order: Order) => STATUS_ORDER[order.status] < STATUS_ORDER["Shipped"];

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
                                        {order.amountDue.toFixed(2)} lei
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
                            {order.status !== "Cancelled" && (
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

                            {/* Shipping address */}
                            {order.shippingAddress && (
                                <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-3">
                                    <div className="flex items-start gap-2">
                                        <MapPin size={14} className="text-gray-400 dark:text-gray-500 mt-0.5 shrink-0" />
                                        <div className="flex flex-col gap-0.5">
                                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">Adresă livrare</p>
                                            <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">{order.shippingAddress.fullName}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">{order.shippingAddress.phoneNumber}</p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {order.shippingAddress.addressLine1}
                                                {order.shippingAddress.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {order.shippingAddress.city}, {order.shippingAddress.region} {order.shippingAddress.postalCode}
                                            </p>
                                        </div>
                                    </div>
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
                                        <span>Fără TVA: <strong className="text-gray-700 dark:text-gray-300">{order.netAmount.toFixed(2)} lei</strong></span>
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
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Produse</p>
                                {order.items.map((item) => (
                                    <div key={item.orderItemId} className="flex justify-between items-start gap-4 text-sm">
                                        <div className="flex flex-col gap-0.5 min-w-0">
                                            <Link
                                                href={`/produse/${item.productSlug}/${item.variantSlug}`}
                                                className="text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 hover:underline transition-colors truncate"
                                            >
                                                {item.productName}
                                            </Link>
                                            <span className="text-xs text-gray-400 dark:text-gray-500">
                                                {item.price.toFixed(2)} lei × {item.quantity}
                                            </span>
                                        </div>
                                        <span className="shrink-0 font-medium text-gray-900 dark:text-gray-100">
                                            {item.total.toFixed(2)} lei
                                        </span>
                                    </div>
                                ))}
                                <div className="flex flex-col gap-1 pt-2 border-t border-gray-50 dark:border-gray-800 mt-1">
                                    {(order.discountAmount > 0 || order.giftCardDeduction > 0) && (
                                        <>
                                            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
                                                <span>Subtotal</span>
                                                <span>{order.totalAmount.toFixed(2)} lei</span>
                                            </div>
                                            {order.discountAmount > 0 && (
                                                <div className="flex justify-between text-xs text-green-600 dark:text-green-400">
                                                    <span>Cupon {order.couponCode ? `(${order.couponCode})` : ""}</span>
                                                    <span>-{order.discountAmount.toFixed(2)} lei</span>
                                                </div>
                                            )}
                                            {order.giftCardDeduction > 0 && (
                                                <div className="flex justify-between text-xs text-green-600 dark:text-green-400">
                                                    <span>Card cadou {order.giftCardCode ? `(${order.giftCardCode})` : ""}</span>
                                                    <span>-{order.giftCardDeduction.toFixed(2)} lei</span>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    <div className="flex justify-end">
                                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                                            Total: {order.amountDue.toFixed(2)} lei
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            {(canCancel(order) || (order.status === "Delivered" && isWithin30Days(order))) && (
                                <div className="border-t border-gray-100 dark:border-gray-800 px-5 py-3 flex items-center justify-end gap-3">
                                    {canCancel(order) && (
                                        <button
                                            onClick={() => handleCancel(order.orderId)}
                                            disabled={cancelling === order.orderId}
                                            className="flex items-center gap-1.5 text-sm text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-50"
                                        >
                                            <X size={14} />
                                            {cancelling === order.orderId ? "Se anulează..." : "Anulează"}
                                        </button>
                                    )}
                                    {order.status === "Delivered" && isWithin30Days(order) && (
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
                    token={token}
                    existingReturns={existingReturns}
                    onClose={() => setReturnOrder(null)}
                    onSuccess={handleReturnSuccess}
                />
            )}
        </div>
    );
}
