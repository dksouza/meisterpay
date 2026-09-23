"use client";

// export const runtime = 'edge';
export const dynamic = 'force-dynamic';


import { useEffect, useState } from "react";
import { UserCheck, UserX, Clock, Search, AlertCircle, ShieldCheck, Eye, CreditCard, DollarSign, X, Edit2, Check, TrendingUp, Flame, ExternalLink, Copy, PackageCheck, Zap, ArrowUpRight, CheckCircle2, ShoppingBag } from "lucide-react";
import { getPendingUsers, approveUser, rejectUser, getUserDetailsForAdmin, updateUserFee } from "../../actions/adminActions";
import { useLoading } from "../../context/LoadingContext";
import { Header } from "../../components/Header";

export default function AdminApprovalsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const { setIsLoading } = useLoading();
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUserDetails, setSelectedUserDetails] = useState<any>(null);
  const [editingFee, setEditingFee] = useState(false);
  const [feeValue, setFeeValue] = useState("");
  const [copiedLinkKey, setCopiedLinkKey] = useState<string | null>(null);

  const handleCopyText = (text: string, key: string) => {
    try {
      navigator.clipboard.writeText(text);
      setCopiedLinkKey(key);
      setTimeout(() => setCopiedLinkKey(null), 2000);
    } catch (err) {
      console.error("Erro ao copiar texto:", err);
    }
  };

  const loadUsers = async () => {
    setIsLoading(true);
    const result = await getPendingUsers();
    if (result.error) {
      setError(result.error);
    } else {
      setUsers(result.users || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleApprove = async (id: string) => {
    setIsLoading(true);
    const result = await approveUser(id);
    if (result.success) {
      loadUsers();
    }
    setIsLoading(false);
  };

  const handleReject = async (id: string) => {
    setIsLoading(true);
    const result = await rejectUser(id);
    if (result.success) {
      loadUsers();
    }
    setIsLoading(false);
  };

  const handleViewDetails = async (id: string) => {
    setIsLoading(true);
    setEditingFee(false);
    const result = await getUserDetailsForAdmin(id);
    if (result.success) {
      setSelectedUserDetails(result.details);
      setFeeValue(result.details.profile.fee_percentage?.toString() ?? "4.9");
      setIsModalOpen(true);
    } else {
      alert(result.error || "Erro ao carregar detalhes do usuário");
    }
    setIsLoading(false);
  };

  const handleSaveFee = async () => {
    if (!selectedUserDetails) return;
    setIsLoading(true);
    const parsedFee = parseFloat(feeValue);
    if (isNaN(parsedFee) || parsedFee < 0 || parsedFee > 100) {
      alert("Taxa inválida.");
      setIsLoading(false);
      return;
    }

    const result = await updateUserFee(selectedUserDetails.profile.id, parsedFee);
    if (result.success) {
      setSelectedUserDetails({
        ...selectedUserDetails,
        profile: {
          ...selectedUserDetails.profile,
          fee_percentage: parsedFee
        }
      });
      setUsers(prevUsers => prevUsers.map(user =>
        user.id === selectedUserDetails.profile.id
          ? { ...user, fee_percentage: parsedFee }
          : user
      ));
      setEditingFee(false);
    } else {
      alert(result.error || "Erro ao atualizar taxa");
    }
    setIsLoading(false);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center">
        <AlertCircle size={48} className="text-red-500 mb-4" />
        <h1 className="text-xl font-bold mb-2">Erro de Acesso</h1>
        <p className="text-secondary">{error}</p>
      </div>
    );
  }

  return (
    <>
      <Header />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestão de Usuários</h2>
          <p className="text-secondary text-sm">Gerencie o acesso dos usuários à plataforma</p>
        </div>

        <div className="input-with-icon" style={{ display: 'flex', alignItems: 'center', position: 'relative', width: '320px', maxWidth: '100%' }}>
          <Search size={18} className="input-icon" />
          <input
            type="text"
            className="form-input"
            placeholder="Buscar por nome ou e-mail..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="premium-table">
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Data de Cadastro</th>
              <th>Plano</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '80px', textAlign: 'center' }}>
                  <div className="flex flex-col items-center gap-4 text-secondary">
                    <ShieldCheck size={48} style={{ opacity: 0.2 }} />
                    <p className="font-medium">Nenhum usuário cadastrado no momento.</p>
                  </div>
                </td>
              </tr>
            ) : (
              users
                .filter(user => {
                  if (!searchQuery) return true;
                  const lowerQuery = searchQuery.toLowerCase();
                  const nameMatch = user.full_name?.toLowerCase().includes(lowerQuery);
                  const emailMatch = user.email?.toLowerCase().includes(lowerQuery);
                  return nameMatch || emailMatch;
                })
                .map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="flex flex-col">
                        <span className="font-bold text-primary">{user.full_name || user.email}</span>
                        {user.full_name && <span className="text-[12px] text-secondary">{user.email}</span>}
                        <span className="text-[10px] text-secondary uppercase tracking-widest font-bold mt-1">ID: {user.id.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-sm text-secondary">
                        <Clock size={14} />
                        {new Date(user.created_at).toLocaleDateString("pt-BR", { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td>
                      <span className="px-2 py-1 bg-white/5 border border-[var(--border-color)] rounded-md text-xs font-bold text-primary">
                        {user.plan_id ? user.plan_id.charAt(0).toUpperCase() + user.plan_id.slice(1) : 'Standard'} ({user.fee_percentage ?? 4.9}%)
                      </span>
                    </td>
                    <td>
                      {user.status === 'approved' ? (
                        <div className="sale-status-tag status-approved">
                          <UserCheck size={12} />
                          Aprovado
                        </div>
                      ) : user.status === 'blocked' ? (
                        <div className="sale-status-tag status-blocked">
                          <UserX size={12} />
                          Bloqueado
                        </div>
                      ) : (
                        <div className="sale-status-tag status-pending">
                          <Clock size={12} />
                          Pendente
                        </div>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex gap-2" style={{ justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleViewDetails(user.id)}
                          className="btn-secondary flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                          title="Ver Detalhes"
                        >
                          <Eye size={18} />
                        </button>
                        {(user.status === 'pending' || user.status === 'blocked') && (
                          <button
                            onClick={() => handleApprove(user.id)}
                            className="btn-success flex items-center gap-2"
                            style={{ padding: '8px 16px', fontSize: '13px' }}
                          >
                            <UserCheck size={16} />
                            Aprovar
                          </button>
                        )}
                        {user.status !== 'blocked' && (
                          <button
                            onClick={() => handleReject(user.id)}
                            className="btn-danger flex items-center gap-2"
                            style={{ padding: '8px 16px', fontSize: '13px' }}
                          >
                            <UserX size={16} />
                            {user.status === 'approved' ? 'Bloquear' : 'Recusar'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
            )}

            {users.length > 0 && users.filter(user => {
              if (!searchQuery) return true;
              const lowerQuery = searchQuery.toLowerCase();
              const nameMatch = user.full_name?.toLowerCase().includes(lowerQuery);
              const emailMatch = user.email?.toLowerCase().includes(lowerQuery);
              return nameMatch || emailMatch;
            }).length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: '60px', textAlign: 'center' }}>
                    <div className="flex flex-col items-center gap-4 text-secondary">
                      <Search size={48} style={{ opacity: 0.2 }} />
                      <p className="font-medium">Nenhum usuário encontrado para "{searchQuery}"</p>
                    </div>
                  </td>
                </tr>
              )}
          </tbody>
        </table>
      </div>

      {/* User Details Modal */}
      {isModalOpen && selectedUserDetails && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-container" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserCheck color="var(--primary)" size={24} /> Detalhes do Usuário
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', overflowY: 'auto', flex: 1 }}>
              {/* Basic Info */}
              <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Informações Básicas</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Nome Completo</p>
                    <p style={{ fontWeight: '500', fontSize: '0.875rem' }}>{selectedUserDetails.profile.full_name || "Não informado"}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>E-mail</p>
                    <p style={{ fontWeight: '500', fontSize: '0.875rem', wordBreak: 'break-all' }}>{selectedUserDetails.profile.email}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Telefone</p>
                    <p style={{ fontWeight: '500', fontSize: '0.875rem' }}>{selectedUserDetails.profile.phone || "Não informado"}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Status da Conta</p>
                    {selectedUserDetails.profile.status === "approved" ? (
                      <div className="sale-status-tag status-approved">
                        <UserCheck size={12} />
                        Aprovado
                      </div>
                    ) : selectedUserDetails.profile.status === "blocked" ? (
                      <div className="sale-status-tag status-blocked">
                        <UserX size={12} />
                        Bloqueado
                      </div>
                    ) : (
                      <div className="sale-status-tag status-pending">
                        <Clock size={12} />
                        Pendente
                      </div>
                    )}
                  </div>
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>Plano Atual</p>
                    <p style={{ fontWeight: '500', fontSize: '0.875rem' }}>
                      <span className="px-2 py-0.5 bg-white/5 border border-[var(--border-color)] rounded text-primary">
                        {selectedUserDetails.profile.plan_id ? selectedUserDetails.profile.plan_id.charAt(0).toUpperCase() + selectedUserDetails.profile.plan_id.slice(1) : 'Standard'} ({selectedUserDetails.profile.fee_percentage ?? 4.9}%)
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Billing Info */}
              <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '16px' }}>Situação Financeira</h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(34, 197, 94, 0.1)', color: '#22c55e' }}>
                        <TrendingUp size={20} />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Total Faturado (Vendas)</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {selectedUserDetails.totalsByCurrency && Object.keys(selectedUserDetails.totalsByCurrency).length > 0 ? (
                            Object.entries(selectedUserDetails.totalsByCurrency)
                              .map(([curr, val]) => `${curr}: ${(val as number).toLocaleString('pt-BR', { style: 'currency', currency: curr })}`)
                              .join(' | ')
                          ) : (
                            'Volume total de vendas aprovadas'
                          )}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#22c55e' }}>
                        {(selectedUserDetails.totalFaturadoBRL || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      {selectedUserDetails.totalsByCurrency && Object.keys(selectedUserDetails.totalsByCurrency).some(c => c !== 'BRL') && (
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          (Total em BRL)
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                        <TrendingUp size={20} />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Vendas de Hoje</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {selectedUserDetails.totalsHojeByCurrency && Object.keys(selectedUserDetails.totalsHojeByCurrency).length > 0 ? (
                            Object.entries(selectedUserDetails.totalsHojeByCurrency)
                              .map(([curr, val]) => `${curr}: ${(val as number).toLocaleString('pt-BR', { style: 'currency', currency: curr })}`)
                              .join(' | ')
                          ) : (
                            'Volume de vendas do dia de hoje'
                          )}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#3b82f6' }}>
                        {(selectedUserDetails.totalHojeBRL || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                      {selectedUserDetails.totalsHojeByCurrency && Object.keys(selectedUserDetails.totalsHojeByCurrency).some(c => c !== 'BRL') && (
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                          (Total em BRL)
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: selectedUserDetails.hasCard ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: selectedUserDetails.hasCard ? '#22c55e' : '#ef4444' }}>
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Cartão de Crédito</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {selectedUserDetails.hasCard
                            ? `Cadastrado (${selectedUserDetails.cardBrand} final ${selectedUserDetails.cardLast4})`
                            : "Não cadastrado"}
                        </p>
                      </div>
                    </div>
                    {selectedUserDetails.hasCard ? (
                      <span style={{ padding: '4px 8px', backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', fontSize: '0.75rem', fontWeight: 'bold', borderRadius: '4px' }}>OK</span>
                    ) : (
                      <span style={{ padding: '4px 8px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold', borderRadius: '4px' }}>Pendente</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(139, 92, 246, 0.1)', color: 'var(--primary)' }}>
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Taxa da Plataforma</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          Taxa aplicada sobre vendas
                        </p>
                      </div>
                    </div>
                    <div>
                      {editingFee ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            step="0.1"
                            className="form-input"
                            style={{ width: '80px', padding: '6px 8px', fontSize: '14px' }}
                            value={feeValue}
                            onChange={(e) => setFeeValue(e.target.value)}
                          />
                          <button onClick={handleSaveFee} className="btn-success" style={{ padding: '6px', borderRadius: '6px' }}>
                            <Check size={16} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary)' }}>
                            {selectedUserDetails.profile.fee_percentage ?? 4.9}%
                          </span>
                          <button onClick={() => setEditingFee(true)} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            <Edit2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', borderRadius: '8px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: selectedUserDetails.isInadimplente ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', color: selectedUserDetails.isInadimplente ? '#ef4444' : '#22c55e' }}>
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <p style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>Taxas da Plataforma</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {selectedUserDetails.isInadimplente
                            ? "Pagamento falhou (inadimplente)"
                            : "Em dias"}
                        </p>
                      </div>
                    </div>
                    {selectedUserDetails.isInadimplente ? (
                      <span style={{ padding: '4px 8px', backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.75rem', fontWeight: 'bold', borderRadius: '4px' }}>Irregular</span>
                    ) : (
                      <span style={{ padding: '4px 8px', backgroundColor: 'rgba(34, 197, 94, 0.2)', color: '#22c55e', fontSize: '0.75rem', fontWeight: 'bold', borderRadius: '4px' }}>OK</span>
                    )}
                  </div>

                  <div style={{ marginTop: '8px', textAlign: 'right' }}>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Taxas pendentes de faturamento: <span style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>{(selectedUserDetails.pendingFees).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Top 3 Best-Selling Offers Section */}
              <div style={{ backgroundColor: 'var(--bg-main)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Flame size={18} style={{ color: '#f97316' }} /> Top 3 Ofertas Mais Vendidas
                  </h4>
                  {selectedUserDetails.topOffers && selectedUserDetails.topOffers.length > 0 && (
                    <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: 'rgba(249, 115, 22, 0.1)', color: '#f97316', fontWeight: '600' }}>
                      {selectedUserDetails.topOffers.length} oferta(s)
                    </span>
                  )}
                </div>

                {!selectedUserDetails.topOffers || selectedUserDetails.topOffers.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <ShoppingBag size={32} style={{ opacity: 0.3, margin: '0 auto 8px' }} />
                    <p style={{ fontSize: '0.875rem', fontWeight: '500' }}>Nenhuma oferta cadastrada por este usuário.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {selectedUserDetails.topOffers.map((offer: any, index: number) => {
                      const offerUrl = offer.hash
                        ? `https://checkout.meisterpay.com.br/pay/${offer.hash}`
                        : null;

                      const rankColors = [
                        { bg: 'rgba(234, 179, 8, 0.15)', text: '#eab308', border: 'rgba(234, 179, 8, 0.3)', label: '#1 Mais Vendida' },
                        { bg: 'rgba(148, 163, 184, 0.15)', text: '#94a3b8', border: 'rgba(148, 163, 184, 0.3)', label: '#2 Mais Vendida' },
                        { bg: 'rgba(217, 119, 6, 0.15)', text: '#d97706', border: 'rgba(217, 119, 6, 0.3)', label: '#3 Mais Vendida' },
                      ];
                      const rank = rankColors[index] || rankColors[2];

                      return (
                        <div
                          key={offer.id || index}
                          style={{
                            backgroundColor: 'var(--bg-card)',
                            borderRadius: '10px',
                            border: '1px solid var(--border-color)',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                          }}
                        >
                          {/* Header: Rank + Name + Price */}
                          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <span style={{
                                padding: '4px 10px',
                                borderRadius: '20px',
                                backgroundColor: rank.bg,
                                color: rank.text,
                                border: `1px solid ${rank.border}`,
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <Flame size={12} /> {rank.label}
                              </span>
                              <div>
                                <h5 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--text-primary)', margin: 0 }}>
                                  {offer.name}
                                </h5>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>
                                  Produto: <span style={{ color: 'var(--text-primary)', fontWeight: '500' }}>{offer.productName}</span>
                                </p>
                              </div>
                            </div>

                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                              <span style={{ fontSize: '1rem', fontWeight: '800', color: 'var(--primary)' }}>
                                {offer.price ? offer.price.toLocaleString('pt-BR', { style: 'currency', currency: offer.currency || 'BRL' }) : 'Grátis'}
                              </span>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                                <div>
                                  <span style={{ color: '#22c55e', fontWeight: '700' }}>{offer.salesCount} vendas total</span>
                                  {offer.revenueBRL > 0 && (
                                    <span> • {(offer.revenueBRL).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.72rem', padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                  <TrendingUp size={10} />
                                  <span>Hoje: <strong>{offer.salesTodayCount || 0} vendas</strong> ({((offer.revenueTodayBRL || 0)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Links Section: Offer URL + Deliverable URL */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', backgroundColor: 'var(--bg-main)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                            {/* URL da Oferta */}
                            <div>
                              <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <ExternalLink size={12} /> URL da Oferta (Checkout)
                              </p>
                              {offerUrl ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <input
                                    type="text"
                                    readOnly
                                    value={offerUrl}
                                    style={{ flex: 1, fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                  />
                                  <button
                                    onClick={() => handleCopyText(offerUrl, `offer_${offer.id}`)}
                                    title="Copiar URL"
                                    style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                                  >
                                    {copiedLinkKey === `offer_${offer.id}` ? <Check size={12} style={{ color: '#22c55e' }} /> : <Copy size={12} />}
                                  </button>
                                  <a
                                    href={offerUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Abrir Checkout"
                                    style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: 'var(--primary)', border: '1px solid rgba(139, 92, 246, 0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                  >
                                    <ArrowUpRight size={14} />
                                  </a>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Link de checkout não disponível</span>
                              )}
                            </div>

                            {/* URL do Entregável */}
                            <div>
                              <p style={{ fontSize: '0.7rem', fontWeight: '700', color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <PackageCheck size={12} /> URL do Entregável (Download / Acesso)
                              </p>
                              {offer.deliveryLink ? (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <input
                                    type="text"
                                    readOnly
                                    value={offer.deliveryLink}
                                    style={{ flex: 1, fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                  />
                                  <button
                                    onClick={() => handleCopyText(offer.deliveryLink, `deliv_${offer.id}`)}
                                    title="Copiar Link do Entregável"
                                    style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}
                                  >
                                    {copiedLinkKey === `deliv_${offer.id}` ? <Check size={12} style={{ color: '#22c55e' }} /> : <Copy size={12} />}
                                  </button>
                                  <a
                                    href={offer.deliveryLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    title="Abrir Entregável"
                                    style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', border: '1px solid rgba(34, 197, 94, 0.3)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                  >
                                    <ArrowUpRight size={14} />
                                  </a>
                                </div>
                              ) : (
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>Nenhum entregável cadastrado</span>
                              )}
                            </div>
                          </div>

                          {/* Upsell Section */}
                          {(() => {
                            const upsellList = offer.upsells || (offer.upsell ? [offer.upsell] : []);
                            const hasUpsells = upsellList.length > 0;

                            return (
                              <div style={{ backgroundColor: hasUpsells ? 'rgba(139, 92, 246, 0.05)' : 'var(--bg-main)', border: `1px solid ${hasUpsells ? 'rgba(139, 92, 246, 0.2)' : 'var(--border-color)'}`, borderRadius: '8px', padding: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: hasUpsells ? '10px' : '0' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Zap size={14} style={{ color: hasUpsells ? 'var(--primary)' : 'var(--text-secondary)' }} />
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: hasUpsells ? 'var(--primary)' : 'var(--text-secondary)' }}>
                                      Estratégias de Upsell / Downsell
                                    </span>
                                  </div>
                                  {hasUpsells ? (
                                    <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', fontSize: '0.7rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <CheckCircle2 size={10} /> {upsellList.length} Upsell(s) Atrelado(s)
                                    </span>
                                  ) : (
                                    <span style={{ padding: '2px 8px', borderRadius: '4px', backgroundColor: 'rgba(148, 163, 184, 0.1)', color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: '600' }}>
                                      Sem Upsell
                                    </span>
                                  )}
                                </div>

                                {hasUpsells && (
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {upsellList.map((upsell: any, uIdx: number) => (
                                      <div
                                        key={upsell.id || uIdx}
                                        style={{
                                          backgroundColor: 'var(--bg-card)',
                                          border: '1px solid var(--border-color)',
                                          borderRadius: '6px',
                                          padding: '10px',
                                          display: 'flex',
                                          flexDirection: 'column',
                                          gap: '8px',
                                          fontSize: '0.75rem'
                                        }}
                                      >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '4px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ padding: '2px 6px', borderRadius: '4px', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: 'var(--primary)', fontWeight: '700', fontSize: '0.68rem' }}>
                                              #{uIdx + 1} {upsell.type || 'Upsell'}
                                            </span>
                                            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                                              {upsell.name}
                                            </span>
                                          </div>
                                          {upsell.productName && (
                                            <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                              Ofertando: <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{upsell.productName}</span>
                                              {upsell.price ? ` (${upsell.price.toLocaleString('pt-BR', { style: 'currency', currency: upsell.currency || 'BRL' })})` : ''}
                                            </div>
                                          )}
                                        </div>

                                        {/* Upsell Sales Stats: Total + Today */}
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', padding: '6px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)' }}>
                                          <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                                            Vendas do Upsell: <span style={{ color: '#22c55e', fontWeight: '700' }}>{upsell.salesCount || 0} total</span>
                                            {upsell.revenueBRL > 0 && (
                                              <span> • {(upsell.revenueBRL).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                            )}
                                          </div>
                                          <div style={{ fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                            <TrendingUp size={10} />
                                            <span>Hoje: <strong>{upsell.salesTodayCount || 0}</strong> ({(upsell.revenueTodayBRL || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})</span>
                                          </div>
                                        </div>

                                        {/* Upsell Page URL */}
                                        {upsell.upsellPageUrl && (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ color: 'var(--text-secondary)', minWidth: '95px', fontSize: '0.7rem' }}>Página Upsell:</span>
                                            <input
                                              type="text"
                                              readOnly
                                              value={upsell.upsellPageUrl}
                                              style={{ flex: 1, fontSize: '0.72rem', padding: '3px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                            />
                                            <button
                                              onClick={() => handleCopyText(upsell.upsellPageUrl, `upsell_page_${offer.id}_${uIdx}`)}
                                              title="Copiar URL da Página de Upsell"
                                              style={{ padding: '3px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}
                                            >
                                              {copiedLinkKey === `upsell_page_${offer.id}_${uIdx}` ? <Check size={12} style={{ color: '#22c55e' }} /> : <Copy size={12} />}
                                            </button>
                                            <a
                                              href={upsell.upsellPageUrl}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              style={{ padding: '3px 6px', borderRadius: '4px', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: 'var(--primary)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                            >
                                              <ArrowUpRight size={12} />
                                            </a>
                                          </div>
                                        )}

                                        {/* Upsell Delivery Link */}
                                        {upsell.deliveryLink && (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <span style={{ color: 'var(--text-secondary)', minWidth: '95px', fontSize: '0.7rem' }}>Entregável Upsell:</span>
                                            <input
                                              type="text"
                                              readOnly
                                              value={upsell.deliveryLink}
                                              style={{ flex: 1, fontSize: '0.72rem', padding: '3px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                                            />
                                            <button
                                              onClick={() => handleCopyText(upsell.deliveryLink, `upsell_deliv_${offer.id}_${uIdx}`)}
                                              title="Copiar Entregável do Upsell"
                                              style={{ padding: '3px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-main)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}
                                            >
                                              {copiedLinkKey === `upsell_deliv_${offer.id}_${uIdx}` ? <Check size={12} style={{ color: '#22c55e' }} /> : <Copy size={12} />}
                                            </button>
                                            <a
                                              href={upsell.deliveryLink}
                                              target="_blank"
                                              rel="noopener noreferrer"
                                              style={{ padding: '3px 6px', borderRadius: '4px', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                            >
                                              <ArrowUpRight size={12} />
                                            </a>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-main)', display: 'flex', justifyContent: 'flex-end', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
              <button
                onClick={() => setIsModalOpen(false)}
                className="btn-primary"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
