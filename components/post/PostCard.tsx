"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  Heart,
  MessageSquare,
  Send,
  Bookmark,
  MoreVertical,
  User,
} from "lucide-react";
import { PostWithUserAndStats, CommentWithUser } from "@/lib/types";
import { formatRelativeTime, cn } from "@/lib/utils";
import LikeButton, { LikeButtonRef } from "./LikeButton";
import CommentList from "@/components/comment/CommentList";
import CommentForm from "@/components/comment/CommentForm";

/**
 * @file PostCard.tsx
 * @description Instagram 스타일의 게시물 카드 컴포넌트
 *
 * 구성 요소:
 * - 헤더: 프로필 이미지, 사용자명, 시간, 메뉴 버튼
 * - 이미지: 1:1 정사각형 이미지
 * - 액션 버튼: 좋아요, 댓글, 공유(UI만), 북마크(UI만)
 * - 좋아요 수
 * - 캡션: 사용자명 + 내용 (2줄 초과 시 확장/축소)
 * - 댓글 미리보기: 최신 2개 (현재는 UI만)
 *
 * @dependencies
 * - lucide-react: 아이콘
 * - next/image: 이미지 최적화
 */

interface PostCardProps {
  post: PostWithUserAndStats;
}

export default function PostCard({ post }: PostCardProps) {
  const { userId: clerkUserId } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [isLiked, setIsLiked] = useState(post.is_liked || false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);

  const likeButtonRef = useRef<LikeButtonRef>(null);

  // 초기 댓글 로드
  useEffect(() => {
    const loadComments = async () => {
      try {
        const response = await fetch(`/api/comments?postId=${post.id}&limit=2`);
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
        }
      } catch (error) {
        console.error("Error loading comments:", error);
      }
    };

    loadComments();
  }, [post.id]);

  // 캡션이 2줄을 초과하는지 확인 (대략 100자 기준)
  const shouldShowMore = post.caption && post.caption.length > 100;
  const displayCaption =
    !isExpanded && shouldShowMore
      ? post.caption?.slice(0, 100) + "..."
      : post.caption;

  const relativeTime = formatRelativeTime(post.created_at);

  // 더블탭 좋아요 핸들러
  const handleDoubleTap = () => {
    // 이미 좋아요 상태면 아무 동작 안 함
    if (isLiked) return;

    // 큰 하트 애니메이션 표시
    setShowDoubleTapHeart(true);
    setTimeout(() => setShowDoubleTapHeart(false), 1000);

    // LikeButton의 handleLike 호출
    likeButtonRef.current?.handleLike();
  };

  // 좋아요 상태 변경 핸들러
  const handleLikeChange = (newIsLiked: boolean, newLikesCount: number) => {
    setIsLiked(newIsLiked);
    setLikesCount(newLikesCount);
  };

  // 댓글 추가 핸들러
  const handleCommentAdded = (newComment: CommentWithUser) => {
    setComments((prev) => [newComment, ...prev]);
    setCommentsCount((prev) => prev + 1);
  };

  // 댓글 삭제 핸들러
  const handleCommentDeleted = (commentId: string) => {
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setCommentsCount((prev) => Math.max(0, prev - 1));
  };

  return (
    <article className="bg-white border border-[#dbdbdb] rounded-lg mb-4">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3">
          {/* 프로필 이미지 */}
          <Link
            href={`/profile/${post.user.id}`}
            className="flex-shrink-0"
            aria-label={`${post.user.name}의 프로필 보기`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
          </Link>

          <div className="flex flex-col">
            <Link
              href={`/profile/${post.user.id}`}
              className="font-semibold text-sm text-[#262626] hover:opacity-70"
            >
              {post.user.name}
            </Link>
            <span className="text-xs text-[#8e8e8e]">{relativeTime}</span>
          </div>
        </div>

        {/* 메뉴 버튼 */}
        <button
          type="button"
          className="text-[#262626] hover:opacity-70 transition-opacity"
          aria-label="게시물 메뉴"
          onClick={() => {
            // 메뉴 기능은 10단계에서 구현 예정
            console.log("게시물 메뉴 열기");
          }}
        >
          <MoreVertical className="w-6 h-6" />
        </button>
      </header>

      {/* 이미지 영역 (1:1 정사각형) */}
      <div
        className="relative w-full aspect-square bg-gray-100"
        onDoubleClick={handleDoubleTap}
      >
        {!imageError ? (
          <Image
            src={post.image_url}
            alt={post.caption || "게시물 이미지"}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 630px"
            priority={false}
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex items-center justify-center w-full h-full text-[#8e8e8e]">
            <p>이미지를 불러올 수 없습니다</p>
          </div>
        )}

        {/* 더블탭 하트 애니메이션 */}
        {showDoubleTapHeart && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <Heart
              className={cn(
                "w-24 h-24 text-white fill-current drop-shadow-lg",
                "animate-[scale-fade_1s_ease-out]",
              )}
              style={{
                animation: "scale-fade 1s ease-out forwards",
              }}
            />
          </div>
        )}
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          {/* 좋아요 버튼 */}
          <LikeButton
            ref={likeButtonRef}
            postId={post.id}
            initialIsLiked={isLiked}
            initialLikesCount={likesCount}
            onLikeChange={handleLikeChange}
          />

          {/* 댓글 버튼 */}
          <button
            type="button"
            className="text-[#262626] hover:opacity-70 transition-opacity"
            aria-label="댓글 달기"
            onClick={() => {
              // 댓글 기능은 6단계에서 구현 예정
              console.log("댓글 버튼 클릭");
            }}
          >
            <MessageSquare className="w-6 h-6" />
          </button>

          {/* 공유 버튼 (1차 제외, UI만) */}
          <button
            type="button"
            className="text-[#262626] hover:opacity-70 transition-opacity"
            aria-label="공유"
            disabled
          >
            <Send className="w-6 h-6" />
          </button>
        </div>

        {/* 북마크 버튼 (1차 제외, UI만) */}
        <button
          type="button"
          className="text-[#262626] hover:opacity-70 transition-opacity"
          aria-label="북마크"
          disabled
        >
          <Bookmark className="w-6 h-6" />
        </button>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="px-4 pb-4">
        {/* 좋아요 수 */}
        {likesCount > 0 && (
          <p className="font-semibold text-sm text-[#262626] mb-2">
            좋아요 {likesCount.toLocaleString()}개
          </p>
        )}

        {/* 캡션 */}
        {post.caption && (
          <div className="text-sm text-[#262626] mb-2">
            <Link
              href={`/profile/${post.user.id}`}
              className="font-semibold hover:opacity-70"
            >
              {post.user.name}
            </Link>
            <span className="ml-2">{displayCaption}</span>
            {shouldShowMore && !isExpanded && (
              <button
                type="button"
                className="text-[#8e8e8e] ml-1 hover:opacity-70"
                onClick={() => setIsExpanded(true)}
              >
                더 보기
              </button>
            )}
          </div>
        )}

        {/* 댓글 목록 (최신 2개) */}
        {comments.length > 0 && (
          <div className="mb-2">
            <CommentList
              postId={post.id}
              initialComments={comments}
              maxDisplay={2}
              showAll={false}
              currentClerkUserId={clerkUserId}
              onCommentDeleted={handleCommentDeleted}
            />
          </div>
        )}

        {/* 댓글 모두 보기 버튼 */}
        {commentsCount > 2 && (
          <button
            type="button"
            className="text-sm text-[#8e8e8e] hover:opacity-70 mb-2"
            onClick={() => {
              // 댓글 모달 열기 (7단계에서 구현 예정)
              console.log("댓글 모두 보기");
            }}
          >
            댓글 {commentsCount}개 모두 보기
          </button>
        )}
      </div>

      {/* 댓글 입력 폼 */}
      <CommentForm postId={post.id} onCommentAdded={handleCommentAdded} />
    </article>
  );
}
