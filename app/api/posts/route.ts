import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { PostsResponse, PostWithUserAndStats } from "@/lib/types";

/**
 * @file route.ts
 * @description 게시물 관리 API
 *
 * GET /api/posts
 * - 게시물 목록 조회 (시간 역순 정렬)
 * - 페이지네이션 지원 (limit, offset)
 * - userId 파라미터 지원 (프로필 페이지용)
 * - 좋아요 수, 댓글 수, 사용자 정보 포함
 * - 현재 사용자의 좋아요 여부 포함
 *
 * POST /api/posts
 * - 새 게시물 생성
 * - 이미지 업로드 (Supabase Storage)
 * - 캡션 저장
 *
 * @queryParams (GET)
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

export async function POST(request: NextRequest) {
  console.log("=== POST /api/posts 시작 ===");

  try {
    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();

    console.log("Clerk User ID:", clerkUserId);

    if (!clerkUserId) {
      console.error("인증 실패: Clerk user ID가 없습니다");
      return NextResponse.json(
        { error: "로그인이 필요합니다. 다시 로그인해주세요." },
        { status: 401 },
      );
    }

    // Supabase 클라이언트 생성
    const supabase = await createClient();

    // 현재 사용자의 Supabase user_id 가져오기
    console.log("Supabase에서 사용자 조회 중...");
    const { data: currentUser, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    if (userError || !currentUser) {
      console.error("Supabase 사용자 조회 실패:", userError);
      return NextResponse.json(
        {
          error:
            "데이터베이스에서 사용자를 찾을 수 없습니다. 페이지를 새로고침해주세요.",
        },
        { status: 404 },
      );
    }

    const currentUserId = currentUser.id;
    console.log("Supabase User ID:", currentUserId);

    // FormData 파싱
    const formData = await request.formData();
    const image = formData.get("image") as File | null;
    const caption = formData.get("caption") as string;

    if (!image) {
      return NextResponse.json({ error: "Image is required" }, { status: 400 });
    }

    // 파일 검증
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

    if (!ALLOWED_TYPES.includes(image.type)) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, and WEBP images are allowed" },
        { status: 400 },
      );
    }

    if (image.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size must be less than 5MB" },
        { status: 400 },
      );
    }

    // 파일을 ArrayBuffer로 변환
    console.log("파일 변환 중...");
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 파일명 생성 (타임스탬프 + 원본 파일명)
    const timestamp = Date.now();
    const fileExt = image.name.split(".").pop();
    const fileName = `${timestamp}_${Math.random()
      .toString(36)
      .substring(7)}.${fileExt}`;
    const filePath = `${clerkUserId}/${fileName}`;

    console.log("Storage 업로드 경로:", filePath);

    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("posts")
      .upload(filePath, buffer, {
        contentType: image.type,
        upsert: false,
      });

    console.log("Storage 업로드 결과:", uploadData, uploadError);

    if (uploadError) {
      console.error("Error uploading to storage:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload image", details: uploadError.message },
        { status: 500 },
      );
    }

    // 공개 URL 생성
    const {
      data: { publicUrl },
    } = supabase.storage.from("posts").getPublicUrl(uploadData.path);

    console.log("공개 URL:", publicUrl);

    // posts 테이블에 데이터 저장
    console.log("posts 테이블에 저장 중...");
    const { data: postData, error: postError } = await supabase
      .from("posts")
      .insert({
        user_id: currentUserId,
        image_url: publicUrl,
        caption: caption || null,
      })
      .select()
      .single();

    console.log("posts 저장 결과:", postData, postError);

    if (postError) {
      console.error("Error creating post:", postError);
      // 업로드된 이미지 삭제 (롤백)
      await supabase.storage.from("posts").remove([uploadData.path]);
      return NextResponse.json(
        { error: "Failed to create post", details: postError.message },
        { status: 500 },
      );
    }

    console.log("=== 게시물 생성 성공 ===");
    return NextResponse.json(
      { success: true, post: postData },
      { status: 201 },
    );
  } catch (error) {
    console.error("=== POST /api/posts 오류 ===");
    console.error("Error details:", error);
    console.error(
      "Error message:",
      error instanceof Error ? error.message : "Unknown error",
    );
    console.error(
      "Error stack:",
      error instanceof Error ? error.stack : "No stack trace",
    );

    return NextResponse.json(
      {
        error: "서버 내부 오류가 발생했습니다",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
