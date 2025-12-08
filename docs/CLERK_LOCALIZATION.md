# Clerk 한국어 로컬라이제이션 가이드

이 문서는 Clerk 컴포넌트를 한국어로 설정하는 방법을 설명합니다.

## 개요

Clerk는 `@clerk/localizations` 패키지를 통해 다양한 언어를 지원합니다. 이 프로젝트는 한국어(`koKR`) 로컬라이제이션을 사용합니다.

## 현재 설정

프로젝트에는 이미 한국어 로컬라이제이션이 적용되어 있습니다:

```tsx
// app/layout.tsx
import { clerkLocalization } from '@/lib/clerk/localization';

<ClerkProvider localization={clerkLocalization}>
  {children}
</ClerkProvider>
```

## 로컬라이제이션 파일 구조

로컬라이제이션 설정은 `lib/clerk/localization.ts` 파일에서 관리됩니다:

```typescript
import { koKR } from '@clerk/localizations';

export const clerkLocalization = {
  ...koKR,
  // 커스텀 메시지 추가 가능
};
```

## 커스텀 로컬라이제이션

### 기본 사용법

기본 한국어 로컬라이제이션을 그대로 사용하려면:

```tsx
import { koKR } from '@clerk/localizations';

<ClerkProvider localization={koKR}>
  {children}
</ClerkProvider>
```

### 커스텀 메시지 추가

특정 텍스트를 브랜드에 맞게 변경하려면:

```typescript
// lib/clerk/localization.ts
import { koKR } from '@clerk/localizations';

export const clerkLocalization = {
  ...koKR,
  signUp: {
    ...koKR.signUp,
    start: {
      ...koKR.signUp?.start,
      subtitle: '{{applicationName}}에 가입하여 시작하세요',
    },
  },
  signIn: {
    ...koKR.signIn,
    start: {
      ...koKR.signIn?.start,
      subtitle: '{{applicationName}}에 로그인하세요',
    },
  },
};
```

### 에러 메시지 커스터마이징

에러 메시지를 커스터마이징하려면 `unstable__errors` 객체를 사용합니다:

```typescript
import { koKR } from '@clerk/localizations';

export const clerkLocalization = {
  ...koKR,
  unstable__errors: {
    ...koKR.unstable__errors,
    not_allowed_access: '접근이 허용되지 않았습니다. 관리자에게 문의하세요.',
    form_password_pwned: '이 비밀번호는 보안상 위험합니다. 다른 비밀번호를 사용해주세요.',
    form_username_invalid_length: '사용자 이름은 3자 이상이어야 합니다.',
  },
};
```

### 사용 가능한 에러 키

Clerk의 모든 에러 키는 [영어 로컬라이제이션 파일](https://github.com/clerk/javascript/blob/main/packages/localizations/src/en-US.ts)에서 확인할 수 있습니다. `unstable__errors` 객체를 검색하여 사용 가능한 키를 찾을 수 있습니다.

## 지원되는 언어

Clerk는 다음 언어를 지원합니다:

| 언어 | 키 |
|------|-----|
| 한국어 | `koKR` |
| 영어 (미국) | `enUS` |
| 영어 (영국) | `enGB` |
| 일본어 | `jaJP` |
| 중국어 (간체) | `zhCN` |
| 중국어 (번체) | `zhTW` |
| 프랑스어 | `frFR` |
| 독일어 | `deDE` |
| 스페인어 | `esES` |
| ... | ... |

전체 언어 목록은 [Clerk 공식 문서](https://clerk.com/docs/guides/customizing-clerk/localization#languages)를 참고하세요.

## 주의사항

### 실험적 기능

로컬라이제이션 기능은 현재 실험적(experimental) 기능입니다. 문제가 발생하면 [Clerk 지원팀](https://clerk.com/contact/support)에 문의하세요.

### Account Portal

로컬라이제이션은 애플리케이션 내의 Clerk 컴포넌트에만 적용됩니다. 호스팅된 [Clerk Account Portal](https://clerk.com/docs/guides/customizing-clerk/account-portal)은 여전히 영어로 표시됩니다.

## 예제

### 예제 1: 기본 한국어 사용

```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import { koKR } from '@clerk/localizations';

export default function RootLayout({ children }) {
  return (
    <ClerkProvider localization={koKR}>
      <html lang="ko">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### 예제 2: 커스텀 메시지 추가

```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import { koKR } from '@clerk/localizations';

const localization = {
  ...koKR,
  formButtonPrimary: '시작하기',
  formButtonSecondary: '취소',
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider localization={localization}>
      <html lang="ko">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

### 예제 3: 에러 메시지 커스터마이징

```tsx
// app/layout.tsx
import { ClerkProvider } from '@clerk/nextjs';
import { koKR } from '@clerk/localizations';

const localization = {
  ...koKR,
  unstable__errors: {
    ...koKR.unstable__errors,
    not_allowed_access:
      '이 이메일 도메인은 접근이 허용되지 않았습니다. 접근 권한이 필요하시면 관리자에게 문의하세요.',
  },
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider localization={localization}>
      <html lang="ko">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
```

## 참고 자료

- [Clerk 로컬라이제이션 공식 문서](https://clerk.com/docs/guides/customizing-clerk/localization)
- [영어 로컬라이제이션 파일 (GitHub)](https://github.com/clerk/javascript/blob/main/packages/localizations/src/en-US.ts)
- [한국어 로컬라이제이션 파일 (GitHub)](https://github.com/clerk/javascript/blob/main/packages/localizations/src/ko-KR.ts)

