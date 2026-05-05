"use client";

import { Package, ShoppingCart, Users, TrendingUp, FolderOpen, Layers, ChevronRight } from "lucide-react";
import Link from "next/link";

const STATS = [
    { label: "Produse", value: "—", icon: Package, color: "bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400" },
    { label: "Comenzi", value: "—", icon: ShoppingCart, color: "bg-green-50 text-green-600 dark:bg-green-950 dark:text-green-400" },
    { label: "Utilizatori", value: "—", icon: Users, color: "bg-purple-50 text-purple-600 dark:bg-purple-950 dark:text-purple-400" },
    { label: "Venituri", value: "—", icon: TrendingUp, color: "bg-orange-50 text-orange-600 dark:bg-orange-950 dark:text-orange-400" },
];

const MANAGEMENT = [
    { href: "/admin/categorii", label: "Categorii", description: "Gestionează categoriile din catalog", icon: FolderOpen, color: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400" },
    { href: "/admin/products", label: "Produse", description: "Adaugă, editează și șterge produse", icon: Package, color: "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400" },
    { href: "/admin/variante", label: "Variante", description: "Gestionează variantele produselor", icon: Layers, color: "bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400" },
];

export default function AdminDashboard() {
    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Panou de control</h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Bun venit în panoul de administrare.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STATS.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 flex flex-col gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                            <Icon size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                        </div>
                    </div>
                ))}
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
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                                <item.icon size={22} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 dark:text-gray-100">{item.label}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
                            </div>
                            <ChevronRight size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                        </Link>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 text-center text-gray-400 dark:text-gray-500 py-16">
                <TrendingUp size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
                <p className="font-medium">Statisticile vor apărea aici</p>
                <p className="text-sm mt-1">Implementare viitoare</p>
            </div>
        </div>
    );
}
