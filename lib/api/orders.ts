const BASE = process.env.NEXT_PUBLIC_API_URL;

export type OrderStatus = 0 | 1 | 2 | 3 | 4;

export interface OrderItem {
    orderItemId: string;
    productVariantId: string;
    quantity: number;
    price: number;
    total: number;
    productName: string;
    variantSlug: string;
    productSlug: string;
}

export interface Order {
    orderId: string;
    totalAmount: number;
    status: OrderStatus;
    items: OrderItem[];
    isPaid: boolean;
    createdAt: string;
    awbNumber?: string;
    carrierName?: string;
    trackingUrl?: string;
}

export async function getOrders(token: string): Promise<Order[]> {
    const res = await fetch(`${BASE}/api/order`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`getOrders failed: ${res.status}`);
    return res.json();
}

export async function getOrderById(token: string, orderId: string): Promise<Order> {
    const res = await fetch(`${BASE}/api/order/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });
    if (!res.ok) throw new Error(`getOrderById failed: ${res.status}`);
    return res.json();
}

export async function cancelOrder(token: string, orderId: string): Promise<void> {
    const res = await fetch(`${BASE}/api/order/${orderId}/cancel`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Nu s-a putut anula comanda");
}
