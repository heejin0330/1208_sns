/**
 * @file app/tasks-example/actions.ts
 * @description Server Actions for Tasks
 *
 * 할 일 생성, 수정, 삭제를 위한 Server Actions입니다.
 * Clerk 토큰이 자동으로 포함된 Supabase 클라이언트를 사용합니다.
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * 할 일 생성
 */
export async function createTask(name: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('tasks').insert({
    name,
    completed: false,
  });

  if (error) {
    console.error('Error creating task:', error);
    throw new Error('할 일을 생성하는 중 오류가 발생했습니다.');
  }

  revalidatePath('/tasks-example');
}

/**
 * 할 일 수정
 */
export async function updateTask(
  taskId: string,
  updates: { completed?: boolean; name?: string }
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId);

  if (error) {
    console.error('Error updating task:', error);
    throw new Error('할 일을 업데이트하는 중 오류가 발생했습니다.');
  }

  revalidatePath('/tasks-example');
}

/**
 * 할 일 삭제
 */
export async function deleteTask(taskId: string) {
  const supabase = await createClient();

  const { error } = await supabase.from('tasks').delete().eq('id', taskId);

  if (error) {
    console.error('Error deleting task:', error);
    throw new Error('할 일을 삭제하는 중 오류가 발생했습니다.');
  }

  revalidatePath('/tasks-example');
}

