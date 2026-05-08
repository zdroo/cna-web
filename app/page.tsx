import { getCategoriesWithProducts } from "@/lib/api/categories";
import { getVariantsFiltered } from "@/lib/api/products";
import HeroSection from "@/components/home/HeroSection";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import VariantCard from "@/components/products/VariantCard";
import Link from "next/link";

export default async function HomePage() {
    const [categories, allVariants] = await Promise.all([
        getCategoriesWithProducts(),
        getVariantsFiltered({ onlyActive: true }),
    ]);

    const popular = allVariants.slice(0, 8);

    return (
        <div className="flex flex-col gap-4">

            <HeroSection />

            <FeaturedCategories categories={categories} />

            <section>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Produse populare
                    </h2>
                    <Link
                        href="/produse"
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                    >
                        Vezi toate →
                    </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {popular.map((variant) => (
                        <VariantCard
                            key={variant.variantId}
                            variant={variant}
                            productSlug={variant.productSlug}
                        />
                    ))}
                </div>
            </section>

        </div>
    );
}
