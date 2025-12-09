/**
 * @file PostCardSkeleton.tsx
 * @description 게시물 카드 로딩 UI 컴포넌트
 *
 * PostCard와 동일한 레이아웃 구조의 Skeleton UI
 * Shimmer 효과를 사용하여 로딩 상태를 표시합니다.
 *
 * @dependencies
 * - Tailwind CSS: animate-pulse
 */

export default function PostCardSkeleton() {
  return (
    <div className="bg-white border border-[#dbdbdb] rounded-lg mb-4 animate-pulse">
      {/* 헤더 영역 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#dbdbdb]">
        {/* 프로필 이미지 */}
        <div className="w-8 h-8 rounded-full bg-gray-200" />
        {/* 사용자명 */}
        <div className="h-4 w-24 bg-gray-200 rounded" />
        {/* 시간 */}
        <div className="h-3 w-16 bg-gray-200 rounded ml-auto" />
      </div>

      {/* 이미지 영역 (1:1 정사각형) */}
      <div className="w-full aspect-square bg-gray-200" />

      {/* 액션 버튼 영역 */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          {/* 좋아요 버튼 */}
          <div className="w-6 h-6 bg-gray-200 rounded" />
          {/* 댓글 버튼 */}
          <div className="w-6 h-6 bg-gray-200 rounded" />
          {/* 공유 버튼 */}
          <div className="w-6 h-6 bg-gray-200 rounded" />
        </div>
        {/* 북마크 버튼 */}
        <div className="w-6 h-6 bg-gray-200 rounded" />
      </div>

      {/* 컨텐츠 영역 */}
      <div className="px-4 pb-4 space-y-2">
        {/* 좋아요 수 */}
        <div className="h-4 w-20 bg-gray-200 rounded" />
        {/* 캡션 첫 줄 */}
        <div className="h-4 w-full bg-gray-200 rounded" />
        {/* 캡션 두 번째 줄 */}
        <div className="h-4 w-3/4 bg-gray-200 rounded" />
        {/* 댓글 미리보기 */}
        <div className="h-3 w-32 bg-gray-200 rounded mt-2" />
        <div className="h-3 w-full bg-gray-200 rounded" />
        <div className="h-3 w-2/3 bg-gray-200 rounded" />
      </div>
    </div>
  );
}
