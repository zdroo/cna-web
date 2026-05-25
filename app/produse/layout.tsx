import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Produse",
    description: "Descoperă întreaga gamă de produse din catalogul CNA Shop. Filtrează după categorie, preț și brand.",
    alternates: { canonical: "/produse" },
    openGraph: {
        title: "Produse | CNA Shop",
        description: "Descoperă întreaga gamă de produse din catalogul CNA Shop. Filtrează după categorie, preț și brand.",
        url: "/produse",
        type: "website",
    },
};

export default function ProduseLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
