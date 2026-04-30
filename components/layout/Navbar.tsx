import Link from "next/link";
import { Heart } from "lucide-react";
import CartBadge from "./CartBadge";
import UserMenu from "./UserMenu";

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">

        {/* Logo */}
        <Link href="/" className="text-xl font-bold text-gray-900">
          CNA Shop
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="/products" className="text-gray-600 hover:text-gray-900 transition-colors">
            Products
          </Link>
          <Link href="/categories" className="text-gray-600 hover:text-gray-900 transition-colors">
            Categories
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          
          {/* Favourites */}
          <Link href="/favourites" className="relative text-gray-600 hover:text-gray-900 transition-colors">
            <Heart size={22} />
          </Link>

          <CartBadge />

          <UserMenu />

        </div>
      </div>
    </nav>
  );
}