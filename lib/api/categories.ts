import { Category, CategoryWithProducts } from "@/types/category";
import { getProducts } from "./products";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getCategories(): Promise<Category[]> {
    const response = await fetch(`${API_URL}/api/categories`, {
        next: { revalidate: 3600 }
    });

    if (!response.ok)
        throw new Error("Failed to fetch categories");

    return response.json();
}

export async function getCategoriesWithProducts(): Promise<CategoryWithProducts[]> {
    const categories = await getCategories();

    const productsPerCategory = await Promise.all(
        categories.map((cat) => getProducts(cat.slug))
    );

    return categories.map((cat, i) => ({
        ...cat,
        products: productsPerCategory[i],
    }));
}
