"use client";

import { useEffect, useState } from "react";
import { ShoppingCart, BarChart2, FolderOpen, Package, Layers, Users, ChevronRight, TrendingUp, Clock, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useTokenRef } from "@/hooks/useTokenRef";
import { adminGetKPIs, type AdminKPIs } from "@/lib/api/admin";

const MANAGEMENT = [
    { href: "/admin/categorii", label: "Categorii", description: "Gestionează categoriile din catalog", icon: FolderOpen, color: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400" },
    { href: "/admin/products", label: "Produse", description: "Adaugă, editează și șterge produse", icon: Package, color: "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400" },
    { href: "/admin/variante", label: "Variante", description: "Gestionează variantele produselor", icon: Layers, color: "bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400" },
    { href: "/admin/comenzi", label: "Comenzi", description: "Vizualizează și procesează comenzile", icon: ShoppingCart, color: "bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400" },
    { href: "/admin/statistici", label: "Statistici", description: "Venituri, comenzi și performanță", icon: BarChart2, color: "bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400" },
    { href: "/admin/users", label: "Utilizatori", description: "Vizualizează utilizatorii înregistrați", icon: Users, color: "bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400" },
];

export default function AdminDashboard() {
    const { user } = useAuth();
    const tokenRef = useTokenRef();
    const [kpis, setKpis] = useState<AdminKPIs | null>(null);

    useEffect(() => {
        const t = tokenRef.current;
        if (!t) return;
        adminGetKPIs(t).then(setKpis).catch(() => null);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Panou de control</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Bun venit în panoul de administrare.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-teal-50 dark:bg-teal-950 text-teal-600 dark:text-teal-400">
                        <TrendingUp size={22} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">Venituri azi</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                            {kpis ? `${kpis.todayRevenue.toFixed(2)} lei` : "—"}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400">
                        <Clock size={22} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">Comenzi în așteptare</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                            {kpis ? kpis.pendingOrdersCount : "—"}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-red-50 dark:bg-red-950 text-red-500 dark:text-red-400">
                        <AlertTriangle size={22} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">Stoc scăzut</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-0.5">
                            {kpis ? `${kpis.lowStockVariantsCount} variante` : "—"}
                        </p>
                    </div>
                </div>
            </div>

            <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Gestionare catalog</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {MANAGEMENT.map((item) => (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex items-center gap-4 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-700 transition-all"
                        >
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${item.color}`}>
                                <item.icon size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{item.label}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
                            </div>
                            <ChevronRight size={18} className="text-gray-400 dark:text-gray-500 shrink-0" />
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
