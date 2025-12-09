/**
 * @file PostCardSkeleton.tsx
 * @description 게시물 카드 로딩 UI 컴포넌트
 *
 * PostCard와 동일한 레이아웃 구조의 Skeleton UI
 * Shimmer 효과를 사용하여 로딩 상태를 표시합니다.
 *
 * @dependencies
 * - app/globals.css: shimmer keyframes
 */

export default function PostCardSkeleton() {
  const shimmerStyle = {
    background: "linear-gradient(90deg, #f0f0f0 0%, #e0e0e0 50%, #f0f0f0 100%)",
    backgroundSize: "2000px 100%",
    animation: "shimmer 2s infinite",
  };

  return (
    <div className="bg-white border border-[#dbdbdb] rounded-lg mb-4">
      {/* 헤더 영역 */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#dbdbdb]">
        {/* 프로필 이미지 */}
        <div className="w-8 h-8 rounded-full" style={shimmerStyle} />
        {/* 사용자명 */}
        <div className="h-4 w-24 rounded" style={shimmerStyle} />
        {/* 시간 */}
        <div className="h-3 w-16 rounded ml-auto" style={shimmerStyle} />
      </div>

      {/* 이미지 영역 (1:1 정사각형) */}
      <div className="w-full aspect-square" style={shimmerStyle} />

      {/* 액션 버튼 영역 */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4">
          {/* 좋아요 버튼 */}
          <div className="w-6 h-6 rounded" style={shimmerStyle} />
          {/* 댓글 버튼 */}
          <div className="w-6 h-6 rounded" style={shimmerStyle} />
          {/* 공유 버튼 */}
          <div className="w-6 h-6 rounded" style={shimmerStyle} />
        </div>
        {/* 북마크 버튼 */}
        <div className="w-6 h-6 rounded" style={shimmerStyle} />
      </div>

      {/* 컨텐츠 영역 */}
      <div className="px-4 pb-4 space-y-2">
        {/* 좋아요 수 */}
        <div className="h-4 w-20 rounded" style={shimmerStyle} />
        {/* 캡션 첫 줄 */}
        <div className="h-4 w-full rounded" style={shimmerStyle} />
        {/* 캡션 두 번째 줄 */}
        <div className="h-4 w-3/4 rounded" style={shimmerStyle} />
        {/* 댓글 미리보기 */}
        <div className="h-3 w-32 rounded mt-2" style={shimmerStyle} />
        <div className="h-3 w-full rounded" style={shimmerStyle} />
        <div className="h-3 w-2/3 rounded" style={shimmerStyle} />
      </div>
    </div>
  );
}
