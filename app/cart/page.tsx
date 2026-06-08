"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2, Plus, Minus, ArrowLeft } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function CartPage() {
    const { items, totalItems, totalPrice, removeItem, updateQuantity, clearCart } = useCart();
    const { user } = useAuth();
    const router = useRouter();

    function handleCheckout() {
        if (!user) {
            router.push("/auth/login?redirect=/checkout");
        } else {
            router.push("/checkout");
        }
    }

    if (items.length === 0) {
        return (
            <div className="flex flex-col gap-8">
                <button onClick={() => router.back()} className="self-start flex items-center gap-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    <ArrowLeft size={20} />
                </button>
            <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400">
                <ShoppingCart size={48} className="text-gray-300" />
                <p className="text-lg font-medium">Coșul tău e gol</p>
                <Link
                    href="/produse"
                    className="mt-2 bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors text-sm"
                >
                    Explorează produse
                </Link>
            </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <ShoppingCart size={28} className="text-gray-700 dark:text-gray-300" />
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Coș</h1>
                    <span className="text-gray-400 text-sm mt-1">({totalItems} produse)</span>
                </div>
                <button
                    onClick={() => { if (window.confirm("Golești tot coșul?")) clearCart(); }}
                    className="text-sm text-gray-400 hover:text-red-500 transition-colors"
                >
                    Golește coșul
                </button>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">

                {/* Items list */}
                <div className="flex-1 flex flex-col gap-4">
                    {items.map((item) => (
                        <div key={item.cartItemId} className="bg-white dark:bg-gray-900 dark:border dark:border-gray-800 rounded-xl shadow-sm p-4 flex gap-4">

                            {/* Image */}
                            <Link href={`/produse/${item.productSlug}/${item.variantSlug}`}>
                                <div className="relative w-24 h-24 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                                    {item.primaryImageUrl ? (
                                        <Image
                                            src={item.primaryImageUrl}
                                            alt={item.name || "Imagine produs"}
                                            fill
                                            className="object-cover"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
                                    )}
                                </div>
                            </Link>

                            {/* Details */}
                            <div className="flex-1 flex flex-col gap-1">
                                {item.brand && (
                                    <p className="text-xs text-gray-400 uppercase tracking-wide">{item.brand}</p>
                                )}
                                <Link href={`/produse/${item.productSlug}/${item.variantSlug}`}>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                                        {item.name}
                                    </h3>
                                </Link>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{item.price.toFixed(2)} lei / buc</p>
                            </div>

                            {/* Quantity + remove */}
                            <div className="flex flex-col items-end justify-between gap-2">
                                <button
                                    onClick={() => removeItem(item.cartItemId)}
                                    className="text-gray-300 hover:text-red-500 transition-colors"
                                    aria-label="Elimină"
                                >
                                    <Trash2 size={16} />
                                </button>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                                        disabled={item.quantity <= 1}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-30"
                                    >
                                        <Minus size={12} />
                                    </button>
                                    <span className="w-6 text-center text-sm font-semibold text-gray-900 dark:text-gray-100">{item.quantity}</span>
                                    <button
                                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                                        disabled={item.quantity >= item.stockQuantity}
                                        className="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors disabled:opacity-30"
                                    >
                                        <Plus size={12} />
                                    </button>
                                </div>

                                <p className="font-bold text-gray-900">
                                    {(item.price * item.quantity).toFixed(2)} lei
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div className="w-full lg:w-80 bg-white dark:bg-gray-900 dark:border dark:border-gray-800 rounded-xl shadow-sm p-6 flex flex-col gap-4 sticky top-24">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Sumar comandă</h2>

                    <div className="flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                            <span>Subtotal ({totalItems} produse)</span>
                            <span>{totalPrice.toFixed(2)} lei</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Livrare</span>
                            <span className="text-green-600 dark:text-green-400">Gratuită</span>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-800 pt-4 flex justify-between font-bold text-gray-900 dark:text-gray-100">
                        <span>Total</span>
                        <span>{totalPrice.toFixed(2)} lei</span>
                    </div>

                    <button
                        onClick={handleCheckout}
                        className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
                    >
                        Finalizează comanda
                    </button>

                    <Link
                        href="/produse"
                        className="text-center text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        Continuă cumpărăturile
                    </Link>
                </div>
            </div>
        </div>
    );
}
