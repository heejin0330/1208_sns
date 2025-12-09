"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/nextjs";
import { Home, Search, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import CreatePostModal from "@/components/post/CreatePostModal";
import { Button } from "@/components/ui/button";

/**
 * @file Sidebar.tsx
 * @description Instagram 스타일의 사이드바 컴포넌트
 *
 * Desktop (1024px+): 244px 너비, 아이콘 + 텍스트 메뉴
 * Tablet (768px~1023px): 72px 너비, 아이콘만 표시
 * Mobile (<768px): 숨김 처리
 *
 * 주요 기능:
 * - 홈, 검색, 만들기, 프로필 메뉴
 * - 현재 경로에 따른 Active 상태 표시
 * - Hover 효과 및 반응형 디자인
 *
 * @dependencies
 * - @clerk/nextjs: 사용자 인증 정보
 * - lucide-react: 아이콘
 * - next/navigation: 경로 감지
 */

interface MenuItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  onClick?: () => void;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const menuItems: MenuItem[] = [
    {
      icon: Home,
      label: "홈",
      href: "/",
    },
    {
      icon: Search,
      label: "검색",
      href: "/search",
    },
    {
      icon: Plus,
      label: "만들기",
      href: "#",
      onClick: () => {
        setIsCreateModalOpen(true);
      },
    },
    {
      icon: User,
      label: "프로필",
      href: "/profile",
    },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    if (href === "/profile") {
      // /profile 또는 /profile/[userId] 모두 활성화
      return pathname === "/profile" || pathname.startsWith("/profile/");
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex md:flex-col fixed left-0 top-0 h-screen bg-white border-r border-[#dbdbdb] z-40">
      {/* Desktop: 244px 너비, Tablet: 72px 너비 */}
      <div className="w-[72px] md:w-[244px] flex flex-col pt-8 px-4">
        {/* 로고 영역 */}
        <div className="mb-8 px-2">
          <Link href="/" className="text-xl font-bold text-[#262626]">
            <span className="hidden md:inline">Instagram</span>
            <span className="md:hidden">IG</span>
          </Link>
        </div>

        {/* 메뉴 항목 */}
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            // onClick이 있는 항목은 button으로 렌더링
            if (item.onClick) {
              return (
                <button
                  key={item.href}
                  type="button"
                  onClick={item.onClick}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                    "hover:bg-gray-50",
                    active && "font-semibold",
                    "text-[#262626]",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-6 h-6 flex-shrink-0",
                      active && "text-[#262626]",
                    )}
                  />
                  <span className="hidden md:inline text-sm">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  "hover:bg-gray-50",
                  active && "font-semibold",
                  "text-[#262626]",
                )}
              >
                <Icon
                  className={cn(
                    "w-6 h-6 flex-shrink-0",
                    active && "text-[#262626]",
                  )}
                />
                <span className="hidden md:inline text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* 하단 프로필 영역 */}
        <div className="mt-auto mb-4 px-2">
          <SignedOut>
            <SignInButton mode="modal">
              <Button className="w-full bg-[#0095f6] hover:bg-[#0095f6]/90">
                <span className="hidden md:inline">로그인</span>
                <User className="w-5 h-5 md:hidden" />
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <div className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg transition-colors">
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8",
                  },
                }}
              />
              <span className="hidden md:inline text-sm font-semibold text-[#262626]">
                프로필
              </span>
            </div>
          </SignedIn>
        </div>
      </div>

      {/* 게시물 작성 모달 */}
      <CreatePostModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </aside>
  );
}

