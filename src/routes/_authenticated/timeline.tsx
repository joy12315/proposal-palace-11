import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { format, isToday, isYesterday } from "date-fns";
import { zhCN } from "date-fns/locale";
import { Play, Pause, Trash2, Mic } from "lucide-react";
import { toast } from "sonner";
import { useGuest, GuestRecording } from "@/hooks/use-guest";

export const Route = createFileRoute("/_authenticated/timeline")({
  head: () => ({ meta: [{ title: "时间轴 — 如果声音记得" }] }),
  component: Timeline,
});

function Timeline() {
  const nav = useNavigate();
  const { recordings, deleteRecording } = useGuest();

  const archives = recordings.filter(r => r.destination === "archive");
  const letters = recordings.filter(r => r.destination === "letter");

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) return "今日";
    if (isYesterday(date)) return "昨日";
    return format(date, "M月d日", { locale: zhCN });
  };

  const handleDelete = async (id: string) => {
    await deleteRecording(id);
    toast.success("已删除");
  };

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 pt-12">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl">时间轴</h1>
        <button
          onClick={() => nav({ to: "/_authenticated/record" })}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_20px_var(--glow)] transition hover:scale-105"
        >
          <Mic className="h-5 w-5" />
        </button>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">留档的声音，随时回放</p>

      {recordings.length === 0 && (
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">还没有声音</p>
          <button
            onClick={() => nav({ to: "/_authenticated/record" })}
            className="mt-4 text-primary"
          >
            去录一段 →
          </button>
        </div>
      )}

      {archives.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-medium text-muted-foreground">留档</h2>
          <div className="mt-4 space-y-3">
            {archives.map((rec) => (
              <RecordingItem
                key={rec.id}
                recording={rec}
                onDelete={() => handleDelete(rec.id)}
              />
            ))}
          </div>
        </div>
      )}

      {letters.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-medium text-muted-foreground">寄出的信</h2>
          <div className="mt-4 space-y-3">
            {letters.map((rec) => (
              <LetterItem
                key={rec.id}
                recording={rec}
                onDelete={() => handleDelete(rec.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RecordingItem({ recording, onDelete }: { recording: GuestRecording; onDelete: () => void }) {
  const [audioUrl] = useState(() => URL.createObjectURL(recording.audioBlob));
  const [playing, setPlaying] = useState(false);
  const [audio] = useState(() => {
    const a = new Audio(audioUrl);
    a.onended = () => setPlaying(false);
    return a;
  });

  useEffect(() => {
    return () => URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const togglePlay = () => {
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4">
      <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
        <span>{formatDate(recording.createdAt)}</span>
        <div className="flex items-center gap-2">
          <span>{fmt(recording.duration)}</span>
          <button onClick={togglePlay} className="p-1 hover:text-primary">
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button onClick={onDelete} className="p-1 hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="font-serif text-base">{recording.name}</p>
    </div>
  );
}

function LetterItem({ recording, onDelete }: { recording: GuestRecording; onDelete: () => void }) {
  const isDelivered = recording.deliverAt && new Date(recording.deliverAt) <= new Date();
  const [audioUrl] = useState(() => URL.createObjectURL(recording.audioBlob));
  const [playing, setPlaying] = useState(false);
  const [audio] = useState(() => {
    const a = new Audio(audioUrl);
    a.onended = () => setPlaying(false);
    return a;
  });

  useEffect(() => {
    return () => URL.revokeObjectURL(audioUrl);
  }, [audioUrl]);

  const togglePlay = () => {
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      audio.play();
      setPlaying(true);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <div className="mb-2 flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {recording.deliverAt
            ? isDelivered
              ? "已送达"
              : `${format(new Date(recording.deliverAt), "MM月dd日 HH:mm", { locale: zhCN })} 送达`
            : "寄出中"
          }
        </span>
        <div className="flex items-center gap-2">
          {isDelivered && (
            <button onClick={togglePlay} className="p-1 hover:text-primary">
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </button>
          )}
          <button onClick={onDelete} className="p-1 hover:text-red-500">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>
      <p className="font-serif text-base">{recording.name}</p>
    </div>
  );
}
