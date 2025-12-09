/**
 * @file app/instruments/page.tsx
 * @description Supabase 공식 문서 예제 페이지
 *
 * Supabase 공식 문서의 Next.js Quickstart 예제를 기반으로 작성되었습니다.
 * https://supabase.com/docs/guides/getting-started/quickstarts/nextjs
 *
 * 이 페이지는 Supabase에서 instruments 테이블의 데이터를 조회하여 표시합니다.
 *
 * @dependencies
 * - @supabase/supabase-js: Supabase 클라이언트
 * - @clerk/nextjs: Clerk 인증 (통합)
 */

import { createClient } from '@/lib/supabase/server';
import { Suspense } from 'react';

interface Instrument {
  id: number;
  name: string;
}

/**
 * Instruments 데이터를 Supabase에서 조회하는 Server Component
 */
async function InstrumentsData() {
  // Supabase 공식 문서 모범 사례: async createClient() 사용
  const supabase = await createClient();
  
  // instruments 테이블에서 모든 데이터 조회
  const { data: instruments, error } = await supabase
    .from('instruments')
    .select('*');

  if (error) {
    console.error('Error loading instruments:', error);
    return (
      <div className="text-red-500">
        데이터를 불러오는 중 오류가 발생했습니다: {error.message}
      </div>
    );
  }

  if (!instruments || instruments.length === 0) {
    return (
      <div className="text-gray-500">
        instruments 테이블이 비어있거나 존재하지 않습니다.
        <br />
        Supabase Dashboard에서 instruments 테이블을 생성하고 데이터를 추가해주세요.
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">
        Instruments ({instruments.length}개)
      </h2>
      <ul className="space-y-2">
        {instruments.map((instrument: Instrument) => (
          <li
            key={instrument.id}
            className="p-3 border rounded-lg bg-white hover:bg-gray-50 transition-colors"
          >
            {instrument.name}
          </li>
        ))}
      </ul>
      
      {/* 디버깅용 JSON 출력 (개발 환경에서만) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            디버그: JSON 데이터 보기
          </summary>
          <pre className="mt-2 p-4 bg-gray-100 rounded-lg overflow-auto text-xs">
            {JSON.stringify(instruments, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}

/**
 * Instruments 페이지 메인 컴포넌트
 * 
 * Supabase 공식 문서 예제를 기반으로 작성되었습니다.
 * Suspense를 사용하여 로딩 상태를 처리합니다.
 */
export default function Instruments() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Instruments</h1>
      <p className="text-gray-600 mb-6">
        Supabase 공식 문서의 Next.js Quickstart 예제입니다.
        <br />
        <a
          href="https://supabase.com/docs/guides/getting-started/quickstarts/nextjs"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          공식 문서 보기 →
        </a>
      </p>

      <Suspense fallback={<div>Loading instruments...</div>}>
        <InstrumentsData />
      </Suspense>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-semibold mb-2">테이블 생성 SQL</h3>
        <p className="text-sm text-gray-700 mb-2">
          Supabase Dashboard의 SQL Editor에서 다음 SQL을 실행하여 테이블을 생성할 수 있습니다:
        </p>
        <pre className="text-xs bg-white p-3 rounded border overflow-auto">
          {`-- Create the table
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
USING (true);`}
        </pre>
      </div>
    </div>
  );
}





