import { authFetch } from "./http";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export interface UserProfile {
    firstName: string | null;
    lastName: string | null;
    email: string;
    isGoogleUser: boolean;
}

export async function getUserProfile(token: string): Promise<UserProfile> {
    const res = await authFetch(`${BASE}/api/users/me`, {}, token);
    if (!res.ok) throw new Error("Nu s-a putut încărca profilul");
    return res.json();
}

export async function updateProfile(token: string, firstName: string, lastName: string): Promise<void> {
    const res = await authFetch(`${BASE}/api/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
    }, token);
    if (!res.ok) throw new Error("Nu s-a putut actualiza profilul");
}

export interface UserListItem {
    userId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: string;
    isEmailConfirmed: boolean;
    isActive: boolean;
    createdAt: string;
}

export interface UsersPagedResult {
    items: UserListItem[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export async function getUsers(token: string, page = 1, pageSize = 20, search?: string): Promise<UsersPagedResult> {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (search) params.set("search", search);
    const res = await authFetch(`${BASE}/api/users?${params}`, {}, token);
    if (!res.ok) throw new Error("Nu s-au putut încărca utilizatorii");
    return res.json();
}

export async function deleteAccount(token: string): Promise<void> {
    const res = await authFetch(`${BASE}/api/users/me`, {
        method: "DELETE",
    }, token);
    if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || "Nu s-a putut șterge contul");
    }
}

export async function changePassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
    const res = await authFetch(`${BASE}/api/users/me/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
    }, token);
    if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || "Nu s-a putut schimba parola");
    }
}
