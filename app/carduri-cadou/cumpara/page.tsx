"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { purchaseGiftCard } from "@/lib/api/giftCards";
import { Gift, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const PRESETS = [50, 100, 150, 200, 300, 500];

const inputCls = "border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 w-full";

export default function CumparaCardCadouPage() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const cancelled = searchParams.get("cancelled") === "true";

    const [selectedPreset, setSelectedPreset] = useState<number | null>(100);
    const [customAmount, setCustomAmount] = useState("");
    const [recipientEmail, setRecipientEmail] = useState("");
    const [recipientName, setRecipientName] = useState("");
    const [senderName, setSenderName] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const senderNameTouched = useRef(false);

    useEffect(() => {
        if (user && !senderNameTouched.current) setSenderName(user.email);
    }, [user]);

    const amount = selectedPreset ?? (parseFloat(customAmount) || 0);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (amount < 10 || amount > 5000) {
            setError("Valoarea cardului trebuie să fie între 10 și 5.000 lei.");
            return;
        }
        if (!recipientEmail.trim() || !recipientName.trim() || !senderName.trim()) {
            setError("Completează toate câmpurile obligatorii.");
            return;
        }
        setError(null);
        setLoading(true);
        try {
            const { url } = await purchaseGiftCard({
                amount,
                recipientEmail: recipientEmail.trim(),
                recipientName: recipientName.trim(),
                senderName: senderName.trim(),
                message: message.trim() || undefined,
            });
            window.location.href = url;
        } catch (err) {
            setError(err instanceof Error ? err.message : "Eroare la inițializarea plății");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="max-w-xl mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Link href="/produse" className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Card cadou</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Surprinde pe cineva cu un card cadou CNA Shop</p>
                </div>
            </div>

            {cancelled && (
                <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-sm text-amber-700 dark:text-amber-300">
                    Plata a fost anulată. Poți reîncerca oricând.
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                {/* Amount */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                        <Gift size={18} className="text-purple-500 dark:text-purple-400" />
                        <h2 className="font-semibold text-gray-900 dark:text-gray-100">Valoare card</h2>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        {PRESETS.map((p) => (
                            <button
                                key={p}
                                type="button"
                                onClick={() => { setSelectedPreset(p); setCustomAmount(""); }}
                                className={`py-2.5 rounded-xl text-sm font-semibold border transition-colors ${
                                    selectedPreset === p
                                        ? "bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 border-gray-900 dark:border-gray-100"
                                        : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500"
                                }`}
                            >
                                {p} lei
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Altă valoare (10 – 5.000 lei)
                        </label>
                        <input
                            type="number"
                            min="10"
                            max="5000"
                            step="1"
                            value={customAmount}
                            onChange={(e) => { setCustomAmount(e.target.value); setSelectedPreset(null); }}
                            placeholder="ex. 250"
                            className={inputCls}
                        />
                    </div>

                    {amount >= 10 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Total de plată: <span className="font-bold text-gray-900 dark:text-gray-100">{amount.toFixed(2)} lei</span>
                        </p>
                    )}
                </div>

                {/* Recipient */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex flex-col gap-4">
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">Destinatar</h2>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nume destinatar *</label>
                        <input
                            required
                            value={recipientName}
                            onChange={(e) => setRecipientName(e.target.value)}
                            placeholder="ex. Maria Ionescu"
                            className={inputCls}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email destinatar *</label>
                        <input
                            required
                            type="email"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            placeholder="ex. maria@exemplu.ro"
                            className={inputCls}
                        />
                    </div>
                </div>

                {/* Sender + message */}
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex flex-col gap-4">
                    <h2 className="font-semibold text-gray-900 dark:text-gray-100">De la</h2>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Numele tău *</label>
                        <input
                            required
                            value={senderName}
                            onChange={(e) => { setSenderName(e.target.value); senderNameTouched.current = true; }}
                            placeholder="ex. Ion Popescu"
                            className={inputCls}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mesaj personal (opțional)</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            maxLength={490}
                            rows={3}
                            placeholder="ex. La mulți ani! Sper să găsești ceva pe plac."
                            className="border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 w-full resize-none"
                        />
                        <p className="text-xs text-gray-400 dark:text-gray-500 self-end">{message.length}/490</p>
                    </div>
                </div>

                {error && (
                    <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading || amount < 10}
                    className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-3.5 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                    {loading ? (
                        <><Loader2 size={16} className="animate-spin" /> Se procesează...</>
                    ) : (
                        <>Plătește {amount >= 10 ? `${amount.toFixed(2)} lei` : ""}</>
                    )}
                </button>

                <p className="text-xs text-center text-gray-400 dark:text-gray-500">
                    Codul cardului cadou va fi trimis pe emailul destinatarului imediat după confirmarea plății.
                </p>
            </form>
        </div>
    );
}
