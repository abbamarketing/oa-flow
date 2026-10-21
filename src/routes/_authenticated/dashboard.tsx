import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, CalendarDays, Layers, FileText, ArrowUpRight, Plus } from "lucide-react";
import {
  fetchPosts,
  PLATFORM_LABELS,
  STATUS_LABELS,
  type Post,
  type PostStatus,
} from "@/lib/posts";
import { useAuthSession } from "@/hooks/use-auth-session";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Painel — OA Flow" },
      {
        name: "description",
        content: "Visão geral dos seus posts, agendamentos e fluxo de conteúdo.",
      },
    ],
  }),
  component: DashboardPage,
});

const STATUS_COLORS: Record<PostStatus, string> = {
  idea: "bg-accent/20 text-accent-foreground",
  drafting: "bg-chart-4/20 text-chart-4",
  scheduled: "bg-primary/15 text-primary",
  published: "bg-chart-3/20 text-chart-3",
};

function DashboardPage() {
  const { user } = useAuthSession();
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  const stats = {
    total: posts.length,
    ideas: posts.filter((p) => p.status === "idea").length,
    scheduled: posts.filter((p) => p.status === "scheduled").length,
    published: posts.filter((p) => p.status === "published").length,
  };

  const recent = posts.slice(0, 5);
  const firstName = user?.email?.split("@")[0] ?? "gente";

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Olá, {firstName} 👋</h1>
          <p className="mt-1.5 text-muted-foreground">Veja como está seu fluxo de conteúdo hoje.</p>
        </div>
        <Button asChild>
          <Link to="/posts">
            <Plus className="mr-1.5 h-4 w-4" />
            Novo post
          </Link>
        </Button>
      </header>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<FileText className="h-5 w-5" />}
          label="Total de posts"
          value={stats.total}
        />
        <StatCard
          icon={<Layers className="h-5 w-5" />}
          label="Ideias"
          value={stats.ideas}
          tint="accent"
        />
        <StatCard
          icon={<CalendarDays className="h-5 w-5" />}
          label="Agendados"
          value={stats.scheduled}
          tint="primary"
        />
        <StatCard
          icon={<Sparkles className="h-5 w-5" />}
          label="Publicados"
          value={stats.published}
          tint="chart-3"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent */}
        <Card className="lg:col-span-2 p-0">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-display text-lg font-semibold">Posts recentes</h2>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/posts">
                Ver todos
                <ArrowUpRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="divide-y divide-border">
            {isLoading ? (
              <div className="px-5 py-10 text-center text-sm text-muted-foreground">
                Carregando…
              </div>
            ) : recent.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <p className="text-sm text-muted-foreground">
                  Nenhum post ainda. Que tal criar o primeiro?
                </p>
                <Button asChild className="mt-4" size="sm">
                  <Link to="/posts">
                    <Plus className="mr-1.5 h-4 w-4" />
                    Criar post
                  </Link>
                </Button>
              </div>
            ) : (
              recent.map((post) => <RecentRow key={post.id} post={post} />)
            )}
          </div>
        </Card>

        {/* Distribution + quick links */}
        <div className="space-y-6">
          <Card className="p-5">
            <h2 className="font-display text-lg font-semibold">Distribuição</h2>
            <p className="mt-1 text-sm text-muted-foreground">Por status do fluxo</p>
            <div className="mt-5 flex h-3 w-full overflow-hidden rounded-full bg-muted">
              {(["idea", "drafting", "scheduled", "published"] as PostStatus[]).map((s) => {
                const count = posts.filter((p) => p.status === s).length;
                const pct = stats.total ? (count / stats.total) * 100 : 0;
                return (
                  <div
                    key={s}
                    className={cn(
                      "h-full",
                      s === "idea" && "bg-accent",
                      s === "drafting" && "bg-chart-4",
                      s === "scheduled" && "bg-primary",
                      s === "published" && "bg-chart-3",
                    )}
                    style={{ width: `${pct}%` }}
                    title={`${STATUS_LABELS[s]}: ${count}`}
                  />
                );
              })}
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {(["idea", "drafting", "scheduled", "published"] as PostStatus[]).map((s) => (
                <li key={s} className="flex items-center justify-between text-muted-foreground">
                  <span className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2.5 w-2.5 rounded-full",
                        s === "idea" && "bg-accent",
                        s === "drafting" && "bg-chart-4",
                        s === "scheduled" && "bg-primary",
                        s === "published" && "bg-chart-3",
                      )}
                    />
                    {STATUS_LABELS[s]}
                  </span>
                  <span className="font-medium text-foreground">
                    {posts.filter((p) => p.status === s).length}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="p-5">
            <h2 className="font-display text-lg font-semibold">Atalhos</h2>
            <div className="mt-3 grid gap-2">
              <QuickLink
                to="/assistant"
                icon={<Sparkles className="h-4 w-4" />}
                label="Gerar copy com IA"
              />
              <QuickLink
                to="/calendar"
                icon={<CalendarDays className="h-4 w-4" />}
                label="Abrir calendário"
              />
              <QuickLink
                to="/kanban"
                icon={<Layers className="h-4 w-4" />}
                label="Ver fluxo kanban"
              />
            </div>
          </Card>
        </div>
      </div>
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

function RecentRow({ post }: { post: Post }) {
  return (
    <div className="flex items-center gap-4 px-5 py-3.5">
      <span
        className={cn("rounded-full px-2.5 py-1 text-xs font-medium", STATUS_COLORS[post.status])}
      >
        {STATUS_LABELS[post.status]}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{post.title}</p>
        <p className="text-xs text-muted-foreground">{PLATFORM_LABELS[post.platform]}</p>
      </div>
      {post.scheduled_for && (
        <span className="hidden text-xs text-muted-foreground sm:block">
          {new Date(post.scheduled_for).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
          })}
        </span>
      )}
    </div>
  );
}

function QuickLink({
  to,
  icon,
  label,
}: {
  to: "/assistant" | "/calendar" | "/kanban";
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      to={to}
      className="flex items-center gap-2.5 rounded-lg border border-border px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted"
    >
      <span className="text-primary">{icon}</span>
      {label}
      <ArrowUpRight className="ml-auto h-4 w-4 text-muted-foreground" />
    </Link>
  );
}
