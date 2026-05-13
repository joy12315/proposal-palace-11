import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "登入 — 如果声音记得" }] }),
  validateSearch: (s: Record<string, unknown>) => ({
    redirect: typeof s.redirect === "string" ? s.redirect : undefined,
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const search = Route.useSearch();
  const target = search.redirect ?? "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    nav({ to: target });
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin + target,
    });
    if (result.error) toast.error("Google 登入失败");
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="mb-8 block text-center font-serif text-xl">如果声音记得</Link>
        <div className="rounded-2xl border border-border bg-card/60 p-8 backdrop-blur">
          <h1 className="font-serif text-2xl">回来了</h1>
          <p className="mt-1 text-sm text-muted-foreground">继续你的声音日记</p>
          <form onSubmit={submit} className="mt-6 space-y-3">
            <input type="email" required placeholder="邮箱" value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring" />
            <input type="password" required placeholder="密码" value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-border bg-input px-4 py-2.5 text-sm outline-none focus:ring-1 focus:ring-ring" />
            <button disabled={loading} className="w-full rounded-lg bg-primary py-2.5 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50">
              {loading ? "登入中…" : "登入"}
            </button>
          </form>
          <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" />或<div className="h-px flex-1 bg-border" />
          </div>
          <button onClick={google} className="w-full rounded-lg border border-border py-2.5 text-sm transition hover:bg-secondary">
            使用 Google 登入
          </button>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            还没有账户？<Link to="/signup" className="text-primary">注册一个</Link>
          </p>
        </div>
      </div>
    </div>
  );
}