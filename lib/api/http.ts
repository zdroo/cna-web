import { refreshToken as apiRefresh } from "./auth";

let refreshPromise: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
    const stored = localStorage.getItem("refreshToken");
    if (!stored) return null;

    try {
        const res = await apiRefresh(stored);
        localStorage.setItem("token", res.token);
        localStorage.setItem("refreshToken", res.refreshToken);
        window.dispatchEvent(new CustomEvent("auth:refreshed", { detail: res }));
        return res.token;
    } catch {
        return null;
    }
}

function getRefreshedToken(): Promise<string | null> {
    if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}

function handleSessionExpired() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    window.dispatchEvent(new Event("auth:logout"));
    if (!window.location.pathname.startsWith("/auth/login")) {
        window.location.href = "/auth/login";
    }
}

/**
 * fetch() wrapper that attaches the Bearer token and, on a 401 response,
 * silently refreshes the access token and retries the request once.
 * If the refresh token is also invalid/expired, clears auth and redirects to login.
 */
export async function authFetch(url: string, options: RequestInit, token: string): Promise<Response> {
    const withAuth = (t: string): RequestInit => ({
        ...options,
        headers: { ...options.headers, Authorization: `Bearer ${t}` },
    });

    const response = await fetch(url, withAuth(token));
    if (response.status !== 401) return response;

    const newToken = await getRefreshedToken();
    if (!newToken) {
        handleSessionExpired();
        return response;
    }

    return fetch(url, withAuth(newToken));
}
