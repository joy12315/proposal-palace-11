import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Phone, Mail, Trash2, Check } from "lucide-react";
import { toast } from "sonner";
import { useGuest } from "@/hooks/use-guest";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "设置 — 如果声音记得" }] }),
  component: Settings,
});

export function Settings() {
  const { isBound, bindInfo, bindContact, clearAllData, recordings } = useGuest();
  const [showBind, setShowBind] = useState(false);
  const [bindType, setBindType] = useState<'phone' | 'email'>('phone');
  const [bindValue, setBindValue] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [sending, setSending] = useState(false);

  const handleSendCode = async () => {
    if (!bindValue) return;
    setSending(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast.success(`验证码已发送至 ${bindValue}`);
    setStep('verify');
    setSending(false);
  };

  const handleVerify = async () => {
    if (verifyCode !== '1234') {
      toast.error('验证码错误');
      return;
    }
    bindContact(bindType, bindValue);
    toast.success('绑定成功');
    setShowBind(false);
    setBindValue('');
    setVerifyCode('');
    setStep('input');
  };

  const handleClearData = () => {
    if (confirm('确定要清除所有本地数据吗？此操作不可恢复。')) {
      clearAllData();
      toast.success('已清除');
    }
  };

  const archiveCount = recordings.filter(r => r.destination === 'archive').length;
  const letterCount = recordings.filter(r => r.destination === 'letter').length;
  const vaultCount = recordings.filter(r => r.destination === 'vault').length;

  return (
    <div className="mx-auto min-h-screen max-w-md px-6 pt-12 pb-24">
      <h1 className="font-serif text-2xl">设置</h1>

      <div className="mt-8 space-y-3">
        {/* Account Section */}
        <div className="rounded-2xl border border-border bg-card/40 p-5">
          <div className="text-xs text-muted-foreground">账号</div>
          {isBound && bindInfo ? (
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm">
                {bindInfo.type === 'phone' ? '📱 ' : '✉️ '}
                {bindInfo.value}
              </span>
              <span className="flex items-center gap-1 text-xs text-primary">
                <Check className="h-3 w-3" /> 已绑定
              </span>
            </div>
          ) : (
            <div className="mt-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="h-2 w-2 rounded-full bg-muted-foreground" />
                游客用户
              </div>
              <button
                onClick={() => setShowBind(true)}
                className="mt-2 text-xs text-primary hover:underline"
              >
                绑定手机/邮箱解锁更多功能
              </button>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="rounded-2xl border border-border bg-card/40 p-5">
          <div className="text-xs text-muted-foreground">数据统计</div>
          <div className="mt-2 flex gap-6">
            <div>
              <span className="font-serif text-xl">{archiveCount}</span>
              <span className="ml-1 text-xs text-muted-foreground">留档</span>
            </div>
            <div>
              <span className="font-serif text-xl">{letterCount}</span>
              <span className="ml-1 text-xs text-muted-foreground">寄出</span>
            </div>
            <div>
              <span className="font-serif text-xl">{vaultCount}</span>
              <span className="ml-1 text-xs text-muted-foreground">封存</span>
            </div>
          </div>
        </div>

        {/* Notify Settings */}
        <div className="rounded-2xl border border-border bg-card/40 p-5">
          <div className="text-xs text-muted-foreground">收信通知</div>
          <p className="mt-1 text-sm">
            {isBound ? '绑定后可开启寄信提醒' : '绑定手机/邮箱后可用'}
          </p>
        </div>

        {/* Data Management */}
        <div className="rounded-2xl border border-border bg-card/40 p-5">
          <div className="text-xs text-muted-foreground">数据管理</div>
          <button
            onClick={handleClearData}
            className="mt-2 flex items-center gap-2 text-sm text-red-500 hover:underline"
          >
            <Trash2 className="h-4 w-4" />
            清除本地数据
          </button>
        </div>

        {/* About */}
        <div className="rounded-2xl border border-border bg-card/40 p-5">
          <div className="text-xs text-muted-foreground">关于</div>
          <div className="mt-1 text-sm font-serif">如果声音记得</div>
          <p className="mt-1 text-xs text-muted-foreground">v1.0.0 · 为内在对话者打造的声音日记</p>
        </div>
      </div>

      {/* Bind Modal */}
      {showBind && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-border bg-card p-6">
            <h2 className="font-serif text-xl">绑定联系方式</h2>
            <p className="mt-1 text-xs text-muted-foreground">绑定后可开启寄信提醒、备份等功能</p>

            {step === 'input' ? (
              <div className="mt-6 space-y-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => setBindType('phone')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm transition ${
                      bindType === 'phone'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border'
                    }`}
                  >
                    <Phone className="h-4 w-4" />
                    手机号
                  </button>
                  <button
                    onClick={() => setBindType('email')}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-3 text-sm transition ${
                      bindType === 'email'
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border'
                    }`}
                  >
                    <Mail className="h-4 w-4" />
                    邮箱
                  </button>
                </div>

                <input
                  type={bindType === 'phone' ? 'tel' : 'email'}
                  value={bindValue}
                  onChange={(e) => setBindValue(e.target.value)}
                  placeholder={bindType === 'phone' ? '请输入手机号' : '请输入邮箱'}
                  className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                />

                <button
                  onClick={handleSendCode}
                  disabled={!bindValue || sending}
                  className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {sending ? '发送中...' : '发送验证码'}
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  验证码已发送至 {bindValue}
                </p>
                <input
                  type="text"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value)}
                  placeholder="请输入验证码"
                  className="w-full rounded-lg border border-border bg-card px-4 py-3 text-sm outline-none focus:border-primary"
                  maxLength={6}
                />
                <button
                  onClick={handleVerify}
                  disabled={verifyCode.length < 4}
                  className="w-full rounded-lg bg-primary py-3 text-sm font-medium text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  确认绑定
                </button>
                <button
                  onClick={() => setStep('input')}
                  className="w-full text-center text-xs text-muted-foreground hover:underline"
                >
                  返回修改
                </button>
              </div>
            )}

            <button
              onClick={() => { setShowBind(false); setStep('input'); setBindValue(''); setVerifyCode(''); }}
              className="mt-4 w-full text-center text-xs text-muted-foreground hover:underline"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
