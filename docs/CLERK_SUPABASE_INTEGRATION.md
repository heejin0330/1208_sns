# Clerk + Supabase 통합 가이드

이 문서는 2025년 권장 방식인 Clerk와 Supabase의 **네이티브 통합**을 설정하고 사용하는 방법을 설명합니다.

> **중요**: 2025년 4월 1일부터 Clerk의 Supabase JWT 템플릿은 deprecated되었습니다. 이제 네이티브 통합 방식을 사용해야 합니다.

## 목차

1. [통합 개요](#통합-개요)
2. [Supabase Dashboard 설정](#supabase-dashboard-설정)
3. [Clerk Dashboard 설정](#clerk-dashboard-설정)
4. [코드 구현](#코드-구현)
5. [RLS 정책 설정](#rls-정책-설정)
6. [사용 예제](#사용-예제)

## 통합 개요

### 네이티브 통합의 장점

- ✅ **JWT 템플릿 불필요**: Clerk JWT Secret을 Supabase와 공유할 필요 없음
- ✅ **자동 토큰 검증**: Supabase가 Clerk 토큰을 자동으로 검증
- ✅ **간단한 설정**: Supabase Dashboard에서 Clerk를 third-party provider로 추가만 하면 됨
- ✅ **보안 강화**: 각 요청마다 새로운 토큰을 가져올 필요 없음

### 통합 아키텍처

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ Clerk Session Token
       ▼
┌─────────────┐         ┌──────────────┐
│   Next.js   │────────▶│   Supabase   │
│  (Clerk)    │         │   Database   │
└─────────────┘         └──────────────┘
       │                        │
       │                        │
       ▼                        ▼
┌─────────────┐         ┌──────────────┐
│  Clerk API  │         │   RLS Check  │
└─────────────┘         └──────────────┘
```

## Supabase Dashboard 설정

### 1단계: Clerk Domain 확인

1. [Clerk Dashboard](https://dashboard.clerk.com/)에 로그인
2. **Setup** → **Supabase** 메뉴로 이동
3. **"Activate Supabase integration"** 클릭
4. 표시된 **Clerk Domain** 복사 (예: `your-app-12.clerk.accounts.dev`)

### 2단계: Supabase에 Clerk Provider 추가

1. [Supabase Dashboard](https://supabase.com/dashboard)에 로그인
2. 프로젝트 선택 → **Authentication** → **Providers** 메뉴
3. 페이지 하단의 **"Third-Party Auth"** 섹션으로 스크롤
4. **"Add Provider"** 클릭
5. **"Clerk"** 선택 (또는 Custom Provider 선택)
6. 다음 정보 입력:

   - **Provider Name**: `Clerk`
   - **Issuer URL**: `https://your-app-12.clerk.accounts.dev` (1단계에서 복사한 도메인)
   - **JWKS URI**: `https://your-app-12.clerk.accounts.dev/.well-known/jwks.json`

7. **"Save"** 클릭

### 3단계: 통합 확인

설정이 완료되면 Supabase가 Clerk 토큰을 자동으로 검증할 수 있습니다.

## Clerk Dashboard 설정

Clerk Dashboard에서 추가 설정은 필요하지 않습니다. 네이티브 통합은 Supabase 측에서만 설정하면 됩니다.

> **참고**: Clerk Dashboard의 Supabase 통합 페이지는 단순히 도메인 정보를 제공하는 용도입니다.

## 코드 구현

프로젝트에는 이미 Clerk와 Supabase 통합 코드가 구현되어 있습니다.

### 클라이언트 컴포넌트용

```typescript
// lib/supabase/clerk-client.ts
'use client';

import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';

export default function MyComponent() {
  const supabase = useClerkSupabaseClient();

  async function fetchData() {
    const { data, error } = await supabase
      .from('tasks')
      .select('*');
    
    if (error) {
      console.error('Error:', error);
      return;
    }
    
    return data;
  }

  return <div>...</div>;
}
```

### 서버 컴포넌트용

```typescript
// lib/supabase/server.ts
import { createClerkSupabaseClient } from '@/lib/supabase/server';

export default async function MyPage() {
  const supabase = createClerkSupabaseClient();
  
  const { data, error } = await supabase
    .from('tasks')
    .select('*');
  
  if (error) {
    throw error;
  }
  
  return <div>{/* 데이터 렌더링 */}</div>;
}
```

### Server Actions용

```typescript
// actions/tasks.ts
'use server';

import { createClerkSupabaseClient } from '@/lib/supabase/server';

export async function createTask(name: string) {
  const supabase = createClerkSupabaseClient();
  
  const { data, error } = await supabase
    .from('tasks')
    .insert({ name });
  
  if (error) {
    throw new Error('Failed to create task');
  }
  
  return data;
}
```

## RLS 정책 설정

Row Level Security (RLS)를 사용하여 사용자가 자신의 데이터만 접근할 수 있도록 제한합니다.

### 기본 RLS 정책 예제

```sql
-- 1. 테이블 생성 (user_id는 Clerk user ID를 저장)
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  user_id TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. RLS 활성화
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 3. SELECT 정책: 사용자는 자신의 tasks만 조회 가능
CREATE POLICY "Users can view their own tasks"
ON tasks
FOR SELECT
TO authenticated
USING (
  (SELECT auth.jwt()->>'sub') = user_id
);

-- 4. INSERT 정책: 사용자는 자신의 user_id로만 task 생성 가능
CREATE POLICY "Users can insert their own tasks"
ON tasks
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.jwt()->>'sub') = user_id
);

-- 5. UPDATE 정책: 사용자는 자신의 tasks만 수정 가능
CREATE POLICY "Users can update their own tasks"
ON tasks
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.jwt()->>'sub') = user_id
)
WITH CHECK (
  (SELECT auth.jwt()->>'sub') = user_id
);

-- 6. DELETE 정책: 사용자는 자신의 tasks만 삭제 가능
CREATE POLICY "Users can delete their own tasks"
ON tasks
FOR DELETE
TO authenticated
USING (
  (SELECT auth.jwt()->>'sub') = user_id
);
```

### RLS 정책 설명

- **`auth.jwt()->>'sub'`**: Clerk 세션 토큰에서 사용자 ID를 추출하는 함수
- **`TO authenticated`**: 인증된 사용자에게만 정책 적용
- **`USING`**: SELECT, UPDATE, DELETE 시 조건 검사
- **`WITH CHECK`**: INSERT, UPDATE 시 데이터 검증

## 사용 예제

### 예제 1: Todo 앱 (Client Component)

```tsx
'use client';

import { useClerkSupabaseClient } from '@/lib/supabase/clerk-client';
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

interface Task {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export default function TodoPage() {
  const supabase = useClerkSupabaseClient();
  const { user } = useUser();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [taskName, setTaskName] = useState('');

  useEffect(() => {
    if (!user) return;

    async function loadTasks() {
      setLoading(true);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading tasks:', error);
      } else {
        setTasks(data || []);
      }
      setLoading(false);
    }

    loadTasks();
  }, [user, supabase]);

  async function handleCreateTask(e: React.FormEvent) {
    e.preventDefault();
    
    const { error } = await supabase
      .from('tasks')
      .insert({ name: taskName });

    if (error) {
      console.error('Error creating task:', error);
    } else {
      setTaskName('');
      // 데이터 다시 로드
      const { data } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });
      setTasks(data || []);
    }
  }

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>My Tasks</h1>
      
      <form onSubmit={handleCreateTask}>
        <input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="Enter task name"
        />
        <button type="submit">Add Task</button>
      </form>

      <ul>
        {tasks.map((task) => (
          <li key={task.id}>{task.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

### 예제 2: Todo 앱 (Server Component + Server Actions)

```tsx
// app/tasks/page.tsx (Server Component)
import { createClerkSupabaseClient } from '@/lib/supabase/server';
import { createTask } from './actions';
import TaskForm from './task-form';

interface Task {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
}

export default async function TasksPage() {
  const supabase = createClerkSupabaseClient();
  
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (
    <div>
      <h1>My Tasks</h1>
      <TaskForm createTask={createTask} />
      <ul>
        {tasks?.map((task: Task) => (
          <li key={task.id}>{task.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

```tsx
// app/tasks/task-form.tsx (Client Component)
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TaskFormProps {
  createTask: (name: string) => Promise<void>;
}

export default function TaskForm({ createTask }: TaskFormProps) {
  const [taskName, setTaskName] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await createTask(taskName);
    setTaskName('');
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={taskName}
        onChange={(e) => setTaskName(e.target.value)}
        placeholder="Enter task name"
      />
      <button type="submit">Add Task</button>
    </form>
  );
}
```

```typescript
// app/tasks/actions.ts (Server Actions)
'use server';

import { createClerkSupabaseClient } from '@/lib/supabase/server';

export async function createTask(name: string) {
  const supabase = createClerkSupabaseClient();
  
  const { error } = await supabase
    .from('tasks')
    .insert({ name });

  if (error) {
    throw new Error('Failed to create task');
  }
}
```

## 문제 해결

### 문제 1: "Invalid JWT" 에러

**원인**: Supabase에서 Clerk 토큰을 인식하지 못함

**해결 방법**:
1. Supabase Dashboard에서 Clerk Provider 설정 확인
2. Issuer URL과 JWKS URI가 정확한지 확인
3. Clerk Domain이 올바른지 확인

### 문제 2: RLS 정책으로 인한 접근 거부

**원인**: RLS 정책이 올바르게 설정되지 않음

**해결 방법**:
1. `auth.jwt()->>'sub'`가 올바르게 작동하는지 확인
2. 정책의 `USING`과 `WITH CHECK` 조건 확인
3. 개발 중에는 RLS를 비활성화하여 테스트 (프로덕션에서는 활성화 필수)

### 문제 3: 토큰이 전달되지 않음

**원인**: 클라이언트/서버 컴포넌트에서 잘못된 Supabase 클라이언트 사용

**해결 방법**:
- Client Component: `useClerkSupabaseClient()` 사용
- Server Component: `createClerkSupabaseClient()` 사용
- 공개 데이터만 필요한 경우: `lib/supabase/client.ts`의 기본 클라이언트 사용

## 추가 리소스

- [Clerk 공식 Supabase 통합 가이드](https://clerk.com/docs/guides/development/integrations/databases/supabase)
- [Supabase Third-Party Auth 문서](https://supabase.com/docs/guides/auth/third-party/overview)
- [Supabase RLS 가이드](https://supabase.com/docs/guides/auth/row-level-security)

