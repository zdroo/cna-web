import { authFetch } from "./http";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function createPaymentSession(
    token: string,
    orderId: string
): Promise<{ url: string }> {
    const res = await authFetch(`${BASE}/api/payments/create-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderId),
    }, token);
    if (!res.ok) throw new Error("Nu s-a putut crea sesiunea de plată");
    return res.json();
}
