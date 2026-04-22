import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';
import { Leaf, Lock, Mail, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[380px] bg-white rounded-lg shadow-xl overflow-hidden border border-slate-200"
      >
        <div className="bg-emerald-900 p-8 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 bg-emerald-400 rounded flex items-center justify-center font-bold text-emerald-950 text-xl mb-3 shadow-inner">
            BT
          </div>
          <div>
            <h1 className="text-white font-bold tracking-tight text-lg leading-tight uppercase">Bio Terra</h1>
            <p className="text-[10px] text-emerald-300 uppercase tracking-widest font-bold">Fertilizantes v2.0</p>
          </div>
        </div>

        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Acesso Restrito</h2>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold italic">Ambiente de Operações Comerciais</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5">Identificador (E-mail)</label>
              <div className="relative group">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded py-2 px-3 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                  placeholder="seu@dominio.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-0.5">Credencial / Senha</label>
              <div className="relative group">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded py-2 px-3 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-emerald-500/20 focus:border-emerald-600 transition-all font-medium"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-50 text-red-600 p-3 rounded flex items-center gap-2 text-[10px] border border-red-100 font-bold uppercase"
              >
                <AlertCircle size={14} className="shrink-0" />
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase py-3 rounded shadow transition-all disabled:opacity-50 tracking-widest mt-2"
            >
              {loading ? 'Validando...' : 'Iniciar Sessão'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-tighter">© 2026 Bio Terra Fertilizantes - Todos os direitos reservados</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
