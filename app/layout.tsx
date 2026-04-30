import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import GoogleProvider from "@/components/layout/GoogleProvider";

export const metadata: Metadata = {
  title: "CNA Shop",
  description: "CNA Ecommerce Store",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <GoogleProvider>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <Navbar />
              <main className="max-w-7xl mx-auto px-4 py-8">
                {children}
              </main>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
        </GoogleProvider>
      </body>
    </html>
  );
}