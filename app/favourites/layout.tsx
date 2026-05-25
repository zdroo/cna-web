import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Favorite",
    description: "Produsele salvate în lista ta de favorite de la CNA Shop.",
    robots: { index: false, follow: false },
};

export default function FavouritesLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
