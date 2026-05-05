const BASE = process.env.NEXT_PUBLIC_API_URL;

export interface UserProfile {
    firstName: string | null;
    lastName: string | null;
    email: string;
    isGoogleUser: boolean;
}

export async function getUserProfile(token: string): Promise<UserProfile> {
    const res = await fetch(`${BASE}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Nu s-a putut încărca profilul");
    return res.json();
}

export async function updateProfile(token: string, firstName: string, lastName: string): Promise<void> {
    const res = await fetch(`${BASE}/api/users/me`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ firstName, lastName }),
    });
    if (!res.ok) throw new Error("Nu s-a putut actualiza profilul");
}

export async function changePassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
    const res = await fetch(`${BASE}/api/users/me/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.message || "Nu s-a putut schimba parola");
    }
}
