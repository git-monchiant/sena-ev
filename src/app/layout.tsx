import type { Metadata } from "next";
import { Prompt } from "next/font/google";
import "./globals.css";

const prompt = Prompt({
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-prompt",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sena EV",
  description: "Sena EV — Mini App สำหรับลูกค้ารถ EV และบริการหลังการขาย",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${prompt.variable} h-full antialiased`}
    >
      <body className={`${prompt.className} min-h-full flex flex-col`}>
        {children}
      </body>
    </html>
  );
}
