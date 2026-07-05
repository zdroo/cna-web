"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Search, X } from "lucide-react";
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
    const [drawerOpen, setDrawerOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (searchOpen) inputRef.current?.focus();
    }, [searchOpen]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape") {
                closeSearch();
                setDrawerOpen(false);
            }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, []);

    useEffect(() => {
        setDrawerOpen(false);
    }, [pathname]);

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

    function handleDrawerSearch(e: React.FormEvent) {
        handleSubmit(e);
        setDrawerOpen(false);
    }

    return (
        <>
            <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16 gap-4">

                    {/* Logo */}
                    <Link href="/" className="text-xl font-bold text-gray-900 dark:text-gray-100 shrink-0">
                        CNA Shop
                    </Link>

                    {/* Nav links + inline search (desktop only) */}
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
                        {/* Hamburger — mobile only */}
                        <button
                            onClick={() => setDrawerOpen(o => !o)}
                            className="md:hidden p-1.5 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                            aria-label="Meniu"
                        >
                            {drawerOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>

                </div>
            </nav>

            {/* Mobile drawer */}
            {drawerOpen && (
                <div className="md:hidden fixed inset-0 top-16 z-40">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/30 dark:bg-black/50"
                        onClick={() => setDrawerOpen(false)}
                    />
                    {/* Drawer panel */}
                    <div className="relative w-72 h-full bg-white dark:bg-gray-900 shadow-xl flex flex-col">
                        {/* Search */}
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                            <form onSubmit={handleDrawerSearch} className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Caută produse..."
                                    className="flex-1 px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                                />
                                <button
                                    type="submit"
                                    className="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                                    aria-label="Caută"
                                >
                                    <Search size={16} />
                                </button>
                            </form>
                        </div>
                        {/* Nav links */}
                        <nav className="flex flex-col p-2">
                            {NAV_LINKS.map(({ href, label }) => {
                                const active = pathname === href || pathname.startsWith(href + "/");
                                return (
                                    <Link
                                        key={href}
                                        href={href}
                                        onClick={() => setDrawerOpen(false)}
                                        className={`px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                            active
                                                ? "text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800"
                                                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50"
                                        }`}
                                    >
                                        {label}
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                </div>
            )}
        </>
    );
}
