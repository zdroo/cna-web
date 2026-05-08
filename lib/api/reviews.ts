const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function checkCanReview(token: string, variantId: string): Promise<boolean> {
    const res = await fetch(`${BASE}/api/reviews/can-review?variantId=${variantId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
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
    const res = await fetch(`${BASE}/api/reviews`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
            productVariantId: variantId,
            rating,
            comment,
        }),
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.message ?? "Eroare la adăugarea recenziei");
    }
}
