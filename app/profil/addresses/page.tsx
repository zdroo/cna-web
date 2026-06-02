"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    ShippingContact,
    getShippingContacts,
    addShippingContact,
    updateShippingContact,
    deleteShippingContact,
    setDefaultShippingContact,
} from "@/lib/api/shippingContacts";
import { MapPin, Plus, Trash2, Star, Pencil, ArrowLeft, Loader2, X } from "lucide-react";
import Link from "next/link";

const EMPTY_FORM = {
    fullName: "",
    phoneNumber: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    region: "",
    postalCode: "",
    countryCode: "RO",
};

type FormData = typeof EMPTY_FORM;

export default function AddressesPage() {
    const { user, token, isLoaded } = useAuth();
    const router = useRouter();
    const [contacts, setContacts] = useState<ShippingContact[]>([]);
    const [loading, setLoading] = useState(true);

    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState<FormData>(EMPTY_FORM);
    const [addSaving, setAddSaving] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<FormData>(EMPTY_FORM);
    const [editSaving, setEditSaving] = useState(false);
    const [editError, setEditError] = useState<string | null>(null);

    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);
    const [actionError, setActionError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoaded) return;
        if (!user || !token) { router.replace("/auth/login"); return; }
        getShippingContacts(token)
            .then(setContacts)
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [isLoaded, user, token, router]);

    async function handleAdd(e: React.FormEvent) {
        e.preventDefault();
        if (!token) return;
        setAddSaving(true);
        setAddError(null);
        try {
            await addShippingContact(token, addForm);
            setContacts(await getShippingContacts(token));
            setShowAdd(false);
            setAddForm(EMPTY_FORM);
        } catch {
            setAddError("Nu s-a putut salva adresa. Încearcă din nou.");
        } finally {
            setAddSaving(false);
        }
    }

    function startEdit(c: ShippingContact) {
        setEditingId(c.shippingContactId);
        setEditForm({
            fullName: c.fullName,
            phoneNumber: c.phoneNumber,
            addressLine1: c.addressLine1,
            addressLine2: c.addressLine2,
            city: c.city,
            region: c.region,
            postalCode: c.postalCode,
            countryCode: c.countryCode,
        });
        setEditError(null);
    }

    async function handleEdit(e: React.FormEvent) {
        e.preventDefault();
        if (!token || !editingId) return;
        setEditSaving(true);
        setEditError(null);
        try {
            await updateShippingContact(token, editingId, editForm);
            setContacts(await getShippingContacts(token));
            setEditingId(null);
        } catch {
            setEditError("Nu s-a putut actualiza adresa. Încearcă din nou.");
        } finally {
            setEditSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!token) return;
        setDeletingId(id);
        setActionError(null);
        try {
            await deleteShippingContact(token, id);
            setContacts((prev) => prev.filter((c) => c.shippingContactId !== id));
        } catch {
            setActionError("Nu s-a putut șterge adresa. Încearcă din nou.");
        } finally {
            setDeletingId(null);
        }
    }

    async function handleSetDefault(id: string) {
        if (!token) return;
        setSettingDefaultId(id);
        setActionError(null);
        try {
            await setDefaultShippingContact(token, id);
            setContacts((prev) =>
                prev.map((c) => ({ ...c, isDefault: c.shippingContactId === id }))
            );
        } catch {
            setActionError("Nu s-a putut seta adresa implicită. Încearcă din nou.");
        } finally {
            setSettingDefaultId(null);
        }
    }

    if (!isLoaded || !user || !token) return null;

    return (
        <div className="max-w-lg mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Link href="/profil" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Adrese de livrare</h1>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                </div>
            ) : (
                <>
                    {actionError && (
                        <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
                            {actionError}
                        </p>
                    )}

                    {contacts.length === 0 && !showAdd && (
                        <div className="text-center py-12 text-gray-400">
                            <MapPin size={40} className="mx-auto mb-3 opacity-40" />
                            <p className="font-medium">Nicio adresă salvată</p>
                            <p className="text-sm mt-1">Adaugă o adresă pentru livrări mai rapide</p>
                        </div>
                    )}

                    <div className="flex flex-col gap-3">
                        {contacts.map((c) => (
                            <div key={c.shippingContactId}>
                                {editingId === c.shippingContactId ? (
                                    <form
                                        onSubmit={handleEdit}
                                        className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 flex flex-col gap-4"
                                    >
                                        <div className="flex items-center justify-between">
                                            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Editează adresa</h2>
                                            <button type="button" onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                                <X size={18} />
                                            </button>
                                        </div>
                                        <AddressForm form={editForm} onChange={setEditForm} />
                                        {editError && <p className="text-sm text-red-500">{editError}</p>}
                                        <div className="flex gap-3 pt-1">
                                            <button
                                                type="submit"
                                                disabled={editSaving}
                                                className="flex-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2.5 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors disabled:opacity-60"
                                            >
                                                {editSaving ? "Se salvează..." : "Salvează"}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setEditingId(null)}
                                                className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                            >
                                                Anulează
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-4 flex items-start justify-between gap-4">
                                        <div className="flex gap-3 items-start">
                                            <div className="p-2 bg-green-50 dark:bg-green-950 rounded-xl mt-0.5">
                                                <MapPin size={16} className="text-green-600 dark:text-green-400" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{c.fullName}</p>
                                                    {c.isDefault && (
                                                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-medium">
                                                            Implicită
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{c.phoneNumber}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                                    {c.addressLine1}{c.addressLine2 ? `, ${c.addressLine2}` : ""}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {c.city}, {c.region}, {c.postalCode}, {c.countryCode}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 flex-shrink-0">
                                            <button
                                                onClick={() => startEdit(c)}
                                                title="Editează adresa"
                                                className="text-gray-400 hover:text-blue-500 transition-colors"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            {!c.isDefault && (
                                                <button
                                                    onClick={() => handleSetDefault(c.shippingContactId)}
                                                    disabled={settingDefaultId === c.shippingContactId}
                                                    title="Setează ca implicită"
                                                    className="text-gray-400 hover:text-yellow-500 transition-colors disabled:opacity-40"
                                                >
                                                    {settingDefaultId === c.shippingContactId
                                                        ? <Loader2 size={16} className="animate-spin" />
                                                        : <Star size={16} />
                                                    }
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(c.shippingContactId)}
                                                disabled={deletingId === c.shippingContactId}
                                                title="Șterge adresa"
                                                className="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                                            >
                                                {deletingId === c.shippingContactId
                                                    ? <Loader2 size={16} className="animate-spin" />
                                                    : <Trash2 size={16} />
                                                }
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {!showAdd && editingId === null ? (
                        <button
                            onClick={() => setShowAdd(true)}
                            className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-200 transition-colors font-medium"
                        >
                            <Plus size={18} />
                            Adaugă adresă nouă
                        </button>
                    ) : showAdd ? (
                        <form
                            onSubmit={handleAdd}
                            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex flex-col gap-4"
                        >
                            <div className="flex items-center justify-between">
                                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Adresă nouă</h2>
                                <button type="button" onClick={() => { setShowAdd(false); setAddForm(EMPTY_FORM); setAddError(null); }} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                                    <X size={18} />
                                </button>
                            </div>
                            <AddressForm form={addForm} onChange={setAddForm} />
                            {addError && <p className="text-sm text-red-500">{addError}</p>}
                            <div className="flex gap-3 pt-1">
                                <button
                                    type="submit"
                                    disabled={addSaving}
                                    className="flex-1 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2.5 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors disabled:opacity-60"
                                >
                                    {addSaving ? "Se salvează..." : "Salvează"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setShowAdd(false); setAddForm(EMPTY_FORM); setAddError(null); }}
                                    className="flex-1 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 py-2.5 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    Anulează
                                </button>
                            </div>
                        </form>
                    ) : null}
                </>
            )}
        </div>
    );
}

function AddressForm({ form, onChange }: { form: FormData; onChange: (f: FormData) => void }) {
    return (
        <>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Nume complet" value={form.fullName} onChange={(v) => onChange({ ...form, fullName: v })} required />
                <Field label="Telefon" value={form.phoneNumber} onChange={(v) => onChange({ ...form, phoneNumber: v })} required />
            </div>
            <Field label="Adresă (linia 1)" value={form.addressLine1} onChange={(v) => onChange({ ...form, addressLine1: v })} required />
            <Field label="Adresă (linia 2)" value={form.addressLine2} onChange={(v) => onChange({ ...form, addressLine2: v })} />
            <div className="grid grid-cols-2 gap-3">
                <Field label="Oraș" value={form.city} onChange={(v) => onChange({ ...form, city: v })} required />
                <Field label="Județ / Regiune" value={form.region} onChange={(v) => onChange({ ...form, region: v })} required />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <Field label="Cod poștal" value={form.postalCode} onChange={(v) => onChange({ ...form, postalCode: v })} required />
                <Field label="Cod țară" value={form.countryCode} onChange={(v) => onChange({ ...form, countryCode: v })} required />
            </div>
        </>
    );
}

function Field({
    label,
    value,
    onChange,
    required,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    required?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
            />
        </div>
    );
}
