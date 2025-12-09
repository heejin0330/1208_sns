"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, Plus, Heart, User } from "lucide-react";
import { cn } from "@/lib/utils";

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
        // CreatePostModal은 5단계에서 구현 예정
        console.log("게시물 만들기 모달 열기");
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
    return pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 h-[50px] bg-white border-t border-[#dbdbdb] z-50 flex items-center justify-around">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={item.onClick}
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
  );
}

