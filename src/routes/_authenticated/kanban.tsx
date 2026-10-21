import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, GripVertical, CalendarDays } from "lucide-react";
import {
  fetchPosts,
  updatePost,
  KANBAN_COLUMNS,
  PLATFORM_LABELS,
  type Post,
  type PostStatus,
} from "@/lib/posts";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/kanban")({
  head: () => ({
    meta: [
      { title: "Fluxo Kanban — OA Flow" },
      {
        name: "description",
        content: "Acompanhe seus posts da ideia à publicação no quadro kanban.",
      },
    ],
  }),
  component: KanbanPage,
});

function KanbanPage() {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });
  const qc = useQueryClient();
  const [dragId, setDragId] = useState<string | null>(null);
  const [overCol, setOverCol] = useState<PostStatus | null>(null);

  async function move(post: Post, status: PostStatus) {
    if (post.status === status) return;
    // optimistic
    qc.setQueryData<Post[]>(["posts"], (old) =>
      (old ?? []).map((p) => (p.id === post.id ? { ...p, status } : p)),
    );
    try {
      await updatePost(post.id, { status });
      await qc.invalidateQueries({ queryKey: ["posts"] });
    } catch (err) {
      qc.setQueryData<Post[]>(["posts"], (old) =>
        (old ?? []).map((p) => (p.id === post.id ? { ...p, status: post.status } : p)),
      );
      toast.error(err instanceof Error ? err.message : "Erro ao mover.");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold tracking-tight">Fluxo</h1>
        <p className="mt-1.5 text-muted-foreground">Arraste os cards para mover entre etapas.</p>
      </header>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando…
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {KANBAN_COLUMNS.map((col) => {
            const items = posts.filter((p) => p.status === col.key);
            return (
              <div
                key={col.key}
                onDragOver={(e) => {
                  e.preventDefault();
                  setOverCol(col.key);
                }}
                onDragLeave={() => setOverCol((c) => (c === col.key ? null : c))}
                onDrop={() => {
                  if (dragId) {
                    const post = posts.find((p) => p.id === dragId);
                    if (post) move(post, col.key);
                  }
                  setDragId(null);
                  setOverCol(null);
                }}
                className={cn(
                  "flex flex-col rounded-2xl border border-border bg-muted/40 p-3 transition-colors",
                  overCol === col.key && "border-primary/60 bg-primary/5",
                )}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <div>
                    <h2 className="font-display text-sm font-semibold text-foreground">
                      {col.label}
                    </h2>
                    <p className="text-xs text-muted-foreground">{col.hint}</p>
                  </div>
                  <span className="rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {items.length}
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  {items.map((post) => (
                    <KanbanCard
                      key={post.id}
                      post={post}
                      onDragStart={() => setDragId(post.id)}
                      onDragEnd={() => setDragId(null)}
                    />
                  ))}
                  {items.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-foreground">
                      Solte um post aqui
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function KanbanCard({
  post,
  onDragStart,
  onDragEnd,
}: {
  post: Post;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  return (
    <Card
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="cursor-grab p-3 shadow-sm transition-shadow active:cursor-grabbing active:shadow-md"
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-foreground">{post.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">{PLATFORM_LABELS[post.platform]}</p>
          {post.scheduled_for && (
            <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarDays className="h-3 w-3" />
              {new Date(post.scheduled_for).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
              })}
            </p>
          )}
        </div>
      </div>
    </Card>
  );
}
