import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";

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

    // request body에서 post_id 추출
    const body = await request.json();
    const { post_id } = body;

    if (!post_id) {
      return NextResponse.json(
        { error: "post_id is required" },
        { status: 400 },
      );
    }

    // 좋아요 추가 (UNIQUE 제약으로 중복 방지)
    const { error: insertError } = await supabase.from("likes").insert({
      post_id,
      user_id: currentUserId,
    });

    if (insertError) {
      console.error("Error inserting like:", insertError);
      return NextResponse.json(
        { error: "Failed to add like", details: insertError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("Error in POST /api/likes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
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

    // request body에서 post_id 추출
    const body = await request.json();
    const { post_id } = body;

    if (!post_id) {
      return NextResponse.json(
        { error: "post_id is required" },
        { status: 400 },
      );
    }

    // 좋아요 제거
    const { error: deleteError } = await supabase
      .from("likes")
      .delete()
      .eq("post_id", post_id)
      .eq("user_id", currentUserId);

    if (deleteError) {
      console.error("Error deleting like:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove like", details: deleteError.message },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in DELETE /api/likes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

