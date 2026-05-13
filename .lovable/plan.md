
# 安全加固方案

分三阶段执行，先关键风险，再纵深防御，最后体验细节。

## P0 — 关键风险（必做）

### 1. 路由守卫改为 SSR 安全模式
- `src/routes/_authenticated.tsx`：把 `useEffect` 跳转改为 `beforeLoad`，先在客户端等待 `supabase.auth.getUser()` 解析，未登入立刻 `throw redirect({ to: "/login", search: { redirect: location.href }})`，消除受保护页面闪现。
- `src/routes/login.tsx`、`signup.tsx`：登入成功后读 `redirect` search 参数跳回原页，没有则回 `/app`。

### 2. 封存（Vault）二次确认
当前点一下按钮就解锁，等同没保护。改为：
- 弹出对话框要求重新输入当前账户密码（调 `supabase.auth.signInWithPassword` 验证，不创建新会话视为通过）。
- 解锁状态加 60 秒 TTL，超时自动锁回。
- 离开页面立即清空 `unlocked` 与已加载列表。

### 3. Storage 路径与上传校验
- 新迁移：为 `capsules` bucket 添加严格 RLS：`auth.uid()::text = (storage.foldername(name))[1]`，覆盖 SELECT/INSERT/UPDATE/DELETE。
- `record.tsx` 上传前校验：MIME 必须 `audio/webm`、大小 ≤ 10MB、时长 ≤ 10 分钟，超限提示并阻止上传。

### 4. 服务端输入校验收紧
`src/lib/capsules.functions.ts` 的 zod schema：
- `audio_path`：必须匹配 `^{userId}/[0-9]+\.webm$`（在 handler 内拼正则校验，因为 schema 静态时拿不到 userId）。
- `duration_seconds`：上限 600。
- `deliver_at`：`z.string().datetime()`，且必须是未来 1 天～10 年内。
- `location`：`z.string().max(120)`。

## P1 — 纵深防御

### 5. 启用泄漏密码检查 + 提高密码强度
- 调 `configure_auth` 打开 `password_hibp_enabled: true`。
- `signup.tsx`：`minLength` 从 6 提到 10，前端加强度提示。

### 6. 登出清理客户端缓存
`use-auth.tsx` 的 `signOut`：调用前先 `queryClient.clear()`、清 `sessionStorage`，避免下一个登入用户短暂看到上一用户缓存。

### 7. 错误日志脱敏
`__root.tsx` `ErrorComponent`：仅在 `import.meta.env.DEV` 下 `console.error(error)`；生产只展示文案。

## P2 — 响应头与权限策略

### 8. 安全响应头
在 root route `head.meta` 加 `referrer`（`strict-origin-when-cross-origin`）、`Permissions-Policy`（`microphone=(self), camera=(), geolocation=()`），并通过 meta `http-equiv` 注入一份基础 CSP（允许 self、Supabase 域、Google Fonts、Supabase Storage signed URL 域）。

## 暂不动 / 后续再做

- `subscriptions` 写入：留待接 Stripe 时通过 `/api/public/webhooks/stripe` server route + 签名校验 + `supabaseAdmin` 完成，本轮不引入。
- 把客户端读取改为 `createServerFn`：与 RLS 重复且工作量大，本轮维持现状。

## 技术细节

- 不修改 `src/integrations/supabase/client.ts` 等自动生成文件。
- 新增一次 SQL 迁移：仅写 `storage.objects` 的 4 条 policy，不动现有业务表。
- `configure_auth` 调用参数：`disable_signup: false, external_anonymous_users_enabled: false, auto_confirm_email: false, password_hibp_enabled: true`（保持当前邮箱验证策略不变，只新增 HIBP）。
- 改完后用 `invoke-server-function` 跑一次 `createCapsule` 校验（合法/非法路径各一次），确认 zod 收紧没误伤。

## 不在范围

- UI 视觉调整、文案改动（除必要的安全提示外）。
- 引入 WebAuthn / 2FA（用户未要求）。
- Stripe 订阅集成。
