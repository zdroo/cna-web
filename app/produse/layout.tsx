import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Produse",
    description: "Descoperă întreaga gamă de produse din catalogul CNA Shop. Filtrează după categorie, preț și brand.",
    alternates: { canonical: "/produse" },
};

export default function ProduseLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
