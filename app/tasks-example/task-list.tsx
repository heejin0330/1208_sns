/**
 * @file app/tasks-example/task-list.tsx
 * @description 할 일 목록 컴포넌트 (Client Component)
 *
 * 할 일 목록을 표시하고 완료/삭제 기능을 제공합니다.
 */

'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateTask, deleteTask } from './actions';
import { Button } from '@/components/ui/button';

interface Task {
  id: string;
  name: string;
  user_id: string;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

interface TaskListProps {
  initialTasks: Task[];
}

export default function TaskList({ initialTasks }: TaskListProps) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [isPending, startTransition] = useTransition();

  async function handleToggleComplete(taskId: string, currentCompleted: boolean) {
    startTransition(async () => {
      try {
        await updateTask(taskId, { completed: !currentCompleted });
        router.refresh();
      } catch (error) {
        console.error('Error updating task:', error);
        alert('할 일을 업데이트하는 중 오류가 발생했습니다.');
      }
    });
  }

  async function handleDelete(taskId: string) {
    if (!confirm('정말 삭제하시겠습니까?')) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteTask(taskId);
        router.refresh();
      } catch (error) {
        console.error('Error deleting task:', error);
        alert('할 일을 삭제하는 중 오류가 발생했습니다.');
      }
    });
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        할 일이 없습니다. 위에서 새 할 일을 추가해보세요!
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {tasks.map((task) => (
        <li
          key={task.id}
          className={`flex items-center gap-3 p-3 border rounded-lg ${
            task.completed ? 'bg-gray-50' : 'bg-white'
          }`}
        >
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => handleToggleComplete(task.id, task.completed)}
            disabled={isPending}
            className="w-4 h-4"
          />
          <span
            className={`flex-1 ${
              task.completed
                ? 'line-through text-gray-500'
                : 'text-gray-900'
            }`}
          >
            {task.name}
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => handleDelete(task.id)}
            disabled={isPending}
          >
            삭제
          </Button>
        </li>
      ))}
    </ul>
  );
}

