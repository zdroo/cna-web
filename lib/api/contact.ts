const BASE = process.env.NEXT_PUBLIC_API_URL;

export interface ContactPayload {
    name: string;
    email: string;
    subject: string;
    message: string;
}

export async function sendContactMessage(payload: ContactPayload): Promise<void> {
    const res = await fetch(`${BASE}/api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || "Mesajul nu a putut fi trimis. Încearcă din nou.");
    }
}
