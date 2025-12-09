-- ============================================
-- Comment Likes 테이블 생성
-- ============================================

-- comment_likes 테이블 생성
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(comment_id, user_id)
);

ALTER TABLE public.comment_likes OWNER TO postgres;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- RLS 비활성화 (개발 환경)
ALTER TABLE public.comment_likes DISABLE ROW LEVEL SECURITY;

-- 권한 부여
GRANT ALL ON TABLE public.comment_likes TO anon;
GRANT ALL ON TABLE public.comment_likes TO authenticated;
GRANT ALL ON TABLE public.comment_likes TO service_role;

