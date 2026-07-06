"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useTokenRef } from "@/hooks/useTokenRef";
import {
    getUserEvents, getFunnel,
    UserEventDto, UserEventType, FunnelResult,
} from "@/lib/api/userEvents";
import { Activity, ShoppingCart, CreditCard, CheckCircle, XCircle, ChevronLeft, ChevronRight } from "lucide-react";

const EVENT_LABELS: Record<UserEventType, string> = {
    UserRegistered:    "Înregistrare",
    UserLoggedIn:      "Autentificare",
    AddedToCart:       "Adăugat în coș",
    CheckoutStarted:   "Checkout inițiat",
    PaymentPageOpened: "Pagină plată deschisă",
    PaymentCompleted:  "Plată finalizată",
    CheckoutAbandoned: "Checkout abandonat",
};

const EVENT_STYLE: Record<UserEventType, string> = {
    UserRegistered:    "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
    UserLoggedIn:      "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
    AddedToCart:       "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
    CheckoutStarted:   "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300",
    PaymentPageOpened: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
    PaymentCompleted:  "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
    CheckoutAbandoned: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
};

const ALL_EVENT_TYPES: UserEventType[] = [
    "UserRegistered", "UserLoggedIn", "AddedToCart",
    "CheckoutStarted", "PaymentPageOpened", "PaymentCompleted", "CheckoutAbandoned",
];

const PAGE_SIZE = 50;

function FunnelCard({ funnel }: { funnel: FunnelResult }) {
    const started   = funnel.CheckoutStarted ?? 0;
    const opened    = funnel.PaymentPageOpened ?? 0;
    const completed = funnel.PaymentCompleted ?? 0;
    const abandoned = funnel.CheckoutAbandoned ?? 0;

    const convRate = started > 0 ? Math.round((completed / started) * 100) : 0;
    const dropRate = started > 0 ? Math.round((abandoned / started) * 100) : 0;

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
                { label: "Checkout inițiat", value: started, icon: ShoppingCart, color: "text-yellow-600 dark:text-yellow-400" },
                { label: "Pagină plată deschisă", value: opened, icon: CreditCard, color: "text-purple-600 dark:text-purple-400" },
                { label: "Plată finalizată", value: completed, icon: CheckCircle, color: "text-green-600 dark:text-green-400" },
                { label: "Abandonat", value: abandoned, icon: XCircle, color: "text-red-600 dark:text-red-400" },
            ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-3">
                    <Icon size={20} className={color} />
                    <div>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                    </div>
                </div>
            ))}
            <div className="col-span-2 lg:col-span-4 flex gap-6 text-sm text-gray-500 dark:text-gray-400">
                <span>Conversie: <strong className="text-gray-900 dark:text-gray-100">{convRate}%</strong></span>
                <span>Abandon: <strong className="text-gray-900 dark:text-gray-100">{dropRate}%</strong></span>
            </div>
        </div>
    );
}

export default function UserEventsPage() {
    const { user, isLoaded } = useAuth();
    const tokenRef = useTokenRef();
    const router = useRouter();
    const [events, setEvents] = useState<UserEventDto[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const [funnel, setFunnel] = useState<FunnelResult | null>(null);

    const [filterType, setFilterType] = useState<UserEventType | "">("");
    const [filterUser, setFilterUser] = useState("");
    const [filterUserInput, setFilterUserInput] = useState("");
    const [days, setDays] = useState(30);

    useEffect(() => {
        if (!isLoaded) return;
        if (!user || user.role !== "Admin") router.replace("/admin");
    }, [isLoaded, user, router]);

    const { from, to } = useMemo(() => ({
        from: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        to: new Date().toISOString(),
    }), [days]);

    const load = useCallback(async (p: number) => {
        const t = tokenRef.current;
        if (!t) return;
        setLoading(true);
        try {
            const [eventsResult, funnelResult] = await Promise.all([
                getUserEvents(t, {
                    page: p, pageSize: PAGE_SIZE,
                    eventType: filterType || undefined,
                    userEmail: filterUser || undefined,
                    from, to,
                }),
                getFunnel(t, from, to),
            ]);
            setEvents(eventsResult.items);
            setTotalPages(eventsResult.totalPages);
            setFunnel(funnelResult);
        } catch {
            setLoadError(true);
        } finally {
            setLoading(false);
        }
    }, [filterType, filterUser, from, to, tokenRef]);

    useEffect(() => { setPage(1); }, [filterType, filterUser, days]);
    useEffect(() => { load(page); }, [load, page]);

    if (!isLoaded || !user || user.role !== "Admin") return null;

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Activity size={20} className="text-gray-500 dark:text-gray-400" />
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Activitate utilizatori</h1>
            </div>

            {/* Funnel */}
            {funnel && <FunnelCard funnel={funnel} />}

            {/* Filters */}
            <div className="flex flex-wrap gap-3 items-center">
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as UserEventType | "")}
                    className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                >
                    <option value="">Toate evenimentele</option>
                    {ALL_EVENT_TYPES.map((t) => (
                        <option key={t} value={t}>{EVENT_LABELS[t]}</option>
                    ))}
                </select>

                <select
                    value={days}
                    onChange={(e) => setDays(Number(e.target.value))}
                    className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300"
                >
                    <option value={7}>Ultimele 7 zile</option>
                    <option value={30}>Ultimele 30 zile</option>
                    <option value={90}>Ultimele 90 zile</option>
                </select>

                <div className="flex gap-2 items-center">
                    <input
                        type="text"
                        placeholder="Filtrează după email..."
                        value={filterUserInput}
                        onChange={(e) => setFilterUserInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") setFilterUser(filterUserInput.trim()); }}
                        className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 w-52"
                    />
                    {filterUser && (
                        <button
                            onClick={() => { setFilterUser(""); setFilterUserInput(""); }}
                            className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                        >
                            ✕ Resetează
                        </button>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-gray-800 text-left">
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Eveniment</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Utilizator</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Comandă / Produs</th>
                            <th className="px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Data</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                        {loading ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Se încarcă...</td></tr>
                        ) : loadError ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-red-500 dark:text-red-400">Eroare la încărcarea evenimentelor.</td></tr>
                        ) : events.length === 0 ? (
                            <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Niciun eveniment găsit.</td></tr>
                        ) : events.map((e) => (
                            <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="px-4 py-3">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${EVENT_STYLE[e.eventType]}`}>
                                        {EVENT_LABELS[e.eventType]}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                    {e.userEmail ?? <span className="text-gray-400 italic">anonim</span>}
                                </td>
                                <td className="px-4 py-3 font-mono text-xs text-gray-500 dark:text-gray-500">
                                    {e.orderId
                                        ? e.orderId.slice(0, 8).toUpperCase()
                                        : e.productVariantId
                                            ? e.productVariantId.slice(0, 8).toUpperCase()
                                            : "—"}
                                </td>
                                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                                    {new Date(e.occurredAt).toLocaleString("ro-RO")}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage((p) => p - 1)}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{page} / {totalPages}</span>
                    <button
                        disabled={page === totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 disabled:opacity-40 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
}
