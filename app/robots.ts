import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
    const base = process.env.NEXT_PUBLIC_SITE_URL || "https://cnashop.ro";
    return {
        rules: [
            {
                userAgent: "*",
                allow: "/",
                disallow: [
                    "/admin/",
                    "/profil/",
                    "/auth/",
                    "/cart",
                    "/checkout/",
                    "/payment/",
                    "/comenzi/",
                ],
            },
        ],
        sitemap: `${base}/sitemap.xml`,
    };
}
