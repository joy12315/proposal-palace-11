import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Mail, Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/subscribe")({
  head: () => ({ meta: [{ title: "订阅 — 声音胶囊" }] }),
  component: Subscribe,
});

function Subscribe() {
  const nav = useNavigate();
  return (
    <div className="mx-auto max-w-md px-6 pt-16">
      <button onClick={() => nav({ to: "/app" })} className="text-xs text-muted-foreground hover:underline">← 返回</button>
      <div className="mt-6 rounded-3xl border border-primary/30 bg-card/60 p-8 backdrop-blur">
        <Mail className="h-7 w-7 text-primary" />
        <h1 className="mt-4 font-serif text-2xl">解锁时间邮局</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          订阅声音胶囊，把声音信寄给未来的自己。
        </p>
        <ul className="mt-6 space-y-3 text-sm">
          {["寄给七天后到一年后的自己", "邮局保证按时送达", "无限封信件存放", "随时取消"].map((t) => (
            <li key={t} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />{t}
            </li>
          ))}
        </ul>
        <div className="mt-8 rounded-2xl border border-border bg-background/40 p-4 text-center">
          <div className="font-serif text-3xl">¥ 19<span className="text-sm text-muted-foreground"> / 月</span></div>
        </div>
        <button
          disabled
          className="mt-6 w-full rounded-full bg-primary py-3 text-sm font-medium text-primary-foreground opacity-60"
        >
          支付通道即将开启
        </button>
        <p className="mt-3 text-center text-[11px] text-muted-foreground">
          MVP 阶段：支付集成稍后接入
        </p>
      </div>
    </div>
  );
}