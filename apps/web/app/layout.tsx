import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Copilot — AI drafts for Tech Twitter",
  description:
    "A content copilot that drafts tweets from the day's trending tech discussions, delivered to Telegram on a schedule. You ship, never spam.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider afterSignOutUrl="/sign-in">
      <html
        lang="en"
        className={`${inter.variable} ${jakarta.variable} h-full antialiased`}
      >
        <body className="min-h-full flex flex-col bg-paper text-ink">
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
