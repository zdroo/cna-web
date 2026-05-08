import Link from "next/link";
import Image from "next/image";
import { Category } from "@/types/category";

export default function FeaturedCategories({ categories }: { categories: Category[] }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Cumpără după categorie</h2>
      <div className="grid grid-cols-3 gap-4">
        {categories.map((category) => (
          <Link
            key={category.categoryId}
            href={`/produse?category=${category.slug}`}
            className="group relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden aspect-[5/2] hover:shadow-lg transition-shadow"
          >
            {category.imageUrl ? (
              <Image
                src={category.imageUrl}
                alt={category.name ?? ""}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600" />
            )}
            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
            <div className="absolute bottom-0 left-0 right-0 p-3">
              <h3 className="text-white font-semibold text-sm">{category.name}</h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
