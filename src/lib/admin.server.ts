import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface AdminUser {
  id: string;
  email: string;
  createdAt: string;
  role: "admin" | "user";
}

export interface AdminMetrics {
  totalUsers: number;
  totalPosts: number;
  totalAdmins: number;
  postsByStatus: Record<string, number>;
  postsByPlatform: Record<string, number>;
  postsByUser: { email: string; count: number }[];
}

function newKeyCheck(value: string): boolean {
  return value.startsWith("sb_publishable_") || value.startsWith("sb_secret_");
}

function adminFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(
      typeof Request !== "undefined" && input instanceof Request ? input.headers : undefined,
    );
    if (init?.headers) new Headers(init.headers).forEach((v, k) => headers.set(k, v));
    if (newKeyCheck(key) && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

export function makeAdminClient() {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) {
    throw new Error(
      "Variáveis do Cloud ausentes (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). Habilite o Cloud.",
    );
  }
  return createClient<Database>(url, key, {
    global: { fetch: adminFetch(key) },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function requireAdmin(userId: string): Promise<void> {
  const admin = makeAdminClient();
  const { data, error } = await admin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error || !data) {
    throw new Error("Forbidden: acesso restrito a administradores.");
  }
}

export async function listAllPosts(client: ReturnType<typeof makeAdminClient>) {
  const { data, error } = await client
    .from("posts")
    .select("id,user_id,title,platform,status,scheduled_for,ai_generated,created_at,updated_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function listAllUsers(
  client: ReturnType<typeof makeAdminClient>,
): Promise<AdminUser[]> {
  const { data: authUsers, error } = await adminListUsers();
  if (error) throw error;
  const users = authUsers ?? [];

  const { data: roles } = await client.from("user_roles").select("user_id,role");
  const adminIds = new Set((roles ?? []).filter((r) => r.role === "admin").map((r) => r.user_id));

  return users.map((u: AuthUserRow) => ({
    id: u.id,
    email: u.email ?? "(sem e-mail)",
    createdAt: u.created_at,
    role: adminIds.has(u.id) ? "admin" : "user",
  }));
}

interface AuthUserRow {
  id: string;
  email?: string | null;
  created_at: string;
}

async function adminListUsers() {
  const url = `${process.env["SUPABASE_URL"]}/auth/v1/admin/users`;
  const key = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  if (!url || !key) {
    throw new Error("Variáveis do Cloud ausentes. Habilite o Cloud.");
  }
  const res = await fetch(url, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Falha ao listar usuários: ${res.status} ${text}`);
  }
  const json = await res.json();
  return { data: json.users ?? [], error: null as null | Error };
}

export async function setRole(
  client: ReturnType<typeof makeAdminClient>,
  userId: string,
  role: "admin" | "user",
) {
  if (role === "admin") {
    const { error } = await client
      .from("user_roles")
      .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" })
      .eq("user_id", userId)
      .eq("role", "admin");
    if (error) throw error;
  } else {
    const { error } = await client
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "admin");
    if (error) throw error;
  }
}

export async function buildMetrics(
  client: ReturnType<typeof makeAdminClient>,
  users: AdminUser[],
): Promise<AdminMetrics> {
  const posts = await listAllPosts(client);
  const byStatus: Record<string, number> = {};
  const byPlatform: Record<string, number> = {};
  const byUserCount = new Map<string, number>();
  for (const p of posts) {
    byStatus[p.status] = (byStatus[p.status] ?? 0) + 1;
    byPlatform[p.platform] = (byPlatform[p.platform] ?? 0) + 1;
    byUserCount.set(p.user_id, (byUserCount.get(p.user_id) ?? 0) + 1);
  }
  const emailById = new Map(users.map((u) => [u.id, u.email]));
  const postsByUser = [...byUserCount.entries()]
    .map(([uid, count]) => ({ email: emailById.get(uid) ?? "—", count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalUsers: users.length,
    totalPosts: posts.length,
    totalAdmins: users.filter((u) => u.role === "admin").length,
    postsByStatus: byStatus,
    postsByPlatform: byPlatform,
    postsByUser,
  };
}
