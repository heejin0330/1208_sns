"use client";

import { useState } from "react";
import { User } from "lucide-react";
import { User as UserType, UserStats } from "@/lib/types";
import FollowButton from "@/components/profile/FollowButton";

/**
 * @file ProfileHeader.tsx
 * @description Instagram 스타일의 프로필 헤더 컴포넌트
 *
 * 주요 기능:
 * - 프로필 이미지, 사용자명, 통계 표시
 * - 본인 프로필과 다른 사람 프로필 구분
 * - 반응형 레이아웃 (Desktop/Mobile)
 *
 * @dependencies
 * - lucide-react: 아이콘
 */

interface ProfileHeaderProps {
  user: UserType;
  stats: UserStats;
  isOwnProfile: boolean;
  isFollowing?: boolean;
  onFollowToggle?: () => void;
}

export default function ProfileHeader({
  user,
  stats: initialStats,
  isOwnProfile,
  isFollowing: initialIsFollowing = false,
  onFollowToggle,
}: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [stats, setStats] = useState(initialStats);

  const handleFollowToggle = (newState: boolean) => {
    setIsFollowing(newState);
    // 낙관적 통계 업데이트
    setStats((prev) => ({
      ...prev,
      followers_count: newState
        ? prev.followers_count + 1
        : Math.max(0, prev.followers_count - 1),
    }));

    // 외부 콜백 호출 (필요한 경우)
    if (onFollowToggle) {
      onFollowToggle();
    }
  };

  return (
    <div className="px-4 py-6 md:px-0">
      <div className="flex flex-col md:flex-row md:items-center gap-6 md:gap-12">
        {/* 프로필 이미지 */}
        <div className="flex-shrink-0 flex justify-center md:justify-start">
          <div className="w-[90px] h-[90px] md:w-[150px] md:h-[150px] rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
            <User className="w-[45px] h-[45px] md:w-[75px] md:h-[75px] text-white" />
          </div>
        </div>

        {/* 정보 영역 */}
        <div className="flex-1 min-w-0">
          {/* 사용자명 및 버튼 */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <h1 className="text-xl md:text-2xl font-light text-[#262626]">
              {user.name}
            </h1>

            {/* 버튼 영역 */}
            <div className="flex items-center gap-2">
              {isOwnProfile ? (
                // 본인 프로필: 프로필 편집 버튼 (1차 제외, UI만)
                <button
                  type="button"
                  className="px-4 py-1.5 text-sm font-semibold border border-[#dbdbdb] rounded-lg text-[#262626] hover:bg-gray-50 transition-colors"
                  disabled
                >
                  프로필 편집
                </button>
              ) : (
                // 다른 사람 프로필: 팔로우 버튼
                <FollowButton
                  userId={user.id}
                  isFollowing={isFollowing}
                  onToggle={handleFollowToggle}
                />
              )}
            </div>
          </div>

          {/* 통계 */}
          <div className="flex items-center gap-8 mb-4">
            <div className="flex items-center gap-1">
              <span className="font-semibold text-[#262626]">
                {stats.posts_count.toLocaleString()}
              </span>
              <span className="text-[#262626]">게시물</span>
            </div>
            <button
              type="button"
              className="flex items-center gap-1 hover:opacity-70 transition-opacity cursor-pointer"
              aria-label="팔로워"
            >
              <span className="font-semibold text-[#262626]">
                {stats.followers_count.toLocaleString()}
              </span>
              <span className="text-[#262626]">팔로워</span>
            </button>
            <button
              type="button"
              className="flex items-center gap-1 hover:opacity-70 transition-opacity cursor-pointer"
              aria-label="팔로잉"
            >
              <span className="font-semibold text-[#262626]">
                {stats.following_count.toLocaleString()}
              </span>
              <span className="text-[#262626]">팔로잉</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

