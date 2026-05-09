"use client";

import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
    Package,
    MapPin,
    RotateCcw,
    Settings,
    Heart,
    LayoutDashboard,
    LogOut,
    ChevronRight,
    UserCircle,
    Moon,
} from "lucide-react";

interface ProfileCard {
    icon: React.ReactNode;
    label: string;
    description: string;
    action: (() => void) | string;
    accent?: string;
}

export default function ProfilePage() {
    const { user, isLoaded, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded && !user) {
            router.replace("/auth/login");
        }
    }, [isLoaded, user, router]);

    const isDark = theme === "dark";

    if (!isLoaded || !user) return null;

    const cards: ProfileCard[] = [
        {
            icon: <Package size={22} />,
            label: "Comenzile mele",
            description: "Vizualizează și gestionează comenzile tale",
            action: "/comenzi",
            accent: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950",
        },
        {
            icon: <MapPin size={22} />,
            label: "Adrese de livrare",
            description: "Salvează și editează adresele tale",
            action: "/profil/addresses",
            accent: "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950",
        },
        {
            icon: <Heart size={22} />,
            label: "Favorite",
            description: "Produsele tale salvate",
            action: "/favourites",
            accent: "text-pink-600 dark:text-pink-400 bg-pink-50 dark:bg-pink-950",
        },
        {
            icon: <RotateCcw size={22} />,
            label: "Retururi",
            description: "Solicită un retur sau urmărește statusul",
            action: "/profil/returns",
            accent: "text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950",
        },
        {
            icon: <Settings size={22} />,
            label: "Setări cont",
            description: "Schimbă parola și datele personale",
            action: "/profil/settings",
            accent: "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800",
        },
    ];

    if (user.role === "Admin" || user.role === "Seller") {
        cards.push({
            icon: <LayoutDashboard size={22} />,
            label: "Panou de control",
            description: "Gestionează produse, categorii și comenzi",
            action: "/admin",
            accent: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950",
        });
    }

    function CardItem({ card }: { card: ProfileCard }) {
        const inner = (
            <div className="flex items-center gap-4 p-4">
                <div className={`p-2.5 rounded-xl ${card.accent ?? "bg-gray-100 dark:bg-gray-800"}`}>
                    {card.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-gray-100">{card.label}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{card.description}</p>
                </div>
                <ChevronRight size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
            </div>
        );

        if (typeof card.action === "string") {
            return (
                <Link
                    href={card.action}
                    className="block hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-xl"
                >
                    {inner}
                </Link>
            );
        }

        return (
            <button
                onClick={card.action}
                className="w-full text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-xl"
            >
                {inner}
            </button>
        );
    }

    return (
        <div className="max-w-lg mx-auto">

            {/* Header cu toggle temă dreapta sus */}
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-full p-3">
                        <UserCircle size={40} className="text-gray-500 dark:text-gray-400" />
                    </div>
                    <div>
                        <p className="font-semibold text-lg text-gray-900 dark:text-gray-100">{user.email}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">{user.role}</p>
                    </div>
                </div>

                {/* Toggle temă */}
                <button
                    onClick={toggleTheme}
                    aria-label="Schimbă tema"
                    className="flex items-center gap-2 select-none"
                >
                    <Moon size={14} className="text-gray-400 dark:text-gray-300" />
                    <div
                        className={`relative w-11 h-6 rounded-full transition-colors duration-300 ${
                            isDark ? "bg-green-500" : "bg-red-400"
                        }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                                isDark ? "translate-x-5" : "translate-x-0"
                            }`}
                        />
                    </div>
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
                {cards.map((card) => (
                    <CardItem key={card.label} card={card} />
                ))}
            </div>

            <button
                onClick={logout}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-red-600 dark:text-red-400 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:bg-red-50 dark:hover:bg-red-950 transition-colors font-medium shadow-sm"
            >
                <LogOut size={18} />
                Deconectare
            </button>
        </div>
    );
}
