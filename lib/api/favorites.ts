import { FavoriteItem } from "@/types/favorite";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function getFavorites(sessionId: string): Promise<FavoriteItem[]> {
    const response = await fetch(`${BASE}/api/favorites?sessionId=${sessionId}`, {
        cache: "no-store",
    });

    if (!response.ok) throw new Error("Failed to fetch favorites");

    return response.json();
}

export async function addFavorite(productVariantId: string, sessionId: string): Promise<string> {
    const response = await fetch(`${BASE}/api/favorites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
