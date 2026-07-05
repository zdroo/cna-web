"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { getFavorites, addFavorite, removeFavorite, mergeSessionFavorites } from "@/lib/api/favorites";
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

const GUEST_SESSION_KEY = "guestFavoritesSessionId";

function getOrCreateSessionId(): string {
    let id = localStorage.getItem(GUEST_SESSION_KEY);
    if (!id) {
        // Fall back to the shared cart session ID so a user who added favorites
        // as a guest (before this key existed) still gets them merged on first login.
        const cartId = localStorage.getItem("guestSessionId");
        id = cartId ?? crypto.randomUUID();
        localStorage.setItem(GUEST_SESSION_KEY, id);
    }
    return id;
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const { user, token, isLoaded: authLoaded } = useAuth();
    const [favorites, setFavorites] = useState<Map<string, string>>(new Map());
    const [items, setItems] = useState<FavoriteItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const inFlightRef = useRef<Set<string>>(new Set());

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
                    const sessionId = localStorage.getItem(GUEST_SESSION_KEY);
                    if (sessionId) {
                        try {
                            const data = await mergeSessionFavorites(currentToken, sessionId);
                            localStorage.removeItem(GUEST_SESSION_KEY);
                            applyItems(data);
                        } catch {
                            // Merge failed — keep the guest session key and show guest favorites
                            // so nothing is permanently lost if the server is momentarily unavailable.
                            const data = await getFavorites(undefined, sessionId);
                            applyItems(data);
                        }
                    } else {
                        const data = await getFavorites(currentToken, undefined);
                        applyItems(data);
                    }
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
    }, [authLoaded, user?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

    const toggle = useCallback(
        async (variantId: string) => {
            if (inFlightRef.current.has(variantId)) return;
            inFlightRef.current.add(variantId);
            try {
                const existingId = favorites.get(variantId);
                if (existingId) {
                    const sessionId = token ? undefined : getOrCreateSessionId();
                    await removeFavorite(existingId, token ?? undefined, sessionId);
                    setFavorites((prev) => { const m = new Map(prev); m.delete(variantId); return m; });
                    setItems((prev) => prev.filter((i) => i.productVariantId !== variantId));
                } else {
                    const sessionId = token ? undefined : getOrCreateSessionId();
                    const favoriteItemId = await addFavorite(variantId, token ?? undefined, sessionId);
                    setFavorites((prev) => new Map(prev).set(variantId, favoriteItemId));
                    const updated = token
                        ? await getFavorites(token, undefined)
                        : await getFavorites(undefined, sessionId);
                    applyItems(updated);
                }
            } finally {
                inFlightRef.current.delete(variantId);
            }
        },
        [favorites, token]
    );

    const removeItem = useCallback(async (favoriteItemId: string, variantId: string) => {
        const prevFavorites = favorites;
        const prevItems = items;
        setFavorites((prev) => { const m = new Map(prev); m.delete(variantId); return m; });
        setItems((prev) => prev.filter((i) => i.favoriteItemId !== favoriteItemId));
        const sessionId = token ? undefined : getOrCreateSessionId();
        try {
            await removeFavorite(favoriteItemId, token ?? undefined, sessionId);
        } catch (e) {
            setFavorites(prevFavorites);
            setItems(prevItems);
            throw e;
        }
    }, [favorites, items, token]);

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
