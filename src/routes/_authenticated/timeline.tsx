import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";

export const Route = createFileRoute("/_authenticated/timeline")({
  head: () => ({ meta: [{ title: "时间轴 — 声音胶囊" }] }),
  component: Timeline,
});

type Row = { id: string; audio_path: string; duration_seconds: number; created_at: string };

function Timeline() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("capsules")
      .select("id,audio_path,duration_seconds,created_at")
      .eq("destination", "archive")
      .order("created_at", { ascending: false })
      .then(({ data }) => setRows(data ?? []));
  }, [user]);

  return (
    <div className="mx-auto max-w-md px-6 pt-12">
      <h1 className="font-serif text-2xl">时间轴</h1>
      <p className="mt-1 text-sm text-muted-foreground">留档的声音，随时回放</p>

      <div className="mt-8 space-y-3">
        {rows.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">
            还没有留档的声音
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
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{format(new Date(row.created_at), "yyyy-MM-dd HH:mm")}</span>
        <span>{Math.floor(row.duration_seconds / 60)}:{(row.duration_seconds % 60).toString().padStart(2, "0")}</span>
      </div>
      {url ? <audio controls src={url} className="w-full" /> : <div className="h-10 animate-pulse rounded bg-muted" />}
    </div>
  );
}