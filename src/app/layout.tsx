import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import NavWrapper from "@/components/NavWrapper";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Teo & Noelle 💕",
  description: "Our little corner of the internet",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`}>
      <body className="min-h-screen bg-rose-50 antialiased font-sans">
        <div className="flex min-h-screen flex-col md:flex-row">
          <NavWrapper />
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
