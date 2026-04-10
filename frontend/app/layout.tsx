import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
  preload: false,
});

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: '--font-outfit',
  display: 'swap',
  preload: false,
});

export const metadata: Metadata = {
  title: "LearnSphere | AI-Powered Learning",
  description: "Next-generation personalized learning platform driven by AI.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body className="font-sans antialiased text-text-main bg-background transition-colors duration-300">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

