import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Mic, Mail, Lock } from "lucide-react";
import { GradientText } from "@/components/gradient-text";
import { useGuest } from "@/hooks/use-guest";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const nav = useNavigate();
  const { recordings } = useGuest();

  // Count pending letters
  const pendingLetters = recordings.filter(r =>
    r.destination === 'letter' &&
    r.deliverAt &&
    new Date(r.deliverAt) <= new Date()
  ).length;

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2 font-serif text-lg">
          <span className="inline-block h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_var(--glow)]" />
          如果声音记得
        </div>
        <nav className="flex items-center gap-3 text-sm">
          <Link to="/_authenticated/timeline" className="text-muted-foreground hover:text-foreground">时间轴</Link>
          <button
            onClick={() => nav({ to: "/_authenticated/record" })}
            className="rounded-full bg-primary px-4 py-2 text-primary-foreground transition hover:opacity-90"
          >
            开始录音
          </button>
        </nav>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-16 text-center">
        {pendingLetters > 0 && (
          <Link
            to="/_authenticated/timeline"
            className="mx-auto mb-12 flex items-center justify-center gap-2 rounded-2xl border border-primary/30 bg-primary/10 px-5 py-3 text-sm transition hover:bg-primary/15 w-fit"
          >
            <Mail className="h-4 w-4 text-primary" />
            <span className="font-serif">今天有信到了</span>
            <span className="text-xs text-muted-foreground">去时间轴 →</span>
          </Link>
        )}

        <h1 className="font-serif text-5xl leading-tight md:text-6xl">
          说一段话，<br />寄给<GradientText text="未来的自己" />。
        </h1>
        <p className="mx-auto mt-8 max-w-xl text-base leading-relaxed text-muted-foreground">
          不是录音机，是声音版的时间胶囊。<br />
          为那些没有容器的感受，留一个出口。
        </p>

        <div className="mt-12 flex flex-col items-center gap-3">
          <button
            onClick={() => nav({ to: "/_authenticated/record" })}
            className="group inline-flex items-center gap-2 rounded-full bg-primary px-8 py-3.5 text-primary-foreground shadow-[0_8px_30px_var(--glow)] transition hover:scale-[1.02]"
          >
            <Mic className="h-4 w-4" />
            开启你的第一封声音信
          </button>
          <p className="text-xs text-muted-foreground">默认私密，永不强制社交 · 无需登录</p>
        </div>

        <div className="mt-24 grid gap-8 md:grid-cols-3">
          {[
            { icon: Mic, title: "打开即录", desc: "三秒开始，不需要标题、不需要分类。" },
            { icon: Mail, title: "时间邮局", desc: "寄给七天后、一年后的自己，到点送达。" },
            { icon: Lock, title: "封存黑洞", desc: "有些话，连自己也不必再听到。" },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card/40 p-6 text-left backdrop-blur">
              <f.icon className="mb-3 h-5 w-5 text-primary" />
              <h3 className="font-serif text-lg">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </main>

      <footer className="border-t border-border/40 py-8 text-center text-xs text-muted-foreground">
        如果声音记得 · 为内在对话者而生
      </footer>
    </div>
  );
}
