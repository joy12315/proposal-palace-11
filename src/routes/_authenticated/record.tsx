import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Square, Mic } from "lucide-react";
import { toast } from "sonner";
import { useGuest } from "@/hooks/use-guest";

export const Route = createFileRoute("/_authenticated/record")({
  head: () => ({ meta: [{ title: "录音 — 如果声音记得" }] }),
  component: Record,
});

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const r = (s % 60).toString().padStart(2, "0");
  return `${m}:${r}`;
}

function Record() {
  const nav = useNavigate();
  const { addRecording } = useGuest();
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [saving, setSaving] = useState(false);
  const recRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const MAX_BYTES = 10 * 1024 * 1024;
  const MAX_SECONDS = 600;

  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      mr.ondataavailable = (e) => e.data.size > 0 && chunksRef.current.push(e.data);
      mr.onstop = () => stream.getTracks().forEach((t) => t.stop());
      mr.start(250);
      recRef.current = mr;
      setRecording(true);
      setSeconds(0);
      timerRef.current = window.setInterval(() => setSeconds((s) => s + 1), 1000);
    } catch {
      toast.error("无法访问麦克风，请允许权限");
    }
  };

  const stop = async () => {
    if (!recRef.current) return;
    setSaving(true);
    if (timerRef.current) clearInterval(timerRef.current);

    await new Promise<void>((res) => {
      recRef.current!.onstop = () => res();
      recRef.current!.stop();
    });

    const blob = new Blob(chunksRef.current, { type: "audio/webm" });

    if (seconds > MAX_SECONDS) {
      setSaving(false);
      setRecording(false);
      return toast.error("超过 10 分钟，已放弃这段录音");
    }

    if (blob.size > MAX_BYTES) {
      setSaving(false);
      setRecording(false);
      return toast.error("录音文件过大（>10MB），无法保存");
    }

    // Save to local storage (guest mode)
    const recordingId = addRecording({
      name: "未命名",
      audioBlob: blob,
      duration: seconds,
      destination: "archive",
    });

    // Create URL for playback
    audioUrlRef.current = URL.createObjectURL(blob);

    setRecording(false);
    setSaving(false);

    // Navigate to result page for AI naming
    nav({
      to: "/_authenticated/result/$id",
      params: { id: recordingId }
    });
  };

  useEffect(() => {
    // auto-start
    start();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recRef.current?.state === 'recording') {
        recRef.current.stop();
      }
      recRef.current?.stream.getTracks().forEach((t) => t.stop());
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
      <div className="font-serif text-6xl tabular-nums">{fmt(seconds)}</div>
      <p className="mt-4 text-sm text-muted-foreground">{recording ? "正在聆听…" : saving ? "正在保存…" : "准备中"}</p>

      <div className="mt-16 flex h-48 w-48 items-center justify-center">
        <span className="absolute h-48 w-48 animate-breathe rounded-full bg-primary/20 blur-3xl" />
        <span className="absolute h-32 w-32 animate-breathe rounded-full bg-primary/30 blur-2xl" style={{ animationDelay: "0.5s" }} />
        <button
          onClick={stop}
          disabled={!recording || saving}
          className="relative z-10 flex h-24 w-24 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_50px_var(--glow)] transition hover:scale-105 disabled:opacity-50"
        >
          {recording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
        </button>
      </div>

      <button
        onClick={() => nav({ to: "/" })}
        className="mt-12 text-xs text-muted-foreground underline-offset-4 hover:underline"
      >
        取消
      </button>
    </div>
  );
}
