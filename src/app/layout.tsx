"use client";

import { useState } from "react";
import { Inter, EB_Garamond } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { Menu, X } from "lucide-react";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const ebGaramond = EB_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <html lang="en" className="dark">
      <body className={`${inter.variable} ${ebGaramond.variable} antialiased min-h-screen bg-[#0A0A0A] text-zinc-100 flex overflow-hidden`}>
        

        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-[110] transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 lg:h-screen lg:sticky lg:top-0
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}>
          <Sidebar onSelect={() => setIsSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          {/* Mobile Header */}
          <header className="lg:hidden p-4 border-b border-zinc-800 flex justify-between items-center bg-black/50 backdrop-blur-xl">
            <h1 className="text-lg font-bold tracking-tighter serif text-amber-500">
              CHEERIO <span className="text-zinc-500 text-sm">ADMIN</span>
            </h1>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-zinc-400 hover:text-amber-500 transition-colors"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </header>

          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>

      </body>
    </html>
  );
}

