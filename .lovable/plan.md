
# 声音胶囊 Web MVP 实施计划

基于你的方案 + 三个选择（Web 先行验证 / 加订阅付费 / 每日一签收信），下面是可落地的 MVP 范围。

## 一、产品范围

聚焦"录—选—收—付"四个动作，砍掉所有非验证必要功能。

| 模块 | 做 | 不做 |
|------|----|----|
| 录音 | 浏览器录音、暂停/继续、自动捕获时间和地点 | 环境音/人声分离、天气、AI 标签 |
| 归宿 | 封存（隐藏）、留档（时间轴）、寄给未来的我 | 黑洞挖掘、二次确认动画 |
| 时间邮局 | 7天 / 1月 / 3月 / 1年 四个固定档位 | 任意日期、随机送达、场景触发 |
| 收信 | 每日一签：每天首次进入 App 解锁一封到期的信 | Web Push、桌面小组件、邮件兜底 |
| 账户 | 邮箱密码 + Google 登录，云端存储录音 | 多设备同步细节、声纹 |
| 订阅 | Stripe 订阅，免费用户不能寄信，付费解锁寄信 | 多档位、年付折扣 |
| 消消乐 | 不做 | — |

## 二、用户流程

```
[未登录] 登陆页（产品介绍 + CTA）
    ↓ 注册/登录
[首页] 一个大圆形录音按钮 + 顶部"今日有 N 封信待开启"
    ↓ 点击录音
[录音页] 波形动画 + 计时器 + 停止按钮
    ↓ 停止
[归宿选择页] 三张卡片：封存 / 留档 / 寄给未来的我
                              ↓ 寄信（仅订阅用户）
                              选择时长 → 加密上传 → 完成
                              ↓ 免费用户点这里
                              引导订阅页面
    ↓
[时间轴页] 按日期分组的留档录音列表，可播放
[信箱页] 每日一签：今天开启的那封信（带仪式感动画）
[设置页] 订阅状态、登出、封存的内容入口（需密码确认）
```

## 三、页面与路由

| 路由 | 说明 | 是否需登录 |
|------|------|----------|
| `/` | 落地页 + 产品介绍 | 否 |
| `/login`, `/signup` | 邮箱 + Google 登录 | 否 |
| `/_authenticated/app` | 主界面（录音入口 + 信箱提示） | 是 |
| `/_authenticated/record` | 录音页 | 是 |
| `/_authenticated/choose/$id` | 录完选归宿 | 是 |
| `/_authenticated/timeline` | 留档时间轴 | 是 |
| `/_authenticated/mailbox` | 每日一签收信 | 是 |
| `/_authenticated/vault` | 封存内容（二次确认） | 是 |
| `/_authenticated/subscribe` | 订阅引导页 | 是 |
| `/_authenticated/settings` | 账户与订阅管理 | 是 |
| `/api/public/stripe-webhook` | Stripe 订阅状态回调 | — |

## 四、数据模型

启用 Lovable Cloud（Supabase + Storage + Auth），表设计：

- **profiles** — 用户基本信息，trigger 自动从 `auth.users` 创建
- **capsules** — 一条录音记录
  - `id, user_id, audio_url, duration_seconds, location, created_at`
  - `destination`: 枚举 `vault | archive | letter`
  - `deliver_at`: 寄信时的送达时间（其他归宿为 null）
  - `delivered_at`: 用户实际开启时间（每日一签时回填）
- **subscriptions** — 订阅状态
  - `user_id, stripe_customer_id, stripe_subscription_id, status, current_period_end`
- 录音文件存 Supabase Storage 私有 bucket，访问通过签名 URL

所有表启用 RLS：用户只能看到自己的数据。

## 五、核心交互细节

**每日一签的逻辑**：
- 进入 `/mailbox` 时，查询当前用户 `destination='letter' AND deliver_at <= now() AND delivered_at IS NULL`
- 按 `deliver_at` 升序取第一封，标记 `delivered_at = now()`，每天最多开启一封
- 当天如果已开过，显示"今天的信已收到，明天再来"
- 没有到期信件时，显示一句温柔的占位文案 + 当前在邮局里"在路上"的信件数量（不显示内容）

**封存的实现**：
- 主时间轴和信箱都过滤 `destination != 'vault'`
- 仅在 `/vault` 页面通过密码二次确认后才能查看
- 体现"自己也找不到"的设计意图

**订阅门槛**：
- 录音和留档/封存对所有用户开放
- "寄给未来的我"按钮，免费用户点击跳 `/subscribe`
- Stripe Checkout 成功后回调更新 `subscriptions.status='active'`

## 六、技术栈与依赖

- **框架**：当前 TanStack Start（已有）
- **UI**：现有 shadcn 组件 + Tailwind，新增波形动画自己画 canvas
- **录音**：浏览器原生 `MediaRecorder`，输出 webm/opus
- **后端**：Lovable Cloud（Supabase Auth + Postgres + Storage）
- **支付**：Lovable 内置 Stripe Payments（订阅模式）
- **服务端逻辑**：`createServerFn` 处理录音元数据写入、每日一签开启
- **定时任务**：不需要专门的 cron，"是否到期"在用户进入信箱时按需查询即可

## 七、设计方向建议

为了承载"私密、内向、仪式感"的产品气质，建议跳出常见 SaaS 风格：

- **配色**：深色为主（深靛蓝/墨黑）+ 一个温暖的暖光色（琥珀/赤陶）作为唯一强调
- **字体**：标题用衬线字体（如 Noto Serif SC）传递书信感，正文用现代无衬线（如 Inter）
- **动效**：录音时圆形呼吸光晕 + 波形脉动；收信时信封展开动画带 1-2 秒留白
- **留白**：大量负空间，避免任何信息密度，让"安静"成为产品的第一印象

## 八、开发分阶段

建议按这个顺序推进，每一步都可独立验证：

1. **骨架** —落地页 + 登录注册 + 启用 Lovable Cloud + 数据表 + RLS
2. **录与选** — 录音页 + 上传到 Storage + 三选一归宿 + 时间轴查看
3. **每日一签** — 信箱页 + 开启逻辑 + 仪式感动画
4. **订阅闭环** — 订阅页 + Stripe Checkout + Webhook + 寄信权限门
5. **打磨** — 落地页转化文案、设置页、封存二次确认

## 九、明确不在 MVP 范围

- 环境音/人声分层、AI 情绪分析、智能混音
- Web Push、邮件通知、桌面小组件、地点/天气场景触发
- 声音消消乐、声音图鉴
- 多档位订阅、年付、推荐返利
- 多语言（先做中文）

这些都是验证之后再决定要不要做的方向，先把"录—选—收—付"跑通。
