import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { fetchPosts, PLATFORM_LABELS, type Post } from "@/lib/posts";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({
    meta: [
      { title: "Calendário — OA Flow" },
      {
        name: "description",
        content: "Calendário editorial com seus posts agendados por data.",
      },
    ],
  }),
  component: CalendarPage,
});

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

function CalendarPage() {
  const [cursor, setCursor] = useState(() => new Date());
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
  });

  const byDay = useMemo(() => {
    const map = new Map<string, Post[]>();
    for (const p of posts) {
      const date = p.scheduled_for ?? p.created_at;
      const key = format(new Date(date), "yyyy-MM-dd");
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    }
    return map;
  }, [posts]);

  const monthStart = startOfMonth(cursor);
  const monthEnd = endOfMonth(cursor);
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Calendário</h1>
          <p className="mt-1.5 text-muted-foreground">Seus posts por data de publicação.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor((c) => addMonths(c, -1))}
            aria-label="Mês anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-44 text-center font-display text-lg font-semibold capitalize">
            {format(cursor, "MMMM yyyy", { locale: ptBR })}
          </span>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setCursor((c) => addMonths(c, 1))}
            aria-label="Próximo mês"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" onClick={() => setCursor(new Date())}>
            Hoje
          </Button>
        </div>
      </header>

      <Card className="p-3 sm:p-5">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando…
          </div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-px">
              {WEEKDAYS.map((d) => (
                <div
                  key={d}
                  className="pb-2 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px">
              {days.map((day) => {
                const key = format(day, "yyyy-MM-dd");
                const items = byDay.get(key) ?? [];
                const inMonth = isSameMonth(day, cursor);
                return (
                  <div
                    key={key}
                    className={cn(
                      "min-h-24 rounded-lg border border-border/60 p-2 transition-colors sm:min-h-32",
                      inMonth ? "bg-card" : "bg-muted/40",
                    )}
                  >
                    <div
                      className={cn(
                        "mb-1.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium",
                        isToday(day)
                          ? "bg-primary text-primary-foreground"
                          : inMonth
                            ? "text-foreground"
                            : "text-muted-foreground/60",
                      )}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {items.slice(0, 3).map((p) => (
                        <div
                          key={p.id}
                          className="truncate rounded-md bg-primary/10 px-2 py-1 text-[0.7rem] font-medium text-primary"
                          title={p.title}
                        >
                          {p.title}
                        </div>
                      ))}
                      {items.length > 3 && (
                        <div className="px-1 text-[0.7rem] text-muted-foreground">
                          +{items.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="font-medium">Legenda:</span>
              {Object.entries(PLATFORM_LABELS).map(([, label]) => (
                <span key={label} className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-primary/60" />
                  {label}
                </span>
              ))}
              <span className="ml-2 text-muted-foreground">
                Posts sem data aparecem no dia de criação.
              </span>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
