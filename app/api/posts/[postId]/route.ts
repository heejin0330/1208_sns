import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { getServiceRoleClient } from "@/lib/supabase/service-role";
import { PostWithUserAndStats } from "@/lib/types";

/**
 * @file route.ts
 * @description 단일 게시물 상세 조회 API
 *
 * GET /api/posts/[postId]
 * - 단일 게시물 상세 정보 조회
 * - 사용자 정보, 좋아요 수, 댓글 수 포함
 * - 현재 사용자의 좋아요 여부 포함
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
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

    // 동적 라우트 파라미터에서 postId 추출
    const { postId } = await params;

    if (!postId) {
      return NextResponse.json(
        { error: "postId가 필요합니다." },
        { status: 400 },
      );
    }

    // 게시물 조회
    const { data: postData, error: postError } = await supabase
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
      .eq("id", postId)
      .single();

    if (postError || !postData) {
      console.error("Error fetching post:", postError);
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 현재 사용자의 좋아요 여부 확인
    const { data: userLike } = await supabase
      .from("likes")
      .select("id")
      .eq("post_id", postId)
      .eq("user_id", currentUserId)
      .single();

    // 데이터 변환
    const likesCount = postData.likes?.length || 0;
    const commentsCount = postData.comments?.length || 0;
    const isLiked = !!userLike;

    const post: PostWithUserAndStats = {
      id: postData.id,
      user_id: postData.user_id,
      image_url: postData.image_url,
      caption: postData.caption,
      created_at: postData.created_at,
      updated_at: postData.updated_at,
      user: {
        id: postData.users.id,
        clerk_id: postData.users.clerk_id,
        name: postData.users.name,
        created_at: postData.users.created_at,
      },
      likes_count: likesCount,
      comments_count: commentsCount,
      is_liked: isLiked,
    };

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error in GET /api/posts/[postId]:", error);
    return NextResponse.json(
      {
        error: "서버 내부 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

/**
 * Storage 이미지 URL에서 파일 경로 추출
 */
function extractStoragePath(imageUrl: string): string | null {
  try {
    const url = new URL(imageUrl);
    const pathMatch = url.pathname.match(/\/storage\/v1\/object\/public\/posts\/(.+)/);
    return pathMatch ? pathMatch[1] : null;
  } catch {
    return null;
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> },
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

    // 동적 라우트 파라미터에서 postId 추출
    const { postId } = await params;

    if (!postId) {
      return NextResponse.json(
        { error: "postId가 필요합니다." },
        { status: 400 },
      );
    }

    // 게시물 조회 및 소유자 확인
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .select("id, user_id, image_url")
      .eq("id", postId)
      .single();

    if (postError || !postData) {
      console.error("Error fetching post:", postError);
      return NextResponse.json(
        { error: "게시물을 찾을 수 없습니다." },
        { status: 404 },
      );
    }

    // 본인 게시물인지 확인
    if (postData.user_id !== currentUserId) {
      return NextResponse.json(
        { error: "이 게시물을 삭제할 권한이 없습니다." },
        { status: 403 },
      );
    }

    // Supabase Storage에서 이미지 삭제
    const storagePath = extractStoragePath(postData.image_url);
    if (storagePath) {
      // Service Role 클라이언트 사용 (관리자 권한 필요)
      const serviceRoleClient = getServiceRoleClient();
      const { error: storageError } = await serviceRoleClient.storage
        .from("posts")
        .remove([storagePath]);

      if (storageError) {
        console.warn("Failed to delete image from storage:", storageError);
        // Storage 삭제 실패해도 DB 삭제는 계속 진행
      }
    }

    // 게시물 삭제 (CASCADE로 likes, comments도 자동 삭제됨)
    const { error: deleteError } = await supabase
      .from("posts")
      .delete()
      .eq("id", postId)
      .eq("user_id", currentUserId); // 추가 보안: user_id도 확인

    if (deleteError) {
      console.error("Error deleting post:", deleteError);
      return NextResponse.json(
        {
          error: "게시물 삭제에 실패했습니다.",
          details: deleteError.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Error in DELETE /api/posts/[postId]:", error);
    return NextResponse.json(
      {
        error: "서버 내부 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

