"use client";

import { SlidersHorizontal, ArrowUpDown, X } from "lucide-react";
import { CategoryWithProducts } from "@/types/category";

export type SortOption = "default" | "price_asc" | "price_desc" | "rating" | "name_asc";

interface Props {
    categories: CategoryWithProducts[];
    selectedCategoryId: string;
    selectedProductId: string;
    selectedSort: SortOption;
    totalCount: number;
    onCategoryChange: (id: string) => void;
    onProductChange: (id: string) => void;
    onSortChange: (sort: SortOption) => void;
    onClear: () => void;
}

const SORT_LABELS: Record<SortOption, string> = {
    default: "Implicit",
    price_asc: "Preț: mic → mare",
    price_desc: "Preț: mare → mic",
    rating: "Rating",
    name_asc: "Nume A → Z",
};

export default function FilterBar({
    categories,
    selectedCategoryId,
    selectedProductId,
    selectedSort,
    totalCount,
    onCategoryChange,
    onProductChange,
    onSortChange,
    onClear,
}: Props) {
    const selectedCategory = categories.find((c) => c.categoryId === selectedCategoryId);
    const productsInCategory = selectedCategory?.products ?? [];
    const hasActiveFilters = selectedCategoryId || selectedProductId || selectedSort !== "default";

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">

                {/* Filters label */}
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 mr-1">
                    <SlidersHorizontal size={15} />
                    Filtre
                </div>

                {/* Category dropdown */}
                <select
                    value={selectedCategoryId}
                    onChange={(e) => {
                        onCategoryChange(e.target.value);
                        onProductChange("");
                    }}
                    className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
                >
                    <option value="">Toate categoriile</option>
                    {categories.map((c) => (
                        <option key={c.categoryId} value={c.categoryId}>
                            {c.name}
                        </option>
                    ))}
                </select>

                {/* Product dropdown — visible only when category selected */}
                {selectedCategoryId && productsInCategory.length > 0 && (
                    <select
                        value={selectedProductId}
                        onChange={(e) => onProductChange(e.target.value)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
                    >
                        <option value="">Toate produsele</option>
                        {productsInCategory.map((p) => (
                            <option key={p.productId} value={p.productId}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                )}

                {/* Divider */}
                <div className="h-5 w-px bg-gray-200 mx-1" />

                {/* Sort dropdown */}
                <div className="flex items-center gap-1.5">
                    <ArrowUpDown size={14} className="text-gray-400" />
                    <select
                        value={selectedSort}
                        onChange={(e) => onSortChange(e.target.value as SortOption)}
                        className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-900 cursor-pointer"
                    >
                        {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                            <option key={key} value={key}>
                                {SORT_LABELS[key]}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Clear button */}
                {hasActiveFilters && (
                    <button
                        onClick={onClear}
                        className="flex items-center gap-1 text-sm text-gray-400 hover:text-gray-700 transition-colors ml-1"
                    >
                        <X size={13} />
                        Resetează
                    </button>
                )}

                {/* Count */}
                <span className="ml-auto text-sm text-gray-400">
                    {totalCount} {totalCount === 1 ? "produs" : "produse"}
                </span>
            </div>

            {/* Active filter chips */}
            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                    {selectedCategory && (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-gray-900 text-white rounded-full px-3 py-1">
                            {selectedCategory.name}
                            <button onClick={() => { onCategoryChange(""); onProductChange(""); }}>
                                <X size={11} />
                            </button>
                        </span>
                    )}
                    {selectedProductId && (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-gray-700 text-white rounded-full px-3 py-1">
                            {productsInCategory.find((p) => p.productId === selectedProductId)?.name}
                            <button onClick={() => onProductChange("")}>
                                <X size={11} />
                            </button>
                        </span>
                    )}
                    {selectedSort !== "default" && (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-gray-200 text-gray-700 rounded-full px-3 py-1">
                            {SORT_LABELS[selectedSort]}
                            <button onClick={() => onSortChange("default")}>
                                <X size={11} />
                            </button>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
