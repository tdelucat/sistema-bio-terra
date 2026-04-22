import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Search, Tag, Info, Filter } from 'lucide-react';
import { derivePackagingPrices } from '../lib/calculations';
import { cn } from '../lib/utils';

export default function CommercialConsultation() {
  const { token } = useAuth();
  const [offers, setOffers] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchOffers = async () => {
    try {
      const res = await axios.get('/api/offers', { headers: { Authorization: `Bearer ${token}` } });
      setOffers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOffers(); }, [token]);

  const filtered = offers.filter(o => 
    o.product_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col">
        <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center text-xs font-bold uppercase text-slate-500 tracking-wide">
          <span>Tabela de Preços Ativos (Derivados)</span>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
              <input
                type="text"
                placeholder="Buscar produto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="text-[11px] border border-slate-300 rounded pl-7 pr-2 py-1 w-48 bg-white outline-none focus:ring-1 focus:ring-emerald-500/20"
              />
            </div>
            <button className="bg-emerald-600 text-white text-[11px] px-3 py-1 rounded hover:bg-emerald-700 transition-colors">
              Filtrar
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse high-density-table">
            <thead className="sticky top-0">
              <tr>
                <th className="px-4 py-2">Produto</th>
                <th className="px-4 py-2">Fornecedor</th>
                <th className="px-4 py-2 text-right">Granel (USD)</th>
                <th className="px-4 py-2 text-right">Big Bag (USD)</th>
                <th className="px-4 py-2 text-right">Sacaria (USD)</th>
                <th className="px-4 py-2">Validade</th>
                <th className="px-4 py-2 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 italic">
              {filtered.map(o => {
                const derived = derivePackagingPrices(o.price_usd, o.packaging_name);
                const isExpiring = new Date(o.valid_until) < new Date(Date.now() + 86400000);
                
                return (
                  <tr key={o.id} className={cn("hover:bg-slate-50", isExpiring && "bg-amber-50")}>
                    <td className="px-4 py-2 font-bold text-slate-900">{o.product_name}</td>
                    <td className="px-4 py-2 text-slate-500">{o.supplier_name}</td>
                    <td className={cn("px-4 py-2 text-right font-mono", o.packaging_name === 'Granel' && "font-bold text-emerald-700")}>
                      ${derived.granel.toFixed(2)}
                    </td>
                    <td className={cn("px-4 py-2 text-right font-mono", o.packaging_name === 'Big Bag' && "font-bold text-emerald-700")}>
                      ${derived.bb.toFixed(2)}
                    </td>
                    <td className={cn("px-4 py-2 text-right font-mono", o.packaging_name === 'Sacaria' && "font-bold text-emerald-700")}>
                      ${derived.sacaria.toFixed(2)}
                    </td>
                    <td className={cn("px-4 py-2", isExpiring ? "text-red-600 font-bold" : "text-slate-500")}>
                      {new Date(o.valid_until).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <button className="text-emerald-600 hover:underline font-bold text-[10px] uppercase">Simular</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
          <span>Exibindo {filtered.length} de {offers.length} ofertas ativas</span>
          <div className="flex gap-2 font-bold uppercase text-[9px] tracking-widest">
             ATENÇÃO: Valores baseados no fechamento anterior conforme política interna.
          </div>
        </div>
      </div>
      
      {filtered.length === 0 && !loading && (
        <div className="bg-white border border-dashed border-slate-200 rounded-lg p-12 text-center text-slate-400 italic text-[11px]">
          Nenhum registro encontrado para os critérios selecionados.
        </div>
      )}
    </div>
  );
}
