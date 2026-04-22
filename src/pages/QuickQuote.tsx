import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { Zap, DollarSign, ArrowRight, Save, Info, Send, Copy } from 'lucide-react';
import { calculateQuote, derivePackagingPrices } from '../lib/calculations';
import { motion, AnimatePresence } from 'motion/react';

export default function QuickQuote() {
  const { token } = useAuth();
  const [offers, setOffers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  const [savedToken, setSavedToken] = useState('');
  
  // Selection
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [selectedPackaging, setSelectedPackaging] = useState('Granel');
  const [quantity, setQuantity] = useState('1');
  const [stateCode, setStateCode] = useState('SP');
  const [isFob, setIsFob] = useState(true);
  const [ptax, setPtax] = useState('5.25');
  const [freightBrl, setFreightBrl] = useState('0');

  useEffect(() => {
    const fetchData = async () => {
      const [o, s, st] = await Promise.all([
        axios.get('/api/offers', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/settings', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/state-adjustments', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setOffers(o.data);
      setSettings(s.data);
      setStates(st.data);
    };
    fetchData();
  }, [token]);

  const selectedOffer = offers.find(o => o.id === parseInt(selectedOfferId));
  const margin = parseFloat(settings.find(s => s.key === 'default_margin')?.value || '0.03');
  const stateAdj = states.find(s => s.state_code === stateCode)?.adjustment_percent || 0;

  let results = null;
  if (selectedOffer) {
    const derived = derivePackagingPrices(selectedOffer.price_usd, selectedOffer.packaging_name);
    const basePrice = selectedPackaging === 'Granel' ? derived.granel : (selectedPackaging === 'Big Bag' ? derived.bb : derived.sacaria);
    
    results = calculateQuote({
      basePriceUsd: basePrice,
      marginPercent: margin,
      stateAdjustmentPercent: stateAdj,
      ptax: parseFloat(ptax),
      quantity: parseFloat(quantity),
      freightBrlTon: parseFloat(freightBrl),
      isFob
    });
  }

  const handleSave = async () => {
    if (!results || !selectedOffer) return;
    try {
      const { granel, bb, sacaria } = derivePackagingPrices(selectedOffer.price_usd, selectedOffer.packaging_name);
      const basePrice = selectedPackaging === 'Granel' ? granel : (selectedPackaging === 'Big Bag' ? bb : sacaria);

      const res = await axios.post('/api/quotes', {
        customer_name: "Simulação Rápida",
        product_id: selectedOffer.product_id,
        packaging_id: selectedOffer.packaging_id,
        quantity: parseFloat(quantity),
        state_code: stateCode,
        is_fob: isFob ? 1 : 0,
        ptax: parseFloat(ptax),
        freight_brl_ton: isFob ? 0 : parseFloat(freightBrl),
        unit_cost_usd: basePrice, 
        total_usd: results.totalUsd,
        total_brl: results.totalBrl,
        status: (!isFob && parseFloat(freightBrl) <= 0) ? 'PENDING_LOGISTICS' : 'OPEN'
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setSavedToken(res.data.token);
      alert("Simulação salva no histórico!");
    } catch (e) {
      alert("Erro ao salvar simulação");
    }
  };

  const handleWhatsAppShare = () => {
    if (!results || !selectedOffer || !savedToken) return;
    const text = `*PROPOSTA BIO TERRA FERTILIZANTES*\n\n` +
      `Olá, segue a cotação solicitada:\n\n` +
      `*Produto:* ${selectedOffer.product_name} (${selectedPackaging})\n` +
      `*Qtd:* ${quantity} Ton\n` +
      `*Total:* R$ ${results.totalBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}\n\n` +
      `*PARA ACEITAR A PROPOSTA ACESSE:*\n` +
      `${window.location.origin}/proposta/${savedToken}\n\n` +
      `_Bio Terra Fertilizantes_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Input Panel */}
      <div className="col-span-12 lg:col-span-6 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
        <div className="p-3 border-b border-slate-100 bg-emerald-700 text-white flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wide">Parâmetros da Cotação</h3>
          <Zap size={14} />
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Produto de Referência</label>
            <select 
              value={selectedOfferId} 
              onChange={e => setSelectedOfferId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 p-2 rounded text-xs outline-none focus:ring-1 focus:ring-emerald-500/20 font-bold"
            >
              <option value="">Selecione um produto...</option>
              {offers.map(o => <option key={o.id} value={o.id}>{o.product_name} (${o.price_usd.toFixed(2)})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Embalagem</label>
              <select 
                value={selectedPackaging} 
                onChange={e => setSelectedPackaging(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 p-2 rounded text-xs outline-none focus:ring-1 focus:ring-emerald-500/20"
              >
                <option value="Granel">Granel</option>
                <option value="Big Bag">Big Bag</option>
                <option value="Sacaria">Sacaria</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Quantidade (Ton)</label>
              <input 
                type="number" 
                value={quantity} 
                onChange={e => setQuantity(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 p-2 rounded text-xs outline-none focus:ring-1 focus:ring-emerald-500/20 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Estado de Faturamento</label>
              <select 
                value={stateCode} 
                onChange={e => setStateCode(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 p-2 rounded text-xs outline-none focus:ring-1 focus:ring-emerald-500/20"
              >
                {states.map(s => <option key={s.state_code} value={s.state_code}>{s.state_code}</option>)}
                {!states.find(s => s.state_code === 'GO') && <option value="OUTRO">Outro (0%)</option>}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Operação</label>
              <div className="flex bg-slate-50 rounded border border-slate-300 overflow-hidden">
                <button 
                  onClick={() => setIsFob(true)}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase transition-all ${isFob ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                >
                  FOB
                </button>
                <button 
                  onClick={() => setIsFob(false)}
                  className={`flex-1 py-1.5 text-[10px] font-bold uppercase transition-all ${!isFob ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}
                >
                  CIF
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">PTAX Aplicada (R$)</label>
              <input 
                type="number" 
                step="0.0001"
                value={ptax} 
                onChange={e => setPtax(e.target.value)}
                className="w-full bg-blue-50 border border-blue-200 p-2 rounded text-xs text-blue-700 font-mono font-bold outline-none"
              />
            </div>
            {!isFob && (
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Frete Sugerido (R$/Ton)</label>
                <input 
                  type="number" 
                  value={freightBrl} 
                  onChange={e => setFreightBrl(e.target.value)}
                  className="w-full bg-amber-50 border border-amber-200 p-2 rounded text-xs text-amber-700 font-mono font-bold outline-none"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Results Panel */}
      <div className="col-span-12 lg:col-span-6 space-y-4 flex flex-col">
        <AnimatePresence mode="wait">
          {!results ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex-1 bg-white border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-8 text-center text-slate-400 italic text-xs"
            >
              <Zap size={32} className="mb-4 opacity-10" />
              <p>Selecione os parâmetros ao lado para gerar o fechamento.</p>
            </motion.div>
          ) : (
            <motion.div 
              key="results"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              className="flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm flex flex-col"
            >
              <div className="p-3 border-b border-slate-100 bg-slate-800 text-white flex justify-between items-center text-xs font-bold uppercase tracking-wide">
                <span>Resultado do Cálculo</span>
                <DollarSign size={14} className="text-emerald-400" />
              </div>
              <div className="p-6 space-y-6 flex-1">
                <div className="flex justify-between items-end border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Preço/Ton Unitário</p>
                    <h2 className="text-4xl font-bold italic text-slate-800 font-mono">${results.pricePerTonUsd.toFixed(2)}</h2>
                    <p className="text-[10px] text-slate-500 italic mt-1">Margem: {(margin*100).toFixed(1)}% | Imposto ({stateCode}): {(stateAdj*100).toFixed(1)}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Equivalente BRL</p>
                    <p className="text-xl font-bold text-emerald-700">R$ {results.pricePerTonBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Subtotal Produto</p>
                    <p className="font-mono font-bold text-slate-700">${results.productTotalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Total Logística (USD)</p>
                    <p className="font-mono font-bold text-slate-700">${results.freightTotalUsd.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-auto">
                   <div className="bg-emerald-50 border border-emerald-100 rounded p-4 flex justify-between items-center">
                     <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest">Total Geral BRL</span>
                     <span className="text-2xl font-bold text-emerald-700">R$ {results.totalBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                   </div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
                {!savedToken ? (
                  <button 
                    onClick={handleSave}
                    className="flex-1 bg-emerald-600 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-sm"
                  >
                    <Save size={14} /> Registrar Simulação
                  </button>
                ) : (
                  <div className="flex-1 flex gap-2">
                    <button 
                      onClick={handleWhatsAppShare}
                      className="flex-1 bg-emerald-600 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-sm"
                    >
                      <Send size={14} /> Compartilhar WhatsApp
                    </button>
                    <button 
                      onClick={() => setSavedToken('')}
                      className="bg-white border border-slate-300 text-slate-600 px-3 py-2 rounded text-xs font-bold hover:bg-slate-50 transition-all"
                    >
                      Nova
                    </button>
                  </div>
                )}
                <button className="bg-white border border-slate-300 text-slate-600 px-3 py-2 rounded hover:bg-slate-50 transition-all">
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="bg-amber-50 border border-amber-200 rounded p-3 flex gap-3 text-[10px] text-amber-800 leading-relaxed italic">
          <Info size={12} className="shrink-0 mt-0.5" />
          <p>Os valores acima são calculados em tempo real e não constituem reserva de produto. A PTAX oficial será confirmada no ato do fechamento bancário.</p>
        </div>
      </div>
    </div>
  );
}
