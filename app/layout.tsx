import type { Metadata } from "next";
import "./globals.css";
import { Caveat } from "next/font/google";
import FloatingSketches from "@/components/FloatingSketches";

const caveat = Caveat({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata: Metadata = {
  title: "VeloStack — Bike Fix & Flip Intelligence",
  description: "Find undervalued bikes, estimate repairs, track component wear, and turn wrenching skills into profit.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={caveat.className} style={{ fontSize: "1.2rem" }}>
        <FloatingSketches />
        <div style={{ position: "relative", zIndex: 10 }}>
          {children}
        </div>
      </body>
    </html>
  );
}
