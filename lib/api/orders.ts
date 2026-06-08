const BASE = process.env.NEXT_PUBLIC_API_URL;

export type OrderStatus = "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";

export const STATUS_ORDER: Record<OrderStatus, number> = {
    Pending: 0, Confirmed: 1, Shipped: 2, Delivered: 3, Cancelled: 4,
};

export interface ShippingAddress {
    fullName: string;
    phoneNumber: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    region: string;
    postalCode: string;
    countryCode: string;
}

export interface OrderItem {
    orderItemId: string;
    productVariantId: string;
    quantity: number;
    price: number;
    total: number;
    productName: string;
    variantSlug: string;
    productSlug: string;
    isReturnable: boolean;
}

export interface CompanyOrderSnapshot {
    companyName: string;
    cui: string;
    jNumber?: string;
    isVATRegistered: boolean;
    vatNumber?: string;
    billingAddressLine1: string;
    billingAddressLine2?: string;
    billingCity: string;
    billingRegion: string;
    billingPostalCode: string;
    billingCountryCode: string;
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
    shippingAddress: ShippingAddress;
    isB2B: boolean;
    netAmount: number;
    vatAmount: number;
    vatRate: number;
    invoiceNumber?: string;
    invoiceDate?: string;
    paymentMethod?: string;
    companySnapshot?: CompanyOrderSnapshot;
    couponCode?: string;
    discountAmount: number;
    giftCardCode?: string;
    giftCardDeduction: number;
    amountDue: number;
}

export interface PagedOrdersResult {
    items: Order[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export async function getOrders(token: string, page = 1, pageSize = 10): Promise<PagedOrdersResult> {
    const res = await fetch(`${BASE}/api/order?page=${page}&pageSize=${pageSize}`, {
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

export async function downloadInvoice(token: string, orderId: string): Promise<void> {
    const res = await fetch(`${BASE}/api/order/${orderId}/invoice`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Nu s-a putut descărca factura");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `factura-${orderId.slice(0, 8).toUpperCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
