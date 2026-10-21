import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, Sparkles, Layers, ArrowRight, Check } from "lucide-react";
import { useAuthSession } from "@/hooks/use-auth-session";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "OA Flow — Gestão de posts e copy com IA" },
      {
        name: "description",
        content:
          "Centralize o calendário, o copy com IA e o fluxo kanban dos seus posts de redes sociais em um só lugar.",
      },
      { property: "og:title", content: "OA Flow — Gestão de posts e copy com IA" },
      {
        property: "og:description",
        content:
          "Centralize o calendário, o copy com IA e o fluxo kanban dos seus posts de redes sociais em um só lugar.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { user, loading } = useAuthSession();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl brand-gradient text-[0.7rem] font-bold text-primary-foreground shadow-sm">
            OA
          </span>
          <span className="font-display text-lg font-bold tracking-tight">Flow</span>
        </div>
        <nav className="flex items-center gap-3">
          {loading ? null : user ? (
            <Button asChild>
              <Link to="/dashboard">
                Ir para o painel
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/auth">Entrar</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">Criar conta</Link>
              </Button>
            </>
          )}
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-10 pb-20 sm:pt-16">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Gestão de conteúdo com IA
          </span>
          <h1 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.05] tracking-tight sm:text-6xl">
            Do rascunho à{" "}
            <span className="brand-gradient bg-clip-text text-transparent">publicação</span>, sem
            perder o ritmo.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            OA Flow centraliza o calendário de posts, o assistente de copy com IA e o fluxo kanban
            da sua agência em uma única mesa de trabalho.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button size="lg" asChild>
              <Link to="/auth">
                Começar agora
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/auth">Ver uma demonstração</Link>
            </Button>
          </div>
        </div>

        {/* Feature cards */}
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: CalendarDays,
              title: "Calendário editorial",
              text: "Visualize e agende publicações por data e plataforma.",
            },
            {
              icon: Sparkles,
              title: "Assistente de IA",
              text: "Legendas, hashtags e ideias de pauta em segundos.",
            },
            {
              icon: Layers,
              title: "Fluxo kanban",
              text: "Acompanhe cada post da ideia ao publicado.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <f.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>

        {/* Sub benefits */}
        <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3 text-sm text-muted-foreground">
          {[
            "Login por e-mail seguro",
            "Dados por usuário com RLS",
            "Pronto para Instagram, Facebook, LinkedIn, X e TikTok",
          ].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-accent" />
              {item}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
