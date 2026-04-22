import React, { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import Login from './pages/Login';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ChemistProducts from './pages/ChemistProducts';
import ChemistOffers from './pages/ChemistOffers';
import CommercialConsultation from './pages/CommercialConsultation';
import QuickQuote from './pages/QuickQuote';
import ClosingQuote from './pages/ClosingQuote';
import HistoryPrice from './pages/HistoryPrice';
import HistoryQuote from './pages/HistoryQuote';
import AdminSettings from './pages/AdminSettings';
import PublicQuote from './pages/PublicQuote';
import './index.css';

function ProtectedRoute({ children, roles }: { children: React.ReactNode, roles?: string[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <div>Carregando...</div>;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold">Painel de Controle de Preços</h2>
            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-[11px] font-medium rounded uppercase">PERFIL: {user.role}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs font-bold">{user.name}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-tight">{user.role}</p>
            </div>
            <div className="w-9 h-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-500">
              {user.name.charAt(0)}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto space-y-6">
          {children}
        </main>
        <footer className="h-8 bg-slate-800 text-slate-400 text-[10px] flex items-center justify-between px-6 flex-shrink-0">
          <div className="flex gap-4">
            <span>v2.1.0-stable</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Banco de Dados: SQL_SERVER_PROD</span>
          </div>
          <div>
            <span>© 2024 Bio Terra Fertilizantes - Sistema de Rastreabilidade Comercial</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          
          {/* Admin & Chemist Routes */}
          <Route path="/products" element={<ProtectedRoute roles={['ADMIN', 'CHEMIST']}><ChemistProducts /></ProtectedRoute>} />
          <Route path="/offers" element={<ProtectedRoute roles={['ADMIN', 'CHEMIST']}><ChemistOffers /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute roles={['ADMIN']}><AdminSettings /></ProtectedRoute>} />
          
          {/* All Auth User Routes */}
          <Route path="/consultation" element={<ProtectedRoute><CommercialConsultation /></ProtectedRoute>} />
          <Route path="/quick-quote" element={<ProtectedRoute><QuickQuote /></ProtectedRoute>} />
          <Route path="/closing-quote" element={<ProtectedRoute><ClosingQuote /></ProtectedRoute>} />
          <Route path="/history-price" element={<ProtectedRoute><HistoryPrice /></ProtectedRoute>} />
          <Route path="/history-quote" element={<ProtectedRoute><HistoryQuote /></ProtectedRoute>} />
          <Route path="/proposta/:token" element={<PublicQuote />} />
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
