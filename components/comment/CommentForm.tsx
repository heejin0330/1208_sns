"use client";

import { useState, KeyboardEvent, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { CommentWithUser } from "@/lib/types";

/**
 * @file CommentForm.tsx
 * @description Instagram 스타일의 댓글 입력 폼 컴포넌트
 *
 * 주요 기능:
 * - 댓글 입력 및 제출
 * - Enter 키 또는 "게시" 버튼으로 제출
 * - 낙관적 UI 업데이트
 * - 에러 처리 및 롤백
 *
 * @dependencies
 * - @clerk/nextjs: 인증
 */

interface CommentFormProps {
  postId: string;
  onCommentAdded?: (comment: CommentWithUser) => void;
}

export default function CommentForm({
  postId,
  onCommentAdded,
}: CommentFormProps) {
  const { userId } = useAuth();
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 댓글 제출
  const handleSubmit = useCallback(async () => {
    if (!content.trim() || isSubmitting) return;

    if (!userId) {
      setError("로그인이 필요합니다.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          post_id: postId,
          content: content.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "댓글 작성에 실패했습니다.");
      }

      const data = await response.json();
      const newComment: CommentWithUser = data.comment;

      // 입력 필드 초기화
      setContent("");

      // 부모 컴포넌트에 알림
      onCommentAdded?.(newComment);
    } catch (err) {
      console.error("Error submitting comment:", err);
      setError(
        err instanceof Error ? err.message : "댓글 작성에 실패했습니다.",
      );
      // 에러 시 입력 내용 복원하지 않음 (사용자가 다시 입력하도록)
    } finally {
      setIsSubmitting(false);
    }
  }, [content, isSubmitting, userId, postId, onCommentAdded]);

  // Enter 키 처리
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="border-t border-[#dbdbdb] px-4 py-3">
      {error && (
        <div className="mb-2 text-xs text-red-600">{error}</div>
      )}

      <div className="flex items-center gap-2">
        <textarea
          placeholder="댓글 달기..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 resize-none border-none outline-none text-sm text-[#262626] placeholder:text-[#8e8e8e] bg-transparent"
          rows={1}
          disabled={isSubmitting}
          style={{
            minHeight: "20px",
            maxHeight: "80px",
          }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className={`
            text-sm font-semibold
            ${content.trim() && !isSubmitting
              ? "text-[#0095f6] hover:text-[#0095f6]/80"
              : "text-[#b2dffc] cursor-not-allowed"
            }
            transition-colors
          `}
        >
          {isSubmitting ? "게시 중..." : "게시"}
        </button>
      </div>
    </div>
  );
}

