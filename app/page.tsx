import type { Metadata } from "next";
import { getCategoriesWithProducts } from "@/lib/api/categories";
import { getVariantsFiltered } from "@/lib/api/products";
import HeroSection from "@/components/home/HeroSection";
import FeaturedCategories from "@/components/home/FeaturedCategories";
import VariantCard from "@/components/products/VariantCard";
import Link from "next/link";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cnashop.ro";

export const metadata: Metadata = {
    title: "CNA Shop – Magazin Online",
    description: "Descoperă produse de calitate la prețuri competitive. Livrare rapidă în toată România.",
    openGraph: {
        url: SITE_URL,
        title: "CNA Shop – Magazin Online",
        description: "Descoperă produse de calitate la prețuri competitive.",
    },
    alternates: { canonical: SITE_URL },
};

const websiteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
        {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            url: SITE_URL,
            name: "CNA Shop",
            inLanguage: "ro-RO",
            potentialAction: {
                "@type": "SearchAction",
                target: { "@type": "EntryPoint", urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
                "query-input": "required name=search_term_string",
            },
        },
        {
            "@type": "Organization",
            "@id": `${SITE_URL}/#organization`,
            name: "CNA Shop",
            url: SITE_URL,
            logo: { "@type": "ImageObject", url: `${SITE_URL}/logo.png` },
        },
    ],
};

export default async function HomePage() {
    const [categories, variantsResult] = await Promise.all([
        getCategoriesWithProducts(),
        getVariantsFiltered({ onlyActive: true, pageSize: 8 }),
    ]);

    const popular = variantsResult.items;

    return (
        <div className="flex flex-col gap-4">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
            />

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
