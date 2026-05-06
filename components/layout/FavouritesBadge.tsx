"use client";

import Link from "next/link";
import { Heart } from "lucide-react";
import { useFavorites } from "@/context/FavoritesContext";

export default function FavouritesBadge() {
    const { items } = useFavorites();
    const count = items.length;

    return (
        <Link href="/favourites" className="relative text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            <Heart size={22} />
            {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
                    {count > 9 ? "9+" : count}
                </span>
            )}
        </Link>
    );
}
