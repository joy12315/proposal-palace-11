import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "设置 — 如果声音记得" }] }),
  component: Settings,
});

function Settings() {
  const { user, signOut } = useAuth();
  const nav = useNavigate();
  const [status, setStatus] = useState<string>("free");

  useEffect(() => {
    if (!user) return;
    supabase.from("subscriptions").select("status").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      if (data) setStatus(data.status);
    });
  }, [user]);

  return (
    <div className="mx-auto max-w-md px-6 pt-12">
      <h1 className="font-serif text-2xl">设置</h1>

      <div className="mt-8 space-y-3">
        <div className="rounded-2xl border border-border bg-card/40 p-5">
          <div className="text-xs text-muted-foreground">账户</div>
          <div className="mt-1 text-sm">{user?.email}</div>
        </div>

        <Link
          to="/subscribe"
          className="block rounded-2xl border border-border bg-card/40 p-5 transition hover:bg-card"
        >
          <div className="text-xs text-muted-foreground">订阅状态</div>
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm font-serif">
              {status === "active" ? "已订阅，可寄信" : "免费用户"}
            </span>
            <span className="text-xs text-primary">管理 →</span>
          </div>
        </Link>

        <Link
          to="/vault"
          className="block rounded-2xl border border-border bg-card/40 p-5 transition hover:bg-card"
        >
          <div className="text-xs text-muted-foreground">封存内容</div>
          <div className="mt-1 text-sm">需要二次确认才能查看</div>
        </Link>

        <button
          onClick={async () => {
            await signOut();
            nav({ to: "/" });
          }}
          className="w-full rounded-2xl border border-border bg-card/40 p-5 text-left text-sm transition hover:bg-card"
        >
          登出
        </button>
      </div>
    </div>
  );
}