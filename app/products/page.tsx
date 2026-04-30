import { getCategoriesWithProducts } from "@/lib/api/categories";
import { getProducts } from "@/lib/api/products";
import ProductCard from "@/components/products/ProductCard";
import CategorySidebar from "@/components/home/CategorySidebar";

interface ProductsPageProps {
    searchParams: Promise<{ category?: string }>;
}

function slugToTitle(slug: string): string {
    return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export default async function ProductsPage({ searchParams }: ProductsPageProps) {
    const { category } = await searchParams;

    const [categories, products] = await Promise.all([
        getCategoriesWithProducts(),
        getProducts(category),
    ]);

    const title = category ? slugToTitle(category) : "Toate produsele";

    return (
        <div className="flex gap-6 items-start">

            <CategorySidebar categories={categories} />

            <div className="flex-1 flex flex-col gap-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {products.length} {products.length === 1 ? "produs găsit" : "produse găsite"}
                    </p>
                </div>

                {products.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {products.map((product) => (
                            <ProductCard key={product.productId} product={product} />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                        <p className="text-lg font-medium">Niciun produs găsit</p>
                        <p className="text-sm mt-1">Încearcă o altă categorie</p>
                    </div>
                )}
            </div>

        </div>
    );
}
