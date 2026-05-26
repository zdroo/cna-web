"use client";

import { useState, useEffect, useRef } from "react";
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
import { getCompanyProfile, CompanyProfile } from "@/lib/api/companyProfile";
import Image from "next/image";
import Link from "next/link";
import { ShoppingBag, ArrowLeft, MapPin, Plus, Building2, CreditCard, FileText } from "lucide-react";

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

    const submittedRef = useRef(false);
    const [contacts, setContacts] = useState<ShippingContact[]>([]);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [showNewForm, setShowNewForm] = useState(false);
    const [form, setForm] = useState<AddShippingContactRequest>(emptyForm);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [companyProfile, setCompanyProfile] = useState<CompanyProfile | null>(null);
    const [isB2B, setIsB2B] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState<"Stripe" | "NetPayment">("Stripe");

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) { router.replace("/auth/login?redirect=/checkout"); return; }
        if (items.length === 0 && !submittedRef.current) { router.replace("/cart"); return; }

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

        getCompanyProfile(token!).then(setCompanyProfile).catch(() => {});
    }, [isLoaded, user, items.length, token, router]);

    if (!isLoaded || !user || items.length === 0) return null;

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (loading) return;
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
            const { orderId } = await checkout(token!, contactId, cartItemIds, isB2B, paymentMethod);
            submittedRef.current = true;
            clearCart();
            if (isB2B && paymentMethod === "NetPayment") {
                router.push(`/comenzi`);
            } else {
                router.push(`/payment/${orderId}`);
            }
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Eroare la plasarea comenzii");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3">
                <Link href="/cart" className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Finalizare comandă</h1>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-6">

                    {/* Saved contacts */}
                    {contacts.length > 0 && (
                        <div className="bg-white dark:bg-gray-900 border border-transparent dark:border-gray-800 rounded-xl shadow-sm p-6 flex flex-col gap-4">
                            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-lg flex items-center gap-2">
                                <MapPin size={18} className="text-gray-500 dark:text-gray-400" />
                                Adresă de livrare
                            </h2>

                            <div className="flex flex-col gap-3">
                                {contacts.map((c) => (
                                    <label
                                        key={c.shippingContactId}
                                        className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors ${
                                            selectedContactId === c.shippingContactId && !showNewForm
                                                ? "border-gray-900 dark:border-gray-400 bg-gray-50 dark:bg-gray-800"
                                                : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
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
                                            <p className="font-medium text-gray-900 dark:text-gray-100">{c.fullName}</p>
                                            <p className="text-gray-500 dark:text-gray-400">{c.phoneNumber}</p>
                                            <p className="text-gray-500 dark:text-gray-400">
                                                {c.addressLine1}
                                                {c.addressLine2 && `, ${c.addressLine2}`}
                                            </p>
                                            <p className="text-gray-500 dark:text-gray-400">{c.city}, {c.region}, {c.postalCode}</p>
                                        </div>
                                    </label>
                                ))}

                                <button
                                    type="button"
                                    onClick={() => { setShowNewForm(true); setSelectedContactId(null); }}
                                    className={`flex items-center gap-2 p-4 rounded-lg border text-sm font-medium transition-colors ${
                                        showNewForm
                                            ? "border-gray-900 dark:border-gray-400 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                                            : "border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                                    }`}
                                >
                                    <Plus size={16} />
                                    Adresă nouă
                                </button>
                            </div>
                        </div>
                    )}

                    {/* B2B section */}
                    {companyProfile && (
                        <div className="bg-white dark:bg-gray-900 border border-transparent dark:border-gray-800 rounded-xl shadow-sm p-6 flex flex-col gap-4">
                            <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-lg flex items-center gap-2">
                                <Building2 size={18} className="text-gray-500 dark:text-gray-400" />
                                Comandă B2B
                            </h2>

                            <label className="flex items-center gap-3 cursor-pointer">
                                <div
                                    onClick={() => { const next = !isB2B; setIsB2B(next); if (!next) setPaymentMethod("Stripe"); }}
                                    className={`relative w-10 h-5.5 rounded-full transition-colors ${isB2B ? "bg-gray-900 dark:bg-gray-100" : "bg-gray-200 dark:bg-gray-700"}`}
                                    style={{ width: 40, height: 22 }}
                                >
                                    <span className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 rounded-full bg-white dark:bg-gray-900 shadow transition-transform ${isB2B ? "translate-x-4.5" : ""}`}
                                        style={{ width: 18, height: 18, transform: isB2B ? "translateX(18px)" : "translateX(0)" }} />
                                </div>
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Emite factură fiscală pe <strong>{companyProfile.companyName}</strong>
                                </span>
                            </label>

                            {isB2B && (
                                <div className="flex flex-col gap-3 pt-1">
                                    <p className="text-xs text-gray-400 dark:text-gray-500">
                                        CUI: {companyProfile.cui}
                                        {companyProfile.jNumber && ` · ${companyProfile.jNumber}`}
                                        {companyProfile.isVATRegistered && " · Plătitor TVA"}
                                    </p>

                                    <div className="flex flex-col gap-2">
                                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400">Metodă de plată</p>
                                        {(["Stripe", "NetPayment"] as const).map((method) => (
                                            <label
                                                key={method}
                                                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                                    paymentMethod === method
                                                        ? "border-gray-900 dark:border-gray-400 bg-gray-50 dark:bg-gray-800"
                                                        : "border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500"
                                                }`}
                                            >
                                                <input
                                                    type="radio"
                                                    name="paymentMethod"
                                                    value={method}
                                                    checked={paymentMethod === method}
                                                    onChange={() => setPaymentMethod(method)}
                                                />
                                                {method === "Stripe" ? (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <CreditCard size={15} className="text-gray-400 dark:text-gray-500" />
                                                        <span className="text-gray-800 dark:text-gray-200">Card / Online (Stripe)</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <FileText size={15} className="text-gray-400 dark:text-gray-500" />
                                                        <div>
                                                            <span className="text-gray-800 dark:text-gray-200">Plată la termen (net-30)</span>
                                                            <p className="text-xs text-gray-400 dark:text-gray-500">Comanda este confirmată imediat, factura se plătește în 30 de zile</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* New address form */}
                    {showNewForm && (
                        <div className="bg-white dark:bg-gray-900 border border-transparent dark:border-gray-800 rounded-xl shadow-sm p-6 flex flex-col gap-4">
                            {contacts.length === 0 && (
                                <h2 className="font-semibold text-gray-900 dark:text-gray-100 text-lg flex items-center gap-2">
                                    <MapPin size={18} className="text-gray-500 dark:text-gray-400" />
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
                        <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
                            {error}
                        </p>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-3.5 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors disabled:opacity-60"
                    >
                        {loading ? "Se procesează..." : "Plasează comanda"}
                    </button>
                </form>

                {/* Order summary */}
                <div className="w-full lg:w-80 bg-white dark:bg-gray-900 border border-transparent dark:border-gray-800 rounded-xl shadow-sm p-6 flex flex-col gap-4 sticky top-24">
                    <div className="flex items-center gap-2">
                        <ShoppingBag size={18} className="text-gray-500 dark:text-gray-400" />
                        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Sumar ({totalItems} produse)</h2>
                    </div>

                    <div className="flex flex-col gap-3 max-h-64 overflow-y-auto">
                        {items.map((item) => (
                            <div key={item.cartItemId} className="flex gap-3 items-center">
                                <div className="relative w-12 h-12 flex-shrink-0 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                                    {item.primaryImageUrl ? (
                                        <Image src={item.primaryImageUrl} alt={item.name || ""} fill className="object-cover" />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{item.name}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">× {item.quantity}</p>
                                </div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex-shrink-0">
                                    {(item.price * item.quantity).toFixed(2)} lei
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-800 pt-3 flex flex-col gap-1.5 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>{totalPrice.toFixed(2)} lei</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Livrare</span>
                            <span className="text-green-600 dark:text-green-400">Gratuită</span>
                        </div>
                    </div>

                    <div className="flex justify-between font-bold text-gray-900 dark:text-gray-100">
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
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
            <input
                type="text"
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-shadow"
            />
        </div>
    );
}
