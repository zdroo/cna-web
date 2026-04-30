import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative bg-gray-900 text-white rounded-2xl overflow-hidden">
      
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-start justify-center px-12 py-32 max-w-2xl">
        <span className="text-sm font-semibold tracking-widest text-gray-400 uppercase mb-4">
          New Collection 2026
        </span>
        <h1 className="text-5xl font-bold leading-tight mb-6">
          Discover Your Perfect Style
        </h1>
        <p className="text-lg text-gray-300 mb-8">
          Explore our curated collection of premium products. Quality you can trust, style you will love.
        </p>
        <div className="flex items-center gap-4">
          <Link
            href="/products"
            className="bg-white text-gray-900 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Shop Now
          </Link>
          <Link
            href="/categories"
            className="border border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-colors"
          >
            Browse Categories
          </Link>
        </div>
      </div>

    </section>
  );
}