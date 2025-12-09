import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * @file page.tsx
 * @description 본인 프로필 리다이렉트 페이지
 *
 * /profile 접속 시 현재 로그인한 사용자의 프로필로 리다이렉트
 *
 * @dependencies
 * - @clerk/nextjs/server: 인증
 * - @/lib/supabase/server: Supabase 클라이언트
 */

export default async function ProfilePage() {
  // Clerk 인증 확인
  const { userId: clerkUserId } = await auth();

  if (!clerkUserId) {
    redirect("/sign-in");
  }

  // Supabase 클라이언트 생성
  const supabase = await createClient();

  // 현재 사용자의 Supabase user_id 조회
  const { data: currentUser, error: userError } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkUserId)
    .single();

  if (userError || !currentUser) {
    console.error("Error fetching current user:", userError);
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">사용자 정보를 불러올 수 없습니다.</p>
          <p className="text-sm text-[#8e8e8e]">
            페이지를 새로고침하거나 다시 로그인해주세요.
          </p>
        </div>
      </div>
    );
  }

  // 본인 프로필로 리다이렉트
  redirect(`/profile/${currentUser.id}`);
}

