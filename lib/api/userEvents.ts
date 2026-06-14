import { authFetch } from "./http";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export type UserEventType =
    | "UserRegistered"
    | "UserLoggedIn"
    | "AddedToCart"
    | "CheckoutStarted"
    | "PaymentPageOpened"
    | "PaymentCompleted"
    | "CheckoutAbandoned";

export interface UserEventDto {
    id: string;
    userId: string | null;
    userEmail: string | null;
    eventType: UserEventType;
    orderId: string | null;
    productVariantId: string | null;
    metadata: string | null;
    occurredAt: string;
}

export interface UserEventsResult {
    items: UserEventDto[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export interface FunnelResult {
    CheckoutStarted?: number;
    PaymentPageOpened?: number;
    PaymentCompleted?: number;
    CheckoutAbandoned?: number;
}

export async function getUserEvents(
    token: string,
    params: {
        page?: number;
        pageSize?: number;
        userEmail?: string;
        eventType?: UserEventType;
        from?: string;
        to?: string;
    } = {}
): Promise<UserEventsResult> {
    const query = new URLSearchParams();
    if (params.page) query.set("page", String(params.page));
    if (params.pageSize) query.set("pageSize", String(params.pageSize));
    if (params.userEmail) query.set("userEmail", params.userEmail);
    if (params.eventType) query.set("eventType", params.eventType);
    if (params.from) query.set("from", params.from);
    if (params.to) query.set("to", params.to);

    const res = await authFetch(`${BASE}/api/admin/user-events?${query}`, {}, token);
    if (!res.ok) throw new Error("Nu s-au putut încărca evenimentele.");
    return res.json();
}

export async function getFunnel(
    token: string,
    from?: string,
    to?: string
): Promise<FunnelResult> {
    const query = new URLSearchParams();
    if (from) query.set("from", from);
    if (to) query.set("to", to);
    const res = await authFetch(`${BASE}/api/admin/user-events/funnel?${query}`, {}, token);
    if (!res.ok) throw new Error("Nu s-a putut încărca funnel-ul.");
    return res.json();
}
