"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "../actions/authActions";
import { Mail, Loader2, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function RecuperarSenhaPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const formData = new FormData(e.currentTarget);
    const originUrl = typeof window !== "undefined" ? window.location.origin : undefined;
    
    const result = await requestPasswordReset(formData, originUrl);

    if (result?.error) {
      setMessage({ type: "error", text: result.error });
    } else if (result?.success) {
      setMessage({ type: "success", text: result.success });
      (e.target as HTMLFormElement).reset();
    }
    setLoading(false);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <img src="/logo1.webp" alt="meisterpay" className="login-logo" />
            <h1>Recuperar Senha</h1>
            <p>Digite seu e-mail cadastrado para receber as instruções</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label className="form-label">E-mail</label>
              <div className="input-with-icon">
                <Mail size={18} className="input-icon" />
                <input
                  name="email"
                  type="email"
                  className="form-input"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            {message && (
              <div className={`auth-message ${message.type} flex items-center gap-2`}>
                {message.type === "success" && <CheckCircle2 size={18} className="flex-shrink-0 text-emerald-400" />}
                <span>{message.text}</span>
              </div>
            )}

            <button type="submit" className="btn-primary login-submit" disabled={loading}>
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Enviar Link de Recuperação
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors">
              <ArrowLeft size={16} />
              Voltar para o Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
