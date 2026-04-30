import { getCategoriesWithProducts } from "@/lib/api/categories";
import { getVariantsFiltered } from "@/lib/api/products";
import SearchBar from "@/components/home/SearchBar";
import CategorySidebar from "@/components/home/CategorySidebar";
import VariantCard from "@/components/products/VariantCard";

interface SearchPageProps {
    searchParams: Promise<{ q?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
    const { q } = await searchParams;
    const query = q?.trim() ?? "";

    const [categories, variants] = await Promise.all([
        getCategoriesWithProducts(),
        getVariantsFiltered({ searchText: query || undefined, onlyActive: true }),
    ]);

    return (
        <div className="flex flex-col gap-6">

            <SearchBar initialQuery={query} />

            <div className="flex gap-6 items-start">
                <CategorySidebar categories={categories} />

                <div className="flex-1 flex flex-col gap-4">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            {query ? `Rezultate pentru „${query}"` : "Toate produsele"}
                        </h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {variants.length} {variants.length === 1 ? "produs găsit" : "produse găsite"}
                        </p>
                    </div>

                    {variants.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {variants.map((variant) => (
                                <VariantCard
                                    key={variant.variantId}
                                    variant={variant}
                                    productSlug={variant.productSlug}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                            <p className="font-medium text-lg">Niciun produs găsit</p>
                            {query && <p className="text-sm mt-1">Încearcă un alt termen de căutare.</p>}
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
}
