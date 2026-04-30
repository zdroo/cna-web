"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { User, LogOut, ChevronDown, LayoutDashboard, Package } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function UserMenu() {
    const { user, isLoaded, logout } = useAuth();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handle(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        }
        document.addEventListener("mousedown", handle);
        return () => document.removeEventListener("mousedown", handle);
    }, []);

    if (!isLoaded) return null;

    if (!user) {
        return (
            <Link
                href="/auth/login"
                className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
                Login
            </Link>
        );
    }

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 transition-colors px-3 py-2 rounded-lg"
            >
                <User size={16} className="text-gray-600" />
                <span className="text-sm font-medium text-gray-800 max-w-[120px] truncate">{user.email}</span>
                <ChevronDown size={14} className="text-gray-500" />
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    {(user.role === "Admin" || user.role === "Seller") && (
                        <Link
                            href="/admin"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            <LayoutDashboard size={14} />
                            Admin
                        </Link>
                    )}
                    <Link
                        href="/orders"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <Package size={14} />
                        Comenzile mele
                    </Link>
                    <button
                        onClick={() => { logout(); setOpen(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                        <LogOut size={14} />
                        Deconectare
                    </button>
                </div>
            )}
        </div>
    );
}
