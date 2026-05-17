import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Mic, Mail } from "lucide-react";
import { useGuest } from "@/hooks/use-guest";

export const Route = createFileRoute("/_authenticated/app")({
  head: () => ({ meta: [{ title: "今天 — 如果声音记得" }] }),
  component: Home,
});

function Home() {
  const nav = useNavigate();
  const { recordings } = useGuest();

  // Count pending letters
  const pendingLetters = recordings.filter(r =>
    r.destination === 'letter' &&
    r.deliverAt &&
    new Date(r.deliverAt) <= new Date()
  ).length;

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center px-6 pt-12">
      {pendingLetters > 0 ? (
        <Link
          to="/_authenticated/timeline"
          className="mb-12 flex items-center justify-between rounded-2xl border border-primary/30 bg-primary/10 px-5 py-4 text-sm transition hover:bg-primary/15"
        >
          <span className="flex items-center gap-2 font-serif">
            <Mail className="h-4 w-4 text-primary" />
            今天有信到了
          </span>
          <span className="text-xs text-muted-foreground">去时间轴 →</span>
        </Link>
      ) : (
        <div className="mb-12 text-center text-xs text-muted-foreground">今天暂无信件</div>
      )}

      <div className="flex flex-1 flex-col items-center justify-center">
        <p className="mb-10 font-serif text-lg text-muted-foreground">此刻</p>
        <button
          onClick={() => nav({ to: "/_authenticated/record" })}
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
