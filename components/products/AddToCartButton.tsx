"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ProductVariantDetail } from "@/types/product";
import FavoriteButton from "./FavoriteButton";

export default function AddToCartButton({ variant }: { variant: ProductVariantDetail }) {
    const { addItem } = useCart();
    const [added, setAdded] = useState(false);
    const isOutOfStock = variant.stockQuantity === 0;

    function handleAdd() {
        addItem({
            variantId: variant.variantId,
            variantSlug: variant.variantSlug,
            productSlug: variant.productSlug,
            name: variant.name,
            brand: variant.brand,
            price: variant.price,
            primaryImageUrl: variant.primaryImageUrl,
            stockQuantity: variant.stockQuantity,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    }

    return (
        <>
            <button
                disabled={isOutOfStock || added}
                onClick={handleAdd}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
                {added ? <Check size={18} /> : <ShoppingCart size={18} />}
                {added ? "Adăugat!" : isOutOfStock ? "Stoc epuizat" : "Adaugă în coș"}
            </button>
            <FavoriteButton variantId={variant.variantId} />
        </>
    );
}
