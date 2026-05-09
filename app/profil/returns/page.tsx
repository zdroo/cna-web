"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RotateCcw, Clock, PackageCheck, HelpCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
    getUserReturnRequests,
    ReturnRequest,
    RETURN_STATUS_LABEL,
    RETURN_STATUS_STYLE,
} from "@/lib/api/returns";

const HOW_IT_WORKS = [
    {
        icon: <RotateCcw size={20} />,
        title: "Inițiezi returul",
        description: "Selectezi produsele din istoricul comenzilor și completezi motivul returului.",
        accent: "bg-orange-50 dark:bg-orange-950 text-orange-600 dark:text-orange-400",
    },
    {
        icon: <PackageCheck size={20} />,
        title: "Trimiți coletul",
        description: "Ambalezi produsul în ambalajul original și îl trimiți la adresa indicată.",
        accent: "bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400",
    },
    {
        icon: <Clock size={20} />,
        title: "Procesăm returul",
        description: "Verificăm produsul primit și procesăm rambursarea în 5–7 zile lucrătoare.",
        accent: "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400",
    },
];

export default function ReturnsPage() {
    const { token, isLoaded, user } = useAuth();
    const [requests, setRequests] = useState<ReturnRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoaded || !user || !token) return;
        getUserReturnRequests(token)
            .then(setRequests)
            .catch(() => setError("Nu s-au putut încărca cererile de retur."))
            .finally(() => setLoading(false));
    }, [isLoaded, user, token]);

    return (
        <div className="max-w-lg mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Link href="/profil" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Retururi</h1>
            </div>

            {/* Active return requests */}
            {loading ? (
                <div className="flex justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                </div>
            ) : error ? (
                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">{error}</p>
            ) : requests.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8 flex flex-col items-center text-center gap-3">
                    <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                        <RotateCcw size={26} className="text-gray-400" />
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">Nicio cerere de retur activă</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                        Retururile pot fi inițiate din pagina comenzilor, în termen de 30 de zile de la plasare.
                    </p>
                    <Link
                        href="/comenzi"
                        className="mt-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
                    >
                        Vezi comenzile mele
                    </Link>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {requests.map((r) => (
                        <div key={r.returnRequestId} className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
                            <div className="flex items-start justify-between gap-3 p-4">
                                <div>
                                    <p className="text-xs font-mono text-gray-400 dark:text-gray-500">
                                        Comanda #{r.orderId.split("-")[0].toUpperCase()}
                                    </p>
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                        {new Date(r.createdAt).toLocaleDateString("ro-RO", {
                                            day: "2-digit", month: "long", year: "numeric",
                                        })}
                                    </p>
                                </div>
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full flex-shrink-0 ${RETURN_STATUS_STYLE[r.status]}`}>
                                    {RETURN_STATUS_LABEL[r.status]}
                                </span>
                            </div>

                            <div className="border-t border-gray-50 dark:border-gray-800 px-4 py-3 flex flex-col gap-1.5">
                                {r.items.map((item) => (
                                    <div key={item.orderItemId} className="flex justify-between text-sm">
                                        <span className="text-gray-700 dark:text-gray-300">{item.productName}</span>
                                        <span className="text-gray-400 dark:text-gray-500 flex-shrink-0 ml-3">× {item.quantity}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-gray-50 dark:border-gray-800 px-4 py-3">
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Motiv: </span>
                                    {r.reason}
                                </p>
                                {r.adminNotes && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        <span className="font-medium text-gray-700 dark:text-gray-300">Notă admin: </span>
                                        {r.adminNotes}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}

                    <Link
                        href="/comenzi"
                        className="text-center text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors py-2"
                    >
                        + Solicită un nou retur
                    </Link>
                </div>
            )}

            {/* How it works */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Cum funcționează returul?</h2>
                <div className="flex flex-col gap-4">
                    {HOW_IT_WORKS.map((step, i) => (
                        <div key={i} className="flex gap-3 items-start">
                            <div className={`p-2 rounded-xl flex-shrink-0 ${step.accent}`}>
                                {step.icon}
                            </div>
                            <div>
                                <p className="font-medium text-sm text-gray-900 dark:text-gray-100">{step.title}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{step.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex items-start gap-3 text-sm text-gray-500 dark:text-gray-400 px-1">
                <HelpCircle size={16} className="flex-shrink-0 mt-0.5" />
                <p>
                    Produsele returnate trebuie să fie în starea originală, nefolosite și cu toate etichetele atașate.
                    Costurile de transport pentru retur sunt suportate de client.
                </p>
            </div>
        </div>
    );
}
