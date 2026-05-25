const BASE = process.env.NEXT_PUBLIC_API_URL;

export type ReturnStatus = 0 | 1 | 2 | 3; // Pending | Approved | Rejected | Refunded

export const RETURN_STATUS_LABEL: Record<ReturnStatus, string> = {
    0: "În așteptare",
    1: "Aprobat",
    2: "Respins",
    3: "Rambursat",
};

export const RETURN_STATUS_STYLE: Record<ReturnStatus, string> = {
    0: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300",
    1: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
    2: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
    3: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
};

export interface ReturnItem {
    orderItemId: string;
    productName: string;
    quantity: number;
}

export interface ReturnRequest {
    returnRequestId: string;
    orderId: string;
    status: ReturnStatus;
    reason: string;
    adminNotes: string | null;
    createdAt: string;
    items: ReturnItem[];
}

export interface AdminReturnRequest extends ReturnRequest {
    userId: string;
    userEmail: string;
}

export interface AdminReturnPagedResult {
    items: AdminReturnRequest[];
    totalCount: number;
    page: number;
    pageSize: number;
}

export interface CreateReturnPayload {
    orderId: string;
    reason: string;
    items: { orderItemId: string; quantity: number }[];
}

export async function getUserReturnRequests(token: string): Promise<ReturnRequest[]> {
    const res = await fetch(`${BASE}/api/returns`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Nu s-au putut încărca cererile de retur.");
    return res.json();
}

export async function createReturnRequest(token: string, payload: CreateReturnPayload): Promise<{ returnRequestId: string }> {
    const res = await fetch(`${BASE}/api/returns`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
    });
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
    if (status !== undefined) params.set("status", String(status));
    const res = await fetch(`${BASE}/api/returns/admin?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Nu s-au putut încărca cererile de retur.");
    return res.json();
}

export async function updateReturnStatus(
    token: string,
    returnRequestId: string,
    status: ReturnStatus,
    adminNotes?: string
): Promise<void> {
    const res = await fetch(`${BASE}/api/returns/${returnRequestId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status, adminNotes: adminNotes ?? null }),
    });
    if (!res.ok) throw new Error("Actualizarea statusului a eșuat.");
}
