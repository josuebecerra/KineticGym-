import React, { useState } from 'react';
import { motion } from 'motion/react';
import { TaxData } from '../types';
import { updateTaxData } from '../services/db';

interface TaxSettingsProps {
  uid: string;
  initialData?: TaxData;
  onSave?: () => void;
  onClose: () => void;
}

export const TaxSettings: React.FC<TaxSettingsProps> = ({ uid, initialData, onSave, onClose }) => {
  const [formData, setFormData] = useState<TaxData>(initialData || {
    id: '',
    type: 'fisica',
    name: '',
    email: '',
    address: {
      province: '1',
      canton: '',
      district: '',
      neighborhood: '',
      other: ''
    }
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateTaxData(uid, formData);
      if (onSave) onSave();
      onClose();
    } catch (error) {
      console.error("Error saving tax data:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-surface-container-low p-6 rounded-[32px] border border-outline-variant/10 shadow-2xl space-y-6 max-w-md w-full"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-xl font-black uppercase italic text-white tracking-tight">DATOS FISCALES</h3>
        <button onClick={onClose} className="text-outline hover:text-white transition-colors">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest leading-relaxed">
        Completa esta información para recibir tus facturas electrónicas automáticamente.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Tipo de Identificación</label>
          <select 
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
            className="w-full bg-surface-container-high border-none rounded-2xl py-3 px-4 text-xs font-bold text-white focus:ring-2 focus:ring-secondary/20 transition-all uppercase"
          >
            <option value="fisica">Cédula Física</option>
            <option value="juridica">Cédula Jurídica</option>
            <option value="dimex">DIMEX</option>
            <option value="pasaporte">Pasaporte</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Número de Cédula / ID</label>
          <input 
            type="text"
            required
            value={formData.id}
            onChange={(e) => setFormData({ ...formData, id: e.target.value })}
            placeholder="Ej: 1-1234-1234"
            className="w-full bg-surface-container-high border-none rounded-2xl py-3 px-4 text-xs font-bold text-white placeholder:text-outline/30 focus:ring-2 focus:ring-secondary/20 transition-all uppercase"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Nombre Completo / Razón Social</label>
          <input 
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-surface-container-high border-none rounded-2xl py-3 px-4 text-xs font-bold text-white placeholder:text-outline/30 focus:ring-2 focus:ring-secondary/20 transition-all uppercase"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Correo Electrónico Fiscal</label>
          <input 
            type="email"
            required
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full bg-surface-container-high border-none rounded-2xl py-3 px-4 text-xs font-bold text-white placeholder:text-outline/30 focus:ring-2 focus:ring-secondary/20 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Provincia</label>
            <select 
              value={formData.address?.province || '1'}
              onChange={(e) => setFormData({ 
                ...formData, 
                address: { ...(formData.address || { canton: '', district: '' }), province: e.target.value } 
              })}
              className="w-full bg-surface-container-high border-none rounded-2xl py-3 px-4 text-xs font-bold text-white focus:ring-2 focus:ring-secondary/20 transition-all uppercase"
            >
              <option value="1">San José</option>
              <option value="2">Alajuela</option>
              <option value="3">Cartago</option>
              <option value="4">Heredia</option>
              <option value="5">Guanacaste</option>
              <option value="6">Puntarenas</option>
              <option value="7">Limón</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Cantón</label>
            <input 
              type="text"
              required
              placeholder="Ej: Escazú"
              value={formData.address?.canton || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                address: { ...(formData.address || { province: '1', district: '' }), canton: e.target.value } 
              })}
              className="w-full bg-surface-container-high border-none rounded-2xl py-3 px-4 text-xs font-bold text-white placeholder:text-outline/30 focus:ring-2 focus:ring-secondary/20 transition-all uppercase"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Distrito y Otras Señas</label>
          <input 
            type="text"
            required
            placeholder="Ej: San Rafael, 100m Este de..."
            value={formData.address?.other || ''}
            onChange={(e) => setFormData({ 
              ...formData, 
              address: { ...(formData.address || { province: '1', canton: '', district: '' }), other: e.target.value } 
            })}
            className="w-full bg-surface-container-high border-none rounded-2xl py-3 px-4 text-xs font-bold text-white placeholder:text-outline/30 focus:ring-2 focus:ring-secondary/20 transition-all uppercase"
          />
        </div>

        <button 
          type="submit"
          disabled={isSaving}
          className="w-full kinetic-gradient py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-on-primary-container shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4"
        >
          {isSaving ? 'GUARDANDO...' : 'ACTUALIZAR DATOS'}
        </button>
      </form>
    </motion.div>
  );
};
