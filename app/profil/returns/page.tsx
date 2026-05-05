"use client";

import Link from "next/link";
import { ArrowLeft, RotateCcw, Clock, PackageCheck, HelpCircle } from "lucide-react";

const STEPS = [
    {
        icon: <RotateCcw size={20} />,
        title: "Inițiezi returul",
        description: "Selectezi produsul din istoricul comenzilor și completezi motivul returului.",
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
        description: "Verificăm produsul primit și procesăm rambursarea în 5-7 zile lucrătoare.",
        accent: "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400",
    },
];

export default function ReturnsPage() {
    return (
        <div className="max-w-lg mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Link href="/profil" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Retururi</h1>
            </div>

            {/* Nicio cerere activă */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-8 flex flex-col items-center text-center gap-3">
                <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <RotateCcw size={26} className="text-gray-400" />
                </div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">Nicio cerere de retur activă</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
                    Retururile pot fi inițiate din pagina comenzii, în termen de 30 de zile de la livrare.
                </p>
                <Link
                    href="/comenzi"
                    className="mt-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
                >
                    Vezi comenzile mele
                </Link>
            </div>

            {/* Cum funcționează */}
            <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Cum funcționează returul?</h2>
                <div className="flex flex-col gap-4">
                    {STEPS.map((step, i) => (
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

            {/* Politică */}
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
