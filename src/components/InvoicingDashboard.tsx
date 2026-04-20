import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Invoice } from '../types';
import { getInvoicesPaginated, searchInvoices, bulkGenerateInvoices } from '../services/db';
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
  const [lastVisibleDoc, setLastVisibleDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [activeTab, setActiveTab] = useState<'trainee' | 'trainer' | 'admin' | 'requests' | 'invoices'>('trainee');
  const [sortConfig, setSortConfig] = useState<{ field: string; direction: 'asc' | 'desc' }>({ 
    field: 'date', 
    direction: 'desc' 
  });
  const [pageSize, setPageSize] = useState(5);
  const [currentPage, setCurrentPage] = useState(1);
  const [cursorStack, setCursorStack] = useState<any[]>([null]);
  const [showRowsDropdown, setShowRowsDropdown] = useState(false);

  const PAGE_SIZE = 20;

  // Unified effect for search and initial load - avoids double loading on mount
  useEffect(() => {
    if (searchQuery.length === 0) {
      // Immediate load for empty search (initial state or reset)
      setCursorStack([null]);
      setCurrentPage(1);
      loadInvoices(1, [null]);
      return;
    }

    const timer = setTimeout(() => {
      if (searchQuery.length >= 2) {
        performGlobalSearch();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const performGlobalSearch = async () => {
    // Silent loading for search to avoid full-screen flicker
    setIsSyncing(true);
    setIsSearchingGlobal(true);
    try {
      const { invoices: data, lastDoc } = await searchInvoices(searchQuery, PAGE_SIZE);
      setInvoices(data);
      setLastVisibleDoc(lastDoc);
      setHasMore(data.length === PAGE_SIZE);
    } catch (error) {
      console.error("Error searching invoices:", error);
    } finally {
      setIsSyncing(false);
      setIsLoading(false); // Ensure main loader is off if search was first action
    }
  };

  const loadInvoices = async (page: number = 1, stack: any[] = cursorStack) => {
    // Only show full-screen loader on first load or if list is empty
    if (invoices.length === 0) {
      setIsLoading(true);
    }
    
    setIsSearchingGlobal(false);
    
    try {
      const cursor = stack[page - 1];
      const { invoices: data, lastDoc, hasMore: more } = await getInvoicesPaginated(
        pageSize, 
        cursor,
        sortConfig.field,
        sortConfig.direction
      );
      
      setInvoices(data);
      
      if (lastDoc && stack.length <= page) {
        setCursorStack([...stack, lastDoc]);
      }

      setCurrentPage(page);
      setHasMore(more);
    } catch (error) {
      console.error("Error loading invoices:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSort = (field: string) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setCursorStack([null]);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCursorStack([null]);
    setCurrentPage(1);
  };

  useEffect(() => {
    loadInvoices(1, [null]);
  }, [sortConfig, pageSize]);

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

  const displayInvoices = invoices; // Now filtered by search or paginated at DB level

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
        <div className="overflow-x-auto kinetic-table-container">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-container-high/50 border-b border-outline-variant/10">
                <th className="px-6 py-4 sticky-header">
                  <button 
                    onClick={() => handleSort('date')}
                    className="flex items-center gap-1.5 group outline-none"
                  >
                    <span className="text-[9px] font-black text-outline uppercase tracking-widest group-hover:text-secondary transition-colors whitespace-nowrap">Fecha / ID</span>
                    <span className={`material-symbols-outlined text-[14px] transition-all ${sortConfig.field === 'date' ? 'text-secondary opacity-100' : 'text-outline opacity-0 group-hover:opacity-40'}`}>
                      {sortConfig.field === 'date' && sortConfig.direction === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                    </span>
                  </button>
                </th>
                <th className="px-6 py-4 w-[220px]">
                  <button 
                    onClick={() => handleSort('receptorName')}
                    className="flex items-center gap-1.5 group outline-none"
                  >
                    <span className="text-[9px] font-black text-outline uppercase tracking-widest group-hover:text-secondary transition-colors whitespace-nowrap">Cliente / Receptor</span>
                    <span className={`material-symbols-outlined text-[14px] transition-all ${sortConfig.field === 'receptorName' ? 'text-secondary opacity-100' : 'text-outline opacity-0 group-hover:opacity-40'}`}>
                      {sortConfig.field === 'receptorName' && sortConfig.direction === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                    </span>
                  </button>
                </th>
                <th className="px-6 py-4 w-[160px]">
                  <span className="text-[9px] font-black text-outline uppercase tracking-widest whitespace-nowrap">Consecutivo</span>
                </th>
                <th className="px-6 py-4 w-[140px]">
                  <button 
                    onClick={() => handleSort('total')}
                    className="flex items-center gap-1.5 group outline-none"
                  >
                    <span className="text-[9px] font-black text-outline uppercase tracking-widest group-hover:text-secondary transition-colors whitespace-nowrap">Total</span>
                    <span className={`material-symbols-outlined text-[14px] transition-all ${sortConfig.field === 'total' ? 'text-secondary opacity-100' : 'text-outline opacity-0 group-hover:opacity-40'}`}>
                      {sortConfig.field === 'total' && sortConfig.direction === 'desc' ? 'arrow_downward' : 'arrow_upward'}
                    </span>
                  </button>
                </th>
                <th className="px-6 py-4 w-[120px] text-[9px] font-black text-outline uppercase tracking-widest whitespace-nowrap">Estado</th>
                <th className="px-6 py-4 w-[100px] text-[9px] font-black text-outline uppercase tracking-widest text-right whitespace-nowrap">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/5">
              {displayInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4 sticky-cell">
                    <div className="flex flex-col">
                      <p className="text-[10px] font-black italic text-white uppercase tracking-tight">{formatKineticDate(inv.date)}</p>
                      <p className="text-[8px] font-bold text-outline opacity-40 uppercase tracking-widest truncate max-w-[120px]">Ref: {inv.planId}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4 w-[220px]">
                    <p className="text-[10px] font-black text-secondary group-hover:text-white transition-colors uppercase truncate max-w-[200px]">{inv.receptorName}</p>
                    <p className="text-[8px] font-bold text-outline uppercase tracking-widest opacity-40">{inv.receptorId}</p>
                  </td>
                  <td className="px-6 py-4 w-[160px]">
                    <span className="font-mono text-[9px] text-outline-variant group-hover:text-white transition-colors block truncate">{inv.consecutive}</span>
                  </td>
                  <td className="px-6 py-4 w-[140px]">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-black text-white">$ {inv.total.toFixed(2)}</span>
                      <span className="text-[7px] font-black text-outline/30 uppercase">USD Net</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 w-[120px]">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-container shadow-[0_0_8px_rgba(204,255,0,0.4)]" />
                      <span className="text-[9px] font-black text-primary-container tracking-widest">ACEPTADA</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 w-[100px] text-right">
                    <button 
                      onClick={() => setSelectedInvoice(inv)}
                      className="w-9 h-9 rounded-xl bg-surface-container-highest flex items-center justify-center text-outline hover:text-secondary hover:bg-secondary/10 transition-all active:scale-90"
                    >
                      <span className="material-symbols-outlined text-lg">receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {displayInvoices.length === 0 && (
          <div className="py-20 text-center">
            <span className="material-symbols-outlined text-4xl text-outline-variant/20 mb-4 italic">content_paste_off</span>
            <p className="text-[11px] font-black uppercase text-outline tracking-widest">
              {isSearchingGlobal ? 'No se encontraron registros en la búsqueda global' : 'No hay facturas cargadas'}
            </p>
          </div>
        )}
      </div>

      {/* Premium Pagination */}
      {!isSearchingGlobal && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 px-6 py-8 bg-surface-container-low border border-outline-variant/10 rounded-[32px] mx-2">
          <div className="flex items-center gap-6 order-2 sm:order-1">
            {/* Custom Rows Selector */}
            <div className="relative">
              <button 
                onClick={() => setShowRowsDropdown(!showRowsDropdown)}
                className="flex items-center justify-center gap-3 px-5 py-2.5 bg-surface-container-high/30 rounded-2xl border border-outline-variant/10 hover:border-secondary/30 transition-all group"
              >
                <span className="text-[9px] font-black text-outline uppercase tracking-widest whitespace-nowrap">Filas</span>
                <span className="text-[12px] font-black text-secondary">{pageSize}</span>
                <span className={`material-symbols-outlined text-secondary text-lg transition-transform duration-300 ${showRowsDropdown ? 'rotate-180' : ''}`}>expand_more</span>
              </button>

              <AnimatePresence>
                {showRowsDropdown && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setShowRowsDropdown(false)} 
                    />
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute bottom-full mb-3 left-0 z-50 min-w-[100px] bg-surface-container-high border border-outline-variant/20 rounded-[24px] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-xl"
                    >
                      {[5, 10, 20, 50].map((size) => (
                        <button
                          key={size}
                          onClick={() => {
                            handlePageSizeChange(size);
                            setShowRowsDropdown(false);
                          }}
                          className={`w-full px-5 py-3 text-left text-[11px] font-black uppercase tracking-widest transition-colors flex items-center justify-between group ${pageSize === size ? 'bg-secondary text-background' : 'text-outline hover:bg-white/5 hover:text-white'}`}
                        >
                          {size}
                          {pageSize === size && <span className="material-symbols-outlined text-sm">check_circle</span>}
                        </button>
                      ))}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

                    {/* Pagination Controls */}
                    <div className="flex items-center gap-1.5 ml-4 bg-surface-container-high/30 rounded-2xl p-1 px-3 border border-outline-variant/10">
                      <span className="text-[10px] font-black text-outline uppercase tracking-widest italic mr-2 opacity-60">Pág</span>
                      <button 
                        onClick={() => loadInvoices(currentPage - 1)}
                        disabled={currentPage === 1 || isLoading}
                        className="w-8 h-8 flex items-center justify-center text-outline hover:text-secondary disabled:opacity-20 transition-all font-headline font-black italic text-lg pr-1"
                      >
                        &lt;
                      </button>
                      <span className="text-[14px] font-headline font-black italic text-secondary w-8 h-8 flex items-center justify-center mx-1">
                        {currentPage}
                      </span>
                      <button 
                        onClick={() => loadInvoices(currentPage + 1)}
                        disabled={!hasMore || isLoading}
                        className="w-8 h-8 flex items-center justify-center text-outline hover:text-secondary disabled:opacity-20 transition-all font-headline font-black italic text-lg pl-1"
                      >
                        &gt;
                      </button>
                    </div>
          </div>

          <div className="flex items-center gap-4 sm:ml-auto order-1 sm:order-2">
            {isLoading && (
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 border-2 border-outline-variant/10 border-t-secondary rounded-full animate-spin" />
                <span className="text-[9px] font-black text-outline uppercase tracking-widest animate-pulse">Cargando...</span>
              </div>
            )}
            <div className="flex flex-col items-center">
              <p className="text-[9px] font-black text-outline uppercase tracking-widest leading-none">Página Actual</p>
              <p className="text-xl font-headline font-black italic text-secondary mt-1">{currentPage}</p>
            </div>
          </div>
        </div>
      )}

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
