import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { openTodaysLetter } from "@/lib/capsules.functions";
import { supabase } from "@/integrations/supabase/client";
import { Mail } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { zhCN } from "date-fns/locale";

export const Route = createFileRoute("/_authenticated/mailbox")({
  head: () => ({ meta: [{ title: "信箱 — 声音胶囊" }] }),
  component: Mailbox,
});

type Capsule = { id: string; audio_path: string; created_at: string; deliver_at: string | null };
type Result =
  | { state: "delivered" | "opened_today"; capsule: Capsule }
  | { state: "empty"; in_transit: number };

function Mailbox() {
  const open = useServerFn(openTodaysLetter);
  const [result, setResult] = useState<Result | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    open().then((r) => setResult(r as Result));
  }, [open]);

  useEffect(() => {
    if (!result || result.state === "empty") return;
    supabase.storage.from("capsules").createSignedUrl(result.capsule.audio_path, 3600).then(({ data }) => {
      if (data) setUrl(data.signedUrl);
    });
  }, [result]);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center px-6 pt-16">
      <Mail className="mb-4 h-7 w-7 text-primary" />
      <h1 className="font-serif text-2xl">信箱</h1>

      {!result && <p className="mt-12 text-sm text-muted-foreground">正在为你打开今天的信…</p>}

      {result?.state === "empty" && (
        <div className="mt-16 text-center">
          <p className="font-serif text-lg text-muted-foreground">今天，邮局静悄悄。</p>
          {result.in_transit > 0 ? (
            <p className="mt-4 text-xs text-muted-foreground">
              还有 {result.in_transit} 封信，正在路上
            </p>
          ) : (
            <p className="mt-4 text-xs text-muted-foreground">先去录一段，寄给未来的自己吧</p>
          )}
        </div>
      )}

      {result && result.state !== "empty" && (
        <div className="animate-envelope mt-12 w-full">
          {result.state === "opened_today" && (
            <p className="mb-4 text-center text-xs text-muted-foreground">今天的信已经收到</p>
          )}
          <div className="rounded-3xl border border-primary/30 bg-card/60 p-6 backdrop-blur">
            <div className="text-xs text-muted-foreground">
              寄出于 {format(new Date(result.capsule.created_at), "yyyy 年 M 月 d 日")}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              在路上走了 {formatDistanceToNow(new Date(result.capsule.created_at), { locale: zhCN })}
            </div>
            <div className="mt-6">
              {url ? (
                <audio controls autoPlay src={url} className="w-full" />
              ) : (
                <div className="h-10 animate-pulse rounded bg-muted" />
              )}
            </div>
            <p className="mt-6 font-serif text-sm text-muted-foreground">
              这是当时的你，对现在的你说的话。
            </p>
          </div>
        </div>
      )}
    </div>
  );
}