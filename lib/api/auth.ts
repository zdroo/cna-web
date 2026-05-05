import { AuthResponse } from "@/types/auth";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export async function login(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message ?? "Email sau parolă incorecte");
    }

    return response.json();
}

export async function googleLogin(idToken: string): Promise<AuthResponse> {
    const response = await fetch(`${BASE}/api/auth/google`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message ?? "Autentificare Google eșuată");
    }

    return response.json();
}

export async function refreshToken(token: string): Promise<AuthResponse> {
    const response = await fetch(`${BASE}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
    });

    if (!response.ok) throw new Error("Refresh failed");

    return response.json();
}

export async function register(email: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message ?? "Înregistrare eșuată");
    }

    return response.json();
}
