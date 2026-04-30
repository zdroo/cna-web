"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { getFavorites, addFavorite, removeFavorite } from "@/lib/api/favorites";
import { FavoriteItem } from "@/types/favorite";

interface FavoritesContextType {
    favorites: Map<string, string>; // variantId -> favoriteItemId
    items: FavoriteItem[];
    isLoaded: boolean;
    toggle: (variantId: string) => Promise<void>;
    removeItem: (favoriteItemId: string, variantId: string) => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

function getOrCreateSessionId(): string {
    let id = localStorage.getItem("sessionId");
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("sessionId", id);
    }
    return id;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const [favorites, setFavorites] = useState<Map<string, string>>(new Map());
    const [items, setItems] = useState<FavoriteItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const sessionId = getOrCreateSessionId();
        getFavorites(sessionId)
            .then((data) => {
                setItems(data);
                setFavorites(new Map(data.map((i) => [i.productVariantId, i.favoriteItemId])));
            })
            .catch(console.error)
            .finally(() => setIsLoaded(true));
    }, []);

    const toggle = useCallback(async (variantId: string) => {
        const existingId = favorites.get(variantId);
        if (existingId) {
            await removeFavorite(existingId);
            setFavorites((prev) => { const m = new Map(prev); m.delete(variantId); return m; });
            setItems((prev) => prev.filter((i) => i.productVariantId !== variantId));
        } else {
            const sessionId = getOrCreateSessionId();
            const favoriteItemId = await addFavorite(variantId, sessionId);
            setFavorites((prev) => new Map(prev).set(variantId, favoriteItemId));
            const updated = await getFavorites(sessionId);
            setItems(updated);
        }
    }, [favorites]);

    const removeItem = useCallback(async (favoriteItemId: string, variantId: string) => {
        await removeFavorite(favoriteItemId);
        setFavorites((prev) => { const m = new Map(prev); m.delete(variantId); return m; });
        setItems((prev) => prev.filter((i) => i.favoriteItemId !== favoriteItemId));
    }, []);

    return (
        <FavoritesContext.Provider value={{ favorites, items, isLoaded, toggle, removeItem }}>
            {children}
        </FavoritesContext.Provider>
    );
}

export function useFavorites() {
    const ctx = useContext(FavoritesContext);
    if (!ctx) throw new Error("useFavorites must be used inside FavoritesProvider");
    return ctx;
}
