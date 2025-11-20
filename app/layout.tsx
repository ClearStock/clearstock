import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { MainNav } from "@/components/main-nav";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Clearstok",
  description: "Clearstok - Aplicação para gestão de validades em restauração",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt">
      <body className={cn(inter.className, "min-h-screen bg-background font-sans antialiased")}>
        <div className="relative flex min-h-screen flex-col">
          <MainNav />
          <main className="flex-1 container py-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
