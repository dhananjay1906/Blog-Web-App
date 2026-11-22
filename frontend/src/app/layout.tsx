import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Inkwell", template: "%s · Inkwell" },
  description: "A small blogging platform built with Django REST Framework, PostgreSQL and Next.js.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-stone-50 text-stone-900 antialiased">
        <AuthProvider>
          <Navbar />
          <main className="mx-auto max-w-5xl px-5 py-10">{children}</main>
          <footer className="mx-auto max-w-5xl px-5 pb-10 text-sm text-stone-400">
            Inkwell · Django + Next.js
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
