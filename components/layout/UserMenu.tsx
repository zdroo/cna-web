"use client";

import Link from "next/link";
import { UserCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function UserMenu() {
    const { user, isLoaded } = useAuth();

    if (!isLoaded) return (
        <div className="w-[110px] h-9 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
    );

    if (!user) {
        return (
            <Link
                href="/auth/login"
                className="bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors text-sm font-medium"
            >
                Conectează-te
            </Link>
        );
    }

    return (
        <Link href="/profil" className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            <UserCircle size={28} />
        </Link>
    );
}
