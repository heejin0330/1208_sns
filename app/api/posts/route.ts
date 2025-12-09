import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { PostsResponse, PostWithUserAndStats } from "@/lib/types";

/**
 * @file route.ts
 * @description 게시물 목록 조회 API
 *
 * GET /api/posts
 * - 게시물 목록 조회 (시간 역순 정렬)
 * - 페이지네이션 지원 (limit, offset)
 * - userId 파라미터 지원 (프로필 페이지용)
 * - 좋아요 수, 댓글 수, 사용자 정보 포함
 * - 현재 사용자의 좋아요 여부 포함
 *
 * @queryParams
 * - limit: 기본값 10
 * - offset: 기본값 0
 * - userId: 선택적, 특정 사용자의 게시물만 조회
 */

export async function GET(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 },
      );
    }

    const currentUserId = currentUser.id;

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const userId = searchParams.get("userId");

    // 게시물 조회 쿼리
    let query = supabase
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

    // userId 파라미터가 있으면 필터링
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data: postsData, error: postsError, count } = await query;

    if (postsError) {
      console.error("Error fetching posts:", postsError);
      return NextResponse.json(
        { error: "Failed to fetch posts", details: postsError.message },
        { status: 500 },
      );
    }

    if (!postsData) {
      return NextResponse.json({
        posts: [],
        has_more: false,
        next_offset: undefined,
      } satisfies PostsResponse);
    }

    // 각 게시물에 대한 좋아요 여부 확인
    const postIds = postsData.map((post) => post.id);
    const { data: userLikes } = await supabase
      .from("likes")
      .select("post_id")
      .eq("user_id", currentUserId)
      .in("post_id", postIds);

    const likedPostIds = new Set(userLikes?.map((like) => like.post_id) || []);

    // 데이터 변환
    const posts: PostWithUserAndStats[] = postsData.map((post: any) => {
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
    const nextOffset = hasMore ? offset + limit : undefined;

    const response: PostsResponse = {
      posts,
      has_more: hasMore,
      next_offset: nextOffset,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in GET /api/posts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
