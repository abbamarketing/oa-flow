import { Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import {
  LayoutDashboard,
  FileText,
  CalendarDays,
  Sparkles,
  Layers,
  LogOut,
  Menu,
  Plus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthSession } from "@/hooks/use-auth-session";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/dashboard", label: "Painel", icon: LayoutDashboard },
  { to: "/posts", label: "Posts", icon: FileText },
  { to: "/calendar", label: "Calendário", icon: CalendarDays },
  { to: "/assistant", label: "Assistente IA", icon: Sparkles },
  { to: "/kanban", label: "Fluxo", icon: Layers },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { user } = useAuthSession();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const email = user?.email ?? "Conta";
  const initial = email.charAt(0).toUpperCase() || "A";

  const Brand = (
    <Link to="/dashboard" className="flex items-center gap-2.5">
      <span className="grid h-9 w-9 place-items-center rounded-xl brand-gradient text-[0.7rem] font-bold text-primary-foreground shadow-sm">
        OA
      </span>
      <span className="font-display text-lg font-bold tracking-tight text-foreground">Flow</span>
    </Link>
  );

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <nav className="flex flex-col gap-1">
      {NAV.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          onClick={onNavigate}
          activeProps={{
            className: "bg-primary/10 text-primary font-semibold",
          }}
          inactiveProps={{ className: "text-muted-foreground" }}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground"
        >
          <item.icon className="h-4 w-4 shrink-0" />
          {item.label}
        </Link>
      ))}
    </nav>
  );

  const UserBlock = (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{email}</p>
        <p className="text-xs text-muted-foreground">Conta conectada</p>
      </div>
      <button
        type="button"
        onClick={handleSignOut}
        aria-label="Sair"
        className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-sidebar px-4 py-5 md:flex">
        <div className="px-1.5">{Brand}</div>
        <div className="mt-7 flex-1 overflow-y-auto">
          <p className="px-3 pb-2 text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
            Workspace
          </p>
          <NavLinks />
        </div>
        <div className="mt-4 space-y-3">
          <Button asChild className="w-full">
            <Link to="/posts">
              <Plus className="mr-1.5 h-4 w-4" />
              Novo post
            </Link>
          </Button>
          {UserBlock}
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-background/90 px-4 py-3 backdrop-blur md:hidden">
        {Brand}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" aria-label="Abrir menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetTitle className="sr-only">Navegação</SheetTitle>
            <div className="flex h-full flex-col p-5">
              {Brand}
              <div className="mt-7 flex-1 overflow-y-auto">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="mt-4">{UserBlock}</div>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* Main */}
      <main className={cn("md:pl-64")}>
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
