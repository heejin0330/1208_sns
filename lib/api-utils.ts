import { NextResponse } from "next/server";

/**
 * @file api-utils.ts
 * @description API 라우트 공통 유틸리티 함수
 *
 * 에러 응답 형식 표준화 및 사용자 친화적 메시지 제공
 */

/**
 * 성공 응답 생성
 */
export function successResponse<T>(data: T, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status },
  );
}

/**
 * 에러 응답 생성
 */
export function errorResponse(
  message: string,
  status: number = 500,
  code?: string,
) {
  return NextResponse.json(
    {
      success: false,
      error: message,
      ...(code && { code }),
    },
    { status },
  );
}

/**
 * HTTP 상태 코드에 따른 사용자 친화적 에러 메시지
 */
export function getErrorMessage(status: number, defaultMessage?: string): string {
  if (defaultMessage) {
    return defaultMessage;
  }

  switch (status) {
    case 401:
      return "로그인이 필요합니다";
    case 403:
      return "권한이 없습니다";
    case 404:
      return "요청한 항목을 찾을 수 없습니다";
    case 400:
      return "잘못된 요청입니다";
    case 500:
    default:
      return "서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요";
  }
}

/**
 * 네트워크 에러 확인
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error) {
    return (
      error.message.includes("fetch") ||
      error.message.includes("network") ||
      error.message.includes("NetworkError") ||
      error.name === "TypeError"
    );
  }
  return false;
}

