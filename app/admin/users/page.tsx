"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUsers, UserListItem } from "@/lib/api/user";
import { Search, ChevronLeft, ChevronRight, Users, ShieldCheck, Store, UserCircle, CheckCircle, XCircle, Loader2 } from "lucide-react";

const ROLE_STYLES: Record<string, string> = {
    Admin: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300",
    Seller: "bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300",
    User: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
};

const ROLE_ICONS: Record<string, React.ReactNode> = {
    Admin: <ShieldCheck size={12} />,
    Seller: <Store size={12} />,
    User: <UserCircle size={12} />,
};

export default function AdminUsersPage() {
    const { token } = useAuth();
    const [items, setItems] = useState<UserListItem[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [inputValue, setInputValue] = useState("");
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

    useEffect(() => {
        if (!token) return;
        let cancelled = false;
        setLoading(true);
        setLoadError(false);
        getUsers(token, page, 20, search || undefined)
            .then((data) => {
                if (cancelled) return;
                setItems(data.items);
                setTotalPages(data.totalPages);
                setTotalCount(data.totalCount);
            })
            .catch(() => { if (!cancelled) setLoadError(true); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [token, page, search]);

    function handleSearchChange(value: string) {
        setInputValue(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            setSearch(value.trim());
            setPage(1);
        }, 400);
    }

    function displayName(u: UserListItem) {
        const name = [u.firstName, u.lastName].filter(Boolean).join(" ");
        return name || "—";
    }

    return (
        <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Utilizatori</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {loading ? "Se încarcă..." : `${totalCount} utilizatori înregistrați`}
                    </p>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950">
                    <Users size={22} className="text-indigo-600 dark:text-indigo-400" />
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Caută după email sau nume..."
                    className="w-full max-w-sm pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                <th className="text-left px-5 py-3.5 font-semibold">Utilizator</th>
                                <th className="text-left px-5 py-3.5 font-semibold">Email</th>
                                <th className="text-left px-5 py-3.5 font-semibold">Rol</th>
                                <th className="text-left px-5 py-3.5 font-semibold">Email confirmat</th>
                                <th className="text-left px-5 py-3.5 font-semibold">Înregistrat</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12">
                                        <Loader2 size={24} className="animate-spin text-gray-400 mx-auto" />
                                    </td>
                                </tr>
                            ) : loadError ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-red-500 dark:text-red-400">
                                        Nu s-au putut încărca utilizatorii. Reîncarcă pagina.
                                    </td>
                                </tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="text-center py-12 text-gray-400 dark:text-gray-500">
                                        Niciun utilizator găsit
                                    </td>
                                </tr>
                            ) : (
                                items.map((u) => (
                                    <tr key={u.userId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                                    <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
                                                        {(u.firstName?.charAt(0) ?? u.email.charAt(0)).toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{displayName(u)}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">{u.email}</td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_STYLES[u.role] ?? ROLE_STYLES.User}`}>
                                                {ROLE_ICONS[u.role]}
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5">
                                            {u.isEmailConfirmed
                                                ? <CheckCircle size={16} className="text-green-500" />
                                                : <XCircle size={16} className="text-gray-300 dark:text-gray-600" />
                                            }
                                        </td>
                                        <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400 tabular-nums">
                                            {new Date(u.createdAt).toLocaleDateString("ro-RO")}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            Pagina {page} din {totalPages}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setPage((p) => p - 1)}
                                disabled={page === 1}
                                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 disabled:opacity-30 hover:border-gray-400 transition-colors"
                            >
                                <ChevronLeft size={15} />
                            </button>
                            <button
                                onClick={() => setPage((p) => p + 1)}
                                disabled={page === totalPages}
                                className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 disabled:opacity-30 hover:border-gray-400 transition-colors"
                            >
                                <ChevronRight size={15} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
