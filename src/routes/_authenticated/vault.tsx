import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Lock } from "lucide-react";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/vault")({
  head: () => ({ meta: [{ title: "封存 — 如果声音记得" }] }),
  component: Vault,
});

type Row = { id: string; audio_path: string; duration_seconds: number; created_at: string };

function Vault() {
  const { user } = useAuth();
  const [unlocked, setUnlocked] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user || !unlocked) return;
    supabase
      .from("capsules")
      .select("id,audio_path,duration_seconds,created_at")
      .eq("destination", "vault")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows(data ?? []));
  }, [user, unlocked]);

  if (!unlocked) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
        <Lock className="h-7 w-7 text-muted-foreground" />
        <h1 className="mt-4 font-serif text-2xl">封存的声音</h1>
        <p className="mt-3 max-w-xs text-sm text-muted-foreground">
          这些声音被你藏在黑洞里。<br />确认要打开吗？
        </p>
        <button
          onClick={() => setUnlocked(true)}
          className="mt-8 rounded-full border border-border px-6 py-2.5 text-sm transition hover:bg-secondary"
        >
          我想看看
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-6 pt-12">
      <h1 className="font-serif text-2xl">封存</h1>
      <div className="mt-8 space-y-3">
        {rows.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            黑洞里空无一物
          </p>
        )}
        {rows.map((r) => <Item key={r.id} row={r} />)}
      </div>
    </div>
  );
}

function Item({ row }: { row: Row }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    supabase.storage.from("capsules").createSignedUrl(row.audio_path, 3600).then(({ data }) => {
      if (data) setUrl(data.signedUrl);
    });
  }, [row.audio_path]);
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4">
      <div className="mb-2 text-xs text-muted-foreground">{format(new Date(row.created_at), "yyyy-MM-dd HH:mm")}</div>
      {url ? <audio controls src={url} className="w-full" /> : <div className="h-10 animate-pulse rounded bg-muted" />}
    </div>
  );
}