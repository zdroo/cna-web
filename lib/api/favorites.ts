import { FavoriteItem } from "@/types/favorite";
import { authFetch } from "./http";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function getFavorites(token?: string, sessionId?: string): Promise<FavoriteItem[]> {
    const response = token
        ? await authFetch(`${BASE}/api/favorites`, { cache: "no-store" }, token)
        : await fetch(`${BASE}/api/favorites?sessionId=${sessionId ?? ""}`, { cache: "no-store" });
    if (!response.ok) throw new Error("Failed to fetch favorites");
    return response.json();
}

export async function addFavorite(productVariantId: string, token?: string, sessionId?: string): Promise<string> {
    const opts: RequestInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productVariantId, sessionId }),
    };
    const response = token
        ? await authFetch(`${BASE}/api/favorites`, opts, token)
        : await fetch(`${BASE}/api/favorites`, opts);
    if (!response.ok) throw new Error("Failed to add favorite");
    return response.json();
}

export async function mergeSessionFavorites(token: string, sessionId: string): Promise<FavoriteItem[]> {
    const response = await authFetch(`${BASE}/api/favorites/merge?sessionId=${sessionId}`, {
        method: "POST",
    }, token);
    if (!response.ok) throw new Error("Failed to merge session favorites");
    return response.json();
}

export async function removeFavorite(
    favoriteItemId: string,
    token?: string,
    sessionId?: string
): Promise<void> {
    const url = sessionId
        ? `${BASE}/api/favorites/${favoriteItemId}?sessionId=${sessionId}`
        : `${BASE}/api/favorites/${favoriteItemId}`;
    const response = token
        ? await authFetch(url, { method: "DELETE" }, token)
        : await fetch(url, { method: "DELETE" });
    if (!response.ok) throw new Error("Failed to remove favorite");
}
