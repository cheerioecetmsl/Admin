import type { Metadata } from "next";
import { Inter, EB_Garamond } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cheerio | Command Center",
  description: "The administrative heart of the Batch of 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${ebGaramond.variable} antialiased min-h-screen bg-[#0A0A0A] text-zinc-100 flex`}>
        
        <Sidebar />

        {/* Main Content */}
        <main className="flex-1 flex flex-col h-screen overflow-auto">
          {children}
        </main>

      </body>
    </html>
  );
}
