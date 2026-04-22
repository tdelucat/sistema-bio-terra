import { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { TrendingUp, Users, Package, FileText, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState({
    products: 0,
    quotes: 0,
    activeUsers: 0,
    recentOffers: 0
  });

  useEffect(() => {
    // In a real app we'd fetch actual stats
    setStats({
      products: 12,
      quotes: 45,
      activeUsers: 8,
      recentOffers: 3
    });
  }, [token]);

  const cards = [
    { name: 'Produtos Ativos', value: stats.products, icon: Package, color: 'text-primary' },
    { name: 'Orçamentos (Mês)', value: stats.quotes, icon: FileText, color: 'text-blue-600' },
    { name: 'Usuários Online', value: stats.activeUsers, icon: Users, color: 'text-orange-600' },
    { name: 'Novas Ofertas', value: stats.recentOffers, icon: TrendingUp, color: 'text-accent' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div 
            key={card.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm"
          >
            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">{card.name}</p>
            <div className="flex items-baseline gap-2">
              <p className={`text-2xl font-bold ${card.color.includes('primary') ? 'text-emerald-700' : card.color}`}>{card.value}</p>
              <card.icon size={14} className="text-slate-300" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            <div className="p-3 border-b border-slate-100 bg-slate-50 flex justify-between items-center text-xs font-bold uppercase text-slate-500 tracking-wide">
              <span>Informações de Mercado & Alertas Operacionais</span>
              <TrendingUp size={14} />
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-100 rounded text-amber-800 text-[11px]">
                <AlertTriangle size={14} className="shrink-0" />
                <p><span className="font-bold">PENDÊNCIA:</span> 5 orçamentos pendentes de logística em Mato Grosso.</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded text-blue-800 text-[11px]">
                <TrendingUp size={14} className="shrink-0" />
                <p><span className="font-bold">PTAX ATUALIZADA:</span> R$ 5,23 (Simulação baseada no fechamento D-1).</p>
              </div>
              <div className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-100 rounded text-emerald-800 text-[11px]">
                <Package size={14} className="shrink-0" />
                <p><span className="font-bold">ESTOQUE:</span> Atualização de preços de UREIA 46% N recebida.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-12 lg:col-span-4 bg-white border border-slate-200 rounded-lg shadow-sm h-fit overflow-hidden">
          <div className="p-3 border-b border-slate-100 bg-slate-50 text-xs font-bold uppercase text-slate-500 tracking-wide">
            Ações Rápidas
          </div>
          <div className="divide-y divide-slate-100 italic">
            <button className="flex items-center justify-between w-full p-4 text-[11px] text-left hover:bg-slate-50 transition-all font-medium">
              <div className="flex items-center gap-3">
                <Package size={14} className="text-emerald-600" />
                <span>Gerenciar Produtos</span>
              </div>
              <TrendingUp size={12} className="text-slate-300" />
            </button>
            <button className="flex items-center justify-between w-full p-4 text-[11px] text-left hover:bg-slate-50 transition-all font-medium">
              <div className="flex items-center gap-3">
                <TrendingUp size={14} className="text-emerald-600" />
                <span>Ver Cotações Atuais</span>
              </div>
              <TrendingUp size={12} className="text-slate-300" />
            </button>
            <button className="flex items-center justify-between w-full p-4 text-[11px] text-left hover:bg-slate-50 transition-all font-medium">
              <div className="flex items-center gap-3">
                <Users size={14} className="text-emerald-600" />
                <span>Histórico de Vendas</span>
              </div>
              <TrendingUp size={12} className="text-slate-300" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
