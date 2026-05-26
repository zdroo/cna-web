import type { Metadata } from "next";
import { getCategoriesWithProducts } from "@/lib/api/categories";
import HomeContent from "@/components/home/HomeContent";

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
    const categories = await getCategoriesWithProducts();

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
            />

            <HomeContent categories={categories} />
        </>
    );
}
