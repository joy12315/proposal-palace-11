import { createFileRoute, Outlet, useNavigate, Link, useLocation } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Mic, Mail, Clock, Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  component: AuthLayout,
});

function AuthLayout() {
  const { user, loading } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/login" });
  }, [user, loading, nav]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        正在打开邮局…
      </div>
    );
  }

  const tabs = [
    { to: "/app", icon: Mic, label: "录" },
    { to: "/mailbox", icon: Mail, label: "信箱" },
    { to: "/timeline", icon: Clock, label: "时间轴" },
    { to: "/settings", icon: SettingsIcon, label: "设置" },
  ] as const;

  return (
    <div className="min-h-screen pb-24">
      <Outlet />
      <nav className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-border bg-card/80 px-2 py-2 backdrop-blur-xl">
        <div className="flex items-center gap-1">
          {tabs.map((t) => {
            const active = loc.pathname === t.to;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={`flex flex-col items-center gap-0.5 rounded-full px-4 py-1.5 text-[10px] transition ${
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}