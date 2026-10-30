import type { Metadata, Viewport } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import { FavoritesProvider } from '@/lib/favorites-context';
import Header from "./header";
import Footer from "./footer";
import { CustomerAuthProvider } from '@/lib/customer-auth-context';
import MobileNav from './mobile-nav';
import MobileHeader from './mobile-header';
import TopBar from './top-bar';
import SavedDataSync from '@/components/saved-data-sync';
import SiteChrome from './site-chrome';
import { PwaRegister } from '@/components/pwa';
import { DialogProvider } from '@/components/dialog-provider';

export const metadata: Metadata = {
  title: {
    default: "AD Sport Solutions",
    template: "%s | AD Sport Solutions",
  },
  description:
    "Vente de tout genre d'équipements de sport au Sénégal : maillots, chaussures, ballons, musculation et plus.",
  applicationName: "AD Sport Solutions",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
  appleWebApp: {
    capable: true,
    title: "AD Sport",
    statusBarStyle: "black",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0a0a",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <DialogProvider>
          <PwaRegister />
          <CartProvider>
            <FavoritesProvider>
              <CustomerAuthProvider>
                <SavedDataSync />
                <SiteChrome
                  header={
                    <>
                      {/* Desktop : TopBar + Header, collés en haut ensemble */}
                      <div className="sticky top-0 z-40">
                        <TopBar />
                        <Header />
                      </div>

                      {/* Mobile : logo + recherche. Doit rester HORS du bloc sticky ci-dessus,
                          car il gère lui-même son « collé en haut » (et son masquage au scroll). */}
                      <MobileHeader />
                    </>
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
        </DialogProvider>
      </body>
    </html>
  );
}