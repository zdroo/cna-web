"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { adminGetProducts, adminDeleteProduct } from "@/lib/api/admin";

interface Product {
    productId: string;
    productSlug: string;
    name: string;
    categoryName: string;
    minPrice: number;
    maxPrice: number;
    isActive?: boolean;
}

export default function AdminProductsPage() {
    const { token } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        adminGetProducts(token)
            .then(setProducts)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    async function handleDelete(productId: string, name: string) {
        if (!token) return;
        if (!confirm(`Ștergi produsul "${name}"?`)) return;
        setDeletingId(productId);
        try {
            await adminDeleteProduct(token, productId);
            setProducts((prev) => prev.filter((p) => p.productId !== productId));
        } catch (e) {
            console.error(e);
            alert("Ștergerea a eșuat.");
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="flex flex-col gap-6">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Produse</h1>
                    <p className="text-gray-500 mt-1">{products.length} produse în catalog</p>
                </div>
                <Link
                    href="/admin/products/new"
                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 transition-colors"
                >
                    <Plus size={16} />
                    Produs nou
                </Link>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-16 text-center text-gray-400">Se încarcă...</div>
                ) : products.length === 0 ? (
                    <div className="py-16 text-center text-gray-400">Niciun produs găsit.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
                                <th className="px-6 py-4 font-semibold">Produs</th>
                                <th className="px-6 py-4 font-semibold">Categorie</th>
                                <th className="px-6 py-4 font-semibold">Preț</th>
                                <th className="px-6 py-4 font-semibold text-right">Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {products.map((product) => (
                                <tr key={product.productId} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-gray-900">{product.name}</span>
                                        <span className="text-gray-400 text-xs block mt-0.5">{product.productSlug}</span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">{product.categoryName}</td>
                                    <td className="px-6 py-4 text-gray-900 font-medium">
                                        {product.minPrice === product.maxPrice
                                            ? `$${product.minPrice.toFixed(2)}`
                                            : `$${product.minPrice.toFixed(2)} – $${product.maxPrice.toFixed(2)}`}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/products/${product.productSlug}`}
                                                target="_blank"
                                                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="Vezi în magazin"
                                            >
                                                <ExternalLink size={15} />
                                            </Link>
                                            <Link
                                                href={`/admin/products/${product.productId}/edit`}
                                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editează"
                                            >
                                                <Pencil size={15} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(product.productId, product.name)}
                                                disabled={deletingId === product.productId}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                                                title="Șterge"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
