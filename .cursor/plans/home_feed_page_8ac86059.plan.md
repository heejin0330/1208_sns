# 홈 피드 페이지 개발 상세 계획

## 목표

Instagram 스타일의 홈 피드 페이지를 구현합니다. 게시물 카드(PostCard), 피드 컴포넌트(PostFeed), API Route를 개발하고 무한 스크롤과 페이지네이션을 지원합니다.

## 현재 상태

- 레이아웃 구조 완료 (`app/(main)/layout.tsx`)
- 데이터베이스 스키마 준비 완료 (posts, users, likes, comments 테이블)
- post_stats 뷰 존재 (likes_count, comments_count 포함)
- TypeScript 타입 정의 완료 (`lib/types.ts`)
- Supabase 클라이언트 설정 완료 (Server/Client)

## 구현 단계

### 1단계: API Route 개발 (`app/api/posts/route.ts`)

**요구사항:**

- GET: 게시물 목록 조회
- 시간 역순 정렬 (created_at DESC)
- 페이지네이션 지원 (limit, offset)
- userId 파라미터 지원 (프로필 페이지용)
- 좋아요 수, 댓글 수, 사용자 정보 포함
- 현재 사용자의 좋아요 여부 포함

**구현 세부사항:**

- Server Action 우선 원칙에 따라 API Route 사용 (외부에서도 접근 가능하도록)
- Clerk 인증 확인 (`auth()`)
- Supabase 쿼리:
  - `posts` 테이블과 `users` 테이블 JOIN
  - `post_stats` 뷰 활용 또는 COUNT 서브쿼리
  - `likes` 테이블에서 현재 사용자의 좋아요 여부 확인
  - `comments` 테이블에서 댓글 수 계산
- 쿼리 파라미터:
  - `limit`: 기본값 10
  - `offset`: 기본값 0
  - `userId`: 선택적, 특정 사용자의 게시물만 조회
- 응답 형식: `PostsResponse` 타입 사용

**SQL 쿼리 예시:**

```sql
SELECT 
  p.*,
  u.id as user_id, u.clerk_id, u.name,
  COUNT(DISTINCT l.id) as likes_count,
  COUNT(DISTINCT c.id) as comments_count,
  EXISTS(SELECT 1 FROM likes WHERE post_id = p.id AND user_id = $current_user_id) as is_liked
FROM posts p
JOIN users u ON p.user_id = u.id
LEFT JOIN likes l ON p.id = l.post_id
LEFT JOIN comments c ON p.id = c.post_id
WHERE ($userId IS NULL OR p.user_id = $userId)
GROUP BY p.id, u.id, u.clerk_id, u.name
ORDER BY p.created_at DESC
LIMIT $limit OFFSET $offset
```

### 2단계: PostCardSkeleton 컴포넌트 개발 (`components/post/PostCardSkeleton.tsx`)

**요구사항:**

- 로딩 UI (Skeleton + Shimmer 효과)
- PostCard와 동일한 레이아웃 구조
- Instagram 스타일 유지

**구현 세부사항:**

- 클라이언트 컴포넌트 (`'use client'`)
- 구성 요소:
  - 헤더 영역: 원형 프로필 이미지 + 텍스트 박스
  - 이미지 영역: 정사각형 박스 (1:1 비율)
  - 액션 버튼 영역: 작은 박스들
  - 컨텐츠 영역: 여러 줄 텍스트 박스
- Shimmer 효과: Tailwind `animate-pulse` 또는 커스텀 애니메이션
- 배경색: 회색 계열 (`bg-gray-200`)

### 3단계: PostCard 컴포넌트 개발 (`components/post/PostCard.tsx`)

**요구사항:**

- 헤더: 프로필 이미지 32px 원형, 사용자명 Bold, 시간 표시, ⋯ 메뉴
- 이미지: 1:1 정사각형, Next.js Image 컴포넌트 사용
- 액션 버튼: 좋아요, 댓글, 공유(UI만), 북마크(UI만)
- 좋아요 수: Bold 텍스트
- 캡션: 사용자명 Bold + 내용, 2줄 초과 시 "... 더 보기" 토글
- 댓글 미리보기: 최신 2개만 표시

**구현 세부사항:**

- 클라이언트 컴포넌트 (`'use client'`)
- Props 타입: `PostWithUserAndStats`
- 시간 표시: 상대 시간 (예: "3시간 전") - `date-fns` 또는 커스텀 함수
- 캡션 확장/축소: useState로 관리
- 댓글 미리보기: comments 배열에서 최신 2개만 표시
- 좋아요 버튼: 4단계에서 구현 예정이므로 UI만 구현 (클릭 핸들러는 빈 함수)
- 이미지 최적화: Next.js `Image` 컴포넌트 사용, lazy loading
- 반응형: Mobile/Desktop 대응

**컴포넌트 구조:**

```
PostCard
├── PostHeader (프로필 이미지, 사용자명, 시간, 메뉴)
├── PostImage (1:1 정사각형 이미지)
├── PostActions (좋아요, 댓글, 공유, 북마크 버튼)
├── PostLikes (좋아요 수)
├── PostCaption (사용자명 + 캡션, 확장/축소)
└── PostCommentsPreview (최신 댓글 2개)
```

### 4단계: PostFeed 컴포넌트 개발 (`components/post/PostFeed.tsx`)

**요구사항:**

- 게시물 목록 렌더링
- 무한 스크롤 (Intersection Observer)
- 페이지네이션 (10개씩)
- 로딩 상태 관리 (Skeleton UI)
- 에러 처리

**구현 세부사항:**

- 클라이언트 컴포넌트 (`'use client'`)
- Props:
  - `initialPosts`: 초기 게시물 목록 (Server Component에서 전달)
  - `initialHasMore`: 더 불러올 데이터가 있는지
  - `initialOffset`: 초기 offset 값
  - `userId?`: 선택적, 특정 사용자의 게시물만 로드
- 상태 관리:
  - `posts`: 게시물 목록
  - `isLoading`: 로딩 상태
  - `hasMore`: 더 불러올 데이터가 있는지
  - `offset`: 현재 offset 값
- 무한 스크롤:
  - Intersection Observer API 사용
  - 하단 감지 요소 (sentinel) 생성
  - 감지 시 `/api/posts` 호출하여 추가 데이터 로드
- API 호출:
  - `fetch` 사용
  - 에러 처리 및 사용자 친화적 메시지 표시
- 로딩 UI: PostCardSkeleton 여러 개 표시

### 5단계: 홈 피드 페이지 통합 (`app/(main)/page.tsx`)

**요구사항:**

- Server Component로 초기 데이터 로드
- PostFeed 컴포넌트에 초기 데이터 전달
- 인증 확인 (Clerk)

**구현 세부사항:**

- Server Component (async)
- Clerk 인증 확인: `auth()` 사용
- Supabase 클라이언트: `createClient()` 사용
- 초기 데이터 로드:
  - 첫 10개 게시물 조회
  - post_stats 뷰 또는 JOIN 쿼리 사용
  - 현재 사용자의 좋아요 여부 포함
- PostFeed에 props 전달:
  - `initialPosts`
  - `initialHasMore`
  - `initialOffset`

**데이터 로딩 로직:**

- Supabase 쿼리로 posts + users JOIN
- likes_count, comments_count 계산
- 현재 사용자의 is_liked 확인
- 시간 역순 정렬

### 6단계: 댓글 미리보기 데이터 로드

**요구사항:**

- PostCard에 최신 댓글 2개 표시
- 댓글 작성자 정보 포함

**구현 세부사항:**

- API Route에서 댓글 데이터 포함:
  - 각 게시물별로 최신 댓글 2개 조회
  - 댓글 작성자 정보 JOIN
- 또는 PostCard에서 별도 API 호출:
  - `/api/comments?postId=xxx&limit=2` (6단계에서 구현 예정)
- 1차는 댓글 데이터 없이 UI만 구현 가능

## 기술 스택

- **아이콘**: lucide-react (Heart, MessageSquare, Send, Bookmark, MoreVertical)
- **이미지**: Next.js Image 컴포넌트
- **시간 표시**: `date-fns` 또는 커스텀 함수
- **스타일링**: Tailwind CSS (Instagram 컬러 변수 활용)
- **인증**: Clerk `auth()` (Server), `useAuth()` (Client)
- **데이터베이스**: Supabase (post_stats 뷰 활용)

## 파일 구조

```
app/
├── api/
│   └── posts/
│       └── route.ts (새로 생성)
├── (main)/
│   └── page.tsx (수정)
components/
└── post/
    ├── PostCard.tsx (새로 생성)
    ├── PostCardSkeleton.tsx (새로 생성)
    └── PostFeed.tsx (새로 생성)
```

## 데이터 흐름

1. 사용자가 홈 페이지 접속
2. Server Component (`app/(main)/page.tsx`)에서 초기 데이터 로드
3. PostFeed 컴포넌트에 초기 데이터 전달
4. PostCard 컴포넌트들이 렌더링
5. 사용자가 스크롤 다운
6. Intersection Observer가 하단 감지
7. PostFeed가 `/api/posts` 호출하여 추가 데이터 로드
8. 새 게시물들이 추가로 렌더링

## 주의사항

- 좋아요 기능은 4단계에서 구현 예정이므로 PostCard의 좋아요 버튼은 UI만 구현
- 댓글 기능은 6단계에서 구현 예정이므로 PostCard의 댓글 미리보기는 초기에는 빈 배열 또는 UI만 구현 가능
- 공유 버튼과 북마크 버튼은 1차 제외 기능이므로 UI만 구현
- 프로필 이미지는 Clerk에서 가져오거나 기본 아바타 사용 (users 테이블에 프로필 이미지 URL 필드 없음)
- 시간 표시는 상대 시간으로 구현 (예: "3시간 전", "2일 전")
- 이미지 최적화를 위해 Next.js Image 컴포넌트 필수 사용
- 무한 스크롤은 Intersection Observer API 사용 (라이브러리 없이 순수 구현)