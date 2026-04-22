import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, Clock, FileText, Smartphone, User, MapPin, Package } from 'lucide-react';
import { motion } from 'motion/react';

export default function PublicQuote() {
  const { token } = useParams();
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await axios.get(`/api/public/quotes/${token}`);
        setQuote(res.data);
      } catch (err) {
        setError('Proposta não encontrada ou expirada.');
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [token]);

  const handleAccept = async () => {
    if (!window.confirm('Deseja confirmar o aceite desta proposta comercial?')) return;
    setLoading(true);
    try {
      await axios.post(`/api/public/quotes/${token}/accept`);
      setAccepted(true);
      setQuote({ ...quote, status: 'CLOSED' });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao processar aceite');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !quote) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 italic text-slate-400">
        Carregando proposta oficial...
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm text-center">
          <p className="text-red-600 font-bold uppercase text-xs mb-4">{error}</p>
          <a href="/" className="text-emerald-600 font-bold underline text-[10px] uppercase">Voltar ao site</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-4 md:p-12 font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-lg">
          {/* Header */}
          <div className="bg-emerald-900 p-8 text-white flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <div className="w-8 h-8 bg-emerald-400 rounded flex items-center justify-center font-bold text-emerald-950 text-sm">BT</div>
                <h1 className="font-bold text-lg uppercase tracking-tight">Bio Terra Fertilizantes</h1>
              </div>
              <p className="text-[10px] text-emerald-300 uppercase font-bold tracking-widest">Proposta Comercial nº {quote.id}</p>
            </div>
            <div className="text-center md:text-right">
              <span className={`px-4 py-1.5 rounded text-[10px] font-bold uppercase tracking-widest shadow-inner ${quote.status === 'CLOSED' ? 'bg-emerald-500 text-white' : 'bg-amber-400 text-amber-950'}`}>
                {quote.status === 'CLOSED' ? 'PROPOSTA ACEITA' : 'AGUARDANDO ACEITE'}
              </span>
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Customer Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-100 pb-8">
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informações do Cliente</h3>
                <div className="flex items-center gap-3">
                  <User size={16} className="text-slate-300" />
                  <p className="font-bold text-slate-800 uppercase">{quote.customer_name || 'Cliente Direto'}</p>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin size={16} className="text-slate-300" />
                  <p className="text-xs text-slate-600">Estado de Faturamento: <span className="font-bold">{quote.state_code}</span></p>
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Consultor Responsável</h3>
                <div className="flex items-center gap-3">
                  < smartphone size={16} className="text-slate-300" />
                  <p className="font-bold text-slate-800 uppercase">{quote.user_name}</p>
                </div>
              </div>
            </div>

            {/* Product Table */}
            <div className="space-y-4">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Detalhamento da Proposta</h3>
              <div className="bg-slate-50 border border-slate-200 rounded p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex items-center gap-3">
                    <Package size={20} className="text-emerald-600" />
                    <div>
                      <p className="text-[9px] font-bold uppercase text-slate-400">Produto / Embalagem</p>
                      <p className="text-xs font-bold text-slate-800">{quote.product_name} ({quote.packaging_name})</p>
                    </div>
                  </div>
                  <div className="text-right md:text-center">
                    <p className="text-[9px] font-bold uppercase text-slate-400">Quantidade</p>
                    <p className="text-xs font-bold text-slate-800 font-mono">{quote.quantity} Toneladas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-bold uppercase text-slate-400">Operação Logística</p>
                    <p className="text-xs font-bold text-emerald-700">{quote.is_fob ? 'FOB (Retirada)' : 'CIF (Entrega)'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Price section */}
            <div className="bg-slate-900 rounded-lg p-8 text-white flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <p className="text-[10px] font-bold uppercase text-slate-500 mb-2">Valor Total do Pedido (BRL)</p>
                <h2 className="text-4xl font-bold font-mono">R$ {quote.total_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h2>
                <p className="text-[9px] text-slate-500 mt-2 italic font-bold">PTAX de Referência: R$ {quote.ptax.toFixed(4)}</p>
              </div>
              
              {quote.status !== 'CLOSED' ? (
                <button 
                  onClick={handleAccept}
                  className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-12 py-4 rounded uppercase tracking-wider text-sm transition-all shadow-lg hover:shadow-emerald-500/20"
                >
                  Confirmar e Aceitar Proposta
                </button>
              ) : (
                <div className="flex items-center gap-3 text-emerald-400 font-bold uppercase text-xs">
                  <CheckCircle size={24} />
                  <span>Aceite realizado em {new Date(quote.accepted_at).toLocaleString()}</span>
                </div>
              )}
            </div>

            <div className="text-[10px] text-slate-400 leading-relaxed italic border-t border-slate-100 pt-6">
              <p>Esta proposta é de caráter irrevogável após o aceite digital. Os valores estão sujeitos à disponibilidade imediata de estoque no momento da confirmação bancária. A validade desta proposta é de 24 horas.</p>
            </div>
          </div>
        </div>
        
        <div className="text-center">
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">© 2026 Bio Terra Fertilizantes - Sistema de Assinatura Digital de Propostas</p>
        </div>
      </div>
    </div>
  );
}
