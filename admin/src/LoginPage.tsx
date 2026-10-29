import { useState, type FormEvent } from "react";
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import api from "./lib/api";
import "./LoginPage.css";
import axios from "axios";

export type AdminUser = {
  id: string;
  email: string;
  fullName: string;
  username: string;
  phone: string | null;
  avatarUrl: string | null;
  role: string;
  permissions: string[];
};

type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresIn: string;
  admin: AdminUser;
};

type LoginPageProps = {
  onLogin: (admin: AdminUser) => void;
};

function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      const message = error.response.data?.message;

      if (Array.isArray(message)) {
        return message.join("، ");
      }

      if (typeof message === "string") {
        return `خطای سرور (${error.response.status}): ${message}`;
      }

      return `سرور با وضعیت ${error.response.status} پاسخ داد.`;
    }

    if (error.code === "ERR_NETWORK") {
      return "ارتباط شبکه برقرار نشد؛ آدرس API و تنظیمات CORS را بررسی کن.";
    }

    return `خطای درخواست: ${error.message}`;
  }

  return "خطای غیرمنتظره‌ای هنگام ورود رخ داد.";
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      const { data } = await api.post<LoginResponse>("/auth/login", {
        email: email.trim(),
        password,
      });

      onLogin(data.admin);
    } catch (error: unknown) {
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page" dir="rtl">
      <div className="login-decoration login-decoration-one" />
      <div className="login-decoration login-decoration-two" />

      <section className="login-card">
        <div className="login-brand">
          <div className="login-logo">ML</div>
          <div>
            <strong>MEHDI LEILAEI</strong>
            <span>PERSONAL PORTFOLIO</span>
          </div>
        </div>

        <div className="login-heading">
          <span className="login-icon">
            <ShieldCheck size={23} />
          </span>
          <p className="login-eyebrow">فضای مدیریت شخصی</p>
          <h1>خوش برگشتی!</h1>
          <p className="login-description">
            برای ورود به پنل مدیریت، اطلاعات حساب خودت را وارد کن.
          </p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label htmlFor="login-email">ایمیل</label>
          <div className="login-input-wrap">
            <Mail size={18} />
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              placeholder="admin@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              maxLength={254}
              disabled={loading}
            />
          </div>

          <label htmlFor="login-password">رمز عبور</label>
          <div className="login-input-wrap">
            <LockKeyhole size={18} />
            <input
              id="login-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder="رمز عبور حساب مدیریت"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              maxLength={128}
              disabled={loading}
            />
            <button
              type="button"
              className="login-password-toggle"
              aria-label={
                showPassword ? "مخفی کردن رمز عبور" : "نمایش رمز عبور"
              }
              onClick={() => setShowPassword((current) => !current)}>
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p className="login-error" role="alert">
              {error}
            </p>
          )}

          <button className="login-submit" type="submit" disabled={loading}>
            {loading ? "در حال بررسی اطلاعات..." : "ورود به پنل مدیریت"}
          </button>
        </form>

        <div className="login-security">
          <LockKeyhole size={15} />
          <span>ورود امن · دسترسی مخصوص مدیران</span>
        </div>
      </section>

      <footer className="login-footer">© ۲۰۲۶ MEHDI LEILAEI</footer>
    </main>
  );
}
