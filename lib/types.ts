/**
 * @file types.ts
 * @description Instagram 클론 프로젝트의 TypeScript 타입 정의
 */

// 기본 데이터베이스 타입
export interface User {
  id: string;
  clerk_id: string;
  name: string;
  created_at: string;
}

export interface Post {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  updated_at: string;
}

export interface Like {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Follow {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
}

// 뷰 타입
export interface PostStats {
  post_id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

export interface UserStats {
  user_id: string;
  clerk_id: string;
  name: string;
  posts_count: number;
  followers_count: number;
  following_count: number;
}

// 확장 타입
export interface PostWithUser extends Post {
  user: User;
}

export interface PostWithStats extends Post {
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
}

export interface PostWithUserAndStats extends Post {
  user: User;
  likes_count: number;
  comments_count: number;
  is_liked?: boolean;
}

export interface CommentWithUser extends Comment {
  user: User;
  likes_count?: number;
  is_liked?: boolean;
}

// API 응답 타입
export interface PostsResponse {
  posts: PostWithUserAndStats[];
  has_more: boolean;
  next_offset?: number;
}

export interface UserResponse {
  user: User;
  stats: UserStats;
  is_following?: boolean;
}



