"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const [theme, setTheme] = useState<Theme>("light");

    useEffect(() => {
        // DOM is already correct (set by inline <script> before first paint).
        // Read from it — more reliable than re-reading localStorage.
        const isDark = document.documentElement.classList.contains("dark");
        setTheme(isDark ? "dark" : "light");
    }, []);

    function toggleTheme() {
        // Read current DOM state — never stale, always authoritative.
        const isDark = document.documentElement.classList.contains("dark");
        const next: Theme = isDark ? "light" : "dark";
        document.documentElement.classList.toggle("dark", next === "dark");
        localStorage.setItem("theme", next);
        setTheme(next);
    }

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
    return ctx;
}
