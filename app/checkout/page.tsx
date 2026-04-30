"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { checkout } from "@/lib/api/cart";
import {
    getShippingContacts,
    addShippingContact,
    ShippingContact,
    AddShippingContactRequest,
} from "@/lib/api/shippingContacts";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, ArrowLeft, MapPin, Plus } from "lucide-react";

const emptyForm: AddShippingContactRequest = {
    fullName: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    region: "",
    postalCode: "",
    countryCode: "RO",
};

export default function CheckoutPage() {
    const router = useRouter();
    const { items, totalPrice, totalItems, clearCart } = useCart();
    const { user, token, isLoaded } = useAuth();

    const [contacts, setContacts] = useState<ShippingContact[]>([]);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [showNewForm, setShowNewForm] = useState(false);
    const [form, setForm] = useState<AddShippingContactRequest>(emptyForm);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) { router.replace("/auth/login"); return; }
        if (items.length === 0) { router.replace("/cart"); return; }

        getShippingContacts(token!)
            .then((list) => {
                setContacts(list);
                if (list.length === 0) setShowNewForm(true);
                else setSelectedContactId(list.find((c) => c.isDefault)?.shippingContactId ?? list[0].shippingContactId);
            })
            .catch((err) => {
                console.error("getShippingContacts:", err);
                setShowNewForm(true);
            });
    }, [isLoaded, user, items.length, token, router]);

    if (!isLoaded || !user || items.length === 0) return null;

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        let contactId = selectedContactId;

        if (showNewForm || contacts.length === 0) {
            const required: (keyof AddShippingContactRequest)[] = [
                "fullName", "phoneNumber", "addressLine1", "city", "region", "postalCode",
            ];
            for (const field of required) {
                if (!form[field].trim()) {
                    setError("Completează toate câmpurile obligatorii.");
                    return;
                }
            }
        }

        setLoading(true);
        try {
            if (showNewForm || contacts.length === 0) {
                contactId = await addShippingContact(token!, form);
            }

            if (!contactId) {
                setError("Selectează sau adaugă o adresă de livrare.");
                return;
            }

            const cartItemIds = items.map((i) => i.cartItemId);
            const { orderId } = await checkout(token!, contactId, cartItemIds);
            clearCart();
            router.push(`/payment/${orderId}`);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Eroare la plasarea comenzii");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3">
                <Link href="/cart" className="text-gray-400 hover:text-gray-700 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">Finalizare comandă</h1>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6">

                    {/* Saved contacts */}
                    {contacts.length > 0 && (
                        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4">
                            <h2 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                                <MapPin size={18} className="text-gray-500" />
                                Adresă de livrare
                            </h2>

                            <div className="flex flex-col gap-3">
                                {contacts.map((c) => (
                                    <label
                                        key={c.shippingContactId}
                                        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                                            selectedContactId === c.shippingContactId && !showNewForm
                                                ? "border-gray-900 bg-gray-50"
                                                : "border-gray-200 hover:border-gray-400"
                                        }`}
                                    >
                                        <input
                                            type="radio"
                                            name="contact"
                                            value={c.shippingContactId}
                                            checked={selectedContactId === c.shippingContactId && !showNewForm}
                                            onChange={() => {
                                                setSelectedContactId(c.shippingContactId);
                                                setShowNewForm(false);
                                            }}
                                            className="mt-1"
                                        />
                                        <div className="text-sm">
                                            <p className="font-medium text-gray-900">{c.fullName}</p>
                                            <p className="text-gray-500">{c.phoneNumber}</p>
                                            <p className="text-gray-500">
                                                {c.addressLine1}
                                                {c.addressLine2 && `, ${c.addressLine2}`}
                                            </p>
                                            <p className="text-gray-500">{c.city}, {c.region}, {c.postalCode}</p>
                                        </div>
                                    </label>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => { setShowNewForm(true); setSelectedContactId(null); }}
                                    className={`flex items-center gap-2 p-4 rounded-lg border text-sm font-medium transition-colors ${
                                        showNewForm
                                            ? "border-gray-900 bg-gray-50 text-gray-900"
                                            : "border-dashed border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700"
                                    }`}
                                >
                                    <Plus size={16} />
                                    Adresă nouă
                                </button>
                            </div>
                        </div>
                    )}

                    {/* New address form */}
                    {showNewForm && (
                        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4">
                            {contacts.length === 0 && (
                                <h2 className="font-semibold text-gray-900 text-lg flex items-center gap-2">
                                    <MapPin size={18} className="text-gray-500" />
                                    Adresă de livrare
                                </h2>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <Field label="Nume complet *" name="fullName" value={form.fullName} onChange={handleChange} placeholder="ex. Maria Ionescu" />
                                <Field label="Telefon *" name="phoneNumber" value={form.phoneNumber} onChange={handleChange} placeholder="ex. 0740 123 456" />
                            </div>
                            <Field label="Adresă *" name="addressLine1" value={form.addressLine1} onChange={handleChange} placeholder="Stradă, număr, bloc, apartament" />
                            <Field label="Adresă (linie 2)" name="addressLine2" value={form.addressLine2} onChange={handleChange} placeholder="Scară, etaj (opțional)" />
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <Field label="Oraș *" name="city" value={form.city} onChange={handleChange} placeholder="ex. București" />
                                <Field label="Județ *" name="region" value={form.region} onChange={handleChange} placeholder="ex. Ilfov" />
                                <Field label="Cod poștal *" name="postalCode" value={form.postalCode} onChange={handleChange} placeholder="ex. 010001" />
                            </div>
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-900 text-white py-3.5 rounded-xl font-semibold hover:bg-gray-700 transition-colors disabled:opacity-60"
                    >
                        {loading ? "Se procesează..." : "Plasează comanda"}
                    </button>
                </form>

                {/* Order summary */}
                <div className="w-full lg:w-80 bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4 sticky top-24">
                    <div className="flex items-center gap-2">
                        <ShoppingBag size={18} className="text-gray-500" />
                        <h2 className="font-semibold text-gray-900">Sumar ({totalItems} produse)</h2>
                    </div>

                    <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
                        {items.map((item) => (
                            <div key={item.cartItemId} className="flex gap-3 items-center">
                                <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                                    {item.primaryImageUrl ? (
                                        <Image src={item.primaryImageUrl} alt={item.name || ""} fill className="object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                                    <p className="text-xs text-gray-500">× {item.quantity}</p>
                                </div>
                                <p className="text-sm font-semibold text-gray-900 flex-shrink-0">
                                    {(item.price * item.quantity).toFixed(2)} lei
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 pt-3 flex flex-col gap-1.5 text-sm text-gray-600">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{totalPrice.toFixed(2)} lei</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Livrare</span>
                            <span className="text-green-600">Gratuită</span>
                        </div>
                    </div>

                    <div className="flex justify-between font-bold text-gray-900">
                        <span>Total</span>
                        <span>{totalPrice.toFixed(2)} lei</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Field({
    label, name, value, onChange, placeholder,
}: {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
}) {
    return (
        <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">{label}</label>
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 transition-shadow"
            />
        </div>
    );
}
