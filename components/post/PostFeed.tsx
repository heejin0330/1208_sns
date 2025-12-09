"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PostCard from "./PostCard";
import PostCardSkeleton from "./PostCardSkeleton";
import ErrorDisplay from "@/components/ui/ErrorDisplay";
import { PostWithUserAndStats, PostsResponse } from "@/lib/types";
import { isNetworkError } from "@/lib/api-utils";

/**
 * @file PostFeed.tsx
 * @description 게시물 피드 컴포넌트
 *
 * 주요 기능:
 * - 게시물 목록 렌더링
 * - 무한 스크롤 (Intersection Observer)
 * - 페이지네이션 (10개씩)
 * - 로딩 상태 관리
 * - 에러 처리
 *
 * @dependencies
 * - Intersection Observer API: 무한 스크롤
 */

interface PostFeedProps {
  initialPosts: PostWithUserAndStats[];
  initialHasMore: boolean;
  initialOffset: number;
  userId?: string;
  onPostDelete?: (postId: string) => void;
}

export default function PostFeed({
  initialPosts,
  initialHasMore,
  initialOffset,
  userId,
  onPostDelete,
}: PostFeedProps) {
  const [posts, setPosts] = useState<PostWithUserAndStats[]>(initialPosts);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [offset, setOffset] = useState(initialOffset);
  const [error, setError] = useState<string | null>(null);

  // Intersection Observer를 위한 ref
  const observerTarget = useRef<HTMLDivElement>(null);

  // 추가 게시물 로드 함수
  const loadMorePosts = useCallback(async () => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: "10",
        offset: offset.toString(),
      });

      if (userId) {
        params.append("userId", userId);
      }

      const response = await fetch(`/api/posts?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error || "게시물을 불러오는데 실패했습니다";
        throw new Error(errorMessage);
      }

      const data: PostsResponse = await response.json();

      setPosts((prev) => [...prev, ...data.posts]);
      setHasMore(data.has_more);
      setOffset(data.next_offset || offset);
    } catch (err) {
      console.error("Error loading posts:", err);
      let errorMessage = "게시물을 불러오는데 실패했습니다";

      if (err instanceof Error) {
        if (isNetworkError(err)) {
          errorMessage = "네트워크 연결을 확인해주세요";
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, hasMore, offset, userId]);

  // Intersection Observer 설정
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        // 요소가 화면에 보이고, 더 불러올 데이터가 있으면 로드
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMorePosts();
        }
      },
      {
        threshold: 0.1, // 10%만 보여도 트리거
        rootMargin: "100px", // 100px 전에 미리 로드
      },
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, isLoading, loadMorePosts]);

  // 게시물 삭제 핸들러
  const handlePostDelete = useCallback(
    (postId: string) => {
      setPosts((prev) => prev.filter((post) => post.id !== postId));
      // 부모 컴포넌트에도 알림
      if (onPostDelete) {
        onPostDelete(postId);
      }
    },
    [onPostDelete],
  );

  return (
    <div className="w-full">
      {/* 게시물 목록 */}
      {posts.length > 0 ? (
        <>
          {posts.map((post, index) => {
            const previousPost = index > 0 ? posts[index - 1] : null;
            const nextPost = index < posts.length - 1 ? posts[index + 1] : null;

            return (
              <PostCard
                key={post.id}
                post={post}
                previousPostId={previousPost?.id || null}
                nextPostId={nextPost?.id || null}
                onDelete={handlePostDelete}
              />
            );
          })}

          {/* 로딩 상태 */}
          {isLoading && (
            <>
              <PostCardSkeleton />
              <PostCardSkeleton />
            </>
          )}

          {/* Intersection Observer 타겟 */}
          {hasMore && !isLoading && (
            <div
              ref={observerTarget}
              className="h-10 flex items-center justify-center"
            >
              <span className="text-[#8e8e8e] text-sm">더 불러오는 중...</span>
            </div>
          )}

          {/* 더 이상 게시물이 없을 때 */}
          {!hasMore && posts.length > 0 && (
            <div className="text-center py-8">
              <p className="text-[#8e8e8e] text-sm">
                모든 게시물을 불러왔습니다
              </p>
            </div>
          )}
        </>
      ) : (
        /* 게시물이 없을 때 */
        <div className="text-center py-12">
          <p className="text-[#8e8e8e] text-lg mb-2">게시물이 없습니다</p>
          <p className="text-[#8e8e8e] text-sm">
            첫 번째 게시물을 작성해보세요!
          </p>
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <ErrorDisplay
          message={error}
          onRetry={() => {
            setError(null);
            loadMorePosts();
          }}
          variant="compact"
          className="mb-4"
        />
      )}
    </div>
  );
}
