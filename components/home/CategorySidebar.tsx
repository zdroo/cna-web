"use client";

import Link from "next/link";
import { CategoryWithProducts } from "@/types/category";
import { ChevronRight } from "lucide-react";
import { useState } from "react";

interface Props {
    categories: CategoryWithProducts[];
    selectedCategoryId?: string;
    onCategorySelect?: (categoryId: string) => void;
}

export default function CategorySidebar({ categories, selectedCategoryId, onCategorySelect }: Props) {
    const [expandedSlug, setExpandedSlug] = useState<string | null>(null);

    const toggle = (slug: string) =>
        setExpandedSlug((prev) => (prev === slug ? null : slug));

    return (
        <aside className="w-56 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden sticky top-24">
                <div className="px-4 py-3 border-b border-gray-100">
                    <h2 className="font-bold text-gray-900 text-sm uppercase tracking-wide">
                        Categorii
                    </h2>
                </div>
                <nav className="py-2">
                    {onCategorySelect && (
                        <button
                            onClick={() => onCategorySelect("")}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                                !selectedCategoryId ? "font-semibold text-gray-900 bg-gray-50" : "text-gray-500"
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
                                        onCategorySelect?.(
                                            isSelected ? "" : category.categoryId
                                        );
                                    }}
                                    className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors hover:bg-gray-50 ${
                                        isSelected
                                            ? "bg-gray-50 font-semibold text-gray-900"
                                            : "text-gray-700"
                                    }`}
                                >
                                    <span>{category.name}</span>
                                    <ChevronRight
                                        size={14}
                                        className={`text-gray-400 transition-transform duration-200 ${
                                            isExpanded ? "rotate-90" : ""
                                        }`}
                                    />
                                </button>

                                {isExpanded && (
                                    <div className="border-l-2 border-gray-100 ml-4 mb-1">
                                        {category.products.length > 0 ? (
                                            category.products.map((product) => (
                                                <Link
                                                    key={product.productId}
                                                    href={`/products/${product.productSlug}`}
                                                    className="block px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors truncate"
                                                >
                                                    {product.name}
                                                </Link>
                                            ))
                                        ) : (
                                            <p className="px-3 py-2 text-xs text-gray-400 italic">
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
