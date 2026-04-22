import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Settings, Percent, Map, Users, Shield, Plus, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminSettings() {
  const { token, user } = useAuth();
  const [settings, setSettings] = useState<any[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [dre, setDre] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('comercial');

  const fetchDre = async () => {
    const res = await axios.get('/api/admin/dre', { headers: { Authorization: `Bearer ${token}` } });
    setDre(res.data);
  };

  const fetchAll = async () => {
    const [s, a, u] = await Promise.all([
      axios.get('/api/settings', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/state-adjustments', { headers: { Authorization: `Bearer ${token}` } }),
      axios.get('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
    ]);
    setSettings(s.data);
    setAdjustments(a.data);
    setUsers(u.data);
  };

  useEffect(() => { 
    fetchAll();
    if (activeTab === 'dre') fetchDre();
  }, [token, activeTab]);

  const updateSetting = async (key: string, value: string) => {
    await axios.patch('/api/settings', { key, value }, { headers: { Authorization: `Bearer ${token}` } });
    fetchAll();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex items-center justify-between p-4">
        <div>
          <h1 className="text-sm font-bold uppercase tracking-widest text-slate-800">Parâmetros do Sistema</h1>
          <p className="text-[10px] text-slate-400 font-bold italic">Configurações globais de margens e tributação</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded">
          {['comercial', 'estados', 'usuarios', 'dre'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1 text-[10px] font-bold uppercase tracking-wider transition-all rounded ${activeTab === tab ? 'bg-white shadow text-emerald-700' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {activeTab === 'dre' && dre && (
          <div className="col-span-12 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Faturamento Bruto</p>
                <p className="text-lg font-bold text-slate-800">R$ {dre.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">CMV (Custo Mercadorias)</p>
                <p className="text-lg font-bold text-red-600">- R$ {dre.cogs.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Lucro Bruto</p>
                <p className="text-lg font-bold text-emerald-600">R$ {dre.grossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Margem Geral (%)</p>
                <p className="text-lg font-bold text-slate-800">{dre.margin.toFixed(2)}%</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
               <div className="p-3 border-b bg-slate-50">
                 <h3 className="text-xs font-bold text-slate-500 uppercase">Performance por Consultor</h3>
               </div>
               <table className="w-full text-left high-density-table border-collapse">
                 <thead>
                   <tr>
                     <th className="px-4 py-2">Consultor</th>
                     <th className="px-4 py-2 text-right">Vendas Totais (BRL)</th>
                     <th className="px-4 py-2">Participação</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 italic text-[11px]">
                   {dre.salesBySeller.map((s: any) => (
                     <tr key={s.name}>
                       <td className="px-4 py-2 font-bold text-slate-800">{s.name}</td>
                       <td className="px-4 py-2 text-right font-mono">R$ {s.total_sales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                       <td className="px-4 py-2">
                         <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full" 
                              style={{ width: `${(s.total_sales / dre.revenue) * 100}%` }}
                            />
                         </div>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}
        {activeTab === 'comercial' && (
          <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 gap-4">
            {settings.map(s => (
              <div key={s.key} className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">{s.description}</h3>
                  <p className="text-[9px] text-slate-400 font-mono mt-0.5">{s.key}</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={s.value}
                      onChange={(e) => updateSetting(s.key, e.target.value)}
                      className="w-20 bg-slate-50 border border-slate-200 p-1.5 rounded text-center text-xs font-bold text-emerald-700 outline-none focus:ring-1 focus:ring-emerald-500/20"
                    />
                    {s.key.includes('margin') && <Percent size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-300" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'estados' && (
          <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <table className="w-full text-left high-density-table border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-2">Estado (UF)</th>
                  <th className="px-4 py-2 text-right">Adicional (%)</th>
                  <th className="px-4 py-2 text-center">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 italic">
                {adjustments.map(a => (
                  <tr key={a.state_code}>
                    <td className="px-4 py-2 font-bold text-slate-800 underline decoration-slate-200 underline-offset-4">{a.state_code}</td>
                    <td className="px-4 py-2 text-right font-mono font-bold text-slate-600">{(a.adjustment_percent * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2 text-center">
                       <button className="text-[10px] uppercase font-bold text-emerald-600 hover:underline">Editar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'usuarios' && (
          <div className="col-span-12 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
             <div className="p-3 border-b flex justify-between items-center bg-slate-50">
               <h3 className="text-xs font-bold text-slate-500 uppercase">Gestão de Identidade</h3>
               <button className="bg-emerald-600 text-white px-3 py-1 rounded text-[11px] font-bold flex items-center gap-2 hover:bg-emerald-700 transition-colors shadow-sm">
                 <Plus size={14} /> Novo Acesso
               </button>
             </div>
             <table className="w-full text-left high-density-table border-collapse">
              <thead>
                <tr>
                  <th className="px-4 py-2">Colaborador</th>
                  <th className="px-4 py-2">Credencial</th>
                  <th className="px-4 py-2">Perfil</th>
                  <th className="px-4 py-2">Situação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 italic text-[11px]">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 font-bold text-slate-800">{u.name}</td>
                    <td className="px-4 py-2 text-slate-500 font-mono">{u.email}</td>
                    <td className="px-4 py-2">
                      <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">{u.role}</span>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${u.active ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {u.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Edit2({ size, className }: { size: number, className?: string }) {
  return <Settings size={size} className={className} />;
}
