import type { Metadata } from "next";
import { Archivo_Black, Instrument_Sans, Recursive } from "next/font/google";
import { NavBar } from "@/components/shared/NavBar";
import "./globals.css";

const archivoBlack = Archivo_Black({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display",
  display: "swap",
});

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const recursive = Recursive({
  subsets: ["latin"],
  variable: "--font-data",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RiftCover — Insure the assumptions your software runs on.",
  description:
    "Parametric insurance for digital dependency shocks, adjudicated by GenLayer's AI-validator consensus.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${archivoBlack.variable} ${instrumentSans.variable} ${recursive.variable}`}
    >
      <body className="min-h-screen bg-bone">
        <NavBar />
        <main className="mx-auto max-w-6xl px-4 py-10 md:px-6">{children}</main>
      </body>
    </html>
  );
}
