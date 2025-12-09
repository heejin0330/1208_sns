"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trash2, User, Heart } from "lucide-react";
import { CommentWithUser } from "@/lib/types";
import { formatRelativeTime, cn } from "@/lib/utils";

/**
 * @file CommentList.tsx
 * @description Instagram 스타일의 댓글 목록 컴포넌트
 *
 * 주요 기능:
 * - 댓글 목록 렌더링 (시간 역순 정렬)
 * - 최신 N개만 표시 (PostCard용)
 * - 전체 댓글 표시 (모달용)
 * - 삭제 버튼 (본인 댓글만)
 * - 낙관적 업데이트
 *
 * @dependencies
 * - lucide-react: 아이콘
 * - formatRelativeTime: 상대 시간 표시
 */

interface CommentListProps {
  postId: string;
  initialComments: CommentWithUser[];
  maxDisplay?: number;
  showAll?: boolean;
  currentClerkUserId?: string;
  onCommentDeleted?: (commentId: string) => void;
  onCommentAdded?: (comment: CommentWithUser) => void;
}

export default function CommentList({
  postId,
  initialComments,
  maxDisplay = 2,
  showAll = false,
  currentClerkUserId,
  onCommentDeleted,
  onCommentAdded,
}: CommentListProps) {
  const [comments, setComments] = useState<CommentWithUser[]>(
    initialComments.sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    ),
  );
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [likingComments, setLikingComments] = useState<Set<string>>(new Set());

  // initialComments가 변경되면 상태 업데이트
  useEffect(() => {
    const sorted = [...initialComments].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    setComments(sorted);
  }, [initialComments]);

  // 댓글 좋아요 토글 핸들러
  const handleLikeToggle = async (commentId: string) => {
    if (likingComments.has(commentId)) return;

    const comment = comments.find((c) => c.id === commentId);
    if (!comment) return;

    const isLiked = comment.is_liked || false;
    const previousLikesCount = comment.likes_count || 0;

    // 낙관적 업데이트
    setLikingComments((prev) => new Set(prev).add(commentId));
    setComments((prev) =>
      prev.map((c) =>
        c.id === commentId
          ? {
              ...c,
              is_liked: !isLiked,
              likes_count: isLiked
                ? Math.max(0, previousLikesCount - 1)
                : previousLikesCount + 1,
            }
          : c,
      ),
    );

    try {
      const response = await fetch("/api/comment-likes", {
        method: isLiked ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: commentId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "좋아요 처리에 실패했습니다.");
      }
    } catch (error) {
      console.error("Error toggling comment like:", error);
      // 에러 시 롤백
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                is_liked: isLiked,
                likes_count: previousLikesCount,
              }
            : c,
        ),
      );
    } finally {
      setLikingComments((prev) => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    }
  };

  // 댓글 삭제 핸들러
  const handleDelete = async (commentId: string) => {
    if (isDeleting) return;

    setIsDeleting(commentId);

    // 낙관적 업데이트
    const previousComments = [...comments];
    setComments((prev) => prev.filter((c) => c.id !== commentId));

    try {
      const response = await fetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: commentId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "댓글 삭제에 실패했습니다.");
      }

      // 성공: 부모 컴포넌트에 알림
      onCommentDeleted?.(commentId);
    } catch (error) {
      console.error("Error deleting comment:", error);
      // 에러 시 롤백
      setComments(previousComments);
    } finally {
      setIsDeleting(null);
    }
  };

  // 표시할 댓글 목록
  const displayComments = showAll
    ? comments
    : comments.slice(0, maxDisplay);

  if (displayComments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-1">
      {displayComments.map((comment) => {
        const isOwner = currentClerkUserId === comment.user.clerk_id;
        const relativeTime = formatRelativeTime(comment.created_at);

        return (
          <div key={comment.id} className="flex items-start gap-2 group">
            {/* 프로필 이미지 */}
            <Link
              href={`/profile/${comment.user.id}`}
              className="flex-shrink-0 mt-1"
              aria-label={`${comment.user.name}의 프로필 보기`}
            >
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </Link>

            {/* 댓글 내용 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <div className="flex-1">
                  <Link
                    href={`/profile/${comment.user.id}`}
                    className="font-semibold text-sm text-[#262626] hover:opacity-70 inline-block mr-2"
                  >
                    {comment.user.name}
                  </Link>
                  <span className="text-sm text-[#262626]">
                    {comment.content}
                  </span>
                </div>

                {/* 삭제 버튼 (본인 댓글만) */}
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => handleDelete(comment.id)}
                    disabled={isDeleting === comment.id}
                    className={cn(
                      "flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
                      "text-[#8e8e8e] hover:text-[#ed4956]",
                      isDeleting === comment.id && "opacity-50 cursor-not-allowed",
                    )}
                    aria-label="댓글 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* 시간 및 좋아요 */}
              <div className="mt-1 flex items-center gap-3">
                <span className="text-xs text-[#8e8e8e]">{relativeTime}</span>
                {(comment.likes_count || 0) > 0 && (
                  <span className="text-xs font-semibold text-[#262626]">
                    좋아요 {comment.likes_count}개
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleLikeToggle(comment.id)}
                  disabled={likingComments.has(comment.id)}
                  className={cn(
                    "text-xs font-semibold transition-colors",
                    comment.is_liked
                      ? "text-[#ed4956]"
                      : "text-[#8e8e8e] hover:text-[#262626]",
                    likingComments.has(comment.id) && "opacity-50 cursor-not-allowed",
                  )}
                >
                  좋아요
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

