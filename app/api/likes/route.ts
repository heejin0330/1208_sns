import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { errorResponse, successResponse, getErrorMessage } from "@/lib/api-utils";

/**
 * @file route.ts
 * @description 좋아요 관리 API
 *
 * POST /api/likes - 좋아요 추가
 * DELETE /api/likes - 좋아요 제거
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

    // request body에서 post_id 추출
    const body = await request.json();
    const { post_id } = body;

    if (!post_id) {
      return errorResponse("게시물 ID가 필요합니다", 400, "POST_ID_REQUIRED");
    }

    // 좋아요 추가 (UNIQUE 제약으로 중복 방지)
    const { error: insertError } = await supabase.from("likes").insert({
      post_id,
      user_id: currentUserId,
    });

    if (insertError) {
      console.error("Error inserting like:", insertError);
      return errorResponse(
        "좋아요 추가에 실패했습니다",
        500,
        "ADD_LIKE_ERROR",
      );
    }

    return successResponse({}, 201);
  } catch (error) {
    console.error("Error in POST /api/likes:", error);
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

    // request body에서 post_id 추출
    const body = await request.json();
    const { post_id } = body;

    if (!post_id) {
      return errorResponse("게시물 ID가 필요합니다", 400, "POST_ID_REQUIRED");
    }

    // 좋아요 제거
    const { error: deleteError } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", post_id)
      .eq("user_id", currentUserId);

    if (deleteError) {
      console.error("Error deleting like:", deleteError);
      return errorResponse(
        "좋아요 제거에 실패했습니다",
        500,
        "REMOVE_LIKE_ERROR",
      );
    }

    return successResponse({}, 200);
  } catch (error) {
    console.error("Error in DELETE /api/likes:", error);
    return errorResponse(
      getErrorMessage(500),
      500,
      "INTERNAL_SERVER_ERROR",
    );
  }
}

