"use client";

import { useState, useEffect, useRef, KeyboardEvent, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  X,
  Heart,
  MessageSquare,
  Send,
  Bookmark,
  MoreVertical,
  User,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { PostWithUserAndStats, CommentWithUser } from "@/lib/types";
import { formatRelativeTime, cn } from "@/lib/utils";
import LikeButton, { LikeButtonRef } from "./LikeButton";
import CommentList from "@/components/comment/CommentList";
import CommentForm from "@/components/comment/CommentForm";

/**
 * @file PostModal.tsx
 * @description Instagram 스타일의 게시물 상세 모달
 *
 * 주요 기능:
 * - Desktop: 모달 형식 (이미지 50% + 댓글 50%)
 * - Mobile: 전체 페이지로 전환
 * - 댓글 전체 목록 표시
 * - 이전/다음 게시물 네비게이션 (Desktop)
 * - 키보드 네비게이션 (ESC, 화살표)
 *
 * @dependencies
 * - shadcn/ui Dialog
 * - LikeButton, CommentList, CommentForm
 */

interface PostModalProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previousPostId?: string | null;
  nextPostId?: string | null;
  isMobile?: boolean;
  onDelete?: (postId: string) => void;
  initialPost?: PostWithUserAndStats | null;
}

export default function PostModal({
  postId,
  open,
  onOpenChange,
  previousPostId,
  nextPostId,
  isMobile = false,
  onDelete,
  initialPost,
}: PostModalProps) {
  const router = useRouter();
  const { userId: clerkUserId } = useAuth();
  const [post, setPost] = useState<PostWithUserAndStats | null>(initialPost || null);
  const [comments, setComments] = useState<CommentWithUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [commentsCount, setCommentsCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const likeButtonRef = useRef<LikeButtonRef>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // 본인 게시물인지 확인
  const isOwnPost = post?.user.clerk_id === clerkUserId;

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMenuOpen]);

  // 게시물 삭제 핸들러
  const handleDelete = async () => {
    if (!isOwnPost || !post) return;

    const confirmed = window.confirm(
      "정말 이 게시물을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.",
    );

    if (!confirmed) return;

    setIsDeleting(true);

    try {
      const response = await fetch(`/api/posts/${post.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "게시물 삭제에 실패했습니다.");
      }

      // 성공 시 모달 닫기 및 부모 컴포넌트에 알림
      onOpenChange(false);
      if (onDelete) {
        onDelete(post.id);
      }
    } catch (error) {
      console.error("Error deleting post:", error);
      alert(
        error instanceof Error
          ? error.message
          : "게시물 삭제 중 오류가 발생했습니다.",
      );
    } finally {
      setIsDeleting(false);
      setIsMenuOpen(false);
    }
  };

  // 게시물 데이터 로드
  useEffect(() => {
    if (!open || !postId) return;

    // initialPost가 있으면 먼저 사용
    if (initialPost) {
      setPost(initialPost);
      setLikesCount(initialPost.likes_count);
      setIsLiked(initialPost.is_liked || false);
      setCommentsCount(initialPost.comments_count);
      setIsLoading(false);
      setError(null);
    }

    const loadPost = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/posts/${postId}`);
        if (!response.ok) {
          // initialPost가 있으면 에러를 표시하지 않고 기존 데이터 사용
          if (initialPost) {
            console.warn("Failed to reload post, using initial data");
            setIsLoading(false);
            return;
          }
          throw new Error("게시물을 불러올 수 없습니다.");
        }

        const data = await response.json();
        setPost(data.post);
        setLikesCount(data.post.likes_count);
        setIsLiked(data.post.is_liked || false);
        setCommentsCount(data.post.comments_count);
        setError(null);
      } catch (err) {
        console.error("Error loading post:", err);
        // initialPost가 있으면 에러를 표시하지 않고 기존 데이터 사용
        if (initialPost) {
          console.warn("Error loading post, using initial data");
          setIsLoading(false);
          return;
        }
        setError(
          err instanceof Error ? err.message : "게시물을 불러올 수 없습니다.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    // initialPost가 없을 때만 로드
    if (!initialPost) {
      loadPost();
    }
  }, [open, postId, initialPost]);

  // 댓글 전체 목록 로드
  useEffect(() => {
    if (!open || !postId) return;

    const loadComments = async () => {
      try {
        const response = await fetch(`/api/comments?postId=${postId}&limit=100`);
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments || []);
        }
      } catch (error) {
        console.error("Error loading comments:", error);
      }
    };

    loadComments();
  }, [open, postId]);

  // 키보드 네비게이션
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (isMobile) {
          router.back();
        } else {
          onOpenChange(false);
        }
      } else if (e.key === "ArrowLeft" && previousPostId) {
        if (isMobile) {
          router.push(`/posts/${previousPostId}`);
        } else {
          onOpenChange(false);
          router.push(`/posts/${previousPostId}`);
        }
      } else if (e.key === "ArrowRight" && nextPostId) {
        if (isMobile) {
          router.push(`/posts/${nextPostId}`);
        } else {
          onOpenChange(false);
          router.push(`/posts/${nextPostId}`);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown as any);
    return () => {
      window.removeEventListener("keydown", handleKeyDown as any);
    };
  }, [open, isMobile, previousPostId, nextPostId, onOpenChange, router]);

  // 이전/다음 게시물 네비게이션
  const handlePrevious = () => {
    if (previousPostId) {
      if (isMobile) {
        router.push(`/posts/${previousPostId}`);
      } else {
        // Desktop: 모달을 닫고 라우트로 이동 (PostCard에서 모달을 다시 열도록)
        onOpenChange(false);
        router.push(`/posts/${previousPostId}`);
      }
    }
  };

  const handleNext = () => {
    if (nextPostId) {
      if (isMobile) {
        router.push(`/posts/${nextPostId}`);
      } else {
        // Desktop: 모달을 닫고 라우트로 이동
        onOpenChange(false);
        router.push(`/posts/${nextPostId}`);
      }
    }
  };

  // 모바일 뒤로가기
  const handleBack = () => {
    router.back();
  };

  // 더블탭 좋아요 핸들러
  const handleDoubleTap = () => {
    if (isLiked) return;

    setShowDoubleTapHeart(true);
    setTimeout(() => setShowDoubleTapHeart(false), 1000);
    likeButtonRef.current?.triggerLike();
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

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-[#8e8e8e]">로딩 중...</p>
      </div>
    );
  }

  // 에러 상태 (initialPost가 없을 때만 에러 표시)
  if ((error || !post) && !initialPost) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <p className="text-red-600">{error || "게시물을 찾을 수 없습니다."}</p>
        {isMobile && (
          <button
            onClick={handleBack}
            className="px-4 py-2 bg-[#0095f6] text-white rounded-lg hover:bg-[#0095f6]/90"
          >
            뒤로가기
          </button>
        )}
      </div>
    );
  }

  // post가 없으면 로딩 상태로 표시
  if (!post) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-[#8e8e8e]">로딩 중...</p>
      </div>
    );
  }

  const relativeTime = formatRelativeTime(post.created_at);

  // Desktop 레이아웃
  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[900px] w-full p-0 gap-0 h-[90vh] overflow-hidden">
          <DialogTitle className="sr-only">게시물 상세</DialogTitle>
          <div className="flex h-full">
            {/* 좌측: 이미지 영역 (50%) */}
            <div className="relative w-1/2 bg-black flex items-center justify-center">
              {/* 이전/다음 네비게이션 버튼 */}
              {previousPostId && (
                <button
                  onClick={handlePrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                  aria-label="이전 게시물"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {nextPostId && (
                <button
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
                  aria-label="다음 게시물"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              {/* 이미지 */}
              <div
                className="relative w-full aspect-square"
                onDoubleClick={handleDoubleTap}
              >
                {!imageError ? (
                  <Image
                    src={post.image_url}
                    alt={post.caption || "게시물 이미지"}
                    fill
                    className="object-contain"
                    sizes="450px"
                    priority
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-white">
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
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 우측: 댓글 영역 (50%) */}
            <div className="w-1/2 flex flex-col bg-white">
              {/* 헤더 */}
              <header className="flex items-center justify-between px-4 py-3 border-b border-[#dbdbdb]">
                <div className="flex items-center gap-3">
                  <Link
                    href={`/profile/${post.user.id}`}
                    className="flex-shrink-0"
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
                {isOwnPost && (
                  <div className="relative" ref={menuRef}>
                    <button
                      type="button"
                      className="text-[#262626] hover:opacity-70"
                      aria-label="게시물 메뉴"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      disabled={isDeleting}
                    >
                      <MoreVertical className="w-6 h-6" />
                    </button>

                    {/* 드롭다운 메뉴 */}
                    {isMenuOpen && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#dbdbdb] rounded-lg shadow-lg z-50">
                        <button
                          type="button"
                          onClick={handleDelete}
                          disabled={isDeleting}
                          className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                          {isDeleting ? "삭제 중..." : "삭제"}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </header>

              {/* 스크롤 가능한 컨텐츠 영역 */}
              <div className="flex-1 overflow-y-auto">
                {/* 액션 버튼 */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#dbdbdb]">
                  <div className="flex items-center gap-4">
                    <LikeButton
                      ref={likeButtonRef}
                      postId={post.id}
                      initialIsLiked={isLiked}
                      initialLikesCount={likesCount}
                      onLikeChange={handleLikeChange}
                    />
                    <button
                      type="button"
                      className="text-[#262626] hover:opacity-70"
                      aria-label="댓글 달기"
                    >
                      <MessageSquare className="w-6 h-6" />
                    </button>
                    <button
                      type="button"
                      className="text-[#262626] hover:opacity-70"
                      aria-label="공유"
                      disabled
                    >
                      <Send className="w-6 h-6" />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="text-[#262626] hover:opacity-70"
                    aria-label="북마크"
                    disabled
                  >
                    <Bookmark className="w-6 h-6" />
                  </button>
                </div>

                {/* 좋아요 수 */}
                {likesCount > 0 && (
                  <div className="px-4 py-2">
                    <p className="font-semibold text-sm text-[#262626]">
                      좋아요 {likesCount.toLocaleString()}개
                    </p>
                  </div>
                )}

                {/* 캡션 */}
                {post.caption && (
                  <div className="px-4 py-2">
                    <div className="text-sm text-[#262626]">
                      <Link
                        href={`/profile/${post.user.id}`}
                        className="font-semibold hover:opacity-70"
                      >
                        {post.user.name}
                      </Link>
                      <span className="ml-2">{post.caption}</span>
                    </div>
                  </div>
                )}

                {/* 댓글 전체 목록 */}
                {comments.length > 0 && (
                  <div className="px-4 py-2">
                    <CommentList
                      postId={post.id}
                      initialComments={comments}
                      showAll={true}
                      currentClerkUserId={clerkUserId}
                      onCommentDeleted={handleCommentDeleted}
                    />
                  </div>
                )}
              </div>

              {/* 댓글 입력 폼 (하단 고정) */}
              <div className="border-t border-[#dbdbdb]">
                <CommentForm postId={post.id} onCommentAdded={handleCommentAdded} />
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Mobile 레이아웃 (전체 페이지)
  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* 헤더 */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#dbdbdb] bg-white">
        <button
          onClick={handleBack}
          className="text-[#262626] hover:opacity-70"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h2 className="font-semibold text-sm text-[#262626]">게시물</h2>
        <button
          onClick={handleBack}
          className="text-[#262626] hover:opacity-70"
          aria-label="닫기"
        >
          <X className="w-6 h-6" />
        </button>
      </header>

      {/* 스크롤 가능한 컨텐츠 */}
      <div className="flex-1 overflow-y-auto">
        {/* 게시물 헤더 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#dbdbdb]">
          <div className="flex items-center gap-3">
            <Link
              href={`/profile/${post.user.id}`}
              className="flex-shrink-0"
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
          {isOwnPost && (
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                className="text-[#262626] hover:opacity-70"
                aria-label="게시물 메뉴"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                disabled={isDeleting}
              >
                <MoreVertical className="w-6 h-6" />
              </button>

              {/* 드롭다운 메뉴 */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-[#dbdbdb] rounded-lg shadow-lg z-50">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? "삭제 중..." : "삭제"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 이미지 */}
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
              sizes="100vw"
              priority
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
              />
            </div>
          )}
        </div>

        {/* 액션 버튼 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#dbdbdb]">
          <div className="flex items-center gap-4">
            <LikeButton
              ref={likeButtonRef}
              postId={post.id}
              initialIsLiked={isLiked}
              initialLikesCount={likesCount}
              onLikeChange={handleLikeChange}
            />
            <button
              type="button"
              className="text-[#262626] hover:opacity-70"
              aria-label="댓글 달기"
            >
              <MessageSquare className="w-6 h-6" />
            </button>
            <button
              type="button"
              className="text-[#262626] hover:opacity-70"
              aria-label="공유"
              disabled
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
          <button
            type="button"
            className="text-[#262626] hover:opacity-70"
            aria-label="북마크"
            disabled
          >
            <Bookmark className="w-6 h-6" />
          </button>
        </div>

        {/* 좋아요 수 */}
        {likesCount > 0 && (
          <div className="px-4 py-2">
            <p className="font-semibold text-sm text-[#262626]">
              좋아요 {likesCount.toLocaleString()}개
            </p>
          </div>
        )}

        {/* 캡션 */}
        {post.caption && (
          <div className="px-4 py-2">
            <div className="text-sm text-[#262626]">
              <Link
                href={`/profile/${post.user.id}`}
                className="font-semibold hover:opacity-70"
              >
                {post.user.name}
              </Link>
              <span className="ml-2">{post.caption}</span>
            </div>
          </div>
        )}

        {/* 댓글 전체 목록 */}
        {comments.length > 0 && (
          <div className="px-4 py-2">
            <CommentList
              postId={post.id}
              initialComments={comments}
              showAll={true}
              currentClerkUserId={clerkUserId}
              onCommentDeleted={handleCommentDeleted}
            />
          </div>
        )}
      </div>

      {/* 댓글 입력 폼 (하단 고정) */}
      <div className="border-t border-[#dbdbdb] bg-white">
        <CommentForm postId={post.id} onCommentAdded={handleCommentAdded} />
      </div>
    </div>
  );
}

