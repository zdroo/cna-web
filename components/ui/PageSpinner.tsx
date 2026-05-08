import { Loader2 } from "lucide-react";

export default function PageSpinner({ className }: { className?: string }) {
    return (
        <div className={`flex justify-center items-center ${className ?? "py-24"}`}>
            <Loader2 size={28} className="animate-spin text-gray-300 dark:text-gray-600" />
        </div>
    );
}
