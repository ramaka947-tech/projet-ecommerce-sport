import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/lib/cart-context";
import Header from "./header";
import Footer from "./footer";
import { CustomerAuthProvider } from '@/lib/customer-auth-context';

export const metadata: Metadata = {
  title: "SportPro",
  description: "Boutique d'articles de sport",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <CartProvider>
          <CustomerAuthProvider>
            <Header />
            <div className="flex-1">{children}</div>
            <Footer />
          </CustomerAuthProvider>
        </CartProvider>
      </body>
    </html>
  );
}