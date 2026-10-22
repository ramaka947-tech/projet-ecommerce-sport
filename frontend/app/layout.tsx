import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { FavoritesProvider } from '@/lib/favorites-context';
import Header from "./header";
import Footer from "./footer";
import { CustomerAuthProvider } from '@/lib/customer-auth-context';
import MobileNav from './mobile-nav';
import TopBar from './top-bar';
import SavedDataSync from '@/components/saved-data-sync';
import SiteChrome from './site-chrome';

export const metadata: Metadata = {
  title: "SportPro",
  description: "Boutique d'articles de sport",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <FavoritesProvider>
            <CustomerAuthProvider>
              <SavedDataSync />
              <SiteChrome
                header={
                  <div className="sticky top-0 z-40">
                    <TopBar />
                    <Header />
                  </div>
                }
                footer={
                  <>
                    <Footer />
                    <MobileNav />
                  </>
                }
              >
                {children}
              </SiteChrome>
            </CustomerAuthProvider>
          </FavoritesProvider>
        </CartProvider>
      </body>
    </html>
  );
}