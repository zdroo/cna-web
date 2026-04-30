"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function SearchBar({ initialQuery = "" }: { initialQuery?: string }) {
    const [query, setQuery] = useState(initialQuery);
    const router = useRouter();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmed = query.trim();
        if (trimmed) {
            router.push(`/search?q=${encodeURIComponent(trimmed)}`);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full">
            <div className="flex items-center bg-white border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-gray-900 transition-colors">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Caută produse, branduri, categorii..."
                    className="flex-1 px-5 py-4 text-gray-900 placeholder-gray-400 outline-none text-base bg-transparent"
                />
                <button
                    type="submit"
                    className="flex items-center gap-2 bg-gray-900 text-white px-6 py-4 font-semibold hover:bg-gray-700 transition-colors"
                >
                    <Search size={20} />
                    <span className="hidden sm:inline">Caută</span>
                </button>
            </div>
        </form>
    );
}
