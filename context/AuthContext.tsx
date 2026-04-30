"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { AuthUser } from "@/types/auth";
import { login as apiLogin, register as apiRegister, googleLogin as apiGoogleLogin } from "@/lib/api/auth";

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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(null);
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const stored = localStorage.getItem("token");
        if (stored) {
            setToken(stored);
            setUser(parseToken(stored));
        }
        setIsLoaded(true);
    }, []);

    function applyAuth(token: string) {
        localStorage.setItem("token", token);
        setToken(token);
        setUser(parseToken(token));
    }

    const login = useCallback(async (email: string, password: string) => {
        const res = await apiLogin(email, password);
        applyAuth(res.token);
        localStorage.setItem("refreshToken", res.refreshToken);
        router.push("/");
    }, [router]);

    const loginWithGoogle = useCallback(async (idToken: string) => {
        const res = await apiGoogleLogin(idToken);
        applyAuth(res.token);
        localStorage.setItem("refreshToken", res.refreshToken);
        router.push("/");
    }, [router]);

    const register = useCallback(async (email: string, password: string) => {
        const res = await apiRegister(email, password);
        applyAuth(res.token);
        localStorage.setItem("refreshToken", res.refreshToken);
        router.push("/");
    }, [router]);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        setToken(null);
        setUser(null);
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
