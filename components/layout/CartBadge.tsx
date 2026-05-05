"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/context/CartContext";

export default function CartBadge() {
    const { totalItems } = useCart();

    return (
        <Link href="/cart" className="relative text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            <ShoppingCart size={22} />
            {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs w-4 h-4 rounded-full flex items-center justify-center font-medium">
                    {totalItems > 9 ? "9+" : totalItems}
                </span>
            )}
        </Link>
    );
}
