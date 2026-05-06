import Link from "next/link";
import CartBadge from "./CartBadge";
import FavouritesBadge from "./FavouritesBadge";
import UserMenu from "./UserMenu";

export default function Navbar() {
  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">

        <Link href="/" className="text-xl font-bold text-gray-900 dark:text-gray-100">
          CNA Shop
        </Link>

        <div className="hidden md:flex items-center gap-8">
          <Link href="/products" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            Produse
          </Link>
          <Link href="/categories" className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
            Categorii
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <FavouritesBadge />
          <CartBadge />
          <UserMenu />
        </div>

      </div>
    </nav>
  );
}
