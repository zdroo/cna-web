"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { adminGetGiftCards, adminCreateGiftCard, adminDeleteGiftCard, GiftCardItem } from "@/lib/api/giftCards";
import { Gift, Plus, Trash2, Loader2, X } from "lucide-react";

const EMPTY = { code: "", value: "", expiresAt: "" };

export default function AdminCarduriCadouPage() {
    const { token, user, isLoaded } = useAuth();
    const router = useRouter();
    const [items, setItems] = useState<GiftCardItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(EMPTY);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoaded) return;
        if (!user || user.role !== "Admin") router.replace("/admin");
    }, [isLoaded, user, router]);

    async function load() {
        if (!token) return;
        setLoading(true);
        setError(null);
        try { setItems(await adminGetGiftCards(token)); } catch { setError("Nu s-au putut încărca cardurile cadou."); }
        finally { setLoading(false); }
    }

    useEffect(() => { load(); }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!isLoaded || !user || user.role !== "Admin") return null;

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault();
        if (!token) return;
        setSaving(true);
        setError(null);
        try {
            await adminCreateGiftCard(token, {
                code: form.code,
                value: parseFloat(form.value),
                expiresAt: form.expiresAt || null,
            });
            setForm(EMPTY);
            setShowForm(false);
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Eroare");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(id: string) {
        if (!token || !confirm("Ștergi cardul cadou?")) return;
        try { await adminDeleteGiftCard(token, id); await load(); } catch (err) { setError(err instanceof Error ? err.message : "Eroare la ștergere"); }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Carduri cadou</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Carduri cu sold prepaid utilizabile la checkout</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950">
                        <Gift size={22} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <button
                        onClick={() => setShowForm((v) => !v)}
                        className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
                    >
                        <Plus size={15} />
                        Card nou
                    </button>
                </div>
            </div>

            {/* Create form */}
            {showForm && (
                <form onSubmit={handleCreate} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Card cadou nou</h2>
                        <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Cod *</label>
                            <input required value={form.code} onChange={(e) => setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))}
                                placeholder="ex. GIFT-2024-A1" className={inputCls} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Valoare (lei) *</label>
                            <input required type="number" min="1" step="0.01" value={form.value}
                                onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
                                placeholder="ex. 100" className={inputCls} />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Expiră la</label>
                            <input type="datetime-local" value={form.expiresAt}
                                onChange={(e) => setForm((p) => ({ ...p, expiresAt: e.target.value }))}
                                className={inputCls} />
                        </div>
                    </div>

                    <button type="submit" disabled={saving}
                        className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-50 transition-colors self-start">
                        {saving && <Loader2 size={14} className="animate-spin" />}
                        {saving ? "Se salvează..." : "Creează card"}
                    </button>
                </form>
            )}

            {error && (
                <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">{error}</p>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 text-xs uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                <th className="text-left px-5 py-3.5 font-semibold">Cod</th>
                                <th className="text-left px-5 py-3.5 font-semibold">Valoare inițială</th>
                                <th className="text-left px-5 py-3.5 font-semibold">Sold rămas</th>
                                <th className="text-left px-5 py-3.5 font-semibold">Expiră</th>
                                <th className="text-left px-5 py-3.5 font-semibold">Status</th>
                                <th className="px-5 py-3.5" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {loading ? (
                                <tr><td colSpan={6} className="text-center py-12"><Loader2 size={24} className="animate-spin text-gray-400 mx-auto" /></td></tr>
                            ) : items.length === 0 ? (
                                <tr><td colSpan={6} className="text-center py-12 text-gray-400 dark:text-gray-500">Niciun card cadou creat</td></tr>
                            ) : items.map((c) => (
                                <tr key={c.giftCardId} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-5 py-3.5 font-mono font-semibold text-gray-900 dark:text-gray-100">{c.code}</td>
                                    <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">{c.initialValue.toFixed(2)} lei</td>
                                    <td className="px-5 py-3.5">
                                        <span className={`font-semibold ${c.balance === 0 ? "text-gray-400 dark:text-gray-500" : "text-gray-900 dark:text-gray-100"}`}>
                                            {c.balance.toFixed(2)} lei
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-gray-500 dark:text-gray-400">
                                        {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("ro-RO") : "—"}
                                    </td>
                                    <td className="px-5 py-3.5">
                                        <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${
                                            !c.isActive || c.balance === 0
                                                ? "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                                                : "bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300"
                                        }`}>
                                            {!c.isActive ? "Inactiv" : c.balance === 0 ? "Epuizat" : "Activ"}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3.5 text-right">
                                        <button onClick={() => handleDelete(c.giftCardId)} className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors">
                                            <Trash2 size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

const inputCls = "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 w-full";
