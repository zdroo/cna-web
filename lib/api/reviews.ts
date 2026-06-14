import { authFetch } from "./http";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function checkCanReview(token: string, variantId: string): Promise<boolean> {
    const res = await authFetch(`${BASE}/api/reviews/can-review?variantId=${variantId}`, {}, token);
    if (!res.ok) return false;
    const data = await res.json();
    return data.canReview as boolean;
}

export async function addReview(
    token: string,
    variantId: string,
    rating: number,
    comment: string
): Promise<void> {
    const res = await authFetch(`${BASE}/api/reviews`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            productVariantId: variantId,
            rating,
            comment,
        }),
    }, token);

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Eroare la adăugarea recenziei");
    }
}

export async function updateReview(
    token: string,
    reviewId: string,
    rating: number,
    comment: string,
): Promise<void> {
    const res = await authFetch(`${BASE}/api/reviews/${reviewId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
    }, token);
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Eroare la actualizarea recenziei");
    }
}

export async function deleteReview(token: string, reviewId: string): Promise<void> {
    const res = await authFetch(`${BASE}/api/reviews/${reviewId}`, {
        method: "DELETE",
    }, token);
    if (!res.ok) throw new Error("Eroare la ștergerea recenziei");
}

export async function subscribeToStockNotification(variantId: string, email: string): Promise<void> {
    const res = await fetch(`${BASE}/api/variants/${variantId}/notify-me`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Eroare la înregistrarea notificării");
    }
}
