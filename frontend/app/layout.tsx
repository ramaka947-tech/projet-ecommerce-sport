import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { FavoritesProvider } from '@/lib/favorites-context';
import Header from "./header";
import Footer from "./footer";
import { CustomerAuthProvider } from '@/lib/customer-auth-context';
import MobileNav from './mobile-nav';
import TopBar from './top-bar';

export const metadata: Metadata = {
  title: "SportPro",
  description: "Boutique d'articles de sport",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col pb-16 md:pb-0">
        <CartProvider>
          <FavoritesProvider>
            <CustomerAuthProvider>
              <div className="sticky top-0 z-40">
                <TopBar />
                <Header />
              </div>
              <div className="flex-1">{children}</div>
              <Footer />
              <MobileNav />
            </CustomerAuthProvider>
          </FavoritesProvider>
        </CartProvider>
      </body>
    </html>
  );
}