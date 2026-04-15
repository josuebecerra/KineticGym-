import React from 'react';
import { motion } from 'motion/react';
import { Invoice } from '../types';
import { formatKineticDate } from '../utils/date';
import { getProvinceName } from '../utils/taxUtils';

interface InvoiceVisualizerProps {
  invoice: Invoice;
  onClose: () => void;
}

export const InvoiceVisualizer: React.FC<InvoiceVisualizerProps> = ({ invoice, onClose }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-white text-black p-8 rounded-[32px] max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh] relative font-mono"
    >
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-outline hover:bg-surface-container-high transition-colors"
      >
        <span className="material-symbols-outlined text-sm">close</span>
      </button>

      {/* Header */}
      <div className="text-center space-y-2 border-b-2 border-dashed border-gray-200 pb-6 mb-6">
        <h2 className="font-headline text-3xl font-black italic tracking-tighter uppercase leading-none">KINETIC GYM</h2>
        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Comprobante de Pago Electrónico</p>
        <div className="text-[9px] font-bold text-gray-400 space-y-0.5">
          <p>{invoice.emisorName}</p>
          <p>ID: {invoice.emisorId}</p>
          <p>San José, Costa Rica</p>
        </div>
      </div>

      {/* Hacienda Info */}
      <div className="space-y-3 mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
        <div className="flex flex-col gap-1">
          <span className="text-[7px] font-black uppercase text-gray-400 tracking-widest">Clave Numérica (50 dígitos)</span>
          <span className="text-[9px] font-bold break-all leading-tight">{invoice.clave}</span>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <span className="text-[7px] font-black uppercase text-gray-400 tracking-widest">Consecutivo</span>
            <span className="text-[9px] font-bold">{invoice.consecutive}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[7px] font-black uppercase text-gray-400 tracking-widest">Fecha</span>
            <span className="text-[9px] font-bold">{formatKineticDate(invoice.date)}</span>
          </div>
        </div>
      </div>

      {/* Receptor */}
      <div className="mb-6 space-y-1 px-2 text-[10px]">
        <p className="font-black text-gray-400 uppercase tracking-widest text-[7px] mb-1">Cliente / Receptor</p>
        <p className="font-bold flex justify-between">
          <span>Nombre:</span>
          <span>{invoice.receptorName}</span>
        </p>
        <p className="font-bold flex justify-between">
          <span>Identificación:</span>
          <span>{invoice.receptorId}</span>
        </p>
      </div>

      {/* Items Table */}
      <div className="border-t-2 border-dashed border-gray-200 pt-6 mb-6">
        <div className="flex justify-between font-black text-[10px] uppercase mb-4 text-gray-400 tracking-widest px-2">
          <span>Descripción</span>
          <span>Total</span>
        </div>
        <div className="space-y-3 px-2">
          <div className="flex justify-between items-start text-xs font-bold">
            <div className="flex flex-col">
              <span>SUSCRIPCIÓN GYM</span>
              <span className="text-[9px] text-gray-400 lowercase">Plan {invoice.planId}</span>
            </div>
            <span>{invoice.currency} {(invoice.amount + invoice.tax).toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="space-y-2 border-t border-gray-100 pt-6 px-2">
        <div className="flex justify-between text-[11px] font-bold text-gray-500">
          <span>Subtotal:</span>
          <span>{invoice.currency} {invoice.amount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-[11px] font-bold text-gray-500">
          <span>IVA (13%):</span>
          <span>{invoice.currency} {invoice.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-lg font-black pt-2 border-t-2 border-black">
          <span>TOTAL:</span>
          <span>{invoice.currency} {invoice.total.toFixed(2)}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center space-y-4">
        <p className="text-[8px] font-bold text-gray-400 italic">"Autorizado mediante resolución DGT-R-033-2019"</p>
        <div className="flex justify-center gap-2">
          <div className="w-12 h-1 bg-black rounded-full" />
          <div className="w-4 h-1 bg-gray-200 rounded-full" />
        </div>
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-800">Kinetic Gym System</p>
      </div>
    </motion.div>
  );
};
