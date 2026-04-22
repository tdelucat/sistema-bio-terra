import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Plus, Package, Edit2, CheckCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function ChemistProducts() {
  const { token } = useAuth();
  const [products, setProducts] = useState<any[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');

  const fetchProducts = async () => {
    const res = await axios.get('/api/products', { headers: { Authorization: `Bearer ${token}` } });
    setProducts(res.data);
  };

  useEffect(() => { fetchProducts(); }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await axios.post('/api/products', { name, description: desc }, { headers: { Authorization: `Bearer ${token}` } });
    setName('');
    setDesc('');
    setIsAdding(false);
    fetchProducts();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex items-center justify-between p-4">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-widest text-slate-800">Catálogo de Fertilizantes</h1>
          <p className="text-[10px] text-slate-400 font-bold italic">Gerenciamento técnico do portfólio</p>
        </div>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded text-xs font-bold flex items-center gap-2 transition-all shadow-sm"
        >
          <Plus size={14} />
          {isAdding ? 'CANCELAR' : 'NOVO PRODUTO'}
        </button>
      </div>

      {isAdding && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-5 border border-slate-200 rounded-lg shadow-sm">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Identificação do Produto</label>
              <input value={name} onChange={e => setName(e.target.value)} required className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs outline-none focus:ring-1 focus:ring-emerald-500/20 font-bold placeholder:font-normal" placeholder="ex: UREIA 46% N" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Especificação Técnica</label>
              <input value={desc} onChange={e => setDesc(e.target.value)} className="w-full bg-slate-50 border border-slate-200 p-2 rounded text-xs outline-none focus:ring-1 focus:ring-emerald-500/20" placeholder="ex: Granulometria controlada, alta pureza" />
            </div>
            <div className="md:col-span-2 pt-2">
              <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded text-xs font-bold shadow-sm flex items-center gap-2">
                <CheckCircle size={14} />
                CONFIRMAR CADASTRO
              </button>
            </div>
          </form>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map(p => (
          <div key={p.id} className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm flex items-center justify-between group hover:border-emerald-600/30 transition-all cursor-default">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded">
                <Package size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">{p.name}</h3>
                <p className="text-[10px] text-slate-400 italic font-medium">{p.description || 'Sem especificação registrada'}</p>
              </div>
            </div>
            <CheckCircle size={14} className="text-slate-100 group-hover:text-emerald-500 transition-colors" />
          </div>
        ))}
      </div>
    </div>
  );
}
