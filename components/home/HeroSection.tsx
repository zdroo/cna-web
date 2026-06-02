import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative bg-gray-900 text-white rounded-2xl overflow-hidden">
      
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-start justify-center px-10 py-14 max-w-xl">
        <span className="text-xs font-semibold tracking-widest text-gray-400 uppercase mb-3">
          Colecție Nouă 2026
        </span>
        <h1 className="text-3xl font-bold leading-tight mb-3">
          Descoperă Stilul Tău Perfect
        </h1>
        <p className="text-sm text-gray-300 mb-6">
          Explorează colecția noastră de produse premium. Calitate în care poți avea încredere, stil pe care îl vei adora.
        </p>
        <div className="flex items-center gap-3">
          <Link
            href="/produse"
            className="bg-white text-gray-900 px-6 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors"
          >
            Cumpără Acum
          </Link>
          <Link
            href="/produse"
            className="border border-white text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-white hover:text-gray-900 transition-colors"
          >
            Vezi Categorii
          </Link>
        </div>
      </div>

    </section>
  );
}