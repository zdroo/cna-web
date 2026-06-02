import type { Metadata } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cnashop.ro";

export const metadata: Metadata = {
    title: "Produse",
    description: "Descoperă întreaga gamă de produse din catalogul CNA Shop. Filtrează după categorie, preț și brand.",
    alternates: { canonical: `${SITE_URL}/produse` },
    openGraph: {
        title: "Produse | CNA Shop",
        description: "Descoperă întreaga gamă de produse din catalogul CNA Shop. Filtrează după categorie, preț și brand.",
        url: `${SITE_URL}/produse`,
        type: "website",
    },
};

export default function ProduseLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
