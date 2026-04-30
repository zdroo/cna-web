import { getCategoriesWithProducts } from "@/lib/api/categories";
import { getVariantsFiltered } from "@/lib/api/products";
import SearchBar from "@/components/home/SearchBar";
import HomeContent from "@/components/home/HomeContent";
import Link from "next/link";

export default async function HomePage() {
    const [categories, allVariants] = await Promise.all([
        getCategoriesWithProducts(),
        getVariantsFiltered({ onlyActive: true }),
    ]);

    return (
        <div className="flex flex-col gap-6">

            <SearchBar />

            <div className="relative bg-gray-900 text-white rounded-2xl overflow-hidden px-10 py-12">
                <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700" />
                <div className="relative z-10 max-w-xl">
                    <p className="text-sm font-semibold tracking-widest text-gray-400 uppercase mb-3">
                        Colecție 2026
                    </p>
                    <h1 className="text-4xl font-bold leading-tight mb-4">
                        Descoperă produsele noastre
                    </h1>
                    <p className="text-gray-300 mb-6">
                        Calitate premium, prețuri competitive.
                    </p>
                    <Link
                        href="/products"
                        className="inline-block bg-white text-gray-900 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                    >
                        Toate produsele
                    </Link>
                </div>
            </div>

            <HomeContent categories={categories} allVariants={allVariants} />

        </div>
    );
}
