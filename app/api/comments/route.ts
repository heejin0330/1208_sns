import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@/lib/supabase/server";
import { CommentWithUser } from "@/lib/types";
import { errorResponse, successResponse, getErrorMessage } from "@/lib/api-utils";

/**
 * @file route.ts
 * @description 댓글 관리 API
 *
 * GET /api/comments - 댓글 목록 조회
 * POST /api/comments - 댓글 작성
 * DELETE /api/comments - 댓글 삭제
 */

const MAX_COMMENT_LENGTH = 1000; // 댓글 최대 길이

export async function GET(request: NextRequest) {
  try {
    // Clerk 인증 확인
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return errorResponse("로그인이 필요합니다", 401, "UNAUTHORIZED");
    }

    // Supabase 클라이언트 생성
    const supabase = await createClient();

    // 현재 사용자의 Supabase user_id 가져오기 (좋아요 여부 확인용)
    const { data: currentUser } = await supabase
      .from("users")
      .select("id")
      .eq("clerk_id", clerkUserId)
      .single();

    const currentUserId = currentUser?.id;

    // 쿼리 파라미터 파싱
    const searchParams = request.nextUrl.searchParams;
    const postId = searchParams.get("postId");
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    if (!postId) {
      return errorResponse("게시물 ID가 필요합니다", 400, "POST_ID_REQUIRED");
    }

    // 댓글 목록 조회 (좋아요 수 포함)
    const { data: commentsData, error: commentsError } = await supabase
      .from("comments")
      .select(
        `
        id,
        post_id,
        user_id,
        content,
        created_at,
        updated_at,
        users!inner (
          id,
          clerk_id,
          name,
          created_at
        ),
        comment_likes (id)
      `,
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
      return errorResponse(
        "댓글을 불러오는데 실패했습니다",
        500,
        "FETCH_COMMENTS_ERROR",
      );
    }

    // 각 댓글에 대한 좋아요 여부 확인
    const commentIds = commentsData?.map((comment) => comment.id) || [];
    const { data: userCommentLikes } = currentUserId
      ? await supabase
          .from("comment_likes")
          .select("comment_id")
          .eq("user_id", currentUserId)
          .in("comment_id", commentIds)
      : { data: null };

    const likedCommentIds = new Set(
      userCommentLikes?.map((like) => like.comment_id) || [],
    );

    // CommentWithUser 타입으로 변환
    const comments: CommentWithUser[] = (commentsData || []).map((comment: any) => {
      const likesCount = comment.comment_likes?.length || 0;
      const isLiked = likedCommentIds.has(comment.id);

      return {
        id: comment.id,
        post_id: comment.post_id,
        user_id: comment.user_id,
        content: comment.content,
        created_at: comment.created_at,
        updated_at: comment.updated_at,
        user: {
          id: comment.users.id,
          clerk_id: comment.users.clerk_id,
          name: comment.users.name,
          created_at: comment.users.created_at,
        },
        likes_count: likesCount,
        is_liked: isLiked,
      };
    });

    return successResponse({ comments });
  } catch (error) {
    console.error("Error in GET /api/comments:", error);
    return errorResponse(
      getErrorMessage(500),
      500,
      "INTERNAL_SERVER_ERROR",
    );
  }
}

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

    // request body에서 post_id, content 추출
    const body = await request.json();
    const { post_id, content } = body;

    if (!post_id) {
      return errorResponse("게시물 ID가 필요합니다", 400, "POST_ID_REQUIRED");
    }

    if (!content || typeof content !== "string" || content.trim().length === 0) {
      return errorResponse("댓글 내용을 입력해주세요", 400, "CONTENT_REQUIRED");
    }

    if (content.length > MAX_COMMENT_LENGTH) {
      return errorResponse(
        `댓글은 최대 ${MAX_COMMENT_LENGTH}자까지 입력 가능합니다`,
        400,
        "CONTENT_TOO_LONG",
      );
    }

    // 댓글 작성
    const { data: commentData, error: insertError } = await supabase
      .from("comments")
      .insert({
        post_id,
        user_id: currentUserId,
        content: content.trim(),
      })
      .select(
        `
        id,
        post_id,
        user_id,
        content,
        created_at,
        updated_at,
        users!inner (
          id,
          clerk_id,
          name,
          created_at
        )
      `,
      )
      .single();

    if (insertError) {
      console.error("Error inserting comment:", insertError);
      return errorResponse(
        "댓글 작성에 실패했습니다",
        500,
        "CREATE_COMMENT_ERROR",
      );
    }

    // CommentWithUser 타입으로 변환 (새 댓글이므로 좋아요 수는 0)
    // users는 join 결과이므로 배열이 아닌 단일 객체로 처리
    const userData = Array.isArray(commentData.users)
      ? commentData.users[0]
      : commentData.users;

    if (!userData) {
      return errorResponse(
        "사용자 정보를 찾을 수 없습니다",
        404,
        "USER_NOT_FOUND",
      );
    }

    const comment: CommentWithUser = {
      id: commentData.id,
      post_id: commentData.post_id,
      user_id: commentData.user_id,
      content: commentData.content,
      created_at: commentData.created_at,
      updated_at: commentData.updated_at,
      user: {
        id: userData.id,
        clerk_id: userData.clerk_id,
        name: userData.name,
        created_at: userData.created_at,
      },
      likes_count: 0,
      is_liked: false,
    };

    return successResponse({ comment }, 201);
  } catch (error) {
    console.error("Error in POST /api/comments:", error);
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

    // request body에서 comment_id 추출
    const body = await request.json();
    const { comment_id } = body;

    if (!comment_id) {
      return errorResponse("댓글 ID가 필요합니다", 400, "COMMENT_ID_REQUIRED");
    }

    // 본인 댓글인지 확인
    const { data: comment, error: fetchError } = await supabase
      .from("comments")
      .select("user_id")
      .eq("id", comment_id)
      .single();

    if (fetchError || !comment) {
      return errorResponse("댓글을 찾을 수 없습니다", 404, "COMMENT_NOT_FOUND");
    }

    if (comment.user_id !== currentUserId) {
      return errorResponse("본인의 댓글만 삭제할 수 있습니다", 403, "FORBIDDEN");
    }

    // 댓글 삭제
    const { error: deleteError } = await supabase
      .from("comments")
      .delete()
      .eq("id", comment_id);

    if (deleteError) {
      console.error("Error deleting comment:", deleteError);
      return errorResponse(
        "댓글 삭제에 실패했습니다",
        500,
        "DELETE_COMMENT_ERROR",
      );
    }

    return successResponse({}, 200);
  } catch (error) {
    console.error("Error in DELETE /api/comments:", error);
    return errorResponse(
      getErrorMessage(500),
      500,
      "INTERNAL_SERVER_ERROR",
    );
  }
}

