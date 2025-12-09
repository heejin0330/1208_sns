"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Heart,
  MessageSquare,
  Send,
  Bookmark,
  MoreVertical,
  User,
} from "lucide-react";
import { PostWithUserAndStats } from "@/lib/types";
import { formatRelativeTime, cn } from "@/lib/utils";

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // 캡션이 2줄을 초과하는지 확인 (대략 100자 기준)
  const shouldShowMore = post.caption && post.caption.length > 100;
  const displayCaption =
    !isExpanded && shouldShowMore
      ? post.caption?.slice(0, 100) + "..."
      : post.caption;

  const relativeTime = formatRelativeTime(post.created_at);

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
      <div className="relative w-full aspect-square bg-gray-100">
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
      </div>

      {/* 액션 버튼 */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          {/* 좋아요 버튼 */}
          <button
            type="button"
            className={cn(
              "transition-colors",
              post.is_liked ? "text-[#ed4956]" : "text-[#262626]",
            )}
            aria-label={post.is_liked ? "좋아요 취소" : "좋아요"}
            onClick={() => {
              // 좋아요 기능은 4단계에서 구현 예정
              console.log("좋아요 버튼 클릭");
            }}
          >
            <Heart className={cn("w-6 h-6", post.is_liked && "fill-current")} />
          </button>

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
        {post.likes_count > 0 && (
          <p className="font-semibold text-sm text-[#262626] mb-2">
            좋아요 {post.likes_count.toLocaleString()}개
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

        {/* 댓글 미리보기 (현재는 댓글 수만 표시) */}
        {post.comments_count > 0 && (
          <button
            type="button"
            className="text-sm text-[#8e8e8e] hover:opacity-70"
            onClick={() => {
              // 댓글 모달 열기 (7단계에서 구현 예정)
              console.log("댓글 모두 보기");
            }}
          >
            댓글 {post.comments_count}개 모두 보기
          </button>
        )}
      </div>
    </article>
  );
}
