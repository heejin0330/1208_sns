/**
 * @file app/tasks-example/create-task-form.tsx
 * @description 할 일 생성 폼 컴포넌트 (Client Component)
 *
 * Server Action을 사용하여 할 일을 생성합니다.
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createTask } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function CreateTaskForm() {
  const router = useRouter();
  const [taskName, setTaskName] = useState('');
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    if (!taskName.trim()) {
      return;
    }

    startTransition(async () => {
      try {
        await createTask(taskName.trim());
        setTaskName('');
        router.refresh(); // 서버 컴포넌트 데이터 새로고침
      } catch (error) {
        console.error('Error creating task:', error);
        alert('할 일을 생성하는 중 오류가 발생했습니다.');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mb-6">
      <div className="flex gap-2">
        <Input
          type="text"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="할 일을 입력하세요..."
          disabled={isPending}
          className="flex-1"
        />
        <Button type="submit" disabled={isPending || !taskName.trim()}>
          {isPending ? '추가 중...' : '추가'}
        </Button>
      </div>
    </form>
  );
}

