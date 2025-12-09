import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse, getErrorMessage } from "@/lib/api-utils";

/**
 * @file route.ts
 * @description 팔로우 관리 API
 *
 * POST /api/follows - 팔로우 추가
 * DELETE /api/follows - 팔로우 제거 (언팔로우)
 */

export async function POST(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return errorResponse("로그인이 필요합니다", 401, "UNAUTHORIZED");
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
      return errorResponse(
        "데이터베이스에서 사용자를 찾을 수 없습니다",
        404,
        "USER_NOT_FOUND",
      );
    }

    const currentUserId = currentUser.id;

    // request body에서 following_id 추출
    const body = await request.json();
    const { following_id } = body;

    if (!following_id) {
      return errorResponse("팔로우할 사용자 ID가 필요합니다", 400, "FOLLOWING_ID_REQUIRED");
    }

    // 자기 자신 팔로우 방지
    if (currentUserId === following_id) {
      return errorResponse("자기 자신을 팔로우할 수 없습니다", 400, "SELF_FOLLOW_NOT_ALLOWED");
    }

    // 팔로우할 사용자가 존재하는지 확인
    const { data: targetUser, error: targetUserError } = await supabase
      .from("users")
      .select("id")
      .eq("id", following_id)
      .single();

    if (targetUserError || !targetUser) {
      return errorResponse("팔로우할 사용자를 찾을 수 없습니다", 404, "USER_NOT_FOUND");
    }

    // 팔로우 추가 (UNIQUE 제약으로 중복 방지)
    const { error: insertError } = await supabase.from("follows").insert({
      follower_id: currentUserId,
      following_id: following_id,
    });

    if (insertError) {
      // 중복 팔로우인 경우 조용히 성공 처리
      if (insertError.code === "23505") {
        // UNIQUE 제약 위반 (이미 팔로우 중)
        return successResponse({}, 200);
      }

      console.error("Error inserting follow:", insertError);
      return errorResponse(
        "팔로우 추가에 실패했습니다",
        500,
        "ADD_FOLLOW_ERROR",
      );
    }

    return successResponse({}, 201);
  } catch (error) {
    console.error("Error in POST /api/follows:", error);
    return errorResponse(
      getErrorMessage(500),
      500,
      "INTERNAL_SERVER_ERROR",
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return errorResponse("로그인이 필요합니다", 401, "UNAUTHORIZED");
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
      return errorResponse(
        "데이터베이스에서 사용자를 찾을 수 없습니다",
        404,
        "USER_NOT_FOUND",
      );
    }

    const currentUserId = currentUser.id;

    // request body에서 following_id 추출
    const body = await request.json();
    const { following_id } = body;

    if (!following_id) {
      return errorResponse("언팔로우할 사용자 ID가 필요합니다", 400, "FOLLOWING_ID_REQUIRED");
    }

    // 팔로우 제거
    const { error: deleteError } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", currentUserId)
      .eq("following_id", following_id);

    if (deleteError) {
      console.error("Error deleting follow:", deleteError);
      return errorResponse(
        "팔로우 제거에 실패했습니다",
        500,
        "REMOVE_FOLLOW_ERROR",
      );
    }

    return successResponse({}, 200);
  } catch (error) {
    console.error("Error in DELETE /api/follows:", error);
    return errorResponse(
      getErrorMessage(500),
      500,
      "INTERNAL_SERVER_ERROR",
    );
  }
}

