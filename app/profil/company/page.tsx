"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
    getCompanyProfile,
    upsertCompanyProfile,
    deleteCompanyProfile,
    CompanyProfile,
} from "@/lib/api/companyProfile";
import { ArrowLeft, Building2, Loader2, CheckCircle, Trash2 } from "lucide-react";
import Link from "next/link";

const emptyForm = {
    companyName: "",
    cui: "",
    jNumber: "",
    isVATRegistered: false,
    vatNumber: "",
    billingAddressLine1: "",
    billingAddressLine2: "",
    billingCity: "",
    billingRegion: "",
    billingPostalCode: "",
    billingCountryCode: "RO",
};

export default function CompanyProfilePage() {
    const router = useRouter();
    const { user, token, isLoaded } = useAuth();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [form, setForm] = useState(emptyForm);
    const [exists, setExists] = useState(false);

    useEffect(() => {
        if (!isLoaded) return;
        if (!user) { router.replace("/auth/login"); return; }

        getCompanyProfile(token!)
            .then((profile) => {
                if (profile) {
                    setExists(true);
                    setForm({
                        companyName: profile.companyName,
                        cui: profile.cui,
                        jNumber: profile.jNumber ?? "",
                        isVATRegistered: profile.isVATRegistered,
                        vatNumber: profile.vatNumber ?? "",
                        billingAddressLine1: profile.billingAddressLine1,
                        billingAddressLine2: profile.billingAddressLine2 ?? "",
                        billingCity: profile.billingCity,
                        billingRegion: profile.billingRegion,
                        billingPostalCode: profile.billingPostalCode,
                        billingCountryCode: profile.billingCountryCode,
                    });
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [isLoaded, user, token, router]);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const { name, value, type, checked } = e.target;
        setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    }

    async function handleSave(e: React.FormEvent) {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccess(false);
        try {
            const payload: Omit<CompanyProfile, "id"> = {
                companyName: form.companyName,
                cui: form.cui,
                jNumber: form.jNumber || undefined,
                isVATRegistered: form.isVATRegistered,
                vatNumber: form.vatNumber || undefined,
                billingAddressLine1: form.billingAddressLine1,
                billingAddressLine2: form.billingAddressLine2 || undefined,
                billingCity: form.billingCity,
                billingRegion: form.billingRegion,
                billingPostalCode: form.billingPostalCode,
                billingCountryCode: form.billingCountryCode,
            };
            await upsertCompanyProfile(token!, payload);
            setExists(true);
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Eroare necunoscută");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!confirm("Ești sigur că vrei să ștergi profilul de companie?")) return;
        setDeleting(true);
        setError(null);
        try {
            await deleteCompanyProfile(token!);
            setExists(false);
            setForm(emptyForm);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Eroare necunoscută");
        } finally {
            setDeleting(false);
        }
    }

    if (!isLoaded || !user) return null;

    return (
        <div className="flex flex-col gap-8 max-w-2xl">
            <div className="flex items-center gap-3">
                <Link href="/profil" className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Profil companie</h1>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-transparent dark:border-gray-800 rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-5">
                    <Building2 size={18} className="text-gray-500 dark:text-gray-400" />
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">Date firmă</h2>
                </div>

                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    Completează datele firmei pentru a beneficia de facturi fiscale și prețuri B2B la checkout.
                </p>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <Loader2 size={24} className="animate-spin text-gray-400" />
                    </div>
                ) : (
                    <form onSubmit={handleSave} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Denumire firmă *" name="companyName" value={form.companyName} onChange={handleChange} placeholder="ex. Firma SRL" required />
                            <Field label="CUI *" name="cui" value={form.cui} onChange={handleChange} placeholder="ex. RO12345678" required />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Field label="Nr. Registru Comerțului" name="jNumber" value={form.jNumber} onChange={handleChange} placeholder="ex. J40/1234/2020" />
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Regim TVA</label>
                                <label className="flex items-center gap-2 cursor-pointer mt-1.5">
                                    <input
                                        type="checkbox"
                                        name="isVATRegistered"
                                        checked={form.isVATRegistered}
                                        onChange={handleChange}
                                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">Înregistrat TVA</span>
                                </label>
                            </div>
                        </div>
                        {form.isVATRegistered && (
                            <Field label="Nr. TVA" name="vatNumber" value={form.vatNumber} onChange={handleChange} placeholder="ex. RO12345678" />
                        )}

                        <div className="border-t border-gray-100 dark:border-gray-800 pt-4 mt-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-3">Adresă facturare</p>
                            <div className="flex flex-col gap-4">
                                <Field label="Stradă *" name="billingAddressLine1" value={form.billingAddressLine1} onChange={handleChange} placeholder="Str., nr., bl., ap." required />
                                <Field label="Adresă (linie 2)" name="billingAddressLine2" value={form.billingAddressLine2} onChange={handleChange} placeholder="Scară, etaj (opțional)" />
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <Field label="Oraș *" name="billingCity" value={form.billingCity} onChange={handleChange} placeholder="București" required />
                                    <Field label="Județ *" name="billingRegion" value={form.billingRegion} onChange={handleChange} placeholder="Ilfov" required />
                                    <Field label="Cod poștal *" name="billingPostalCode" value={form.billingPostalCode} onChange={handleChange} placeholder="010001" required />
                                </div>
                            </div>
                        </div>

                        {error && (
                            <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
                                {error}
                            </p>
                        )}

                        <div className="flex items-center justify-between gap-3 mt-2">
                            {exists && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex items-center gap-1.5 text-sm text-red-500 dark:text-red-400 border border-red-200 dark:border-red-800 px-4 py-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 transition-colors disabled:opacity-50"
                                >
                                    <Trash2 size={14} />
                                    {deleting ? "Se șterge..." : "Șterge profil"}
                                </button>
                            )}
                            <button
                                type="submit"
                                disabled={saving}
                                className="ml-auto flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors disabled:opacity-60"
                            >
                                {saving && <Loader2 size={15} className="animate-spin" />}
                                {success && <CheckCircle size={15} />}
                                {saving ? "Se salvează..." : success ? "Salvat!" : "Salvează"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

function Field({
    label, name, value, onChange, placeholder, required,
}: {
    label: string;
    name: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    placeholder?: string;
    required?: boolean;
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
                required={required}
                className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 transition-shadow"
            />
        </div>
    );
}
