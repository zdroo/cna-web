"use client";

import Link from "next/link";
import { CategoryWithProducts } from "@/types/category";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

interface Props {
    categories: CategoryWithProducts[];
    selectedCategoryId?: string;
    onCategorySelect?: (categoryId: string) => void;
    defaultExpandedSlug?: string;
    selectedProductSlug?: string;
}

export default function CategorySidebar({ categories, selectedCategoryId, onCategorySelect, defaultExpandedSlug, selectedProductSlug }: Props) {
    const [expandedSlug, setExpandedSlug] = useState<string | null>(defaultExpandedSlug ?? null);

    useEffect(() => {
        if (defaultExpandedSlug) setExpandedSlug(defaultExpandedSlug);
    }, [defaultExpandedSlug]);

    const toggle = (slug: string) =>
        setExpandedSlug((prev) => (prev === slug ? null : slug));

    return (
        <aside className="w-56 shrink-0">
            <div className="bg-white dark:bg-gray-900 dark:border dark:border-gray-800 rounded-xl shadow-sm overflow-hidden sticky top-24">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                    <h2 className="font-bold text-gray-900 dark:text-gray-100 text-sm uppercase tracking-wide">
                        Categorii
                    </h2>
                </div>
                <nav className="py-2">
                    {onCategorySelect && (
                        <button
                            onClick={() => onCategorySelect("")}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                !selectedCategoryId
                                    ? "font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800"
                                    : "text-gray-500 dark:text-gray-400"
                            }`}
                        >
                            Toate categoriile
                        </button>
                    )}

                    {categories.map((category) => {
                        const isExpanded = expandedSlug === category.slug;
                        const isSelected = selectedCategoryId === category.categoryId;

                        return (
                            <div key={category.categoryId}>
                                <button
                                    onClick={() => {
                                        toggle(category.slug);
                                        onCategorySelect?.(isSelected ? "" : category.categoryId);
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                                        isSelected
                                            ? "bg-gray-50 dark:bg-gray-800 font-semibold text-gray-900 dark:text-gray-100"
                                            : "text-gray-700 dark:text-gray-300"
                                    }`}
                                >
                                    <span>{category.name}</span>
                                    <ChevronRight
                                        size={14}
                                        className={`text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
                                            isExpanded ? "rotate-90" : ""
                                        }`}
                                    />
                                </button>

                                {isExpanded && (
                                    <div className="border-l-2 border-gray-100 dark:border-gray-700 ml-4 mb-1">
                                        {category.products.length > 0 ? (
                                            category.products.map((product) => (
                                                <Link
                                                    key={product.productId}
                                                    href={`/produse/${product.productSlug}`}
                                                    className={`block px-3 py-2 text-sm transition-colors truncate ${
                                                        selectedProductSlug === product.productSlug
                                                            ? "font-semibold text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-800"
                                                            : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800"
                                                    }`}
                                                >
                                                    {product.name}
                                                </Link>
                                            ))
                                        ) : (
                                            <p className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500 italic">
                                                Niciun produs
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>
            </div>
        </aside>
    );
}
