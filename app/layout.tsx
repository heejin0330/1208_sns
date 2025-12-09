import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";

import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import { SyncUserProvider } from "@/components/providers/sync-user-provider";
import { clerkLocalization } from "@/lib/clerk/localization";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mini Instagram",
  description: "Instagram 스타일 SNS 앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={clerkLocalization}>
      <html lang="ko">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <SyncUserProvider>
            {/* Instagram 레이아웃 구조 */}
            <div className="min-h-screen bg-[#FAFAFA]">
              {/* Sidebar: Desktop/Tablet에서만 표시 */}
              <Sidebar />

              {/* Header: Mobile에서만 표시 */}
              <Header />

              {/* Main Feed 영역 */}
              <main
                className={`
                  pt-[60px] md:pt-0 
                  pb-[50px] md:pb-0
                  md:ml-[72px] lg:ml-[244px]
                  min-h-screen
                `}
              >
                <div className="max-w-[630px] mx-auto px-4 py-4 md:py-8">
                  {children}
                </div>
              </main>

              {/* BottomNav: Mobile에서만 표시 */}
              <BottomNav />
            </div>
          </SyncUserProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
