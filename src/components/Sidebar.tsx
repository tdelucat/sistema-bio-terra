import { NavLink } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  Package, 
  Tag, 
  Search, 
  Zap, 
  FileCheck, 
  History, 
  BarChart3, 
  Settings, 
  LogOut,
  Users
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function Sidebar() {
  const { user, logout } = useAuth();

  const menuItems = [
    { name: 'Dashboard Geral', icon: LayoutDashboard, path: '/', roles: ['ADMIN', 'CHEMIST', 'SELLER', 'REPRESENTATIVE'] },
    { name: 'Módulo Químico', icon: Package, path: '/products', roles: ['ADMIN', 'CHEMIST'] },
    { name: 'Ofertas/Preços', icon: Tag, path: '/offers', roles: ['ADMIN', 'CHEMIST'] },
    { name: 'Consulta Comercial', icon: Search, path: '/consultation', roles: ['ADMIN', 'CHEMIST', 'SELLER', 'REPRESENTATIVE'] },
    { name: 'Orçamento Rápido', icon: Zap, path: '/quick-quote', roles: ['ADMIN', 'CHEMIST', 'SELLER', 'REPRESENTATIVE'] },
    { name: 'Fechamento Pedido', icon: FileCheck, path: '/closing-quote', roles: ['ADMIN', 'CHEMIST', 'SELLER', 'REPRESENTATIVE'] },
    { name: 'Histórico Preços', icon: History, path: '/history-price', roles: ['ADMIN', 'CHEMIST', 'SELLER', 'REPRESENTATIVE'] },
    { name: 'Histórico Orçamentos', icon: BarChart3, path: '/history-quote', roles: ['ADMIN', 'CHEMIST', 'SELLER', 'REPRESENTATIVE'] },
  ];

  const filteredItems = menuItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="w-64 bg-emerald-900 text-white flex flex-col flex-shrink-0">
      <div className="p-6 border-b border-emerald-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-400 rounded flex items-center justify-center font-bold text-emerald-900">BT</div>
          <div>
            <h1 className="text-sm font-bold leading-tight">Bio Terra</h1>
            <p className="text-[10px] text-emerald-300 uppercase tracking-wider">Fertilizantes v2.0</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 py-4 text-sm">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "px-4 py-2 flex items-center gap-3 cursor-pointer transition-all",
              isActive 
                ? "bg-emerald-800 border-l-4 border-emerald-400" 
                : "hover:bg-emerald-800 opacity-80 hover:opacity-100"
            )}
          >
            <item.icon size={16} className="opacity-70" />
            {item.name}
          </NavLink>
        ))}
        {user?.role === 'ADMIN' && (
          <>
            <div className="mt-4 px-4 py-2 text-[10px] uppercase font-bold text-emerald-500 tracking-widest">Admin</div>
            <NavLink
              to="/settings"
              className={({ isActive }) => cn(
                "px-4 py-2 flex items-center gap-3 cursor-pointer transition-all",
                isActive 
                  ? "bg-emerald-800 border-l-4 border-emerald-400" 
                  : "hover:bg-emerald-800 opacity-80 hover:opacity-100"
              )}
            >
              <Users size={16} className="opacity-70" />
              Gestão de Usuários
            </NavLink>
            <NavLink
              to="/settings" // Reuse settings for parameters in this mock
              className="px-4 py-2 hover:bg-emerald-800 flex items-center gap-3 cursor-pointer opacity-80 hover:opacity-100 transition-all"
            >
              <Settings size={16} className="opacity-70" />
              Parâmetros Globais
            </NavLink>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-emerald-800 text-[11px] text-emerald-400">
        <div className="flex justify-between mb-1">
          <span>Usuário:</span>
          <span className="font-medium text-white">{user?.name}</span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <button
            onClick={logout}
            className="flex items-center gap-2 hover:text-emerald-200 transition-colors"
          >
            <LogOut size={12} />
            Sair
          </button>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> 
            Online
          </span>
        </div>
      </div>
    </div>
  );
}
