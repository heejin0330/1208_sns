/**
 * @file lib/clerk/localization.ts
 * @description Clerk 한국어 로컬라이제이션 설정
 *
 * Clerk 공식 문서의 모범 사례를 따라 한국어 로컬라이제이션을 설정합니다.
 * 기본 한국어 로컬라이제이션에 커스텀 메시지를 추가할 수 있습니다.
 *
 * @see https://clerk.com/docs/guides/customizing-clerk/localization
 */

import { koKR } from '@clerk/localizations';

/**
 * 한국어 로컬라이제이션 설정
 *
 * 기본 한국어 로컬라이제이션을 사용하되, 필요시 커스텀 메시지를 추가할 수 있습니다.
 *
 * @example
 * ```tsx
 * import { clerkLocalization } from '@/lib/clerk/localization';
 *
 * <ClerkProvider localization={clerkLocalization}>
 *   {children}
 * </ClerkProvider>
 * ```
 */
export const clerkLocalization = {
  ...koKR,
  
  // 필요시 커스텀 메시지 추가
  // 예: 애플리케이션 이름을 사용한 커스텀 메시지
  // signUp: {
  //   start: {
  //     subtitle: '{{applicationName}}에 가입하여 시작하세요',
  //   },
  // },
  
  // 커스텀 에러 메시지
  unstable__errors: {
    ...koKR.unstable__errors,
    // 필요시 특정 에러 메시지 커스터마이징
    // not_allowed_access: '접근이 허용되지 않았습니다. 관리자에게 문의하세요.',
  },
};

