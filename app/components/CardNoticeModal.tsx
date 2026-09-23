"use client";

import { useState, useEffect } from "react";
import { X, CreditCard, Calendar, ShieldCheck, ArrowRight, Sparkles, ShoppingBag } from "lucide-react";
import Link from "next/link";

export function CardNoticeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Show modal as soon as user enters the page
    const hasSeen = sessionStorage.getItem("has_seen_card_notice");
    if (!hasSeen) {
      setIsOpen(true);
      // Small timeout to trigger fade-in scale animation
      setTimeout(() => setIsAnimating(true), 50);
    }
  }, []);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsOpen(false);
      sessionStorage.setItem("has_seen_card_notice", "true");
    }, 200);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 transition-all duration-300"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        opacity: isAnimating ? 1 : 0,
      }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-[500px] rounded-3xl p-6 sm:p-8 transition-all duration-300 transform overflow-hidden"
        style={{
          backgroundColor: "var(--bg-card, #17151a)",
          border: "1px solid rgba(139, 92, 246, 0.25)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(139, 92, 246, 0.15)",
          scale: isAnimating ? "1" : "0.95",
          translate: isAnimating ? "0px 0px" : "0px 10px",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Ambient Background Glows */}
        <div
          className="absolute -top-24 -right-24 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, rgba(0,0,0,0) 70%)",
          }}
        />
        <div
          className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(0,0,0,0) 70%)",
          }}
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            border: "1px solid var(--border-color, rgba(255, 255, 255, 0.1))",
            color: "var(--text-secondary, #a1a1aa)",
          }}
          aria-label="Fechar"
        >
          <X size={18} />
        </button>

        {/* Header Section */}
        <div className="flex flex-col items-center text-center mb-6">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-3 border"
            style={{
              background: "linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(59, 130, 246, 0.15) 100%)",
              borderColor: "rgba(139, 92, 246, 0.3)",
              color: "#a78bfa",
            }}
          >
            <ShieldCheck size={14} className="text-purple-400" />
            <span>Informativo de Cobrança</span>
            <Sparkles size={13} className="text-blue-400" />
          </div>

          <h2
            className="text-xl sm:text-2xl font-bold tracking-tight mb-2"
            style={{ color: "var(--text-primary, #ffffff)" }}
          >
            Como funcionam as taxas e o cartão
          </h2>
          <p
            className="text-xs sm:text-sm max-w-md"
            style={{ color: "var(--text-secondary, #a1a1aa)", lineHeight: "1.5" }}
          >
            Transparência total para você vender com segurança e previsibilidade na meisterpay.
          </p>
        </div>

        {/* Information Items */}
        <div className="flex flex-col gap-3.5 mb-7">
          {/* Card item 1: Finalidade do cartão */}
          <div
            className="flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              borderColor: "rgba(255, 255, 255, 0.06)",
            }}
          >
            <div
              className="p-2.5 rounded-xl shrink-0 mt-0.5"
              style={{
                backgroundColor: "rgba(139, 92, 246, 0.12)",
                color: "#a78bfa",
                border: "1px solid rgba(139, 92, 246, 0.2)",
              }}
            >
              <CreditCard size={20} />
            </div>
            <div>
              <h3
                className="text-sm font-semibold mb-0.5"
                style={{ color: "var(--text-primary, #ffffff)" }}
              >
                Desconto Exclusivo de Taxas
              </h3>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--text-secondary, #a1a1aa)" }}
              >
                O cadastro do cartão é utilizado <strong className="text-purple-300 font-medium">apenas para que as taxas sobre as vendas sejam descontadas</strong>.
              </p>
            </div>
          </div>

          {/* Card item 2: Somente se houver venda */}
          <div
            className="flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              borderColor: "rgba(255, 255, 255, 0.06)",
            }}
          >
            <div
              className="p-2.5 rounded-xl shrink-0 mt-0.5"
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                color: "#34d399",
                border: "1px solid rgba(16, 185, 129, 0.2)",
              }}
            >
              <ShoppingBag size={20} />
            </div>
            <div>
              <h3
                className="text-sm font-semibold mb-0.5"
                style={{ color: "var(--text-primary, #ffffff)" }}
              >
                Cobrança Apenas com Vendas
              </h3>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--text-secondary, #a1a1aa)" }}
              >
                Isso <strong className="text-emerald-300 font-medium">só acontece quando houver venda</strong>. Sem vendas realizadas, nenhuma cobrança é gerada.
              </p>
            </div>
          </div>

          {/* Card item 3: Frequência de cobrança */}
          <div
            className="flex items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border transition-all duration-200"
            style={{
              backgroundColor: "rgba(255, 255, 255, 0.03)",
              borderColor: "rgba(255, 255, 255, 0.06)",
            }}
          >
            <div
              className="p-2.5 rounded-xl shrink-0 mt-0.5"
              style={{
                backgroundColor: "rgba(245, 158, 11, 0.12)",
                color: "#fbbf24",
                border: "1px solid rgba(245, 158, 11, 0.2)",
              }}
            >
              <Calendar size={20} />
            </div>
            <div>
              <h3
                className="text-sm font-semibold mb-0.5"
                style={{ color: "var(--text-primary, #ffffff)" }}
              >
                Periodicidade das Cobranças
              </h3>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "var(--text-secondary, #a1a1aa)" }}
              >
                A cobrança das taxas ocorre <strong className="text-amber-300 font-medium">toda segunda-feira</strong> ou <strong className="text-amber-300 font-medium">a depender do faturamento</strong> acumulado.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="relative w-full py-3.5 px-6 rounded-xl font-semibold text-sm text-white flex items-center justify-center gap-2 overflow-hidden transition-all duration-200 active:scale-[0.98] shadow-lg"
            style={{
              background: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
              boxShadow: "0 4px 20px rgba(139, 92, 246, 0.35)",
            }}
          >
            <span>Entendi e Concordo</span>
            <ArrowRight size={16} />
          </button>

          <Link
            href="/cobrancas"
            onClick={handleClose}
            className="w-full py-2.5 text-center text-xs font-medium transition-colors hover:underline"
            style={{ color: "var(--text-secondary, #a1a1aa)" }}
          >
            Gerenciar cartões no menu Cobranças
          </Link>
        </div>
      </div>
    </div>
  );
}
