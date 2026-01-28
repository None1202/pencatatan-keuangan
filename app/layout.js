import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "UangKu - Asisten Keuangan Cerdas",
  description: "Sistem pelacakan dan analitik keuangan berbasis AI. Upload struk Anda dan biarkan AI yang urus.",
  icons: {
    icon: '/logo.png?v=2',
    apple: '/logo.png?v=2',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
      </body>
    </html>
  );
}
