import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "School ERP",
  description: "Multi-tenant school ERP for Indian K-12 day schools",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
