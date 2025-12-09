"use client";

import Link from "next/link";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Bell, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * @file Header.tsx
 * @description Mobile 전용 헤더 컴포넌트
 *
 * Mobile (<768px)에서만 표시되는 상단 헤더
 * 높이: 60px
 * 구성: 로고 + 우측 아이콘 (알림, DM, 프로필)
 *
 * @dependencies
 * - lucide-react: 아이콘
 */

export default function Header() {
  return (
    <header className="md:hidden fixed top-0 left-0 right-0 h-[60px] bg-white border-b border-[#dbdbdb] z-50 flex items-center justify-between px-4">
      {/* 로고 */}
      <Link href="/" className="text-xl font-bold text-[#262626]">
        Instagram
      </Link>

      {/* 우측 아이콘 */}
      <div className="flex items-center gap-4">
        <SignedOut>
          {/* 로그인하지 않은 경우 */}
          <SignInButton mode="modal">
            <Button size="sm" className="bg-[#0095f6] hover:bg-[#0095f6]/90">
              로그인
            </Button>
          </SignInButton>
        </SignedOut>

        <SignedIn>
          {/* 로그인한 경우 */}
          {/* 알림 아이콘 (1차 제외, UI만) */}
          <button
            type="button"
            className="text-[#262626] hover:opacity-70 transition-opacity"
            aria-label="알림"
          >
            <Bell className="w-6 h-6" />
          </button>

          {/* DM 아이콘 (1차 제외, UI만) */}
          <button
            type="button"
            className="text-[#262626] hover:opacity-70 transition-opacity"
            aria-label="메시지"
          >
            <MessageSquare className="w-6 h-6" />
          </button>

          {/* Clerk UserButton (프로필, 로그아웃 등) */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
              },
            }}
          />
        </SignedIn>
      </div>
    </header>
  );
}

