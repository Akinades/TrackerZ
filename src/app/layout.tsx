import type { Metadata } from "next";
import { Kanit } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import { ReduxProvider } from "@/components/shared/ReduxProvider";
import { AuthProvider } from "@/store/useAuth";
import { ToasterProvider } from "@/components/shared/ToasterProvider";

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
        <ReduxProvider>
          <AuthProvider>
            <ToasterProvider />
            <div className="mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-4">
              <Navbar />
              <main className="flex flex-1 py-6">
                <div className="w-full">{children}</div>
              </main>
              <Footer />
            </div>
          </AuthProvider>
        </ReduxProvider>
      </body>
    </html>
  );
}

