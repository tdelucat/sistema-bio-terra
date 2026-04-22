import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../hooks/useAuth';
import { FileCheck, Download, Save, User, Info } from 'lucide-react';
import { calculateQuote, derivePackagingPrices } from '../lib/calculations';
import * as XLSX from 'xlsx';

export default function ClosingQuote() {
  const { token, user } = useAuth();
  const [offers, setOffers] = useState<any[]>([]);
  const [settings, setSettings] = useState<any[]>([]);
  const [states, setStates] = useState<any[]>([]);
  
  // Detailed State
  const [customerName, setCustomerName] = useState('');
  const [selectedOfferId, setSelectedOfferId] = useState('');
  const [selectedPackaging, setSelectedPackaging] = useState('Granel');
  const [quantity, setQuantity] = useState('');
  const [stateCode, setStateCode] = useState('SP');
  const [isFob, setIsFob] = useState(true);
  const [ptax, setPtax] = useState('5.25');
  const [freightBrl, setFreightBrl] = useState('');

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

  const results = selectedOffer && quantity ? calculateQuote({
    basePriceUsd: selectedPackaging === 'Granel' ? derivePackagingPrices(selectedOffer.price_usd, selectedOffer.packaging_name).granel : (selectedPackaging === 'Big Bag' ? derivePackagingPrices(selectedOffer.price_usd, selectedOffer.packaging_name).bb : derivePackagingPrices(selectedOffer.price_usd, selectedOffer.packaging_name).sacaria),
    marginPercent: margin,
    stateAdjustmentPercent: stateAdj,
    ptax: parseFloat(ptax),
    quantity: parseFloat(quantity),
    freightBrlTon: parseFloat(freightBrl || '0'),
    isFob
  }) : null;

  const handleExport = () => {
    if (!results || !selectedOffer) return;
    
    const ws_data = [
      ["ORÇAMENTO COMERCIAL - Bio Terra Fertilizantes"],
      ["Data:", new Date().toLocaleDateString()],
      ["Responsável:", user?.name],
      ["Cliente:", customerName],
      [],
      ["DETALHES DO PRODUTO"],
      ["Produto:", selectedOffer.product_name],
      ["Embalagem:", selectedPackaging],
      ["Quantidade (Ton):", quantity],
      ["Estado Faturamento:", stateCode],
      ["Operação:", isFob ? "FOB" : "CIF"],
      [],
      ["VALORES"],
      ["PTAX Base:", ptax],
      ["Preço Unitário (USD/Ton):", results.pricePerTonUsd.toFixed(2)],
      ["Frete Unitário (R$/Ton):", isFob ? "N/A" : freightBrl],
      ["TOTAL PRODUTO (USD):", results.productTotalUsd.toFixed(2)],
      ["TOTAL FRETE (USD):", results.freightTotalUsd.toFixed(2)],
      ["TOTAL GERAL (USD):", results.totalUsd.toFixed(2)],
      ["TOTAL GERAL (BRL):", results.totalBrl.toFixed(2)],
      [],
      ["Obs:", "Valor sujeito a alteração conforme variação cambial do fechamento."]
    ];

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orçamento");
    XLSX.writeFile(wb, `Orcamento_${customerName.replace(/\s/g, '_')}_${new Date().getTime()}.xlsx`);
  };

  const handleSave = async () => {
    if (!results || !selectedOffer) return;
    await axios.post('/api/quotes', {
      customer_name: customerName,
      product_id: selectedOffer.product_id,
      packaging_id: selectedOffer.packaging_id,
      quantity: parseFloat(quantity),
      state_code: stateCode,
      is_fob: isFob ? 1 : 0,
      ptax: parseFloat(ptax),
      freight_brl_ton: isFob ? 0 : parseFloat(freightBrl),
      total_usd: results.totalUsd,
      total_brl: results.totalBrl,
      status: 'CLOSED'
    }, { headers: { Authorization: `Bearer ${token}` } });
    alert("Orçamento fechado e registrado!");
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-serif font-bold italic text-secondary">Fechamento de Pedido</h1>
          <p className="text-gray-500">Documentação detalhada para conversão comercial</p>
        </div>
        <div className="flex gap-2">
            <button onClick={handleExport} disabled={!results} className="bg-white border text-gray-600 px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50">
              <Download size={18} /> Exportar Excel
            </button>
            <button onClick={handleSave} disabled={!results} className="bg-primary text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 disabled:opacity-50">
              <Save size={18} /> Salvar Fechamento
            </button>
        </div>
      </header>

      <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400 font-sans">Identificação do Cliente</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input 
                value={customerName} 
                onChange={e => setCustomerName(e.target.value)}
                className="w-full bg-gray-50 border p-4 pl-12 rounded-2xl outline-none" 
                placeholder="Nome da Fazenda / Produtor"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Produto</label>
            <select 
              value={selectedOfferId} 
              onChange={e => setSelectedOfferId(e.target.value)}
              className="w-full bg-gray-50 border p-4 rounded-2xl outline-none font-bold"
            >
              <option value="">Escolha uma oferta válida...</option>
              {offers.map(o => <option key={o.id} value={o.id}>{o.product_name} - {o.supplier_name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Embalagem</label>
              <select value={selectedPackaging} onChange={e => setSelectedPackaging(e.target.value)} className="w-full bg-gray-50 border p-4 rounded-2xl outline-none">
                <option value="Granel">Granel</option>
                <option value="Big Bag">Big Bag</option>
                <option value="Sacaria">Sacaria</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">Quantidade (Ton)</label>
              <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full bg-gray-50 border p-4 rounded-2xl outline-none" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-400">UF / Modal / PTAX</label>
              <div className="space-y-3">
                 <select value={stateCode} onChange={e => setStateCode(e.target.value)} className="w-full bg-gray-50 border p-3 rounded-xl outline-none text-sm">
                   {states.map(s => <option key={s.state_code} value={s.state_code}>{s.state_code}</option>)}
                 </select>
                 <div className="flex gap-2">
                   <button onClick={() => setIsFob(true)} className={`flex-1 py-3 text-[10px] font-bold rounded-lg border uppercase ${isFob ? 'bg-secondary text-white' : 'bg-gray-50'}`}>FOB</button>
                   <button onClick={() => setIsFob(false)} className={`flex-1 py-3 text-[10px] font-bold rounded-lg border uppercase ${!isFob ? 'bg-secondary text-white' : 'bg-gray-50'}`}>CIF</button>
                 </div>
              </div>
            </div>
            <div className="space-y-3">
               <input type="number" step="0.0001" value={ptax} onChange={e => setPtax(e.target.value)} className="w-full bg-blue-50 border border-blue-100 p-3 rounded-xl text-blue-600 font-mono" placeholder="PTAX" title="PTAX" />
               {!isFob && <input type="number" value={freightBrl} onChange={e => setFreightBrl(e.target.value)} className="w-full bg-orange-50 border border-orange-100 p-3 rounded-xl text-orange-600 font-mono" placeholder="R$/Ton Frete" title="Frete R$/Ton" />}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-secondary uppercase tracking-widest border-b pb-4">Resumo do Fechamento</h3>
            {!results ? (
              <div className="text-gray-400 text-sm italic py-10 text-center">Aguardando preenchimento...</div>
            ) : (
              <div className="space-y-4 font-mono">
                <div className="flex justify-between border-b border-dashed pb-2">
                  <span className="text-gray-500">Unitário USD</span>
                  <span className="font-bold">${results.pricePerTonUsd.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-dashed pb-2">
                  <span className="text-gray-500">Unitário BRL</span>
                  <span className="font-bold">R$ {results.pricePerTonBrl.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-b border-dashed pb-2">
                  <span className="text-gray-500">Subtotal Prod.</span>
                  <span className="font-bold">${results.productTotalUsd.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-dashed pb-2">
                  <span className="text-gray-500">Total Logística</span>
                  <span className="font-bold">${results.freightTotalUsd.toLocaleString()}</span>
                </div>
                <div className="pt-4 flex flex-col gap-1 items-end">
                  <span className="text-[10px] font-bold text-primary uppercase">Total Geral</span>
                  <span className="text-4xl font-bold font-sans text-secondary italic">R$ {results.totalBrl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl text-[10px] text-gray-400 border border-gray-100 italic">
            * PTAX do fechamento será a data oficial do Banco Central do dia útil anterior à operação. Operação sujeita a validação do comercial.
          </div>
        </div>
      </div>
    </div>
  );
}
