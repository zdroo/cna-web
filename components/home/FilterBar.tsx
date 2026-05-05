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

    const selectClass = "text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-500 cursor-pointer";

    return (
        <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">

                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 mr-1">
                    <SlidersHorizontal size={15} />
                    Filtre
                </div>

                <select
                    value={selectedCategoryId}
                    onChange={(e) => { onCategoryChange(e.target.value); onProductChange(""); }}
                    className={selectClass}
                >
                    <option value="">Toate categoriile</option>
                    {categories.map((c) => (
                        <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                    ))}
                </select>

                {selectedCategoryId && productsInCategory.length > 0 && (
                    <select
                        value={selectedProductId}
                        onChange={(e) => onProductChange(e.target.value)}
                        className={selectClass}
                    >
                        <option value="">Toate produsele</option>
                        {productsInCategory.map((p) => (
                            <option key={p.productId} value={p.productId}>{p.name}</option>
                        ))}
                    </select>
                )}

                <div className="h-5 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

                <div className="flex items-center gap-1.5">
                    <ArrowUpDown size={14} className="text-gray-400 dark:text-gray-500" />
                    <select
                        value={selectedSort}
                        onChange={(e) => onSortChange(e.target.value as SortOption)}
                        className={selectClass}
                    >
                        {(Object.keys(SORT_LABELS) as SortOption[]).map((key) => (
                            <option key={key} value={key}>{SORT_LABELS[key]}</option>
                        ))}
                    </select>
                </div>

                {hasActiveFilters && (
                    <button
                        onClick={onClear}
                        className="flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors ml-1"
                    >
                        <X size={13} />
                        Resetează
                    </button>
                )}

                <span className="ml-auto text-sm text-gray-400 dark:text-gray-500">
                    {totalCount} {totalCount === 1 ? "produs" : "produse"}
                </span>
            </div>

            {hasActiveFilters && (
                <div className="flex flex-wrap gap-2">
                    {selectedCategory && (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-full px-3 py-1">
                            {selectedCategory.name}
                            <button onClick={() => { onCategoryChange(""); onProductChange(""); }}>
                                <X size={11} />
                            </button>
                        </span>
                    )}
                    {selectedProductId && (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-800 rounded-full px-3 py-1">
                            {productsInCategory.find((p) => p.productId === selectedProductId)?.name}
                            <button onClick={() => onProductChange("")}>
                                <X size={11} />
                            </button>
                        </span>
                    )}
                    {selectedSort !== "default" && (
                        <span className="inline-flex items-center gap-1.5 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full px-3 py-1">
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
