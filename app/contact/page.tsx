import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Contact",
    description: "Contactează-ne pentru orice întrebare sau problemă. Suntem aici să te ajutăm.",
    alternates: { canonical: "/contact" },
};

export default function ContactPage() {
    return (
        <div className="max-w-2xl mx-auto py-16 px-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">Contact</h1>
            <p className="text-gray-500 dark:text-gray-400 text-lg">
                Pagină în construcție.
            </p>
        </div>
    );
}
