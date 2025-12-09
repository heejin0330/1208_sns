"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Heart, MessageSquare } from "lucide-react";
import { PostWithUserAndStats } from "@/lib/types";
import { cn } from "@/lib/utils";
import PostModal from "@/components/post/PostModal";

/**
 * @file PostGrid.tsx
 * @description Instagram 스타일의 게시물 그리드 컴포넌트
 *
 * 주요 기능:
 * - 3열 그리드 레이아웃 (반응형)
 * - 게시물 썸네일 표시
 * - Hover 시 좋아요/댓글 수 오버레이
 * - 클릭 시 PostModal 열기 (Desktop) 또는 라우트 이동 (Mobile)
 *
 * @dependencies
 * - next/image: 이미지 최적화
 * - PostModal: 게시물 상세 모달
 */

interface PostGridProps {
  posts: PostWithUserAndStats[];
}

export default function PostGrid({ posts }: PostGridProps) {
  const router = useRouter();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);

  // 게시물 클릭 핸들러
  const handlePostClick = (postId: string, _index: number) => {
    if (window.innerWidth >= 768) {
      // Desktop: 모달 열기
      setSelectedPostId(postId);
    } else {
      // Mobile: 라우트 이동
      router.push(`/posts/${postId}`);
    }
  };

  // 이전/다음 게시물 ID 계산
  const getPreviousPostId = (currentIndex: number): string | null => {
    return currentIndex > 0 ? posts[currentIndex - 1].id : null;
  };

  const getNextPostId = (currentIndex: number): string | null => {
    return currentIndex < posts.length - 1
      ? posts[currentIndex + 1].id
      : null;
  };

  // 선택된 게시물의 인덱스 찾기
  const selectedPostIndex = selectedPostId
    ? posts.findIndex((p) => p.id === selectedPostId)
    : -1;

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="w-16 h-16 rounded-full border-2 border-[#262626] flex items-center justify-center mb-4">
          <svg
            className="w-8 h-8 text-[#262626]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <p className="text-xl font-light text-[#262626] mb-2">게시물 없음</p>
        <p className="text-sm text-[#8e8e8e]">
          아직 게시물이 없습니다. 첫 번째 게시물을 작성해보세요!
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-[2px]">
        {posts.map((post, index) => (
          <div
            key={post.id}
            className="relative aspect-square bg-gray-100 cursor-pointer group"
            onClick={() => handlePostClick(post.id, index)}
            onMouseEnter={() => setHoveredPostId(post.id)}
            onMouseLeave={() => setHoveredPostId(null)}
            role="button"
            tabIndex={0}
            aria-label={`${post.user.name}의 게시물 보기`}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handlePostClick(post.id, index);
              }
            }}
          >
            <Image
              src={post.image_url}
              alt={post.caption || "게시물"}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 33vw, (max-width: 1024px) 50vw, 33vw"
              {...(index < 6 ? { priority: true } : { loading: "lazy" })}
            />

            {/* Hover 오버레이 (Desktop만) */}
            {hoveredPostId === post.id && (
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-6 text-white md:flex hidden">
                <div className="flex items-center gap-2">
                  <Heart className="w-6 h-6 fill-current" />
                  <span className="font-semibold">
                    {post.likes_count.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-6 h-6 fill-current" />
                  <span className="font-semibold">
                    {post.comments_count.toLocaleString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* PostModal (Desktop) */}
      {selectedPostId && selectedPostIndex >= 0 && (
        <PostModal
          postId={selectedPostId}
          open={true}
          onOpenChange={(open) => {
            if (!open) setSelectedPostId(null);
          }}
          previousPostId={getPreviousPostId(selectedPostIndex)}
          nextPostId={getNextPostId(selectedPostIndex)}
          isMobile={false}
          initialPost={posts[selectedPostIndex]}
        />
      )}
    </>
  );
}

