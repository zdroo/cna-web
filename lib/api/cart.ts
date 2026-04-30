import { CartItem } from "@/types/cart";

const BASE = process.env.NEXT_PUBLIC_API_URL;

interface CartApiItem {
    cartItemId: string;
    productVariantId: string;
    cartId: string;
    quantity: number;
    price: number;
    total: number;
    name: string;
    brand: string | null;
    primaryImageUrl: string | null;
    productSlug: string;
    variantSlug: string;
    stockQuantity: number;
}

interface CartApiResponse {
    userId: string;
    total: number;
    items: CartApiItem[];
}

function mapItems(data: CartApiResponse): CartItem[] {
    return data.items.map((i) => ({
        cartItemId: i.cartItemId,
        variantId: i.productVariantId,
        variantSlug: i.variantSlug,
        productSlug: i.productSlug,
        name: i.name,
        brand: i.brand,
        price: i.price,
        quantity: i.quantity,
        primaryImageUrl: i.primaryImageUrl,
        stockQuantity: i.stockQuantity,
    }));
}

function buildHeaders(token?: string | null, sessionId?: string | null): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (token) h["Authorization"] = `Bearer ${token}`;
    if (sessionId) h["X-Session-Id"] = sessionId;
    return h;
}

/** Appends sessionId as query param so it works even if the header gets stripped by CORS preflight. */
function buildUrl(path: string, sessionId?: string | null, extraParams?: Record<string, string>): string {
    const params = new URLSearchParams();
    if (sessionId) params.set("sessionId", sessionId);
    if (extraParams) Object.entries(extraParams).forEach(([k, v]) => params.set(k, v));
    const qs = params.toString();
    return `${BASE}${path}${qs ? `?${qs}` : ""}`;
}

export async function getCart(token?: string | null, sessionId?: string | null): Promise<CartItem[]> {
    const res = await fetch(buildUrl("/api/cart", sessionId), {
        headers: buildHeaders(token, sessionId),
    });
    if (!res.ok) return [];
    const data: CartApiResponse = await res.json();
    return mapItems(data);
}

export async function addToCart(
    token: string | null | undefined,
    sessionId: string | null | undefined,
    variantId: string
): Promise<CartItem[]> {
    const res = await fetch(buildUrl("/api/cart", sessionId), {
        method: "POST",
        headers: buildHeaders(token, sessionId),
        body: JSON.stringify(variantId),
    });
    if (!res.ok) throw new Error("Eroare la adăugarea în coș");
    const data: CartApiResponse = await res.json();
    return mapItems(data);
}

export async function updateCartItem(
    token: string | null | undefined,
    sessionId: string | null | undefined,
    cartItemId: string,
    quantity: number
): Promise<CartItem[]> {
    const res = await fetch(buildUrl(`/api/cart/${cartItemId}`, sessionId, { quantity: String(quantity) }), {
        method: "PUT",
        headers: buildHeaders(token, sessionId),
    });
    if (!res.ok) throw new Error("Eroare la actualizarea cantității");
    const data: CartApiResponse = await res.json();
    return mapItems(data);
}

export async function removeCartItem(
    token: string | null | undefined,
    sessionId: string | null | undefined,
    cartItemId: string
): Promise<CartItem[]> {
    const res = await fetch(buildUrl(`/api/cart/${cartItemId}`, sessionId), {
        method: "DELETE",
        headers: buildHeaders(token, sessionId),
    });
    if (!res.ok) throw new Error("Eroare la eliminarea din coș");
    const data: CartApiResponse = await res.json();
    return mapItems(data);
}

export async function clearCartApi(token?: string | null, sessionId?: string | null): Promise<void> {
    await fetch(buildUrl("/api/cart", sessionId), {
        method: "DELETE",
        headers: buildHeaders(token, sessionId),
    });
}

export async function checkout(
    token: string,
    shippingContactId: string,
    cartItemIds: string[]
): Promise<{ orderId: string }> {
    const res = await fetch(`${BASE}/api/cart/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shippingContactId, cartItemIds }),
    });
    if (!res.ok) throw new Error("Comanda nu a putut fi plasată");
    return res.json();
}

export async function mergeSessionCart(token: string, sessionId: string): Promise<CartItem[]> {
    const res = await fetch(`${BASE}/api/cart/merge?sessionId=${sessionId}`, {
        method: "POST",
        headers: buildHeaders(token),
    });
    if (!res.ok) return [];
    const data: CartApiResponse = await res.json();
    return mapItems(data);
}
