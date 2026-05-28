import Link from "next/link";
import { CheckCircle, Gift } from "lucide-react";

export default function ConfirmareCardCadouPage() {
    return (
        <div className="max-w-md mx-auto flex flex-col items-center gap-6 py-12 text-center">
            <div className="flex flex-col items-center gap-3">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-950 flex items-center justify-center">
                        <Gift size={36} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                        <CheckCircle size={16} className="text-white" />
                    </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Card cadou trimis!</h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                    Plata a fost confirmată. Destinatarul va primi codul cardului cadou pe email în câteva momente.
                </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-5 w-full text-left flex flex-col gap-2 text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium text-gray-900 dark:text-gray-100">Ce urmează?</p>
                <ul className="flex flex-col gap-1.5 list-disc list-inside">
                    <li>Destinatarul primește emailul cu codul</li>
                    <li>Codul poate fi folosit la orice comandă, în câmpul <em>Card cadou</em></li>
                    <li>Soldul rămas poate fi utilizat la comenzi viitoare</li>
                </ul>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full">
                <Link
                    href="/carduri-cadou/cumpara"
                    className="flex-1 text-center px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    Trimite alt card cadou
                </Link>
                <Link
                    href="/produse"
                    className="flex-1 text-center px-5 py-3 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-medium hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
                >
                    Explorează produse
                </Link>
            </div>
        </div>
    );
}
