import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProfileHeader from "@/components/profile/ProfileHeader";
import PostGrid from "@/components/profile/PostGrid";
import { PostWithUserAndStats } from "@/lib/types";

/**
 * @file page.tsx
 * @description 프로필 페이지
 *
 * 사용자 프로필 정보와 게시물 그리드를 표시합니다.
 *
 * @dependencies
 * - @clerk/nextjs/server: 인증
 * - @/lib/supabase/server: Supabase 클라이언트
 */

interface ProfilePageProps {
  params: Promise<{ userId: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  // Clerk 인증 확인
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  // Supabase 클라이언트 생성
  const supabase = await createClient();

  // 현재 사용자의 Supabase user_id 가져오기
  const { data: currentUser, error: currentUserError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  if (currentUserError || !currentUser) {
    console.error("Error fetching current user:", currentUserError);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">사용자 정보를 불러올 수 없습니다.</p>
        </div>
      </div>
    );
  }

  const currentUserId = currentUser.id;

  // 동적 라우트 파라미터에서 userId 추출
  const { userId } = await params;

  if (!userId) {
    redirect("/");
  }

  // users 테이블에서 사용자 정보 조회
  const { data: userData, error: userDataError } = await supabase
    .from("users")
    .select("id, clerk_id, name, created_at")
    .eq("id", userId)
    .single();

  if (userDataError || !userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">사용자를 찾을 수 없습니다.</p>
        </div>
      </div>
    );
  }

  // user_stats 뷰에서 통계 조회
  const { data: userStats, error: statsError } = await supabase
    .from("user_stats")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (statsError || !userStats) {
    console.error("Error fetching user stats:", statsError);
    // 통계 조회 실패 시 기본값 사용
  }

  const user = {
    id: userData.id,
    clerk_id: userData.clerk_id,
    name: userData.name,
    created_at: userData.created_at,
  };

  const stats = {
    user_id: userData.id,
    clerk_id: userData.clerk_id,
    name: userData.name,
    posts_count: userStats?.posts_count || 0,
    followers_count: userStats?.followers_count || 0,
    following_count: userStats?.following_count || 0,
  };

  // 본인 프로필 여부 확인
  const isOwnProfile = currentUserId === userId;

  // 본인 프로필이 아닐 때만 팔로우 여부 확인
  let isFollowing = false;
  if (!isOwnProfile && currentUserId) {
    const { data: followData } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUserId)
      .eq("following_id", userId)
      .single();

    isFollowing = !!followData;
  }

  // 해당 사용자의 게시물 조회
  const { data: postsData, error: postsError } = await supabase
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
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (postsError) {
    console.error("Error fetching posts:", postsError);
  }

  // 현재 사용자의 좋아요 여부 확인
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

  return (
    <div className="w-full">
      <ProfileHeader
        user={user}
        stats={stats}
        isOwnProfile={isOwnProfile}
        isFollowing={isFollowing}
      />
      <div className="border-t border-[#dbdbdb] mt-4">
        <PostGrid posts={posts} />
      </div>
    </div>
  );
}

