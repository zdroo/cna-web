"use client";

import { Package, ShoppingCart, Users, TrendingUp } from "lucide-react";

const STATS = [
    { label: "Produse", value: "—", icon: Package, color: "bg-blue-50 text-blue-600" },
    { label: "Comenzi", value: "—", icon: ShoppingCart, color: "bg-green-50 text-green-600" },
    { label: "Utilizatori", value: "—", icon: Users, color: "bg-purple-50 text-purple-600" },
    { label: "Venituri", value: "—", icon: TrendingUp, color: "bg-orange-50 text-orange-600" },
];

export default function AdminDashboard() {
    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-500 mt-1">Bun venit în panoul de administrare.</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {STATS.map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
                            <Icon size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{value}</p>
                            <p className="text-sm text-gray-500 mt-0.5">{label}</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center text-gray-400 py-16">
                <TrendingUp size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="font-medium">Statisticile vor apărea aici</p>
                <p className="text-sm mt-1">Implementare viitoare</p>
            </div>
        </div>
    );
}
