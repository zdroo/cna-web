"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useFavorites } from "@/context/FavoritesContext";

export default function FavoriteButton({ variantId }: { variantId: string }) {
    const { favorites, toggle, isLoaded } = useFavorites();
    const [isLoading, setIsLoading] = useState(false);

    const isFavorited = favorites.has(variantId);

    async function handleClick() {
        if (isLoading) return;
        setIsLoading(true);
        try {
            await toggle(variantId);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="relative group/fav">
            <button
                onClick={handleClick}
                disabled={isLoading || !isLoaded}
                aria-label={isFavorited ? "Elimină de la favorite" : "Adaugă la favorite"}
                className="flex items-center justify-center w-9 h-9 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
                <Heart
                    size={16}
                    className={isFavorited ? "fill-red-500 text-red-500" : "text-gray-400"}
                />
            </button>
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/fav:opacity-100">
                {isFavorited ? "Elimină de la favorite" : "Adaugă la favorite"}
            </span>
        </div>
    );
}
