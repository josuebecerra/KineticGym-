import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { GymTaxConfig } from '../types';
import { updateGymTaxConfig, listenToGymTaxConfig } from '../services/db';

interface InvoicingConfigProps {
  onClose: () => void;
}

export const InvoicingConfig: React.FC<InvoicingConfigProps> = ({ onClose }) => {
  const [config, setConfig] = useState<GymTaxConfig>({
    id: '',
    type: 'juridica',
    name: '',
    email: '',
    haciendaUser: '',
    haciendaPass: '',
    isStaging: true,
    lastConsecutive: 0
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = listenToGymTaxConfig((cloudConfig) => {
      if (cloudConfig) {
        setConfig(cloudConfig);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateGymTaxConfig(config);
      onClose();
    } catch (error) {
      console.error("Error saving global tax config:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface-container-low p-8 rounded-[40px] border border-outline-variant/10 shadow-2xl space-y-8 max-w-2xl w-full"
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-headline text-2xl font-black uppercase italic text-white tracking-tight">CONFIGURACIÓN EMISOR</h3>
          <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em] mt-1">Ministerio de Hacienda CR</p>
        </div>
        <button onClick={onClose} className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-outline hover:text-white transition-all">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Info */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-outline uppercase tracking-widest border-b border-outline-variant/10 pb-2">Datos Legales del Gimnasio</h4>
          
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Razón Social</label>
            <input 
              type="text"
              required
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
              className="w-full bg-surface-container-high border-none rounded-2xl py-3 px-4 text-xs font-bold text-white uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Cédula Jurídica / Física</label>
            <input 
              type="text"
              required
              value={config.id}
              onChange={(e) => setConfig({ ...config, id: e.target.value })}
              className="w-full bg-surface-container-high border-none rounded-2xl py-3 px-4 text-xs font-bold text-white uppercase"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Correo Notificaciones</label>
            <input 
              type="email"
              required
              value={config.email}
              onChange={(e) => setConfig({ ...config, email: e.target.value })}
              className="w-full bg-surface-container-high border-none rounded-2xl py-3 px-4 text-xs font-bold text-white"
            />
          </div>
        </div>

        {/* Hacienda API Info */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-black text-outline uppercase tracking-widest border-b border-outline-variant/10 pb-2">Credenciales Hacienda API</h4>
          
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Usuario API (ATV)</label>
            <input 
              type="text"
              value={config.haciendaUser || ''}
              onChange={(e) => setConfig({ ...config, haciendaUser: e.target.value })}
              className="w-full bg-surface-container-high border-none rounded-2xl py-3 px-4 text-xs font-bold text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-secondary uppercase tracking-[0.2em] ml-1">Contraseña API</label>
            <input 
              type="password"
              value={config.haciendaPass || ''}
              onChange={(e) => setConfig({ ...config, haciendaPass: e.target.value })}
              className="w-full bg-surface-container-high border-none rounded-2xl py-3 px-4 text-xs font-bold text-white"
            />
          </div>

          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input 
                type="checkbox"
                checked={config.isStaging}
                onChange={(e) => setConfig({ ...config, isStaging: e.target.checked })}
                className="w-5 h-5 rounded-lg bg-surface-container-high border-none text-secondary focus:ring-0"
              />
              <span className="text-[10px] font-black text-outline group-hover:text-white transition-colors uppercase tracking-widest">Modo Pruebas (Staging)</span>
            </label>
          </div>
        </div>

        <div className="md:col-span-2 pt-4">
          <button 
            type="submit"
            disabled={isSaving}
            className="w-full kinetic-gradient py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] text-on-primary-container shadow-xl shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50"
          >
            {isSaving ? 'GUARDANDO CONFIGURACIÓN...' : 'GUARDAR CONFIGURACIÓN FISCAL'}
          </button>
        </div>
      </form>

      <div className="p-4 bg-error/5 border border-error/10 rounded-2xl">
        <p className="text-[9px] font-bold text-error uppercase tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">warning</span>
          Asegúrate de que la llave criptográfica (.p12) esté cargada en los secretos de Firebase Functions.
        </p>
      </div>
    </motion.div>
  );
};
