"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";
import CreatePostModal from "@/components/post/CreatePostModal";

/**
 * @file BottomNav.tsx
 * @description Mobile 전용 하단 네비게이션 컴포넌트
 *
 * Mobile (<768px)에서만 표시되는 하단 고정 네비게이션
 * 높이: 50px
 * 5개 아이콘: 홈, 검색, 만들기, 좋아요, 프로필
 *
 * @dependencies
 * - lucide-react: 아이콘
 * - next/navigation: 경로 감지
 */

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  label: string;
  onClick?: () => void;
}

export default function BottomNav() {
  const pathname = usePathname();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      icon: Home,
      href: "/",
      label: "홈",
    },
    {
      icon: Search,
      href: "/search",
      label: "검색",
    },
    {
      icon: Plus,
      href: "#",
      label: "만들기",
      onClick: () => {
        setIsCreateModalOpen(true);
      },
    },
    {
      icon: Heart,
      href: "/activity",
      label: "좋아요",
    },
    {
      icon: User,
      href: "/profile",
      label: "프로필",
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
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[50px] bg-white border-t border-[#dbdbdb] z-50 flex items-center justify-around">
        {navItems.map((item) => {
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
                  "flex items-center justify-center w-full h-full transition-colors",
                  active && "text-[#262626]",
                  !active && "text-[#8e8e8e]",
                )}
                aria-label={item.label}
              >
                <Icon className="w-6 h-6" />
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-center w-full h-full transition-colors",
                active && "text-[#262626]",
                !active && "text-[#8e8e8e]",
              )}
              aria-label={item.label}
            >
              <Icon className="w-6 h-6" />
            </Link>
          );
        })}
      </nav>

      {/* 게시물 작성 모달 */}
      <CreatePostModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
      />
    </>
  );
}

