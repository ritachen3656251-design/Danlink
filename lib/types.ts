/**
 * 用户/档案类型：与 Supabase public.profiles 及前端 current_user 一致
 */
export interface User {
  id: string;
  profileId?: string;
  name: string;
  major?: string;
  year?: string;
  /** 学院，如 哲学学院 */
  college?: string;
  /** 届数，如 2024届 */
  graduation_year?: string;
  /** 头像 URL（与 profiles.avatar_url 一致） */
  avatar?: string;
}

/**
 * Supabase profiles 表行类型（含新增字段）
 */
export interface ProfileRow {
  id: string;
  student_id: string;
  name: string;
  major?: string;
  year?: string;
  avatar_url?: string;
  college?: string;
  graduation_year?: string;
  created_at?: string;
  updated_at?: string;
}
