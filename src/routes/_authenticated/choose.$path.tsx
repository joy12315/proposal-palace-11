import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { createCapsule } from "@/lib/capsules.functions";
import { supabase } from "@/integrations/supabase/client";
import { Lock, Archive, Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/choose/$path")({
  validateSearch: z.object({ d: z.coerce.number().default(0) }),
  head: () => ({ meta: [{ title: "选择归宿 — 如果声音记得" }] }),
  component: Choose,
});

const DURATIONS = [
  { label: "7 天后", days: 7 },
  { label: "1 个月后", days: 30 },
  { label: "3 个月后", days: 90 },
  { label: "1 年后", days: 365 },
];

function Choose() {
  const { path } = Route.useParams();
  const { d } = Route.useSearch();
  const audioPath = decodeURIComponent(path);
  const nav = useNavigate();
  const create = useServerFn(createCapsule);
  const [step, setStep] = useState<"choose" | "letter">("choose");
  const [busy, setBusy] = useState(false);

  const cancel = async () => {
    await supabase.storage.from("capsules").remove([audioPath]);
    nav({ to: "/app" });
  };

  const save = async (destination: "vault" | "archive", deliver_at: string | null = null) => {
    setBusy(true);
    try {
      await create({ data: { audio_path: audioPath, duration_seconds: d, destination, deliver_at } });
      toast.success(destination === "vault" ? "已封存" : "已留档");
      nav({ to: destination === "archive" ? "/timeline" : "/app" });
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  };

  const sendLetter = async (days: number) => {
    setBusy(true);
    const dt = new Date(Date.now() + days * 86400000).toISOString();
    try {
      await create({ data: { audio_path: audioPath, duration_seconds: d, destination: "letter", deliver_at: dt } });
      toast.success("已寄出，等它到来");
      nav({ to: "/app" });
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col px-6 pt-16">
      <h1 className="font-serif text-2xl">这段声音，归宿在哪？</h1>
      <p className="mt-2 text-sm text-muted-foreground">{Math.floor(d / 60)} 分 {d % 60} 秒</p>

      {step === "choose" ? (
        <div className="mt-10 space-y-3">
          <Card icon={Lock} title="封存" desc="进入黑洞，自己也找不到" onClick={() => save("vault")} disabled={busy} />
          <Card icon={Archive} title="留档" desc="进入时间轴，随时回望" onClick={() => save("archive")} disabled={busy} />
          <Card icon={Mail} title="寄给未来的我" desc="进入时间邮局，等待送达" onClick={() => setStep("letter")} disabled={busy} highlighted />

          <button onClick={cancel} className="mt-8 w-full text-center text-xs text-muted-foreground underline-offset-4 hover:underline">
            放弃这段录音
          </button>
        </div>
      ) : (
        <div className="mt-10 space-y-3">
          <p className="text-sm text-muted-foreground">什么时候送达？</p>
          {DURATIONS.map((d) => (
            <button
              key={d.days}
              onClick={() => sendLetter(d.days)}
              disabled={busy}
              className="w-full rounded-2xl border border-border bg-card/40 px-5 py-4 text-left font-serif transition hover:border-primary/50 hover:bg-card disabled:opacity-50"
            >
              {d.label}
            </button>
          ))}
          <button onClick={() => setStep("choose")} className="mt-4 w-full text-center text-xs text-muted-foreground hover:underline">
            返回
          </button>
        </div>
      )}
    </div>
  );
}

function Card({
  icon: Icon, title, desc, onClick, disabled, highlighted,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string; desc: string; onClick: () => void; disabled?: boolean; highlighted?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-start gap-4 rounded-2xl border px-5 py-4 text-left transition disabled:opacity-50 ${
        highlighted
          ? "border-primary/40 bg-primary/10 hover:bg-primary/15"
          : "border-border bg-card/40 hover:bg-card"
      }`}
    >
      <Icon className={`mt-0.5 h-5 w-5 ${highlighted ? "text-primary" : "text-muted-foreground"}`} />
      <div>
        <div className="font-serif text-base">{title}</div>
        <div className="text-xs text-muted-foreground">{desc}</div>
      </div>
    </button>
  );
}