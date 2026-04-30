"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ChevronRight, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const NAV = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
    { href: "/admin/products", label: "Produse", icon: Package },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const { user, isLoaded, logout } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoaded) return;
        if (!user || (user.role !== "Admin" && user.role !== "Seller")) {
            router.replace("/");
        }
    }, [isLoaded, user, router]);

    if (!isLoaded || !user) return null;

    return (
        <div className="flex gap-8 items-start">

            {/* Sidebar */}
            <aside className="w-56 flex-shrink-0 sticky top-24">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-4 py-4 border-b border-gray-100">
                        <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Admin</p>
                        <p className="text-sm font-medium text-gray-800 mt-0.5 truncate">{user.email}</p>
                    </div>

                    <nav className="p-2 flex flex-col gap-0.5">
                        {NAV.map(({ href, label, icon: Icon, exact }) => {
                            const active = exact ? pathname === href : pathname.startsWith(href);
                            return (
                                <Link
                                    key={href}
                                    href={href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                                        active
                                            ? "bg-gray-900 text-white"
                                            : "text-gray-600 hover:bg-gray-50"
                                    }`}
                                >
                                    <Icon size={16} />
                                    {label}
                                    {active && <ChevronRight size={14} className="ml-auto opacity-60" />}
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-2 border-t border-gray-100">
                        <button
                            onClick={logout}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors w-full"
                        >
                            <LogOut size={16} />
                            Deconectare
                        </button>
                    </div>
                </div>
            </aside>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {children}
            </div>
        </div>
    );
}
