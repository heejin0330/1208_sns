"use client";

import { useState, useRef, forwardRef, useImperativeHandle } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * @file LikeButton.tsx
 * @description Instagram 스타일의 좋아요 버튼 컴포넌트
 *
 * 주요 기능:
 * - 낙관적 UI 업데이트
 * - 클릭 애니메이션 (scale 1.3 → 1)
 * - 에러 시 롤백
 * - 더블탭 좋아요를 위한 ref 노출
 */

interface LikeButtonProps {
  postId: string;
  initialIsLiked: boolean;
  initialLikesCount: number;
  onLikeChange?: (isLiked: boolean, likesCount: number) => void;
}

export interface LikeButtonRef {
  handleLike: () => void;
}

const LikeButton = forwardRef<LikeButtonRef, LikeButtonProps>(
  ({ postId, initialIsLiked, initialLikesCount, onLikeChange }, ref) => {
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likesCount, setLikesCount] = useState(initialLikesCount);
    const [isAnimating, setIsAnimating] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // 이전 상태 저장 (롤백용)
    const previousStateRef = useRef({
      isLiked: initialIsLiked,
      likesCount: initialLikesCount,
    });

    const handleLike = async () => {
      // 이미 처리 중이면 무시
      if (isProcessing) return;

      setIsProcessing(true);

      // 현재 상태 저장 (롤백용)
      previousStateRef.current = { isLiked, likesCount };

      // 낙관적 UI 업데이트
      const newIsLiked = !isLiked;
      const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;

      setIsLiked(newIsLiked);
      setLikesCount(newLikesCount);
      setIsAnimating(true);

      // 애니메이션 종료
      setTimeout(() => setIsAnimating(false), 150);

      // 부모 컴포넌트에 변경 알림
      onLikeChange?.(newIsLiked, newLikesCount);

      try {
        const method = newIsLiked ? "POST" : "DELETE";
        const response = await fetch("/api/likes", {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ post_id: postId }),
        });

        if (!response.ok) {
          throw new Error("Failed to update like");
        }
      } catch (error) {
        console.error("Error updating like:", error);

        // 에러 시 롤백
        setIsLiked(previousStateRef.current.isLiked);
        setLikesCount(previousStateRef.current.likesCount);
        onLikeChange?.(
          previousStateRef.current.isLiked,
          previousStateRef.current.likesCount,
        );
      } finally {
        setIsProcessing(false);
      }
    };

    // ref를 통해 외부에서 handleLike 호출 가능 (더블탭용)
    useImperativeHandle(ref, () => ({
      handleLike,
    }));

    return (
      <button
        type="button"
        className={cn(
          "transition-all",
          isAnimating && "scale-[1.3]",
          isLiked ? "text-[#ed4956]" : "text-[#262626] hover:opacity-70",
        )}
        style={{
          transitionDuration: isAnimating ? "150ms" : "200ms",
          transitionTimingFunction: "ease-out",
        }}
        aria-label={isLiked ? "좋아요 취소" : "좋아요"}
        onClick={handleLike}
        disabled={isProcessing}
      >
        <Heart className={cn("w-6 h-6", isLiked && "fill-current")} />
      </button>
    );
  },
);

LikeButton.displayName = "LikeButton";

export default LikeButton;

