import type { Metadata } from "next";
import "./globals.css";
import "@/lib/cache-globals"; // Initialize global cache functions
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AuthErrorBoundary } from "@/components/AuthErrorBoundary";
import PwaRegistrar from "@/components/PwaRegistrar";

export const metadata: Metadata = {
  title: "Modern POS System",
  description: "A modern, mobile-first Point of Sale system",
  applicationName: "Modern POS",
  manifest: "/manifest.json",
  themeColor: "#0b5cab",
  appleWebApp: {
    capable: true,
    title: "Modern POS",
    statusBarStyle: "default"
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: "/icons/icon-192.png"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        <AuthErrorBoundary>
          <AuthProvider>
            <NotificationProvider>
              <CurrencyProvider>
                <SettingsProvider>
                  {children}
                  <PwaRegistrar />
                </SettingsProvider>
              </CurrencyProvider>
            </NotificationProvider>
          </AuthProvider>
        </AuthErrorBoundary>
      </body>
    </html>
  );
}
