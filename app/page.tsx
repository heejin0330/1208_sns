import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import PostFeed from "@/components/post/PostFeed";
import { PostWithUserAndStats } from "@/lib/types";

/**
 * @file page.tsx
 * @description 홈 피드 페이지
 *
 * Server Component로 초기 게시물 데이터를 로드하고
 * PostFeed 컴포넌트에 전달합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: 인증
 * - @/lib/supabase/server: Supabase 클라이언트
 */

export default async function HomePage() {
  // Clerk 인증 확인
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  // Supabase 클라이언트 생성
  const supabase = await createClient();

  // 현재 사용자의 Supabase user_id 가져오기
  const { data: currentUser, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  if (userError || !currentUser) {
    console.error("Error fetching current user:", userError);
    return (
      <div className="text-center py-12">
        <p className="text-red-600">사용자 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const currentUserId = currentUser.id;

  // 초기 게시물 데이터 로드 (첫 10개)
  const limit = 10;
  const offset = 0;

  const {
    data: postsData,
    error: postsError,
    count,
  } = await supabase
    .from("posts")
    .select(
      `
      id,
      user_id,
      image_url,
      caption,
      created_at,
      updated_at,
      users!inner (
        id,
        clerk_id,
        name,
        created_at
      ),
      likes (id),
      comments (id)
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (postsError) {
    console.error("Error fetching posts:", postsError);
    return (
      <div className="text-center py-12">
        <p className="text-red-600">게시물을 불러올 수 없습니다.</p>
      </div>
    );
  }

  // 각 게시물에 대한 좋아요 여부 확인
  const postIds = postsData?.map((post) => post.id) || [];
  const { data: userLikes } = await supabase
    .from("likes")
    .select("post_id")
    .eq("user_id", currentUserId)
    .in("post_id", postIds);

  const likedPostIds = new Set(userLikes?.map((like) => like.post_id) || []);

  // 데이터 변환
  const posts: PostWithUserAndStats[] = (postsData || []).map((post: any) => {
    const likesCount = post.likes?.length || 0;
    const commentsCount = post.comments?.length || 0;
    const isLiked = likedPostIds.has(post.id);

    return {
      id: post.id,
      user_id: post.user_id,
      image_url: post.image_url,
      caption: post.caption,
      created_at: post.created_at,
      updated_at: post.updated_at,
      user: {
        id: post.users.id,
        clerk_id: post.users.clerk_id,
        name: post.users.name,
        created_at: post.users.created_at,
      },
      likes_count: likesCount,
      comments_count: commentsCount,
      is_liked: isLiked,
    };
  });

  // 더 불러올 데이터가 있는지 확인
  const hasMore = count ? offset + limit < count : false;
  const nextOffset = hasMore ? offset + limit : 0;

  return (
    <div className="w-full max-w-[630px] mx-auto px-4 py-8">
      <PostFeed
        initialPosts={posts}
        initialHasMore={hasMore}
        initialOffset={nextOffset}
      />
    </div>
  );
}
