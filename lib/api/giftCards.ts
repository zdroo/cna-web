import { authFetch } from "./http";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export interface GiftCardValidation {
    isValid: boolean;
    errorMessage: string | null;
    deduction: number;
    balance: number;
}

export interface GiftCardItem {
    giftCardId: string;
    code: string;
    initialValue: number;
    balance: number;
    isActive: boolean;
    expiresAt: string | null;
    createdAt: string;
}

export async function validateGiftCard(code: string, orderTotal: number): Promise<GiftCardValidation> {
    const res = await fetch(`${BASE}/api/gift-cards/validate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, orderTotal }),
    });
    if (!res.ok) throw new Error("Eroare la validarea cardului cadou");
    return res.json();
}

export async function adminGetGiftCards(token: string): Promise<GiftCardItem[]> {
    const res = await authFetch(`${BASE}/api/gift-cards`, {}, token);
    if (!res.ok) throw new Error("Eroare la încărcarea cardurilor cadou");
    return res.json();
}

export async function adminCreateGiftCard(token: string, data: {
    code: string;
    value: number;
    expiresAt: string | null;
}): Promise<void> {
    const res = await authFetch(`${BASE}/api/gift-cards`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }, token);
    if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || "Nu s-a putut crea cardul cadou");
    }
}

export async function adminDeleteGiftCard(token: string, giftCardId: string): Promise<void> {
    const res = await authFetch(`${BASE}/api/gift-cards/${giftCardId}`, {
        method: "DELETE",
    }, token);
    if (!res.ok) throw new Error("Nu s-a putut șterge cardul cadou");
}

export async function purchaseGiftCard(data: {
    amount: number;
    recipientEmail: string;
    recipientName: string;
    senderName: string;
    message?: string;
}): Promise<{ url: string }> {
    const res = await fetch(`${BASE}/api/gift-cards/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });
    if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || "Eroare la inițializarea plății");
    }
    return res.json();
}
