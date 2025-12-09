"use client";

import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * @file ErrorDisplay.tsx
 * @description 에러 상태 표시 컴포넌트
 *
 * 사용자 친화적인 에러 메시지와 재시도 버튼을 제공합니다.
 *
 * @dependencies
 * - lucide-react: 아이콘
 * - @/components/ui/button: Button 컴포넌트
 */

interface ErrorDisplayProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
  variant?: "default" | "compact";
}

export default function ErrorDisplay({
  message = "오류가 발생했습니다",
  onRetry,
  className,
  variant = "default",
}: ErrorDisplayProps) {
  if (variant === "compact") {
    return (
      <div className={cn("flex items-center gap-2 text-sm text-red-600", className)}>
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <span>{message}</span>
        {onRetry && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRetry}
            className="h-auto p-1 text-red-600 hover:text-red-700"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 py-8 px-4 text-center",
        className,
      )}
    >
      <AlertCircle className="w-12 h-12 text-red-500" />
      <div className="space-y-2">
        <p className="text-lg font-medium text-[#262626]">{message}</p>
        <p className="text-sm text-[#8e8e8e]">
          잠시 후 다시 시도해주세요
        </p>
      </div>
      {onRetry && (
        <Button
          onClick={onRetry}
          className="bg-[#0095f6] hover:bg-[#0095f6]/90"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          다시 시도
        </Button>
      )}
    </div>
  );
}

