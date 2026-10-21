import { supabase } from "@/integrations/supabase/client";

export type PostStatus = "idea" | "drafting" | "scheduled" | "published";
export type Platform = "instagram" | "facebook" | "linkedin" | "x" | "tiktok";

export interface Post {
  id: string;
  user_id: string;
  title: string;
  caption: string | null;
  platform: Platform;
  status: PostStatus;
  scheduled_for: string | null;
  ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

export type NewPost = Omit<Post, "id" | "user_id" | "created_at" | "updated_at">;

export const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  linkedin: "LinkedIn",
  x: "X / Twitter",
  tiktok: "TikTok",
};

export const STATUS_LABELS: Record<PostStatus, string> = {
  idea: "Ideia",
  drafting: "Rascunho",
  scheduled: "Agendado",
  published: "Publicado",
};

export const KANBAN_COLUMNS: { key: PostStatus; label: string; hint: string }[] = [
  { key: "idea", label: "Ideias", hint: "Pautas a explorar" },
  { key: "drafting", label: "Rascunhos", hint: "Em produção" },
  { key: "scheduled", label: "Agendados", hint: "Com data marcada" },
  { key: "published", label: "Publicados", hint: "No ar" },
];

// The generated Database type is empty until the migration lands, so we go
// through a loosely-typed handle to avoid `never`-table type errors while the
// schema is applied and types regenerate.
const postsTable = () => (supabase as unknown as { from: (table: string) => any }).from("posts");

export async function fetchPosts(): Promise<Post[]> {
  const { data, error } = await postsTable().select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Post[];
}

export async function createPost(input: NewPost): Promise<Post> {
  const { data, error } = await postsTable().insert(input).select().single();
  if (error) throw error;
  return data as Post;
}

export async function updatePost(id: string, patch: Partial<NewPost>): Promise<Post> {
  const { data, error } = await postsTable().update(patch).eq("id", id).select().single();
  if (error) throw error;
  return data as Post;
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await postsTable().delete().eq("id", id);
  if (error) throw error;
}
