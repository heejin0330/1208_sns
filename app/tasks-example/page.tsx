/**
 * @file app/tasks-example/page.tsx
 * @description Clerk + Supabase 통합 예제 페이지
 *
 * 이 페이지는 Clerk와 Supabase의 네이티브 통합을 사용하여
 * 사용자별 할 일 목록을 관리하는 예제를 보여줍니다.
 *
 * 주요 기능:
 * 1. Server Component에서 데이터 로드
 * 2. Server Actions를 통한 데이터 생성/수정/삭제
 * 3. RLS 정책을 통한 사용자별 데이터 격리
 *
 * @dependencies
 * - @clerk/nextjs: Clerk 인증
 * - @supabase/supabase-js: Supabase 클라이언트
 * - next/navigation: 라우팅
 */

import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import TaskList from './task-list';
import CreateTaskForm from './create-task-form';

interface Task {
  id: string;
  name: string;
  user_id: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export default async function TasksExamplePage() {
  // 인증 확인
  const { userId } = await auth();
  
  if (!userId) {
    redirect('/sign-in');
  }

  // Supabase 클라이언트 생성 (Clerk 토큰 자동 포함)
  // Supabase 공식 문서 모범 사례: async createClient() 사용
  const supabase = await createClient();

  // 사용자의 할 일 목록 조회 (RLS 정책에 의해 자신의 데이터만 반환됨)
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading tasks:', error);
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">할 일 목록</h1>
        <p className="text-red-500">데이터를 불러오는 중 오류가 발생했습니다.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">할 일 목록</h1>
      <p className="text-gray-600 mb-4">
        Clerk와 Supabase 네이티브 통합 예제입니다. RLS 정책에 의해 자신의 할 일만 표시됩니다.
      </p>

      <CreateTaskForm />

      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-4">
          내 할 일 ({tasks?.length || 0}개)
        </h2>
        <TaskList initialTasks={tasks as Task[] || []} />
      </div>
    </div>
  );
}

