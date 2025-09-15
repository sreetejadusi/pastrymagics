import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pastry Magics — Custom Cakes & Fresh Bakes",
  description:
    "Design your perfect cake and place instant dine-in orders. Freshly baked delights crafted with love at Pastry Magics.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="w-full top-0 left-0 right-0 z-20 p-2">
          <Header />
        </div>
        {children}
      </body>
    </html>
  );
}
