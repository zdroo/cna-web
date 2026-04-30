"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartBadge() {
    const { totalItems } = useCart();

    return (
        <Link href="/cart" className="relative text-gray-600 hover:text-gray-900 transition-colors">
            <ShoppingCart size={22} />
            {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                    {totalItems > 9 ? "9+" : totalItems}
                </span>
            )}
        </Link>
    );
}
