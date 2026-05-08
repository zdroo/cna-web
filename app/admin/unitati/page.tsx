"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, Lock } from "lucide-react";
import PageSpinner from "@/components/ui/PageSpinner";
import { useAuth } from "@/context/AuthContext";
import {
    MeasurementUnit,
    adminGetMeasurementUnits,
    adminCreateMeasurementUnit,
    adminUpdateMeasurementUnit,
    adminDeleteMeasurementUnit,
} from "@/lib/api/admin";

interface FormState {
    name: string;
    symbol: string;
    measures: string;
}

const emptyForm: FormState = { name: "", symbol: "", measures: "" };

export default function AdminUnitatiPage() {
    const { token } = useAuth();
    const [units, setUnits] = useState<MeasurementUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        adminGetMeasurementUnits(token)
            .then(setUnits)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    const grouped = units.reduce<Record<string, MeasurementUnit[]>>((acc, u) => {
        (acc[u.measures] ??= []).push(u);
        return acc;
    }, {});

    function openCreate() {
        setEditingId(null);
        setForm(emptyForm);
        setError(null);
        setShowForm(true);
    }

    function openEdit(unit: MeasurementUnit) {
        setEditingId(unit.unitId);
        setForm({ name: unit.name, symbol: unit.symbol, measures: unit.measures });
        setError(null);
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        setError(null);
    }

    function setField<K extends keyof FormState>(key: K, value: string) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSave() {
        if (!token) return;
        if (!form.name.trim() || !form.symbol.trim() || !form.measures.trim()) {
            setError("Completează toate câmpurile: denumire, simbol și ce măsoară.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const data = { name: form.name.trim(), symbol: form.symbol.trim(), measures: form.measures.trim() };
            if (editingId) {
                await adminUpdateMeasurementUnit(token, editingId, data);
                setUnits((prev) => prev.map((u) => u.unitId === editingId ? { ...u, ...data } : u));
            } else {
                const { id } = await adminCreateMeasurementUnit(token, data);
                setUnits((prev) => [...prev, { unitId: id, ...data, isSystem: false, usageCount: 0 }]);
            }
            closeForm();
        } catch {
            setError("Operațiunea a eșuat. Încearcă din nou.");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(unit: MeasurementUnit) {
        if (!token) return;
        if (!window.confirm(`Ștergi unitatea "${unit.name} (${unit.symbol})"?`)) return;
        setDeletingId(unit.unitId);
        try {
            await adminDeleteMeasurementUnit(token, unit.unitId);
            setUnits((prev) => prev.filter((u) => u.unitId !== unit.unitId));
        } catch {
            alert("Ștergerea a eșuat.");
        } finally {
            setDeletingId(null);
        }
    }

    const inputCls = "px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100";

    return (
        <div className="flex flex-col gap-6">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Unități de măsură</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{units.length} unități ({units.filter(u => !u.isSystem).length} personalizate)</p>
                </div>
                {!showForm && (
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
                    >
                        <Plus size={16} />
                        Unitate nouă
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        {editingId ? "Editează unitatea" : "Unitate nouă"}
                    </h2>
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Denumire <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setField("name", e.target.value)}
                                    placeholder="ex. Kilogram"
                                    className={inputCls}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Simbol <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={form.symbol}
                                    onChange={(e) => setField("symbol", e.target.value)}
                                    placeholder="ex. kg"
                                    className={inputCls}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Ce măsoară <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={form.measures}
                                    onChange={(e) => setField("measures", e.target.value)}
                                    placeholder="ex. Greutate"
                                    className={inputCls}
                                />
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                <Check size={15} />
                                {saving ? "Se salvează..." : "Salvează"}
                            </button>
                            <button
                                onClick={closeForm}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                                <X size={15} />
                                Anulează
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <PageSpinner className="py-16" />
            ) : (
                <div className="flex flex-col gap-4">
                    {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([measures, groupUnits]) => (
                        <div key={measures} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                            <div className="px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800">
                                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{measures}</h3>
                            </div>
                            <table className="w-full text-sm">
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                    {groupUnits.map((unit) => (
                                        <tr key={unit.unitId} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="px-6 py-3">
                                                <span className="font-medium text-gray-900 dark:text-gray-100">{unit.name}</span>
                                            </td>
                                            <td className="px-6 py-3">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-mono font-semibold">
                                                    {unit.symbol}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3">
                                                {unit.isSystem ? (
                                                    <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                                                        <Lock size={11} />
                                                        Sistem
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-blue-500 dark:text-blue-400">Personalizat</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => openEdit(unit)}
                                                        disabled={unit.isSystem}
                                                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                        title={unit.isSystem ? "Unitățile de sistem nu pot fi editate" : "Editează"}
                                                    >
                                                        <Pencil size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(unit)}
                                                        disabled={unit.isSystem || deletingId === unit.unitId}
                                                        className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                        title={unit.isSystem ? "Unitățile de sistem nu pot fi șterse" : "Șterge"}
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
