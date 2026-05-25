"use client";

import { useState } from "react";
import { sendContactMessage } from "@/lib/api/contact";
import { Mail, Phone, MapPin, Loader2, CheckCircle } from "lucide-react";

export default function ContactPage() {
    const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await sendContactMessage(form);
            setSuccess(true);
            setForm({ name: "", email: "", subject: "", message: "" });
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "A apărut o eroare. Încearcă din nou.");
        } finally {
            setLoading(false);
        }
    }

    const inputClass =
        "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors text-sm";

    return (
        <div className="max-w-5xl mx-auto py-16 px-4">
            <div className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Contact</h1>
                <p className="mt-2 text-gray-500 dark:text-gray-400">
                    Ai o întrebare sau o problemă? Scrie-ne și îți răspundem în cel mai scurt timp.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* Info panel */}
                <div className="flex flex-col gap-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                            <Mail size={18} className="text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Email</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">contact@cna.shop</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                            <Phone size={18} className="text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Telefon</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">+40 700 000 000</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                            <MapPin size={18} className="text-gray-600 dark:text-gray-400" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">Adresă</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                                Str. Exemplu nr. 1<br />Cluj-Napoca, România
                            </p>
                        </div>
                    </div>
                    <div className="mt-2 p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            Program de lucru: <strong className="text-gray-700 dark:text-gray-300">Luni – Vineri</strong>, orele <strong className="text-gray-700 dark:text-gray-300">09:00 – 18:00</strong>.
                            Mesajele primite în afara programului vor fi procesate în următoarea zi lucrătoare.
                        </p>
                    </div>
                </div>

                {/* Form */}
                <div className="lg:col-span-2">
                    {success ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-4 text-center">
                            <CheckCircle size={48} className="text-green-500" />
                            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Mesaj trimis!</h2>
                            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                                Mulțumim pentru mesaj. Îți vom răspunde în cel mai scurt timp.
                            </p>
                            <button
                                onClick={() => setSuccess(false)}
                                className="mt-2 text-sm text-gray-500 dark:text-gray-400 underline hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                            >
                                Trimite un alt mesaj
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Nume <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        name="name"
                                        value={form.name}
                                        onChange={handleChange}
                                        required
                                        placeholder="Ion Popescu"
                                        className={inputClass}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Email <span className="text-red-400">*</span>
                                    </label>
                                    <input
                                        name="email"
                                        type="email"
                                        value={form.email}
                                        onChange={handleChange}
                                        required
                                        placeholder="ion@exemplu.ro"
                                        className={inputClass}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Subiect <span className="text-red-400">*</span>
                                </label>
                                <input
                                    name="subject"
                                    value={form.subject}
                                    onChange={handleChange}
                                    required
                                    placeholder="ex. Întrebare despre o comandă"
                                    className={inputClass}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Mesaj <span className="text-red-400">*</span>
                                </label>
                                <textarea
                                    name="message"
                                    value={form.message}
                                    onChange={handleChange}
                                    required
                                    minLength={10}
                                    rows={6}
                                    placeholder="Descrie întrebarea sau problema ta..."
                                    className={`${inputClass} resize-none`}
                                />
                                <p className="text-xs text-gray-400 dark:text-gray-500">
                                    {form.message.length} / minim 10 caractere
                                </p>
                            </div>

                            {error && (
                                <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                                    {error}
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="self-start flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-50 transition-colors"
                            >
                                {loading && <Loader2 size={15} className="animate-spin" />}
                                {loading ? "Se trimite..." : "Trimite mesajul"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
