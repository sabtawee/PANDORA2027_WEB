import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "../globals.css";

const kanit = Kanit({ variable: "--font-kanit", subsets: ["thai", "latin"], weight: ["300", "400", "500", "600"] });

export const metadata: Metadata = {
  title: "Admin | PANDORA-RO",
  robots: { index: false, follow: false },
};

/** Root layout for the back office (login page + signed-in panel). */
export default function AdminRootLayout({ children }: LayoutProps<"/admin">) {
  return (
    <html lang="th" className={`${kanit.variable} h-full`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
