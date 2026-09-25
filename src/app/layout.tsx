import type { Metadata } from "next";
import { Cairo, Cormorant_Garamond, IBM_Plex_Sans_Arabic, Outfit } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeInjector } from "@/components/providers/ThemeInjector";
import { ServiceWorkerRegister } from "@/components/providers/ServiceWorkerRegister";

const cairo = Cairo({ subsets: ['arabic'], variable: '--font-cairo' });
const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'], 
  variable: '--font-cormorant',
  weight: ['400', '500', '600', '700']
});
const ibmPlex = IBM_Plex_Sans_Arabic({ 
  subsets: ['arabic'], 
  variable: '--font-ibm-plex',
  weight: ['300', '400', '500', '600', '700']
});
const outfit = Outfit({ 
  subsets: ['latin'], 
  variable: '--font-outfit',
  weight: ['300', '400', '500', '600', '700', '800']
});

export const metadata: Metadata = {
  title: "f2m Smart POS",
  description: "نظام نقاط البيع الذكي",
  manifest: "/manifest.json",
  themeColor: "#BA7517",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "f2m POS",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icon-192.png" />
      </head>
      <body className={`${cairo.variable} ${cormorant.variable} ${ibmPlex.variable} ${outfit.variable}`}>
        <SessionProvider>
          <ThemeInjector />
          <ServiceWorkerRegister />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
