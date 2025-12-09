import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { UserResponse } from "@/lib/types";

/**
 * @file route.ts
 * @description 사용자 정보 조회 API
 *
 * GET /api/users/[userId]
 * - 사용자 정보 및 통계 조회
 * - user_stats 뷰 활용
 * - 현재 사용자의 팔로우 여부 확인 (9단계에서 구현 예정)
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> },
) {
  try {
    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 },
      );
    }

    // Supabase 클라이언트 생성
    const supabase = await createClient();

    // 현재 사용자의 Supabase user_id 가져오기 (팔로우 여부 확인용)
    const { data: currentUser } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    const currentUserId = currentUser?.id;

    // 동적 라우트 파라미터에서 userId 추출
    const { userId } = await params;

    if (!userId) {
      return NextResponse.json(
        { error: "userId가 필요합니다." },
        { status: 400 },
      );
    }

    // user_stats 뷰에서 사용자 정보 및 통계 조회
    const { data: userStats, error: statsError } = await supabase
      .from("user_stats")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (statsError || !userStats) {
      console.error("Error fetching user stats:", statsError);
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // User 타입으로 변환
    const user = {
      id: userStats.user_id,
      clerk_id: userStats.clerk_id,
      name: userStats.name,
      created_at: userStats.created_at || new Date().toISOString(),
    };

    // UserStats 타입으로 변환
    const stats = {
      user_id: userStats.user_id,
      clerk_id: userStats.clerk_id,
      name: userStats.name,
      posts_count: userStats.posts_count || 0,
      followers_count: userStats.followers_count || 0,
      following_count: userStats.following_count || 0,
    };

    // 현재 사용자가 해당 사용자를 팔로우하는지 확인
    let isFollowing = false;
    if (currentUserId && currentUserId !== userId) {
      const { data: followData } = await supabase
        .from("follows")
        .select("id")
        .eq("follower_id", currentUserId)
        .eq("following_id", userId)
        .single();

      isFollowing = !!followData;
    }

    const response: UserResponse = {
      user,
      stats,
      is_following: isFollowing,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error in GET /api/users/[userId]:", error);
    return NextResponse.json(
      {
        error: "서버 내부 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

