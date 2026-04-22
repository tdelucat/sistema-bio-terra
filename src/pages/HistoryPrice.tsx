import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { History, Calendar, DollarSign, Package } from 'lucide-react';

export default function HistoryPrice() {
  const { token } = useAuth();
  const [offers, setOffers] = useState<any[]>([]);

  useEffect(() => {
    const fetchOffers = async () => {
      const res = await axios.get('/api/offers', { headers: { Authorization: `Bearer ${token}` } });
      setOffers(res.data);
    };
    fetchOffers();
  }, [token]);

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center text-xs font-bold uppercase text-slate-500 tracking-wide">
          <span>Rastreabilidade de Preços / Registro Histórico</span>
          <History size={14} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse high-density-table">
            <thead className="sticky top-0">
              <tr>
                <th className="px-4 py-2">Data Registro</th>
                <th className="px-4 py-2">Produto</th>
                <th className="px-4 py-2">Fornecedor</th>
                <th className="px-4 py-2 text-right">Base USD</th>
                <th className="px-4 py-2">Vencimento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic">
              {offers.map(o => (
                <tr key={o.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2 text-[10px] font-mono text-slate-400">
                    {new Date(o.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-2 font-bold text-slate-900">{o.product_name}</td>
                  <td className="px-4 py-2 text-slate-500">{o.supplier_name}</td>
                  <td className="px-4 py-2 text-right font-mono font-bold text-emerald-700">${o.price_usd.toFixed(2)}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${new Date(o.valid_until) < new Date() ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {new Date(o.valid_until).toLocaleDateString()}
                    </span>
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
