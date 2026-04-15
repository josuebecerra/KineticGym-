import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Invoice } from '../types';
import { getGlobalInvoices, bulkGenerateInvoices } from '../services/db';
import { formatKineticDate } from '../utils/date';
import { InvoiceVisualizer } from './InvoiceVisualizer';

interface InvoicingDashboardProps {
  onOpenConfig: () => void;
}

export const InvoicingDashboard: React.FC<InvoicingDashboardProps> = ({ onOpenConfig }) => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await getGlobalInvoices();
      // Sort by date descending
      setInvoices(data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error("Error loading invoices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const count = await bulkGenerateInvoices();
      alert(`Sincronización completa. Se generaron ${count} facturas nuevas.`);
      await loadInvoices();
    } catch (error) {
      console.error("Error syncing invoices:", error);
      alert("Error al sincronizar facturas.");
    } finally {
      setIsSyncing(false);
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    if (!inv) return false;
    const search = searchQuery.toLowerCase();
    const name = (inv.receptorName || '').toLowerCase();
    const clave = (inv.clave || '').toLowerCase();
    const consecutive = (inv.consecutive || '').toLowerCase();
    
    return name.includes(search) || clave.includes(search) || consecutive.includes(search);
  });

  const stats = {
    totalRevenue: invoices.reduce((acc, inv) => acc + inv.total, 0),
    totalTax: invoices.reduce((acc, inv) => acc + inv.tax, 0),
    count: invoices.length
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="w-12 h-12 border-4 border-surface-container-highest border-t-secondary rounded-full animate-spin" />
        <p className="text-[10px] font-black text-outline uppercase tracking-widest">Cargando Registros Fiscales...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 px-2">
        <div className="bg-surface-container-low p-6 rounded-[32px] border border-outline-variant/10">
          <p className="text-[9px] font-black text-outline uppercase tracking-widest mb-1">Total Comprobantes</p>
          <div className="flex items-center justify-between">
            <h4 className="text-3xl font-black italic">{stats.count}</h4>
            <span className="material-symbols-outlined text-secondary text-4xl opacity-20">receipt_long</span>
          </div>
        </div>
        <div className="bg-surface-container-low p-6 rounded-[32px] border border-outline-variant/10">
          <p className="text-[9px] font-black text-outline uppercase tracking-widest mb-1">Total Recaudado (Gross)</p>
          <div className="flex items-center justify-between">
            <h4 className="text-3xl font-black italic text-primary-container">USD {stats.totalRevenue.toFixed(2)}</h4>
            <span className="material-symbols-outlined text-primary-container text-4xl opacity-20">payments</span>
          </div>
        </div>
        <div className="bg-surface-container-low p-6 rounded-[32px] border border-outline-variant/10">
          <p className="text-[9px] font-black text-outline uppercase tracking-widest mb-1">IVA Acumulado (13%)</p>
          <div className="flex items-center justify-between">
            <h4 className="text-3xl font-black italic text-secondary">USD {stats.totalTax.toFixed(2)}</h4>
            <span className="material-symbols-outlined text-secondary text-4xl opacity-20">account_balance</span>
          </div>
        </div>
      </div>

      {/* List Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4">
        <div>
          <h3 className="text-xl font-black uppercase italic tracking-tight">HISTORIAL DE FACTURACIÓN</h3>
          <p className="text-[9px] font-black text-outline uppercase tracking-[0.3em]">Cumplimiento Hacienda v4.3</p>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="relative group min-w-[300px]">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">search</span>
            <input 
              type="text" 
              placeholder="BUSCAR POR CLIENTE O CLAVE..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl py-3 pl-12 pr-4 text-[10px] font-black uppercase tracking-widest text-white placeholder:text-outline-variant/40 focus:ring-1 focus:ring-secondary/30 transition-all outline-none"
            />
          </div>

          <button 
            onClick={onOpenConfig}
            className="bg-secondary/10 hover:bg-secondary/20 text-secondary px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-secondary/20 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined text-lg">settings</span>
            Configurar Emisor
          </button>

          <button 
            onClick={handleSync}
            disabled={isSyncing}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border transition-all active:scale-95 ${isSyncing ? 'bg-surface-container-high text-outline cursor-not-allowed' : 'bg-primary-container/10 border-primary-container/20 text-primary-container hover:bg-primary-container/20'}`}
          >
            <span className={`material-symbols-outlined text-lg ${isSyncing ? 'animate-spin' : ''}`}>sync</span>
            {isSyncing ? 'SINCRONIZANDO...' : 'SINCRONIZAR ACTIVAS'}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-surface-container-low rounded-[40px] border border-outline-variant/10 overflow-hidden shadow-xl mx-2">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-high/50 border-b border-outline-variant/10">
                <th className="px-6 py-4 text-[9px] font-black text-outline uppercase tracking-widest">Fecha</th>
                <th className="px-6 py-4 text-[9px] font-black text-outline uppercase tracking-widest">Receptor / Cliente</th>
                <th className="px-6 py-4 text-[9px] font-black text-outline uppercase tracking-widest">Consecutivo</th>
                <th className="px-6 py-4 text-[9px] font-black text-outline uppercase tracking-widest">Total</th>
                <th className="px-6 py-4 text-[9px] font-black text-outline uppercase tracking-widest">Estado</th>
                <th className="px-6 py-4 text-[9px] font-black text-outline uppercase tracking-widest text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {filteredInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-bold text-white">{formatKineticDate(inv.date)}</p>
                    <p className="text-[8px] text-outline italic">Ref: {inv.planId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-[10px] font-black text-secondary group-hover:text-white transition-colors uppercase">{inv.receptorName}</p>
                    <p className="text-[9px] text-outline tracking-wider">{inv.receptorId}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono text-[9px] text-outline-variant group-hover:text-white transition-colors">{inv.consecutive}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-black text-white">$ {inv.total.toFixed(2)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-primary-container shadow-[0_0_8px_rgba(204,255,0,0.4)]" />
                      <span className="text-[9px] font-black text-primary-container tracking-widest">ACEPTADA</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => setSelectedInvoice(inv)}
                      className="w-10 h-10 rounded-xl bg-surface-container-highest flex items-center justify-center text-outline hover:text-secondary hover:bg-secondary/10 transition-all active:scale-90"
                    >
                      <span className="material-symbols-outlined text-lg">receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredInvoices.length === 0 && (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-4xl text-outline-variant/20 mb-4 italic">content_paste_off</span>
            <p className="text-[11px] font-black uppercase text-outline tracking-widest">No se encontraron registros</p>
          </div>
        )}
      </div>

      {/* Visualizer Modal */}
      <AnimatePresence>
        {selectedInvoice && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md"
            onClick={() => setSelectedInvoice(null)}
          >
            <div onClick={e => e.stopPropagation()} className="w-full flex justify-center">
              <InvoiceVisualizer 
                invoice={selectedInvoice} 
                onClose={() => setSelectedInvoice(null)} 
              />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
