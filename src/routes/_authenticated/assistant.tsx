import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Sparkles, Loader2, Copy, Check, Wand2 } from "lucide-react";
import { generateCopy, type CopyResult } from "@/lib/ai.functions";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "Assistente IA — OA Flow" },
      {
        name: "description",
        content: "Gere legendas, hashtags e ideias de pauta com o assistente de IA.",
      },
    ],
  }),
  component: AssistantPage,
});

const PLATFORMS = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "x", label: "X / Twitter" },
  { value: "tiktok", label: "TikTok" },
] as const;

const TONES = [
  { value: "inspirador", label: "Inspirador" },
  { value: "profissional", label: "Profissional" },
  { value: "descontraido", label: "Descontraído" },
  { value: "urgente", label: "Urgente" },
  { value: "educativo", label: "Educativo" },
  { value: "persuasivo", label: "Persuasivo" },
] as const;

function AssistantPage() {
  const generate = useServerFn(generateCopy);
  const [topic, setTopic] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]["value"]>("instagram");
  const [tone, setTone] = useState<(typeof TONES)[number]["value"]>("inspirador");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CopyResult | null>(null);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (loading || topic.trim().length < 2) return;
    setLoading(true);
    setResult(null);
    try {
      const out = await generate({ data: { topic, platform, tone } });
      setResult(out);
      toast.success("Copy gerado!");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível gerar agora.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl brand-gradient text-primary-foreground shadow-sm">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Assistente de IA</h1>
            <p className="mt-1 text-muted-foreground">
              Legendas, hashtags e ideias de pauta em segundos.
            </p>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Form */}
        <Card className="lg:col-span-2 p-6">
          <form className="space-y-4" onSubmit={handleGenerate}>
            <div className="space-y-2">
              <Label htmlFor="topic">Sobre o que é o post?</Label>
              <Textarea
                id="topic"
                required
                rows={3}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Ex: lançamento de um curso de marketing digital"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platform">Plataforma</Label>
                <NativeSelect
                  id="platform"
                  value={platform}
                  onChange={(v) => setPlatform(v as typeof platform)}
                  options={PLATFORMS.map((p) => ({ value: p.value, label: p.label }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tone">Tom de voz</Label>
                <NativeSelect
                  id="tone"
                  value={tone}
                  onChange={(v) => setTone(v as typeof tone)}
                  options={TONES.map((t) => ({ value: t.value, label: t.label }))}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                  Gerando…
                </>
              ) : (
                <>
                  <Wand2 className="mr-1.5 h-4 w-4" />
                  Gerar copy
                </>
              )}
            </Button>
          </form>
        </Card>

        {/* Result */}
        <div className="lg:col-span-3">
          {result ? (
            <div className="space-y-4">
              <Card className="p-5">
                <SectionTitle>Legendas</SectionTitle>
                <div className="mt-3 space-y-3">
                  {result.captions.map((c, i) => (
                    <CopyBlock key={i} text={c} />
                  ))}
                </div>
              </Card>
              <div className="grid gap-4 sm:grid-cols-2">
                <Card className="p-5">
                  <SectionTitle>Hashtags</SectionTitle>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {result.hashtags.map((h) => (
                      <span
                        key={h}
                        className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                  <CopyButton
                    className="mt-4"
                    text={result.hashtags.join(" ")}
                    label="Copiar hashtags"
                  />
                </Card>
                <Card className="p-5">
                  <SectionTitle>CTA sugerido</SectionTitle>
                  <p className="mt-3 text-sm text-foreground">{result.cta}</p>
                </Card>
              </div>
              <Card className="p-5">
                <SectionTitle>Ideias de pauta</SectionTitle>
                <ul className="mt-3 space-y-2 text-sm text-foreground">
                  {result.ideas.map((idea, i) => (
                    <li key={i} className="flex gap-2">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      {idea}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          ) : (
            <Card className="flex h-full min-h-64 flex-col items-center justify-center p-10 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary">
                <Sparkles className="h-6 w-6" />
              </span>
              <h2 className="mt-4 font-display text-lg font-semibold">
                {loading ? "Gerando conteúdo…" : "Pronto para criar"}
              </h2>
              <p className="mt-1 max-w-xs text-sm text-muted-foreground">
                Descreva o tema, escolha plataforma e tom, depois clique em gerar.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display text-base font-semibold text-foreground">{children}</h3>;
}

function CopyBlock({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copiado!");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }
  return (
    <div className="group relative rounded-lg border border-border bg-muted/40 p-3 pr-10 text-sm text-foreground whitespace-pre-wrap">
      {text}
      <button
        type="button"
        onClick={copy}
        className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        aria-label="Copiar"
      >
        {copied ? <Check className="h-4 w-4 text-chart-3" /> : <Copy className="h-4 w-4" />}
      </button>
    </div>
  );
}

function CopyButton({
  text,
  label,
  className,
}: {
  text: string;
  label: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copiado!");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }
  return (
    <Button type="button" variant="outline" size="sm" className={className} onClick={copy}>
      {copied ? <Check className="mr-1.5 h-4 w-4" /> : <Copy className="mr-1.5 h-4 w-4" />}
      {label}
    </Button>
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
