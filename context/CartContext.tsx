"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { CartItem } from "@/types/cart";
import { ShoppingCart, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
    getCart,
    addToCart as apiAddToCart,
    updateCartItem as apiUpdateCartItem,
    removeCartItem as apiRemoveCartItem,
    clearCartApi,
    mergeSessionCart,
} from "@/lib/api/cart";

interface AddItemPayload {
    variantId: string;
    variantSlug: string;
    productSlug: string;
    name: string;
    brand: string | null;
    price: number;
    primaryImageUrl: string | null;
    stockQuantity: number;
}

interface CartContextType {
    items: CartItem[];
    totalItems: number;
    totalPrice: number;
    addItem: (payload: AddItemPayload) => void;
    removeItem: (cartItemId: string) => void;
    updateQuantity: (cartItemId: string, quantity: number) => void;
    clearCart: () => void;
}

const GUEST_SESSION_KEY = "guestSessionId";
const CartContext = createContext<CartContextType | null>(null);

function getOrCreateSessionId(): string {
    let id = localStorage.getItem(GUEST_SESSION_KEY);
    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(GUEST_SESSION_KEY, id);
    }
    return id;
}

export function CartProvider({ children }: { children: ReactNode }) {
    const { user, token, isLoaded } = useAuth();
    const [items, setItems] = useState<CartItem[]>([]);
    const [toastVisible, setToastVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const errorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!isLoaded) return;

        if (user && token) {
            const sessionId = localStorage.getItem(GUEST_SESSION_KEY);
            if (sessionId) {
                localStorage.removeItem(GUEST_SESSION_KEY);
                mergeSessionCart(token, sessionId)
                    .then(setItems)
                    .catch(() => {
                        showError("Nu s-au putut transfera articolele din coș.");
                        return getCart(token, null).then(setItems).catch(console.error);
                    });
            } else {
                getCart(token, null).then(setItems).catch(console.error);
            }
        } else {
            setItems([]);
            const sessionId = getOrCreateSessionId();
            getCart(null, sessionId).then(setItems).catch(console.error);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.userId, isLoaded]);

    const showToast = useCallback(() => {
        setToastVisible(true);
        if (toastTimer.current) clearTimeout(toastTimer.current);
        toastTimer.current = setTimeout(() => setToastVisible(false), 2500);
    }, []);

    const showError = useCallback((message: string) => {
        setErrorMessage(message);
        if (errorTimer.current) clearTimeout(errorTimer.current);
        errorTimer.current = setTimeout(() => setErrorMessage(null), 3500);
    }, []);

    const addItem = useCallback((payload: AddItemPayload) => {
        const onError = (err: unknown) => {
            console.error(err);
            showError(err instanceof Error ? err.message : "Nu s-a putut adăuga în coș.");
        };
        if (user && token) {
            apiAddToCart(token, null, payload.variantId)
                .then((updated) => { setItems(updated); showToast(); })
                .catch(onError);
        } else {
            const sessionId = getOrCreateSessionId();
            apiAddToCart(null, sessionId, payload.variantId)
                .then((updated) => { setItems(updated); showToast(); })
                .catch(onError);
        }
    }, [user, token, showToast, showError]);

    const removeItem = useCallback((cartItemId: string) => {
        if (user && token) {
            apiRemoveCartItem(token, null, cartItemId)
                .then(setItems)
                .catch(console.error);
        } else {
            const sessionId = localStorage.getItem(GUEST_SESSION_KEY);
            if (sessionId) {
                apiRemoveCartItem(null, sessionId, cartItemId)
                    .then(setItems)
                    .catch(console.error);
            }
        }
    }, [user, token]);

    const updateQuantity = useCallback((cartItemId: string, quantity: number) => {
        // Optimistic update
        setItems((prev) =>
            prev.map((i) =>
                i.cartItemId === cartItemId
                    ? { ...i, quantity: Math.max(1, Math.min(quantity, i.stockQuantity)) }
                    : i
            )
        );
        const revert = () => {
            if (user && token) {
                getCart(token, null).then(setItems).catch(console.error);
            } else {
                const sessionId = localStorage.getItem(GUEST_SESSION_KEY);
                if (sessionId) getCart(null, sessionId).then(setItems).catch(console.error);
            }
        };
        if (user && token) {
            apiUpdateCartItem(token, null, cartItemId, quantity).catch(revert);
        } else {
            const sessionId = localStorage.getItem(GUEST_SESSION_KEY);
            if (sessionId) {
                apiUpdateCartItem(null, sessionId, cartItemId, quantity).catch(revert);
            }
        }
    }, [user, token]);

    const clearCart = useCallback(() => {
        const previous = items;
        setItems([]);
        if (user && token) {
            clearCartApi(token, null).catch(() => {
                console.error("clearCart failed");
                setItems(previous);
            });
        } else {
            const sessionId = localStorage.getItem(GUEST_SESSION_KEY);
            if (sessionId) {
                clearCartApi(null, sessionId).catch(() => {
                    console.error("clearCart failed");
                    setItems(previous);
                });
            }
        }
    }, [user, token, items]);

    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalPrice = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return (
        <CartContext.Provider value={{ items, totalItems, totalPrice, addItem, removeItem, updateQuantity, clearCart }}>
            {children}

            <div
                className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg transition-all duration-300 ${
                    toastVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
                }`}
            >
                <ShoppingCart size={15} />
                Adăugat în coș
            </div>

            <div
                className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 bg-red-600 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg transition-all duration-300 ${
                    errorMessage ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3 pointer-events-none"
                }`}
            >
                <AlertCircle size={15} />
                {errorMessage}
            </div>
        </CartContext.Provider>
    );
}

export function useCart() {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error("useCart must be used inside CartProvider");
    return ctx;
}
