import { authFetch } from "./http";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export interface CouponValidation {
    isValid: boolean;
    errorMessage: string | null;
    discountAmount: number;
    discountType: string;
    discountValue: number;
}

export interface CouponItem {
    couponId: string;
    code: string;
    discountType: "Percentage" | "FixedAmount";
    discountValue: number;
    minOrderAmount: number | null;
    maxUses: number | null;
    maxUsesPerUser: number | null;
    usesCount: number;
    expiresAt: string | null;
    isActive: boolean;
    createdAt: string;
}

export async function validateCoupon(code: string, orderTotal: number, token?: string): Promise<CouponValidation> {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;
    const res = await fetch(`${BASE}/api/coupons/validate`, {
        method: "POST",
        headers,
        body: JSON.stringify({ code, orderTotal }),
    });
    if (!res.ok) throw new Error("Eroare la validarea cuponului");
    return res.json();
}

export async function adminGetCoupons(token: string): Promise<CouponItem[]> {
    const res = await authFetch(`${BASE}/api/coupons`, {}, token);
    if (!res.ok) throw new Error("Eroare la încărcarea cupoanelor");
    return res.json();
}

export async function adminCreateCoupon(token: string, data: {
    code: string;
    discountType: "Percentage" | "FixedAmount";
    discountValue: number;
    minOrderAmount: number | null;
    maxUses: number | null;
    maxUsesPerUser: number | null;
    expiresAt: string | null;
}): Promise<void> {
    const res = await authFetch(`${BASE}/api/coupons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    }, token);
    if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || "Nu s-a putut crea cuponul");
    }
}

export async function adminDeleteCoupon(token: string, couponId: string): Promise<void> {
    const res = await authFetch(`${BASE}/api/coupons/${couponId}`, {
        method: "DELETE",
    }, token);
    if (!res.ok) throw new Error("Nu s-a putut șterge cuponul");
}

export async function adminToggleCoupon(token: string, couponId: string): Promise<void> {
    const res = await authFetch(`${BASE}/api/coupons/${couponId}/toggle`, {
        method: "PATCH",
    }, token);
    if (!res.ok) throw new Error("Nu s-a putut modifica starea cuponului");
}
