import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import {
  Users,
  FileText,
  ShieldCheck,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  Crown,
} from "lucide-react";
import {
  getAdminDashboard,
  updateUserRole,
  type AdminUser,
  type AdminMetrics,
} from "@/lib/admin.functions";
import { PLATFORM_LABELS, STATUS_LABELS, type Platform, type PostStatus } from "@/lib/posts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin — OA Flow" },
      {
        name: "description",
        content: "Painel administrativo do OA Flow: usuários, posts e métricas globais.",
      },
      { property: "og:title", content: "Admin — OA Flow" },
      {
        property: "og:description",
        content: "Painel administrativo do OA Flow: usuários, posts e métricas globais.",
      },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: getAdminDashboard,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    const msg =
      error.message?.includes("Forbidden") || error.message?.includes("admin")
        ? "Acesso restrito a administradores."
        : "Não foi possível carregar o painel.";
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="text-center">
          <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground" />
          <h1 className="mt-4 font-display text-xl font-semibold">{msg}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Verifique seu papel de administrador em Mais → Cloud.
          </p>
          <Button asChild className="mt-6">
            <Link to="/dashboard">Voltar ao painel</Link>
          </Button>
        </div>
      </div>
    );
  }

  const users = data?.users ?? [];
  const metrics = data?.metrics;

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="font-display text-3xl font-bold tracking-tight">Admin</h1>
          </div>
          <p className="mt-1.5 text-muted-foreground">
            Visão global de usuários, posts e atividade da plataforma.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <Crown className="h-3.5 w-3.5" />
          Painel administrativo
        </span>
      </header>

      {metrics && <OverviewCards metrics={metrics} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <UsersTable users={users} />
        </div>
        <div className="space-y-6">{metrics && <DistributionCards metrics={metrics} />}</div>
      </div>
    </div>
  );
}

function OverviewCards({ metrics }: { metrics: AdminMetrics }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard icon={<Users className="h-5 w-5" />} label="Usuários" value={metrics.totalUsers} />
      <StatCard
        icon={<FileText className="h-5 w-5" />}
        label="Posts totais"
        value={metrics.totalPosts}
        tint="accent"
      />
      <StatCard
        icon={<ShieldCheck className="h-5 w-5" />}
        label="Administradores"
        value={metrics.totalAdmins}
        tint="chart-3"
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  tint = "primary",
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tint?: "primary" | "accent" | "chart-3";
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "grid h-10 w-10 place-items-center rounded-xl",
            tint === "primary" && "bg-primary/10 text-primary",
            tint === "accent" && "bg-accent/20 text-accent-foreground",
            tint === "chart-3" && "bg-chart-3/20 text-chart-3",
          )}
        >
          {icon}
        </span>
        <span className="font-display text-3xl font-bold tabular-nums">{value}</span>
      </div>
      <p className="mt-3 text-sm text-muted-foreground">{label}</p>
    </Card>
  );
}

function UsersTable({ users }: { users: AdminUser[] }) {
  const queryClient = useQueryClient();
  const toggleFn = useServerFn(updateUserRole);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function toggle(user: AdminUser) {
    if (busyId) return;
    const nextRole = user.role === "admin" ? "user" : "admin";
    setBusyId(user.id);
    try {
      const fresh = await toggleFn({ data: { userId: user.id, role: nextRole } });
      queryClient.setQueryData(["admin-dashboard"], fresh);
      toast.success(nextRole === "admin" ? "Administrador atribuído." : "Papel de admin removido.");
    } catch {
      toast.error("Não foi possível atualizar o papel.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <Card className="p-0">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <div>
          <h2 className="font-display text-lg font-semibold">Usuários</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {users.length} conta{users.length === 1 ? "" : "s"} cadastrada
            {users.length === 1 ? "" : "s"}
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users className="h-4 w-4" />
          Gestão de acesso
        </span>
      </div>
      <div className="divide-y divide-border">
        {users.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-muted-foreground">
            Nenhum usuário cadastrado ainda.
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="flex items-center gap-4 px-5 py-3.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                {(user.email || "A").charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{user.email}</p>
                <p className="text-xs text-muted-foreground">
                  Entrou em{" "}
                  {new Date(user.createdAt).toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
              {user.role === "admin" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                  <Crown className="h-3 w-3" />
                  Admin
                </span>
              ) : (
                <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
                  Usuário
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                disabled={busyId === user.id}
                onClick={() => toggle(user)}
                className="shrink-0"
              >
                {busyId === user.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : user.role === "admin" ? (
                  "Remover admin"
                ) : (
                  "Tornar admin"
                )}
              </Button>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}

function DistributionCards({ metrics }: { metrics: AdminMetrics }) {
  const statuses = useMemo(
    () =>
      (Object.keys(STATUS_LABELS) as PostStatus[]).map((s) => ({
        key: s,
        label: STATUS_LABELS[s],
        count: metrics.postsByStatus[s] ?? 0,
      })),
    [metrics],
  );
  const platforms = useMemo(
    () =>
      (Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => ({
        key: p,
        label: PLATFORM_LABELS[p],
        count: metrics.postsByPlatform[p] ?? 0,
      })),
    [metrics],
  );

  return (
    <>
      <Card className="p-5">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <h2 className="font-display text-lg font-semibold">Por status</h2>
        </div>
        <ul className="mt-4 space-y-3 text-sm">
          {statuses.map((s) => {
            const pct = metrics.totalPosts ? (s.count / metrics.totalPosts) * 100 : 0;
            return (
              <li key={s.key}>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>{s.label}</span>
                  <span className="font-medium text-foreground">{s.count}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent-foreground" />
          <h2 className="font-display text-lg font-semibold">Por plataforma</h2>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {platforms.map((p) => (
            <li key={p.key} className="flex items-center justify-between text-muted-foreground">
              <span>{p.label}</span>
              <span className="font-medium text-foreground">{p.count}</span>
            </li>
          ))}
        </ul>
      </Card>

      {metrics.postsByUser.length > 0 && (
        <Card className="p-5">
          <h2 className="font-display text-lg font-semibold">Top criadores</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {metrics.postsByUser.slice(0, 5).map((u, i) => (
              <li key={`${u.email}-${i}`} className="flex items-center justify-between">
                <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">{u.email}</span>
                </span>
                <span className="font-medium text-foreground">{u.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
