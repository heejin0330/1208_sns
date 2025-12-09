-- Tasks 테이블 생성 및 RLS 정책 설정 예제
-- Clerk + Supabase 네이티브 통합을 위한 모범 사례

-- 1. Tasks 테이블 생성
-- user_id는 Clerk user ID를 저장하며, 기본값으로 현재 인증된 사용자의 ID를 사용
CREATE TABLE IF NOT EXISTS public.tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    user_id TEXT NOT NULL DEFAULT auth.jwt()->>'sub',
    completed BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 테이블 소유자 설정
ALTER TABLE public.tasks OWNER TO postgres;

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON public.tasks(created_at DESC);

-- 2. RLS 활성화
-- 개발 중에는 비활성화할 수 있으나, 프로덕션에서는 반드시 활성화해야 합니다
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 3. RLS 정책 생성

-- SELECT 정책: 사용자는 자신의 tasks만 조회 가능
CREATE POLICY "Users can view their own tasks"
ON public.tasks
FOR SELECT
TO authenticated
USING (
    (SELECT auth.jwt()->>'sub') = user_id
);

-- INSERT 정책: 사용자는 자신의 user_id로만 task 생성 가능
CREATE POLICY "Users can insert their own tasks"
ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
    (SELECT auth.jwt()->>'sub') = user_id
);

-- UPDATE 정책: 사용자는 자신의 tasks만 수정 가능
CREATE POLICY "Users can update their own tasks"
ON public.tasks
FOR UPDATE
TO authenticated
USING (
    (SELECT auth.jwt()->>'sub') = user_id
)
WITH CHECK (
    (SELECT auth.jwt()->>'sub') = user_id
);

-- DELETE 정책: 사용자는 자신의 tasks만 삭제 가능
CREATE POLICY "Users can delete their own tasks"
ON public.tasks
FOR DELETE
TO authenticated
USING (
    (SELECT auth.jwt()->>'sub') = user_id
);

-- 4. updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. 권한 부여
GRANT ALL ON TABLE public.tasks TO authenticated;
GRANT USAGE ON SEQUENCE IF EXISTS tasks_id_seq TO authenticated;

-- 주석 추가
COMMENT ON TABLE public.tasks IS '사용자별 할 일 목록 테이블 (Clerk user_id 기반)';
COMMENT ON COLUMN public.tasks.user_id IS 'Clerk 사용자 ID (auth.jwt()->>''sub''에서 추출)';
COMMENT ON COLUMN public.tasks.name IS '할 일 이름';
COMMENT ON COLUMN public.tasks.completed IS '완료 여부';





