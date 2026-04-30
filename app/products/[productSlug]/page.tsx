import { getProductVariants } from "@/lib/api/products";
import VariantCard from "@/components/products/VariantCard";
import { SlidersHorizontal } from "lucide-react";

interface ProductVariantsPageProps {
    params: Promise<{ productSlug: string }>;
}

function slugToTitle(slug: string): string {
    return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default async function ProductVariantsPage({ params }: ProductVariantsPageProps) {
    const { productSlug } = await params;
    const variants = await getProductVariants(productSlug);

    return (
        <div className="flex flex-col gap-8">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{slugToTitle(productSlug)}</h1>
                    <p className="text-gray-500 mt-1">{variants.length} variants found</p>
                </div>
                <button className="flex items-center gap-2 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                    <SlidersHorizontal size={16} />
                    <span className="text-sm font-medium">Filters</span>
                </button>
            </div>

            {/* Variants grid */}
            {variants.length > 0 ? (
                <div className="flex flex-wrap justify-center gap-6">
                    {variants.map((variant) => (
                        <div key={variant.variantId} className="w-64 flex flex-col">
                            <VariantCard variant={variant} productSlug={productSlug} />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                    <p className="text-lg font-medium">No variants found</p>
                </div>
            )}

        </div>
    );
}
