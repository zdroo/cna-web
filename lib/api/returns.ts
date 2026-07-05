import { authFetch } from "./http";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export type ReturnStatus = "Pending" | "Approved" | "Rejected" | "InTransit" | "Received" | "Refunded";
export type ReturnReasonCode = "Defective" | "WrongItem" | "NotAsDescribed" | "ChangedMind" | "DamagedInShipping" | "Other";
export type ReturnItemStatus = "Pending" | "Approved" | "Rejected";

export const RETURN_REASON_LABEL: Record<ReturnReasonCode, string> = {
    Defective: "Produs defect",
    WrongItem: "Produs greșit",
    NotAsDescribed: "Nu corespunde descrierii",
    ChangedMind: "M-am răzgândit",
    DamagedInShipping: "Deteriorat în transport",
    Other: "Altul",
};

export const RETURN_STATUS_ORDER: Record<ReturnStatus, number> = {
    Pending: 0, Approved: 1, InTransit: 2, Received: 3, Refunded: 4, Rejected: 5,
};

export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
    Pending:   "În așteptare",
    Approved:  "Aprobat",
    InTransit: "În tranzit",
    Received:  "Primit",
    Refunded:  "Rambursat",
    Rejected:  "Respins",
};

export const RETURN_STATUS_STYLE: Record<ReturnStatus, string> = {
    Pending:   "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
    Approved:  "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    InTransit: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
    Received:  "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
    Refunded:  "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
    Rejected:  "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
};

export interface ReturnItem {
    id: string;
    orderItemId: string;
    productName: string;
    quantity: number;
    itemStatus: ReturnItemStatus;
    itemAdminNotes: string | null;
}

export interface ReturnRequest {
    returnRequestId: string;
    orderId: string;
    status: ReturnStatus;
    reason: string;
    reasonCode: ReturnReasonCode | null;
    adminNotes: string | null;
    returnAwb: string | null;
    returnCarrierName: string | null;
    returnTrackingUrl: string | null;
    createdAt: string;
    items: ReturnItem[];
    refundAmount: number;
}

export interface AdminReturnRequest extends ReturnRequest {
    userId: string;
    userEmail: string;
}

export interface AdminReturnPagedResult {
    items: AdminReturnRequest[];
    totalCount: number;
    totalPages: number;
    page: number;
    pageSize: number;
}

export interface CreateReturnPayload {
    orderId: string;
    reason: string;
    items: { orderItemId: string; quantity: number }[];
    reasonCode?: ReturnReasonCode;
}

export interface ItemStatusUpdate {
    returnItemId: string;
    itemStatus: ReturnItemStatus;
    itemAdminNotes?: string;
}

export async function getUserReturnRequests(token: string): Promise<ReturnRequest[]> {
    const res = await authFetch(`${BASE}/api/returns`, {}, token);
    if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || "Nu s-au putut încărca cererile de retur.");
    }
    return res.json();
}

export async function createReturnRequest(token: string, payload: CreateReturnPayload): Promise<{ returnRequestId: string }> {
    const res = await authFetch(`${BASE}/api/returns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    }, token);
    if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || "Nu s-a putut trimite cererea de retur.");
    }
    return res.json();
}

export async function getAdminReturnRequests(
    token: string,
    page = 1,
    pageSize = 20,
    status?: ReturnStatus
): Promise<AdminReturnPagedResult> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (status !== undefined) params.set("status", status);
    const res = await authFetch(`${BASE}/api/returns/admin?${params}`, {}, token);
    if (!res.ok) throw new Error("Nu s-au putut încărca cererile de retur.");
    return res.json();
}

export async function updateReturnStatus(
    token: string,
    returnRequestId: string,
    status: ReturnStatus,
    adminNotes?: string,
    rma?: { awb: string; carrierName: string; trackingUrl?: string },
    itemStatusUpdates?: ItemStatusUpdate[],
): Promise<void> {
    const res = await authFetch(`${BASE}/api/returns/${returnRequestId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            status,
            adminNotes: adminNotes ?? null,
            returnAwb: rma?.awb ?? null,
            returnCarrierName: rma?.carrierName ?? null,
            returnTrackingUrl: rma?.trackingUrl ?? null,
            itemStatusUpdates: itemStatusUpdates ?? null,
        }),
    }, token);
    if (!res.ok) throw new Error("Actualizarea statusului a eșuat.");
}
