import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { BarChart3, Clock, User, Download, Share2, Copy, Send } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function HistoryQuote() {
  const { token } = useAuth();
  const [quotes, setQuotes] = useState<any[]>([]);

  const fetchQuotes = async () => {
    const res = await axios.get('/api/quotes', { headers: { Authorization: `Bearer ${token}` } });
    setQuotes(res.data);
  };

  useEffect(() => { fetchQuotes(); }, [token]);

  const handleWhatsApp = (q: any) => {
    const text = `*PROPOSTA BIO TERRA FERTILIZANTES - REF: ${q.id}*\n\n` +
      `Olá, segue sua proposta comercial oficial:\n\n` +
      `*Produto:* ${q.product_name} (${q.packaging_name})\n` +
      `*Quantidade:* ${q.quantity} Ton\n` +
      `*Volume Total:* R$ ${q.total_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
      `*PARA VISUALIZAR E ACEITAR A PROPOSTA, ACESSE:*\n` +
      `${window.location.origin}/proposta/${q.external_token}\n\n` +
      `_Bio Terra Fertilizantes - De solo em solo, alimentando o mundo._`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = (q: any) => {
    const url = `${window.location.origin}/proposta/${q.external_token}`;
    navigator.clipboard.writeText(url);
    alert('Link da proposta copiado para a área de transferência!');
  };

  const handleExportAll = () => {
    const ws = XLSX.utils.json_to_sheet(quotes);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Historico");
    XLSX.writeFile(wb, "Historico_Orcamentos_BioTerra.xlsx");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end">
        <h1 className="text-sm font-bold uppercase tracking-widest text-slate-500">Histórico Comercial Completo</h1>
        <button onClick={handleExportAll} className="bg-emerald-600 text-white px-3 py-1.5 rounded text-[11px] font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors">
          <Download size={14} /> Exportar Relatório (XLSX)
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse high-density-table">
            <thead className="sticky top-0 shadow-sm z-10">
              <tr>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Data</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Produto</th>
                <th className="px-4 py-2 text-right">Qtd (Ton)</th>
                <th className="px-4 py-2 text-right">Total (BRL)</th>
                <th className="px-4 py-2">Responsável</th>
                <th className="px-4 py-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic">
              {quotes.map(q => (
                <tr key={q.id} className="hover:bg-slate-50">
                   <td className="px-4 py-2">
                     <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${q.status === 'CLOSED' ? 'bg-emerald-100 text-emerald-700 font-bold' : (q.status === 'PENDING_LOGISTICS' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700')}`}>
                        {q.status === 'CLOSED' ? 'Fechado' : (q.status === 'PENDING_LOGISTICS' ? 'Logística' : 'Simulação')}
                     </span>
                  </td>
                  <td className="px-4 py-2 text-[10px] font-mono text-slate-400">{new Date(q.created_at).toLocaleString()}</td>
                  <td className="px-4 py-2 font-bold text-slate-800">{q.customer_name || 'Consumidor Final'}</td>
                  <td className="px-4 py-2 text-slate-500">{q.product_name}</td>
                  <td className="px-4 py-2 text-right font-mono">{q.quantity}</td>
                  <td className="px-4 py-2 text-right font-bold text-emerald-700">R$ {q.total_brl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td className="px-4 py-2 text-[10px] text-slate-400">
                    <div className="flex items-center gap-1">
                       <User size={10} />
                       {q.user_name}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center justify-center gap-2">
                       <button onClick={() => handleWhatsApp(q)} title="Enviar WhatsApp" className="text-emerald-600 hover:text-emerald-700 p-1">
                         <Send size={14} />
                       </button>
                       <button onClick={() => handleCopyLink(q)} title="Copiar Link Aceite" className="text-slate-400 hover:text-slate-600 p-1">
                         <Copy size={14} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
