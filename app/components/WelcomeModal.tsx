"use client";

import { useState, useEffect } from "react";
import { X, ExternalLink, Sparkles, Gift, HelpCircle } from "lucide-react";
import { getUserStatus, markStripeGuideAsSeen } from "../actions/authActions";

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const checkStatus = async () => {
      // 1. LocalStorage fast check
      const localSeen = localStorage.getItem("has_seen_stripe_guide");
      if (localSeen === "true") {
        return;
      }

      // 2. DB check via getUserStatus
      try {
        const status = await getUserStatus();
        if (status && !status.hasSeenStripeGuide) {
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Error checking guide status:", err);
      }
    };

    checkStatus();
  }, []);

  const handleClose = async () => {
    setIsOpen(false);
    localStorage.setItem("has_seen_stripe_guide", "true");
    try {
      await markStripeGuideAsSeen();
    } catch (err) {
      console.error("Error marking guide as seen:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={handleClose}
      style={{ zIndex: 9999, backgroundColor: "rgba(0, 0, 0, 0.7)", backdropFilter: "blur(12px)" }}
    >
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "480px",
          width: "90%",
          padding: "32px",
          borderRadius: "24px",
          position: "relative",
          overflow: "hidden",
          border: "1px solid rgba(139, 92, 246, 0.25)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 30px rgba(139, 92, 246, 0.15)",
          backgroundColor: "var(--bg-card)",
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-color)",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-secondary)",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          className="hover:text-white hover:bg-white/10"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: "28px" }}>
          {/* Exclusive Welcome Badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "9999px",
              background: "linear-gradient(135deg, rgba(234, 179, 8, 0.15) 0%, rgba(139, 92, 246, 0.15) 100%)",
              border: "1px solid rgba(234, 179, 8, 0.3)",
              color: "#eab308",
              fontSize: "12px",
              fontWeight: "600",
              marginBottom: "16px",
              letterSpacing: "0.4px",
            }}
          >
            <Gift size={14} style={{ color: "#eab308" }} />
            <span>Boas-Vindas</span>
            <Sparkles size={14} style={{ color: "#a855f7" }} />
          </div>

          <h2
            style={{
              fontSize: "24px",
              fontWeight: "700",
              color: "var(--text-primary)",
              margin: "0 0 12px 0",
              textAlign: "center",
              lineHeight: "1.3",
            }}
          >
            Primeiros Passos na meisterpay
          </h2>

          <p
            style={{
              fontSize: "14px",
              color: "var(--text-secondary)",
              textAlign: "center",
              lineHeight: "1.6",
              margin: 0,
              maxWidth: "400px",
            }}
          >
            Preparamos um guia passo a passo para você realizar a integração completa do Stripe e começar a transacionar na plataforma com segurança.
          </p>
        </div>

        {/* Footer Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <a
            href="https://docs.meisterpay.com.br/docs/integracoes/primeiros-passos-stripe"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClose}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              width: "100%",
              padding: "14px 24px",
              borderRadius: "12px",
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              color: "#ffffff",
              fontWeight: "600",
              fontSize: "15px",
              textDecoration: "none",
              boxShadow: "0 4px 14px rgba(139, 92, 246, 0.4)",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              cursor: "pointer",
            }}
          >
            <span>Acessar Material Inicial</span>
            <ExternalLink size={18} />
          </a>

          <button
            type="button"
            onClick={handleClose}
            style={{
              width: "100%",
              padding: "12px 24px",
              borderRadius: "12px",
              backgroundColor: "transparent",
              border: "1px solid transparent",
              color: "var(--text-secondary)",
              fontWeight: "500",
              fontSize: "14px",
              cursor: "pointer",
              transition: "color 0.2s ease",
            }}
          >
            Entendi, ver mais tarde
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              marginTop: "6px",
              fontSize: "12.5px",
              color: "var(--text-secondary)",
              opacity: 0.85,
              textAlign: "center",
              lineHeight: "1.4",
            }}
          >
            <HelpCircle size={15} style={{ flexShrink: 0, color: "#8b5cf6" }} />
            <span>
              Acesse este material quando quiser no menu <strong>Ajuda</strong>.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
