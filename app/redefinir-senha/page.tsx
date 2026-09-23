"use client";

export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import { updatePasswordWithToken } from "../actions/authActions";
import { Lock, Loader2, CheckCircle2, ArrowRight, Eye, EyeOff, AlertTriangle } from "lucide-react";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sessionChecking, setSessionChecking] = useState(true);
  const [hasValidToken, setHasValidToken] = useState(false);
  const [accessToken, setAccessToken] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  useEffect(() => {
    const extractTokenAndCheckSession = async () => {
      try {
        let tokenFound = "";

        // 1. Check URL Hash (#access_token=...)
        if (typeof window !== "undefined" && window.location.hash) {
          const hash = window.location.hash.replace(/^#/, "");
          const params = new URLSearchParams(hash);
          const hashToken = params.get("access_token");
          const refreshToken = params.get("refresh_token");

          if (hashToken) {
            tokenFound = hashToken;
            setAccessToken(hashToken);

            // Attempt to establish client session
            if (refreshToken) {
              await supabase.auth.setSession({
                access_token: hashToken,
                refresh_token: refreshToken,
              });
            }
          }
        }

        // 2. Check URL Search Params (?access_token=...)
        if (!tokenFound && typeof window !== "undefined" && window.location.search) {
          const searchParams = new URLSearchParams(window.location.search);
          const queryToken = searchParams.get("access_token") || searchParams.get("code");
          if (queryToken) {
            tokenFound = queryToken;
            setAccessToken(queryToken);
          }
        }

        // 3. Check active Supabase Client session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          tokenFound = session.access_token;
          setAccessToken(session.access_token);
        }

        if (tokenFound) {
          setHasValidToken(true);
        } else {
          // Retry after a brief moment in case Supabase SDK is parsing asynchronous hash
          setTimeout(async () => {
            const { data: { session: delayedSession } } = await supabase.auth.getSession();
            if (delayedSession?.access_token) {
              setAccessToken(delayedSession.access_token);
              setHasValidToken(true);
            } else if (typeof window !== "undefined" && window.location.hash.includes("access_token")) {
              const hash = window.location.hash.replace(/^#/, "");
              const params = new URLSearchParams(hash);
              const retryToken = params.get("access_token");
              if (retryToken) {
                setAccessToken(retryToken);
                setHasValidToken(true);
              }
            } else {
              setMessage({
                type: "error",
                text: "Sessão ou token de recuperação não encontrado. Abra o link enviado no seu e-mail.",
              });
            }
            setSessionChecking(false);
          }, 800);
          return;
        }

        setSessionChecking(false);
      } catch (err) {
        console.error("[REDEFINIR_SENHA] Error initializing session:", err);
        setSessionChecking(false);
      }
    };

    extractTokenAndCheckSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage(null);

    if (password.length < 6) {
      setMessage({ type: "error", text: "A senha deve ter no mínimo 6 caracteres." });
      return;
    }

    if (password !== confirmPassword) {
      setMessage({ type: "error", text: "As senhas não coincidem." });
      return;
    }

    setLoading(true);

    try {
      // 1. Try client-side updateUser first
      const { error: clientError } = await supabase.auth.updateUser({
        password: password,
      });

      if (!clientError) {
        setMessage({
          type: "success",
          text: "Senha redefinida com sucesso! Redirecionando para o login...",
        });
        setTimeout(() => {
          router.push("/login");
        }, 2000);
        return;
      }

      console.warn("[REDEFINIR_SENHA] Client update error, trying server action:", clientError.message);

      // 2. Fallback to server action with extracted access token
      const currentToken = accessToken || (typeof window !== "undefined" ? new URLSearchParams(window.location.hash.replace(/^#/, "")).get("access_token") : "") || "";
      
      const serverResult = await updatePasswordWithToken(currentToken, password);

      if (serverResult.error) {
        setMessage({ type: "error", text: serverResult.error });
      } else {
        setMessage({
          type: "success",
          text: "Senha redefinida com sucesso! Redirecionando para o login...",
        });
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      }
    } catch (err: any) {
      console.error("[REDEFINIR_SENHA] Exception updating password:", err);
      setMessage({ type: "error", text: err.message || "Erro ao redefinir a senha." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <img src="/logo1.webp" alt="meisterpay" className="login-logo" />
            <h1>Redefinir Senha</h1>
            <p>Crie uma nova senha segura para a sua conta</p>
          </div>

          {sessionChecking ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 className="animate-spin text-purple-500" size={32} />
              <p className="text-sm text-neutral-400">Verificando link de recuperação...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label className="form-label">Nova Senha</label>
                <div className="input-with-icon relative">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input pr-12"
                    placeholder="Mínimo de 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-4 icon-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirmar Nova Senha</label>
                <div className="input-with-icon">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="Repita a nova senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {message && (
                <div className={`auth-message ${message.type} flex items-center gap-2`}>
                  {message.type === "success" ? (
                    <CheckCircle2 size={18} className="flex-shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle size={18} className="flex-shrink-0 text-rose-400" />
                  )}
                  <span>{message.text}</span>
                </div>
              )}

              <button type="submit" className="btn-primary login-submit" disabled={loading}>
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    Salvar Nova Senha
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="login-footer">
            <p>
              Lembrou sua senha?{" "}
              <Link href="/login" className="auth-toggle">
                Fazer Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
