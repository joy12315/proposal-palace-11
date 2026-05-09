import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Mic, Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "今天 — 声音胶囊" }] }),
  component: Home,
});

function Home() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [pending, setPending] = useState<number>(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("capsules")
      .select("id", { count: "exact", head: true })
      .eq("destination", "letter")
      .is("delivered_at", null)
      .lte("deliver_at", new Date().toISOString())
      .then(({ count }) => setPending(count ?? 0));
  }, [user]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center px-6 pt-12">
      <div className="w-full">
        {pending > 0 ? (
          <Link
            to="/mailbox"
            className="mb-12 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 px-5 py-4 text-sm transition hover:bg-primary/15"
          >
            <span className="flex items-center gap-2 font-serif">
              <Mail className="h-4 w-4 text-primary" />
              今天有信到了
            </span>
            <span className="text-xs text-muted-foreground">去信箱 →</span>
          </Link>
        ) : (
          <div className="mb-12 text-center text-xs text-muted-foreground">今天暂无信件</div>
        )}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="mb-10 font-serif text-lg text-muted-foreground">此刻</p>
        <button
          onClick={() => nav({ to: "/record" })}
          className="group relative flex h-40 w-40 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_60px_var(--glow)] transition hover:scale-105"
        >
          <span className="absolute inset-0 animate-breathe rounded-full bg-primary/40 blur-2xl" />
          <Mic className="relative h-12 w-12" />
        </button>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          点一下，开始录制
        </p>
      </div>
    </div>
  );
}