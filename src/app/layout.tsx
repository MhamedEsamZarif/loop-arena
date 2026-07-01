import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Loop Arena — live multiplayer bug hunt",
  description:
    "Race to find seeded bugs in a live sandbox before the timer runs out. Built for TestSprite Hackathon S3.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-bg text-white antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
