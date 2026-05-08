import Link from "next/link";
import { CheckCircle } from "lucide-react";

interface Props {
    params: Promise<{ orderId: string }>;
}

export default async function ConfirmationPage({ params }: Props) {
    const { orderId } = await params;

    return (
        <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle size={36} className="text-green-600" />
            </div>

            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold text-gray-900">Comandă plasată cu succes!</h1>
                <p className="text-gray-500 text-sm max-w-sm">
                    Îți mulțumim pentru comandă. Vei fi contactat în curând pentru confirmare și detalii de livrare.
                </p>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl px-6 py-4 flex flex-col gap-1 items-center">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Număr comandă</p>
                <p className="font-mono text-sm font-semibold text-gray-700 break-all">{orderId}</p>
            </div>

            <div className="flex gap-3 mt-2">
                <Link
                    href="/produse"
                    className="bg-gray-900 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm"
                >
                    Continuă cumpărăturile
                </Link>
                <Link
                    href="/"
                    className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm"
                >
                    Acasă
                </Link>
            </div>
        </div>
    );
}
