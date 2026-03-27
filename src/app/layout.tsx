import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";

const font = Outfit({
  variable: "--font-outfit",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "CRM Chat Pro | Univerzální platforma",
  description: "Správa chatů pro jakýkoliv web v reálném čase.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className={`${font.variable}`}>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
