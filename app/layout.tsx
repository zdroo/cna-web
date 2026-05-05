import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import UnpaidOrderBanner from "@/components/layout/UnpaidOrderBanner";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import GoogleProvider from "@/components/layout/GoogleProvider";

export const metadata: Metadata = {
  title: "CNA Shop",
  description: "CNA Magazin Online",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <head>
        {/* Apply theme before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased">
        <GoogleProvider>
          <AuthProvider>
            <ThemeProvider>
              <CartProvider>
                <FavoritesProvider>
                  <Navbar />
                  <UnpaidOrderBanner />
                  <main className="max-w-7xl mx-auto px-4 py-8">
                    {children}
                  </main>
                </FavoritesProvider>
              </CartProvider>
            </ThemeProvider>
          </AuthProvider>
        </GoogleProvider>
      </body>
    </html>
  );
}
