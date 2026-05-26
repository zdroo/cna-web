"use client";

import { useEffect, useState, use } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import VariantCard from "@/components/products/VariantCard";
import CategorySidebar from "@/components/home/CategorySidebar";
import { getProductVariants } from "@/lib/api/products";
import { getCategoriesWithProducts } from "@/lib/api/categories";
import { ProductVariant } from "@/types/product";
import { CategoryWithProducts } from "@/types/category";

type SortOption = "default" | "price_asc" | "price_desc" | "name_asc";

function slugToTitle(slug: string): string {
    return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

function sortVariants(variants: ProductVariant[], sort: SortOption): ProductVariant[] {
    const sorted = [...variants];
    switch (sort) {
        case "price_asc":  return sorted.sort((a, b) => a.price - b.price);
        case "price_desc": return sorted.sort((a, b) => b.price - a.price);
        case "name_asc":   return sorted.sort((a, b) => a.name.localeCompare(b.name));
        default:           return sorted;
    }
}

export default function ProductVariantsPage({ params }: { params: Promise<{ productSlug: string }> }) {
    const { productSlug } = use(params);

    const [variants, setVariants] = useState<ProductVariant[]>([]);
    const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [sort, setSort] = useState<SortOption>("default");
    const [onlyInStock, setOnlyInStock] = useState(false);

    useEffect(() => {
        Promise.all([
            getProductVariants(productSlug),
            getCategoriesWithProducts(),
        ]).then(([v, c]) => {
            setVariants(v);
            setCategories(c);
        }).finally(() => setLoading(false));
    }, [productSlug]);

    const matchingCategory = categories.find((cat) =>
        cat.products.some((p) => p.productSlug === productSlug)
    );

    const displayed = sortVariants(
        onlyInStock ? variants.filter(v => v.stockQuantity > 0) : variants,
        sort
    );

    const hasActiveFilters = sort !== "default" || onlyInStock;

    function clearFilters() {
        setSort("default");
        setOnlyInStock(false);
    }

    return (
        <div className="flex gap-6 items-start">
            <CategorySidebar
                categories={categories}
                selectedCategoryId={matchingCategory?.categoryId}
                defaultExpandedSlug={matchingCategory?.slug}
                selectedProductSlug={productSlug}
            />

            <div className="flex-1 min-w-0 flex flex-col gap-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{slugToTitle(productSlug)}</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">{displayed.length} variante disponibile</p>
                    </div>
                    <button
                        onClick={() => setShowFilters(v => !v)}
                        className={`flex items-center gap-2 border px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                            showFilters || hasActiveFilters
                                ? "border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                                : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                        }`}
                    >
                        <SlidersHorizontal size={16} />
                        Filtre
                        {hasActiveFilters && (
                            <span className="w-5 h-5 rounded-full bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs flex items-center justify-center font-bold">
                                {(sort !== "default" ? 1 : 0) + (onlyInStock ? 1 : 0)}
                            </span>
                        )}
                    </button>
                </div>

                {/* Filter panel */}
                {showFilters && (
                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Sortare</label>
                            <select
                                value={sort}
                                onChange={e => setSort(e.target.value as SortOption)}
                                className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                            >
                                <option value="default">Implicit</option>
                                <option value="price_asc">Preț crescător</option>
                                <option value="price_desc">Preț descrescător</option>
                                <option value="name_asc">Nume A–Z</option>
                            </select>
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={onlyInStock}
                                onChange={e => setOnlyInStock(e.target.checked)}
                                className="w-4 h-4 rounded accent-gray-900 dark:accent-gray-100"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">Doar în stoc</span>
                        </label>

                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors ml-auto"
                            >
                                <X size={14} />
                                Resetează
                            </button>
                        )}
                    </div>
                )}

                {/* Variants grid */}
                {loading ? (
                    <div className="flex justify-center py-24 text-gray-400 dark:text-gray-500">
                        <p>Se încarcă...</p>
                    </div>
                ) : displayed.length > 0 ? (
                    <div className="flex flex-wrap gap-6">
                        {displayed.map((variant) => (
                            <div key={variant.variantId} className="w-64 flex flex-col">
                                <VariantCard variant={variant} productSlug={productSlug} />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-400 dark:text-gray-500">
                        <p className="text-lg font-medium">Nicio variantă găsită</p>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="mt-3 text-sm underline hover:text-gray-700 dark:hover:text-gray-200">
                                Resetează filtrele
                            </button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
