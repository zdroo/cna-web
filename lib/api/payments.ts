const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function createPaymentSession(
    token: string,
    orderId: string
): Promise<{ url: string }> {
    const res = await fetch(`${BASE}/api/payments/create-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(orderId),
    });
    if (!res.ok) throw new Error("Nu s-a putut crea sesiunea de plată");
    return res.json();
}
