"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import CartBadge from "./CartBadge";
import FavouritesBadge from "./FavouritesBadge";
import UserMenu from "./UserMenu";

const NAV_LINKS = [
    { href: "/produse",               label: "Produse" },
    { href: "/carduri-cadou/cumpara", label: "Carduri cadou" },
    { href: "/despre-noi",            label: "Despre noi" },
    { href: "/contact",               label: "Contact" },
];

export default function Navbar() {
    const pathname = usePathname();
    const router = useRouter();
    const [searchOpen, setSearchOpen] = useState(false);
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (searchOpen) inputRef.current?.focus();
    }, [searchOpen]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeSearch();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    function closeSearch() {
        setSearchOpen(false);
        setQuery("");
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const trimmed = query.trim();
        if (!trimmed) return;
        router.push(`/produse?search=${encodeURIComponent(trimmed)}`);
        closeSearch();
    }

    return (
        <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16 gap-4">

                {/* Logo */}
                <Link href="/" className="text-xl font-bold text-gray-900 dark:text-gray-100 shrink-0">
                    CNA Shop
                </Link>

                {/* Nav links + inline search */}
                <div className="hidden md:flex items-center flex-1 justify-center">

                    {/* Expandable search */}
                    <div className="flex items-center mr-2">
                        {searchOpen ? (
                            <form onSubmit={handleSubmit} className="flex items-center gap-1">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Caută produse..."
                                    className="w-52 px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-gray-500 dark:focus:border-gray-400 transition-colors"
                                />
                                <button
                                    type="submit"
                                    className="p-1.5 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    <Search size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={closeSearch}
                                    className="p-1.5 rounded-full text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </form>
                        ) : (
                            <button
                                onClick={() => setSearchOpen(true)}
                                className="p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                aria-label="Caută"
                            >
                                <Search size={17} />
                            </button>
                        )}
                    </div>

                    {/* Divider between search and nav links */}
                    <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 mr-2" />

                    {/* Nav links */}
                    {NAV_LINKS.map(({ href, label }, i) => {
                        const active = pathname === href || pathname.startsWith(href + "/");
                        return (
                            <div key={href} className="flex items-center">
                                {i > 0 && (
                                    <span className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
                                )}
                                <Link
                                    href={href}
                                    className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${
                                        active
                                            ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800"
                                            : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                    }`}
                                >
                                    {label}
                                </Link>
                            </div>
                        );
                    })}
                </div>

                {/* Right icons */}
                <div className="flex items-center gap-3 shrink-0">
                    <FavouritesBadge />
                    <CartBadge />
                    <UserMenu />
                </div>

            </div>
        </nav>
    );
}
