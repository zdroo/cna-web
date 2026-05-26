"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { getFavorites, addFavorite, removeFavorite } from "@/lib/api/favorites";
import { useAuth } from "@/context/AuthContext";
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
    const { user, token, isLoaded: authLoaded } = useAuth();
    const [favorites, setFavorites] = useState<Map<string, string>>(new Map());
    const [items, setItems] = useState<FavoriteItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    function applyItems(data: FavoriteItem[]) {
        setItems(data);
        setFavorites(new Map(data.map((i) => [i.productVariantId, i.favoriteItemId])));
    }

    useEffect(() => {
        if (!authLoaded) return;

        const currentToken = token;

        async function load() {
            try {
                if (currentToken) {
                    // Drop the anonymous session so logout shows empty favorites
                    localStorage.removeItem("sessionId");
                    const data = await getFavorites(currentToken, undefined);
                    applyItems(data);
                } else {
                    applyItems([]);
                    const sessionId = getOrCreateSessionId();
                    const data = await getFavorites(undefined, sessionId);
                    applyItems(data);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoaded(true);
            }
        }

        load();
    }, [authLoaded, token]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggle = useCallback(
        async (variantId: string) => {
            const existingId = favorites.get(variantId);
            if (existingId) {
                const sessionId = token ? undefined : getOrCreateSessionId();
                await removeFavorite(existingId, token ?? undefined, sessionId);
                setFavorites((prev) => { const m = new Map(prev); m.delete(variantId); return m; });
                setItems((prev) => prev.filter((i) => i.productVariantId !== variantId));
            } else {
                const sessionId = getOrCreateSessionId();
                const favoriteItemId = await addFavorite(
                    variantId,
                    token ?? undefined,
                    token ? undefined : sessionId
                );
                setFavorites((prev) => new Map(prev).set(variantId, favoriteItemId));
                const updated = token
                    ? await getFavorites(token, undefined)
                    : await getFavorites(undefined, sessionId);
                applyItems(updated);
            }
        },
        [favorites, token]
    );

    const removeItem = useCallback(async (favoriteItemId: string, variantId: string) => {
        const sessionId = token ? undefined : getOrCreateSessionId();
        await removeFavorite(favoriteItemId, token ?? undefined, sessionId);
        setFavorites((prev) => { const m = new Map(prev); m.delete(variantId); return m; });
        setItems((prev) => prev.filter((i) => i.favoriteItemId !== favoriteItemId));
    }, [token]);

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
