# Supabase + Next.js 설정 가이드

이 문서는 Supabase 공식 문서의 모범 사례를 따라 Next.js 프로젝트에 Supabase를 연결하는 방법을 설명합니다.

> **참고**: 이 프로젝트는 Clerk를 인증 제공자로 사용하므로, Supabase의 기본 인증 대신 Clerk 토큰을 사용합니다.

## 목차

1. [Supabase 프로젝트 생성](#supabase-프로젝트-생성)
2. [환경 변수 설정](#환경-변수-설정)
3. [Supabase 클라이언트 사용](#supabase-클라이언트-사용)
4. [예제 페이지](#예제-페이지)

## Supabase 프로젝트 생성

### 1단계: Supabase 프로젝트 생성

1. [Supabase Dashboard](https://supabase.com/dashboard)에 접속하여 로그인
2. **"New Project"** 클릭
3. 프로젝트 정보 입력:
   - **Name**: 원하는 프로젝트 이름
   - **Database Password**: 안전한 비밀번호 생성
   - **Region**: `Northeast Asia (Seoul)` 선택 (한국 서비스용)
   - **Pricing Plan**: Free 또는 Pro 선택
4. **"Create new project"** 클릭하고 프로젝트가 준비될 때까지 대기 (~2분)

### 2단계: 테이블 생성 및 샘플 데이터 추가

Supabase Dashboard의 **SQL Editor**에서 다음 SQL을 실행합니다:

```sql
-- Create the table
CREATE TABLE instruments (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name TEXT NOT NULL
);

-- Insert some sample data
INSERT INTO instruments (name)
VALUES
  ('violin'),
  ('viola'),
  ('cello');

-- Enable RLS and create policy
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public can read instruments"
ON public.instruments
FOR SELECT
TO anon
USING (true);
```

또는 **Table Editor**에서 직접 테이블을 생성하고 데이터를 추가할 수 있습니다.

## 환경 변수 설정

### 환경 변수 파일 생성

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 변수들을 설정합니다:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL="<Project URL>"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="<anon public key>"
# 또는 기존 코드와의 호환성을 위해
NEXT_PUBLIC_SUPABASE_ANON_KEY="<anon public key>"
SUPABASE_SERVICE_ROLE_KEY="<service_role secret key>"
```

### 환경 변수 값 확인

1. Supabase Dashboard → **Settings** → **API**
2. 다음 값들을 복사:
   - **Project URL**: `NEXT_PUBLIC_SUPABASE_URL`에 사용
   - **anon public key**: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` 또는 `NEXT_PUBLIC_SUPABASE_ANON_KEY`에 사용
   - **service_role secret key**: `SUPABASE_SERVICE_ROLE_KEY`에 사용 (서버 사이드 전용)

> **⚠️ 주의**: `service_role` 키는 모든 RLS를 우회하는 관리자 권한이므로 절대 공개하지 마세요!

## Supabase 클라이언트 사용

### Server Component에서 사용

Supabase 공식 문서의 모범 사례를 따라 `async createClient()` 함수를 사용합니다:

```tsx
// app/my-page/page.tsx
import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';

async function MyData() {
  // async createClient() 사용 (Supabase 공식 문서 모범 사례)
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('instruments')
    .select('*');

  if (error) {
    throw error;
  }

  return <div>{/* 데이터 렌더링 */}</div>;
}

export default function MyPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <MyData />
    </Suspense>
  );
}
```

### Server Actions에서 사용

```typescript
// actions/my-actions.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createItem(name: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('items')
    .insert({ name });

  if (error) {
    throw new Error('Failed to create item');
  }

  revalidatePath('/my-page');
}
```

### Client Component에서 사용

Clerk 통합을 사용하는 경우:

```tsx
'use client';

import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

export default function MyComponent() {
  const supabase = useClerkSupabaseClient();

  async function fetchData() {
    const { data, error } = await supabase
      .from('instruments')
      .select('*');
    
    return data;
  }

  return <div>...</div>;
}
```

## 예제 페이지

프로젝트에는 Supabase 공식 문서 예제를 기반으로 한 예제 페이지가 포함되어 있습니다:

### `/instruments` 페이지

Supabase 공식 문서의 Quickstart 예제를 구현한 페이지입니다.

**특징**:
- Server Component에서 데이터 조회
- Suspense를 사용한 로딩 상태 처리
- 에러 처리 및 빈 상태 처리
- 개발 환경에서 JSON 데이터 디버깅 출력

**사용 방법**:
1. Supabase Dashboard에서 `instruments` 테이블 생성 (위의 SQL 실행)
2. 개발 서버 실행: `pnpm dev`
3. 브라우저에서 `/instruments` 페이지 접속

### `/tasks-example` 페이지

Clerk + Supabase 통합 예제 페이지입니다.

**특징**:
- Clerk 인증 통합
- RLS 정책을 통한 사용자별 데이터 격리
- Server Actions를 통한 CRUD 작업

## 주요 파일 구조

```
lib/supabase/
├── server.ts          # Server Component/Server Actions용 (async createClient)
├── clerk-client.ts    # Client Component용 (Clerk 통합)
├── client.ts          # 공개 데이터용 (인증 불필요)
└── service-role.ts    # 관리자 권한용 (RLS 우회)

app/
├── instruments/       # Supabase 공식 문서 예제
│   └── page.tsx
└── tasks-example/     # Clerk + Supabase 통합 예제
    ├── page.tsx
    ├── actions.ts
    ├── create-task-form.tsx
    └── task-list.tsx
```

## 참고 자료

- [Supabase Next.js Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase Server-Side Auth](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Clerk + Supabase 통합 가이드](./CLERK_SUPABASE_INTEGRATION.md)

## 문제 해결

### 문제 1: "Invalid API key" 에러

**원인**: 환경 변수가 올바르게 설정되지 않음

**해결 방법**:
1. `.env.local` 파일이 프로젝트 루트에 있는지 확인
2. 환경 변수명이 정확한지 확인 (`NEXT_PUBLIC_` 접두사 필수)
3. 개발 서버 재시작

### 문제 2: 데이터가 표시되지 않음

**원인**: 테이블이 생성되지 않았거나 RLS 정책 문제

**해결 방법**:
1. Supabase Dashboard에서 테이블이 존재하는지 확인
2. RLS 정책이 올바르게 설정되었는지 확인
3. SQL Editor에서 직접 쿼리 실행하여 데이터 확인

### 문제 3: "createClient is not a function" 에러

**원인**: 잘못된 import 경로

**해결 방법**:
- Server Component: `import { createClient } from '@/lib/supabase/server'`
- Client Component: `import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client'`

