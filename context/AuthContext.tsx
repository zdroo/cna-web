"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthUser } from "@/types/auth";
import { login as apiLogin, register as apiRegister, googleLogin as apiGoogleLogin, refreshToken as apiRefresh } from "@/lib/api/auth";

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

    function applyAuth(newToken: string, newRefresh: string) {
        localStorage.setItem("token", newToken);
        localStorage.setItem("refreshToken", newRefresh);
        setToken(newToken);
        setUser(parseToken(newToken));
        scheduleRefresh(newToken);
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

        const delay = msUntilExpiry(currentToken) - 60_000;
        if (delay <= 0) return; // already expired, handled elsewhere

        refreshTimerRef.current = setTimeout(async () => {
            const stored = localStorage.getItem("refreshToken");
            if (!stored) return;
            try {
                const res = await apiRefresh(stored);
                applyAuth(res.token, res.refreshToken);
            } catch {
                clearAuth();
            }
        }, delay);
    }

    useEffect(() => {
        async function init() {
            const storedToken = localStorage.getItem("token");
            const storedRefresh = localStorage.getItem("refreshToken");

            if (storedToken && msUntilExpiry(storedToken) > 0) {
                // Token still valid — use it and schedule next refresh.
                setToken(storedToken);
                setUser(parseToken(storedToken));
                scheduleRefresh(storedToken);
            } else if (storedRefresh) {
                // Token expired (or missing) but refresh token exists — renew silently.
                try {
                    const res = await apiRefresh(storedRefresh);
                    applyAuth(res.token, res.refreshToken);
                } catch {
                    clearAuth();
                }
            }

            setIsLoaded(true);
        }

        init();

        return () => {
            if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const login = useCallback(async (email: string, password: string) => {
        const res = await apiLogin(email, password);
        applyAuth(res.token, res.refreshToken);
        router.push("/");
    }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

    const loginWithGoogle = useCallback(async (idToken: string) => {
        const res = await apiGoogleLogin(idToken);
        applyAuth(res.token, res.refreshToken);
        router.push("/");
    }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

    const register = useCallback(async (email: string, password: string) => {
        const res = await apiRegister(email, password);
        applyAuth(res.token, res.refreshToken);
        router.push("/");
    }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

    const logout = useCallback(() => {
        clearAuth();
        router.push("/");
    }, [router]); // eslint-disable-line react-hooks/exhaustive-deps

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
