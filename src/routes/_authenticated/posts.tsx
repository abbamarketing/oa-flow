import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Loader2, Sparkles } from "lucide-react";
import {
  fetchPosts,
  createPost,
  updatePost,
  deletePost,
  PLATFORM_LABELS,
  STATUS_LABELS,
  type Post,
  type PostStatus,
  type Platform,
  type NewPost,
} from "@/lib/posts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/posts")({
  head: () => ({
    meta: [
      { title: "Posts — OA Flow" },
      {
        name: "description",
        content: "Crie, edite e gerencie seus posts de redes sociais.",
      },
    ],
  }),
  component: PostsPage,
});

const STATUS_COLORS: Record<PostStatus, string> = {
  idea: "bg-accent/20 text-accent-foreground",
  drafting: "bg-chart-4/20 text-chart-4",
  scheduled: "bg-primary/15 text-primary",
  published: "bg-chart-3/20 text-chart-3",
};

const EMPTY: NewPost = {
  title: "",
  caption: "",
  platform: "instagram",
  status: "idea",
  scheduled_for: null,
  ai_generated: false,
};

function PostsPage() {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });
  const [editing, setEditing] = useState<Post | null>(null);
  const [open, setOpen] = useState(false);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

  function openEdit(post: Post) {
    setEditing(post);
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Posts</h1>
          <p className="mt-1.5 text-muted-foreground">
            Gerencie todas as suas publicações em um só lugar.
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-1.5 h-4 w-4" />
          Novo post
        </Button>
      </header>

      <Card className="p-0">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando…
          </div>
        ) : posts.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold">Nenhum post ainda</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Crie seu primeiro post ou peça uma legenda ao assistente de IA.
            </p>
            <div className="mt-5 flex justify-center gap-3">
              <Button onClick={openNew}>
                <Plus className="mr-1.5 h-4 w-4" />
                Criar post
              </Button>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {posts.map((post) => (
              <li key={post.id} className="flex flex-wrap items-center gap-3 px-5 py-4">
                <span
                  className={cn(
                    "rounded-full px-2.5 py-1 text-xs font-medium",
                    STATUS_COLORS[post.status],
                  )}
                >
                  {STATUS_LABELS[post.status]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{post.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {PLATFORM_LABELS[post.platform]}
                    {post.scheduled_for
                      ? ` · ${new Date(post.scheduled_for).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`
                      : ""}
                    {post.ai_generated ? " · IA" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEdit(post)}
                    aria-label="Editar"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <DeleteButton id={post.id} title={post.title} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <PostDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}

function DeleteButton({ id, title }: { id: string; title: string }) {
  const qc = useQueryClient();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!confirm(`Excluir "${title}"? Esta ação não pode ser desfeita.`)) return;
    setPending(true);
    try {
      await deletePost(id);
      await qc.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post excluído.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao excluir.");
    } finally {
      setPending(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-8 w-8 text-muted-foreground hover:text-destructive"
      onClick={handleDelete}
      disabled={pending}
      aria-label="Excluir"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
    </Button>
  );
}

function PostDialog({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing: Post | null;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<NewPost>(EMPTY);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setForm({
        title: editing.title,
        caption: editing.caption ?? "",
        platform: editing.platform,
        status: editing.status,
        scheduled_for: editing.scheduled_for,
        ai_generated: editing.ai_generated,
      });
    } else {
      setForm(EMPTY);
    }
  }, [open, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload: NewPost = {
        ...form,
        title: form.title.trim(),
        caption: form.caption?.trim() || "",
        scheduled_for: form.scheduled_for || null,
      };
      if (editing) {
        await updatePost(editing.id, payload);
        toast.success("Post atualizado.");
      } else {
        await createPost(payload);
        toast.success("Post criado.");
      }
      await qc.invalidateQueries({ queryKey: ["posts"] });
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Editar post" : "Novo post"}</DialogTitle>
          <DialogDescription>Preencha os detalhes da publicação.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ex: Lançamento de verão"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="caption">Legenda</Label>
            <Textarea
              id="caption"
              rows={4}
              value={form.caption ?? ""}
              onChange={(e) => setForm({ ...form, caption: e.target.value })}
              placeholder="Escreva ou cole a legenda…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="platform">Plataforma</Label>
              <NativeSelect
                id="platform"
                value={form.platform}
                onChange={(v) => setForm({ ...form, platform: v as Platform })}
                options={Object.entries(PLATFORM_LABELS).map(([v, l]) => ({
                  value: v,
                  label: l,
                }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <NativeSelect
                id="status"
                value={form.status}
                onChange={(v) => setForm({ ...form, status: v as PostStatus })}
                options={Object.entries(STATUS_LABELS).map(([v, l]) => ({
                  value: v,
                  label: l,
                }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="scheduled_for">Agendar para (opcional)</Label>
            <Input
              id="scheduled_for"
              type="datetime-local"
              value={toLocalInput(form.scheduled_for)}
              onChange={(e) =>
                setForm({
                  ...form,
                  scheduled_for: e.target.value ? new Date(e.target.value).toISOString() : null,
                })
              }
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
              {editing ? "Salvar alterações" : "Criar post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function NativeSelect({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 16);
}
