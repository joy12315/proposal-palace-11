import { createFileRoute, Outlet, Link, useLocation } from "@tanstack/react-router";
import { Mic, Clock, Settings as SettingsIcon } from "lucide-react";

export const Route = createFileRoute("/_authenticated")({
  // 移除登录验证，游客也可访问
  // beforeLoad: async ({ location }) => {
  //   const { data } = await supabase.auth.getUser();
  //   if (!data.user) {
  //     throw redirect({ to: "/login", search: { redirect: location.href } });
  //   }
  // },
  component: AuthLayout,
});

function AuthLayout() {
  const loc = useLocation();

  const tabs = [
    { to: "/", icon: Mic, label: "录" },
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
