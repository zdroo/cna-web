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

export async function register(email: string, password: string): Promise<void> {
    const response = await fetch(`${BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message ?? "Înregistrare eșuată");
    }
}

export async function confirmEmail(token: string): Promise<void> {
    const response = await fetch(`${BASE}/api/auth/confirm-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message ?? "Link invalid sau expirat.");
    }
}

export async function resendConfirmationEmail(email: string): Promise<void> {
    const response = await fetch(`${BASE}/api/auth/resend-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message ?? "Trimiterea emailului a eșuat.");
    }
}

export async function forgotPassword(email: string): Promise<void> {
    const response = await fetch(`${BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message ?? "Trimiterea emailului a eșuat.");
    }
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await fetch(`${BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message ?? "Link invalid sau expirat.");
    }
}

export async function logout(refreshToken: string): Promise<void> {
    await fetch(`${BASE}/api/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
    }).catch(() => {});
}
