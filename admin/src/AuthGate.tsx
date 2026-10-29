import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import api from "./lib/api";
import LoginPage, { type AdminUser } from "./LoginPage";
import App from "./App";

export default function AuthGate() {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkSession() {
      try {
        const { data } = await api.get<AdminUser>("/auth/me");

        if (active) {
          setAdmin(data);
          setSessionError(null);
        }
      } catch (error: unknown) {
        if (!active) return;

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          setAdmin(null);
          setSessionError(null);
        } else {
          setSessionError(
            "ارتباط با سرور برقرار نشد. لطفاً اتصال API را بررسی و دوباره تلاش کن.",
          );
        }
      } finally {
        if (active) {
          setCheckingSession(false);
        }
      }
    }

    void checkSession();

    return () => {
      active = false;
    };
  }, []);

  const handleLogin = useCallback((user: AdminUser) => {
    setAdmin(user);
    setSessionError(null);
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
      setAdmin(null);
      setSessionError(null);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        // The server has already rejected the current session.
        setAdmin(null);
        setSessionError(null);
        return;
      }

      setSessionError(
        "خروج از حساب انجام نشد؛ ارتباط با سرور را بررسی و دوباره تلاش کن.",
      );
    }
  }, []);

  if (checkingSession) {
    return (
      <div
        dir="rtl"
        style={{
          display: "grid",
          minHeight: "100vh",
          placeItems: "center",
          background: "#0d0b14",
          color: "#b19aff",
          fontFamily: "Vazir, Tahoma, sans-serif",
        }}>
        در حال بررسی نشست...
      </div>
    );
  }

  if (sessionError && !admin) {
    return (
      <div
        dir="rtl"
        style={{
          display: "grid",
          minHeight: "100vh",
          placeContent: "center",
          justifyItems: "center",
          gap: 16,
          padding: 24,
          background: "#0d0b14",
          color: "#f1f0f7",
          fontFamily: "Vazir, Tahoma, sans-serif",
        }}>
        <p>{sessionError}</p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          style={{
            padding: "9px 16px",
            border: "1px solid #49385f",
            borderRadius: 8,
            color: "#d8caff",
            background: "#21192f",
            fontFamily: "inherit",
            cursor: "pointer",
          }}>
          تلاش دوباره
        </button>
      </div>
    );
  }

  if (!admin) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div>
      {sessionError && (
        <div
          dir="rtl"
          role="alert"
          style={{
            padding: "10px 20px",
            color: "#ffd7a8",
            background: "#392817",
            fontFamily: "Vazir, Tahoma, sans-serif",
          }}>
          {sessionError}
        </div>
      )}

      <div
        dir="rtl"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 12,
          padding: "10px 20px",
          color: "#f1f0f7",
          background: "#15121f",
          borderBottom: "1px solid #292438",
        }}>
        <span>{admin.fullName || admin.username || admin.email}</span>

        <button
          type="button"
          onClick={() => void handleLogout()}
          style={{
            padding: "7px 12px",
            border: "1px solid #49385f",
            borderRadius: 8,
            color: "#d8caff",
            background: "#21192f",
            fontFamily: "inherit",
            cursor: "pointer",
          }}>
          خروج از حساب
        </button>
      </div>

      <App />
    </div>
  );
}
