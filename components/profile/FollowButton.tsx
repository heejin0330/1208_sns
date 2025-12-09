"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * @file FollowButton.tsx
 * @description Instagram 스타일의 팔로우 버튼 컴포넌트
 *
 * 주요 기능:
 * - 낙관적 UI 업데이트
 * - 팔로우/언팔로우 상태 전환
 * - 에러 시 롤백
 * - Hover 시 "언팔로우" 텍스트 표시
 */

interface FollowButtonProps {
  userId: string;
  isFollowing: boolean;
  onToggle?: (newState: boolean) => void;
}

export default function FollowButton({
  userId,
  isFollowing: initialIsFollowing,
  onToggle,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleToggle = async () => {
    // 이미 처리 중이면 무시
    if (isLoading) return;

    const newState = !isFollowing;
    const previousState = isFollowing;

    // 낙관적 UI 업데이트
    setIsFollowing(newState);
    setIsLoading(true);

    try {
      const url = "/api/follows";
      const method = newState ? "POST" : "DELETE";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ following_id: userId }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "팔로우 처리에 실패했습니다.");
      }

      // 성공 시 콜백 호출
      if (onToggle) {
        onToggle(newState);
      }
    } catch (error) {
      // 에러 발생 시 롤백
      setIsFollowing(previousState);
      console.error("Error toggling follow:", error);

      // 사용자에게 에러 메시지 표시 (선택적)
      if (error instanceof Error) {
        alert(error.message);
      } else {
        alert("팔로우 처리 중 오류가 발생했습니다.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={isLoading}
      className={cn(
        "px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        isFollowing
          ? isHovered
            ? "border border-red-500 text-red-500 hover:bg-red-50"
            : "border border-[#dbdbdb] text-[#262626] hover:bg-gray-50"
          : "bg-[#0095f6] text-white hover:bg-[#0095f6]/90",
      )}
      aria-label={isFollowing ? "언팔로우" : "팔로우"}
      aria-busy={isLoading}
      aria-disabled={isLoading}
    >
      {isLoading
        ? "처리 중..."
        : isFollowing
          ? isHovered
            ? "언팔로우"
            : "팔로잉"
          : "팔로우"}
    </button>
  );
}

