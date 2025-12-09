"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import PostModal from "@/components/post/PostModal";

/**
 * @file page.tsx
 * @description 게시물 상세 페이지 (Mobile 전용)
 *
 * Mobile에서 게시물 이미지 클릭 시 전체 페이지로 표시
 * Desktop에서는 모달로 표시되므로 이 페이지는 Mobile에서만 사용
 *
 * @dependencies
 * - PostModal: 게시물 상세 모달 컴포넌트
 */

interface PostPageProps {
  params: Promise<{ postId: string }>;
}

export default function PostPage({ params }: PostPageProps) {
  const router = useRouter();
  const [postId, setPostId] = useState<string | null>(null);

  useEffect(() => {
    params.then(({ postId }) => {
      if (!postId) {
        router.push("/");
      } else {
        setPostId(postId);
      }
    });
  }, [params, router]);

  if (!postId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-[#8e8e8e]">로딩 중...</p>
      </div>
    );
  }

  return (
    <PostModal
      postId={postId}
      open={true}
      onOpenChange={() => router.back()}
      isMobile={true}
    />
  );
}

