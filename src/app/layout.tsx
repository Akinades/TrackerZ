import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/shared/Navbar";

const kanit = Kanit({
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600"],
  display: "swap"
});

export const metadata: Metadata = {
  title: "TrackerZ",
  description: "Mini project tracker trader"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body className={`${kanit.className} min-h-dvh text-zinc-900`}>
        <div className="mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-4">
          <Navbar />
          <main className="flex-1 py-6">{children}</main>
          <footer className="py-8 text-sm text-zinc-500">
            TrackerZ MVP • Minimal
          </footer>
        </div>
      </body>
    </html>
  );
}

