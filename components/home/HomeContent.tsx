"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ProductVariant } from "@/types/product";
import { CategoryWithProducts } from "@/types/category";
import VariantCard from "@/components/products/VariantCard";
import CategorySidebar from "@/components/home/CategorySidebar";
import FilterBar, { SortOption } from "@/components/home/FilterBar";

interface Props {
    categories: CategoryWithProducts[];
    allVariants: ProductVariant[];
}

function sortVariants(variants: ProductVariant[], sort: SortOption): ProductVariant[] {
    const sorted = [...variants];
    switch (sort) {
        case "price_asc":  return sorted.sort((a, b) => a.price - b.price);
        case "price_desc": return sorted.sort((a, b) => b.price - a.price);
        case "rating":     return sorted.sort((a, b) => (b.averageRating ?? 0) - (a.averageRating ?? 0));
        case "name_asc":   return sorted.sort((a, b) => a.name.localeCompare(b.name));
        default:           return sorted;
    }
}

export default function HomeContent({ categories, allVariants }: Props) {
    const [selectedCategoryId, setSelectedCategoryId] = useState("");
    const [selectedProductId, setSelectedProductId] = useState("");
    const [selectedSort, setSelectedSort] = useState<SortOption>("default");

    const filtered = useMemo(() => {
        let result = allVariants;

        if (selectedCategoryId)
            result = result.filter((v) => v.categoryId === selectedCategoryId);

        if (selectedProductId)
            result = result.filter((v) => v.productId === selectedProductId);

        result = sortVariants(result, selectedSort);

        return result;
    }, [allVariants, selectedCategoryId, selectedProductId, selectedSort]);

    const displayed = (selectedCategoryId || selectedProductId) ? filtered : filtered.slice(0, 12);

    function handleClear() {
        setSelectedCategoryId("");
        setSelectedProductId("");
        setSelectedSort("default");
    }

    return (
        <div className="flex gap-6 items-start">
            <CategorySidebar
                categories={categories}
                selectedCategoryId={selectedCategoryId}
                onCategorySelect={(id) => {
                    setSelectedCategoryId(id);
                    setSelectedProductId("");
                }}
            />

            <div className="flex-1 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                        {selectedCategoryId
                            ? categories.find((c) => c.categoryId === selectedCategoryId)?.name ?? "Produse"
                            : "Produse populare"}
                    </h2>
                    {!selectedCategoryId && !selectedProductId && (
                        <Link href="/produse" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                            Vezi toate →
                        </Link>
                    )}
                </div>

                <FilterBar
                    categories={categories}
                    selectedCategoryId={selectedCategoryId}
                    selectedProductId={selectedProductId}
                    selectedSort={selectedSort}
                    totalCount={displayed.length}
                    onCategoryChange={setSelectedCategoryId}
                    onProductChange={setSelectedProductId}
                    onSortChange={setSelectedSort}
                    onClear={handleClear}
                />

                {displayed.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {displayed.map((variant) => (
                            <VariantCard
                                key={variant.variantId}
                                variant={variant}
                                productSlug={variant.productSlug}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center justify-center py-24 text-gray-400 dark:text-gray-500">
                        <p>Niciun produs găsit pentru filtrele selectate.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
