import { MetadataRoute } from "next";

const BASE = process.env.NEXT_PUBLIC_API_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cnashop.ro";

const STATIC_ROUTES: MetadataRoute.Sitemap = [
    { url: SITE_URL, priority: 1.0, changeFrequency: "daily" },
    { url: `${SITE_URL}/produse`, priority: 0.9, changeFrequency: "daily" },
    { url: `${SITE_URL}/contact`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${SITE_URL}/despre-noi`, priority: 0.5, changeFrequency: "monthly" },
];

interface VariantSlug {
    variantSlug: string;
    productSlug: string;
    updatedAt?: string;
}

interface SlugPage {
    items: VariantSlug[];
    totalPages: number;
}

async function fetchAllVariantSlugs(): Promise<VariantSlug[]> {
    try {
        const firstPage = await fetch(
            `${BASE}/api/products/variants-filtered?onlyActive=true&page=1&pageSize=100`,
            { next: { revalidate: 3600 } }
        );
        if (!firstPage.ok) return [];
        const data: SlugPage = await firstPage.json();
        const all: VariantSlug[] = [...data.items];

        if (data.totalPages > 1) {
            const pages = Array.from({ length: data.totalPages - 1 }, (_, i) => i + 2);
            const results = await Promise.all(
                pages.map((p) =>
                    fetch(`${BASE}/api/products/variants-filtered?onlyActive=true&page=${p}&pageSize=100`, {
                        next: { revalidate: 3600 },
                    })
                        .then((r) => (r.ok ? r.json() : null))
                        .catch(() => null)
                )
            );
            for (const r of results) {
                if (r?.items) all.push(...r.items);
            }
        }

        return all;
    } catch {
        return [];
    }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const variants = await fetchAllVariantSlugs();

    const productRoutes: MetadataRoute.Sitemap = variants.map((v) => ({
        url: `${SITE_URL}/produse/${v.productSlug}/${v.variantSlug}`,
        lastModified: v.updatedAt ? new Date(v.updatedAt) : undefined,
        priority: 0.8,
        changeFrequency: "weekly",
    }));

    const productGroupRoutes: MetadataRoute.Sitemap = [
        ...new Set(variants.map((v) => v.productSlug)),
    ].map((slug) => ({
        url: `${SITE_URL}/produse/${slug}`,
        priority: 0.7,
        changeFrequency: "weekly" as const,
    }));

    return [...STATIC_ROUTES, ...productGroupRoutes, ...productRoutes];
}
