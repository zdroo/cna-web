import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact",
    description: "Contactează echipa CNA Shop. Suntem disponibili pentru orice întrebare, sugestie sau problemă legată de comenzile tale.",
    alternates: { canonical: "/contact" },
    openGraph: {
        title: "Contact | CNA Shop",
        description: "Contactează echipa CNA Shop. Suntem disponibili pentru orice întrebare sau problemă.",
        url: "/contact",
        type: "website",
    },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
