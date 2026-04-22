import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Tag, Plus, CheckCircle, Clock, FileText } from 'lucide-react';
import { motion } from 'motion/react';
import { derivePackagingPrices } from '../lib/calculations';

export default function ChemistOffers() {
  const { token } = useAuth();
  const [offers, setOffers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  
  // Form State
  const [productId, setProductId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [packagingId, setPackagingId] = useState('1'); // Granel
  const [priceUsd, setPriceUsd] = useState('');
  const [validUntil, setValidUntil] = useState('');
  const [coa, setCoa] = useState('');

  const fetchAll = async () => {
    const [p, s, o] = await Promise.all([
      axios.get('/api/products', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/suppliers', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/offers', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    setProducts(p.data);
    setSuppliers(s.data);
    setOffers(o.data);
  };

  useEffect(() => { fetchAll(); }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.post('/api/offers', {
      product_id: parseInt(productId),
      supplier_id: parseInt(supplierId),
      packaging_id: parseInt(packagingId),
      price_usd: parseFloat(priceUsd),
      valid_until: validUntil,
      coa_ref: coa
    }, { headers: { Authorization: `Bearer ${token}` } });
    
    setIsAdding(false);
    fetchAll();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex items-center justify-between p-4">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-widest text-slate-800">Ofertas USD (Input Base)</h1>
          <p className="text-[10px] text-slate-400 font-bold italic">Manutenção de preços ativos e fornecedores</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus size={14} />
          {isAdding ? 'CANCELAR' : 'NOVA COTAÇÃO'}
        </button>
      </div>

      {isAdding && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5 border border-slate-200 rounded-lg shadow-sm">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Produto</label>
              <select value={productId} onChange={e => setProductId(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs outline-none">
                <option value="">Selecione...</option>
                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Fornecedor</label>
              <select value={supplierId} onChange={e => setSupplierId(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs outline-none">
                <option value="">Selecione...</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Origem (Embalagem)</label>
              <select value={packagingId} onChange={e => setPackagingId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs outline-none">
                <option value="1">Granel</option>
                <option value="2">Big Bag</option>
                <option value="3">Sacaria</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Preço Base (USD)</label>
              <input type="number" step="0.01" value={priceUsd} onChange={e => setPriceUsd(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs font-mono" placeholder="0.00" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Vencimento</label>
              <input type="date" value={validUntil} onChange={e => setValidUntil(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400">Ref. Documental / COA</label>
              <input value={coa} onChange={e => setCoa(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs" placeholder="Protocolo ou Link" />
            </div>
            <div className="lg:col-span-3 flex justify-end pt-2">
              <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded text-xs font-bold shadow-sm">SALVAR OFERTA COMERCIAL</button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <table className="w-full text-left high-density-table border-collapse">
          <thead>
            <tr>
              <th className="px-4 py-2">Produto</th>
              <th className="px-4 py-2">Fornecedor</th>
              <th className="px-4 py-2">Pack Base</th>
              <th className="px-4 py-2 text-right">Preço USD</th>
              <th className="px-4 py-2">Vencimento</th>
              <th className="px-4 py-2 text-center">Docs</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 italic">
            {offers.map(o => (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="px-4 py-2 font-bold text-slate-800">{o.product_name}</td>
                <td className="px-4 py-2 text-slate-500">{o.supplier_name}</td>
                <td className="px-4 py-2">
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded uppercase">{o.packaging_name}</span>
                </td>
                <td className="px-4 py-2 text-right font-mono font-bold text-slate-700">${o.price_usd.toFixed(2)}</td>
                <td className="px-4 py-2 text-[10px]">
                  <div className="flex items-center gap-1 text-slate-400">
                    <Clock size={10} />
                    {new Date(o.valid_until).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-4 py-2 text-center">
                  {o.coa_ref ? <FileText size={14} className="text-emerald-600 mx-auto cursor-pointer" /> : <span className="text-slate-300">-</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
