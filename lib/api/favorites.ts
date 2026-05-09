import { FavoriteItem } from "@/types/favorite";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function getFavorites(token?: string, sessionId?: string): Promise<FavoriteItem[]> {
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const url = token
        ? `${BASE}/api/favorites`
        : `${BASE}/api/favorites?sessionId=${sessionId ?? ""}`;

    const response = await fetch(url, { cache: "no-store", headers });
    if (!response.ok) throw new Error("Failed to fetch favorites");
    return response.json();
}

export async function addFavorite(productVariantId: string, token?: string, sessionId?: string): Promise<string> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const response = await fetch(`${BASE}/api/favorites`, {
        method: "POST",
        headers,
        body: JSON.stringify({ productVariantId, sessionId }),
    });

    if (!response.ok) throw new Error("Failed to add favorite");
    return response.json();
}

export async function removeFavorite(favoriteItemId: string): Promise<void> {
    const response = await fetch(`${BASE}/api/favorites/${favoriteItemId}`, {
        method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to remove favorite");
}
