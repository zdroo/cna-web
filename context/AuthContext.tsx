"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthUser } from "@/types/auth";
import { login as apiLogin, register as apiRegister, googleLogin as apiGoogleLogin, refreshToken as apiRefresh, logout as apiLogout } from "@/lib/api/auth";

interface AuthContextType {
    user: AuthUser | null;
    token: string | null;
    isLoaded: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    loginWithGoogle: (idToken: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

function parseToken(token: string): AuthUser | null {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return {
            userId: payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier"],
            email: payload["http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress"],
            role: payload["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"] ?? "User",
        };
    } catch {
        return null;
    }
}

// Returns ms until token expires, negative if already expired.
function msUntilExpiry(token: string): number {
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        return payload.exp * 1000 - Date.now();
    } catch {
        return -1;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const router = useRouter();
    const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Refs that always point to the latest function versions. The event listeners
    // and the setTimeout callback in scheduleRefresh read from these so they never
    // hold stale closures even if AuthProvider re-renders between registration and firing.
    const applyAuthRef = useRef<(newToken: string, newRefresh: string) => void>(null!);
    const clearAuthRef = useRef<() => void>(null!);
    const scheduleRefreshRef = useRef<(currentToken: string) => void>(null!);

    function applyAuth(newToken: string, newRefresh: string) {
        localStorage.setItem("token", newToken);
        localStorage.setItem("refreshToken", newRefresh);
        setToken(newToken);
        setUser(parseToken(newToken));
        scheduleRefreshRef.current(newToken);
    }

    function clearAuth() {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setToken(null);
        setUser(null);
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    }

    // Schedule a silent refresh 60 seconds before the token expires.
    function scheduleRefresh(currentToken: string) {
        if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

        const remaining = msUntilExpiry(currentToken);
        if (remaining <= 0) return; // already expired, handled elsewhere

        refreshTimerRef.current = setTimeout(async () => {
            const stored = localStorage.getItem("refreshToken");
            if (!stored) return;
            try {
                const res = await apiRefresh(stored);
                applyAuthRef.current(res.token, res.refreshToken);
            } catch {
                clearAuthRef.current();
            }
        }, Math.max(0, remaining - 60_000));
    }

    // Keep refs current on every render so callbacks never capture stale versions.
    applyAuthRef.current = applyAuth;
    clearAuthRef.current = clearAuth;
    scheduleRefreshRef.current = scheduleRefresh;

    // Sync state when lib/api/http.ts silently refreshes or invalidates the session.
    useEffect(() => {
        function onRefreshed(e: Event) {
            const detail = (e as CustomEvent<{ token: string; refreshToken: string }>).detail;
            setToken(detail.token);
            setUser(parseToken(detail.token));
            scheduleRefreshRef.current(detail.token);
        }

        function onLogout() {
            clearAuthRef.current();
        }

        window.addEventListener("auth:refreshed", onRefreshed);
        window.addEventListener("auth:logout", onLogout);
        return () => {
            window.removeEventListener("auth:refreshed", onRefreshed);
            window.removeEventListener("auth:logout", onLogout);
        };
    }, []);

    useEffect(() => {
        async function init() {
            const storedToken = localStorage.getItem("token");
            const storedRefresh = localStorage.getItem("refreshToken");

            if (storedToken && msUntilExpiry(storedToken) > 0) {
                // Token still valid — use it and schedule next refresh.
                setToken(storedToken);
                setUser(parseToken(storedToken));
                scheduleRefreshRef.current(storedToken);
            } else if (storedRefresh) {
                // Token expired (or missing) but refresh token exists — renew silently.
                try {
                    const res = await apiRefresh(storedRefresh);
                    applyAuthRef.current(res.token, res.refreshToken);
                } catch {
                    clearAuthRef.current();
                }
            }

            setIsLoaded(true);
        }

        init();

        return () => {
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        };
    }, []);

    function safeRedirect(): string {
        const redirect = new URLSearchParams(window.location.search).get("redirect");
        return redirect?.startsWith("/") ? redirect : "/";
    }

    const login = useCallback(async (email: string, password: string) => {
        const res = await apiLogin(email, password);
        applyAuthRef.current(res.token, res.refreshToken);
        router.push(safeRedirect());
    }, [router]);

    const loginWithGoogle = useCallback(async (idToken: string) => {
        const res = await apiGoogleLogin(idToken);
        applyAuthRef.current(res.token, res.refreshToken);
        router.push(safeRedirect());
    }, [router]);

    const register = useCallback(async (email: string, password: string) => {
        await apiRegister(email, password);
    }, []);

    const logout = useCallback(() => {
        const storedRefresh = localStorage.getItem("refreshToken");
        if (storedRefresh) apiLogout(storedRefresh);
        clearAuthRef.current();
        router.push("/");
    }, [router]);

    return (
        <AuthContext.Provider value={{ user, token, isLoaded, login, register, loginWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
    return ctx;
}
