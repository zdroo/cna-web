import Link from "next/link";
import Image from "next/image";
import { Category } from "@/types/category";

export default function FeaturedCategories({ categories }: { categories: Category[] }) {
  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Shop by Category</h2>
      <div className="grid grid-cols-3 gap-6">
        {categories.map((category) => (
          <Link
            key={category.categoryId}
            href={`/products?category=${category.slug}`}
            className="group relative bg-gray-100 rounded-xl overflow-hidden aspect-video hover:shadow-lg transition-shadow"
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
    </section>
  );
}
