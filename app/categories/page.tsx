import { getCategories } from "@/lib/api/categories";
import Link from "next/link";
import Image from "next/image";

export default async function CategoriesPage() {
    const categories = await getCategories();

    return (
        <div className="flex flex-col gap-8">

            {/* Header */}
            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-900">Categorii</h1>
                <p className="text-gray-500 mt-1">{categories.length} categorii disponibile</p>
            </div>

            {/* Categories grid */}
            <div className="flex flex-wrap justify-center gap-6">
                {categories.map((category) => (
                    <Link
                        key={category.categoryId}
                        href={`/produse?category=${category.slug}`}
                        className="group relative bg-gray-100 rounded-xl overflow-hidden w-64 h-48 hover:shadow-lg transition-shadow"
                    >
                        {category.imageUrl ? (
                            <Image
                                src={category.imageUrl}
                                alt={category.name ?? ""}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                        ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
                        )}
                        <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                            <h3 className="text-white font-semibold text-lg">{category.name}</h3>
                        </div>
                    </Link>
                ))}
            </div>

        </div>
    );
}
