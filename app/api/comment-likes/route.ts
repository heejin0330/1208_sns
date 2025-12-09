import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

/**
 * @file route.ts
 * @description 댓글 좋아요 관리 API
 *
 * POST /api/comment-likes - 댓글 좋아요 추가
 * DELETE /api/comment-likes - 댓글 좋아요 제거
 */

export async function POST(request: NextRequest) {
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

    // 현재 사용자의 Supabase user_id 가져오기
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !currentUser) {
      console.error("Error fetching current user:", userError);
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const currentUserId = currentUser.id;

    // request body에서 comment_id 추출
    const body = await request.json();
    const { comment_id } = body;

    if (!comment_id) {
      return NextResponse.json(
        { error: "comment_id가 필요합니다." },
        { status: 400 },
      );
    }

    // 댓글 좋아요 추가 (UNIQUE 제약으로 중복 방지)
    const { error: insertError } = await supabase
      .from("comment_likes")
      .insert({
        comment_id,
        user_id: currentUserId,
      });

    if (insertError) {
      console.error("Error inserting comment like:", insertError);
      return NextResponse.json(
        { error: "좋아요 추가에 실패했습니다.", details: insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/comment-likes:", error);
    return NextResponse.json(
      {
        error: "서버 내부 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    // 현재 사용자의 Supabase user_id 가져오기
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !currentUser) {
      console.error("Error fetching current user:", userError);
      return NextResponse.json(
        { error: "사용자를 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    const currentUserId = currentUser.id;

    // request body에서 comment_id 추출
    const body = await request.json();
    const { comment_id } = body;

    if (!comment_id) {
      return NextResponse.json(
        { error: "comment_id가 필요합니다." },
        { status: 400 },
      );
    }

    // 댓글 좋아요 제거
    const { error: deleteError } = await supabase
      .from("comment_likes")
      .delete()
      .eq("comment_id", comment_id)
      .eq("user_id", currentUserId);

    if (deleteError) {
      console.error("Error deleting comment like:", deleteError);
      return NextResponse.json(
        { error: "좋아요 제거에 실패했습니다.", details: deleteError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in DELETE /api/comment-likes:", error);
    return NextResponse.json(
      {
        error: "서버 내부 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

