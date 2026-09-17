import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "EduLink Hub — Nền tảng việc làm Sinh viên Web3",
  description:
    "Kết nối Sinh viên với Doanh nghiệp qua Open Campus OCID và thanh toán USDC trên Solana. Hồ sơ xác thực bằng Soulbound Token, ký quỹ chống bùng lương.",
  keywords: ["EduLink", "Solana", "Open Campus", "OCID", "SBT", "Web3", "Freelance", "Sinh viên"],
  openGraph: {
    title: "EduLink Hub",
    description: "Nền tảng việc làm sinh viên Web2.5 — Xác thực bằng SBT, thanh toán USDC tức thì",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
