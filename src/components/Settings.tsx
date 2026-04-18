import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, TaxData } from '../types';
import { uploadAvatarPhoto, updateUserProfile, updateTaxData } from '../services/db';
import { DialogConfig } from './Dialog';
import { Button } from './common/Button';

interface SettingsProps {
  profile: UserProfile;
  onBack: () => void;
  onShowDialog: (config: Omit<DialogConfig, 'isOpen'>) => void;
}

type TabType = 'perfil' | 'facturacion' | 'suscripcion';

export const Settings: React.FC<SettingsProps> = ({ profile, onBack, onShowDialog }) => {
  const [activeTab, setActiveTab] = useState<TabType>('perfil');
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [soundEnabled, setSoundEnabled] = useState(profile.settings?.soundEnabled ?? true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // Tax Data Local State
  const [taxData, setTaxData] = useState<TaxData>(profile.taxData || {
    id: '',
    type: 'fisica',
    name: '',
    email: profile.email || '',
    address: {
      province: '1',
      canton: '',
      district: '',
      other: ''
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const subscription = profile.subscription;
  const daysRemaining = subscription ? Math.max(0, Math.ceil((new Date(subscription.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : null;
  const totalDays = subscription ? Math.ceil((new Date(subscription.endDate).getTime() - new Date(subscription.startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
  const elapsedDays = subscription ? Math.max(0, Math.ceil((new Date().getTime() - new Date(subscription.startDate).getTime()) / (1000 * 60 * 60 * 24))) : 0;
  const progressPercentage = totalDays > 0 ? Math.min(100, (elapsedDays / totalDays) * 100) : 0;

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadAvatarPhoto(profile.uid, file);
      await updateUserProfile(profile.uid, { avatarUrl: url });
      onShowDialog({
        type: 'success',
        title: 'FOTO ACTUALIZADA',
        message: 'Tu nueva imagen de perfil se ha guardado correctamente.',
        confirmText: 'EXCELENTE'
      });
    } catch (err) {
      console.error("Error subiendo avatar:", err);
      onShowDialog({
        type: 'error',
        title: 'ERROR DE CARGA',
        message: 'No pudimos subir tu foto en este momento. Revisa tu conexión.',
        confirmText: 'REINTENTAR'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      // 1. Profile and Settings
      await updateUserProfile(profile.uid, {
        displayName,
        settings: { soundEnabled }
      });

      // 2. Tax Data (if modified or just always sync if we are in that tab/context)
      await updateTaxData(profile.uid, taxData);

      onShowDialog({
        type: 'success',
        title: 'AJUSTES GUARDADOS',
        message: 'Toda tu información ha sido sincronizada con éxito.',
        confirmText: 'LISTO'
      });
    } catch (err) {
      console.error("Error guardando ajustes:", err);
      onShowDialog({
        type: 'error',
        title: 'FALLO AL GUARDAR',
        message: 'Hubo un problema al sincronizar los datos. Inténtalo de nuevo.',
        confirmText: 'CERRAR'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const tabs = [
    { id: 'perfil', label: 'PERFIL', icon: 'person' },
    { id: 'facturacion', label: 'FACTURACIÓN', icon: 'receipt_long' },
    ...(profile.role === 'trainee' ? [{ id: 'suscripcion', label: 'MEMBRESÍA', icon: 'card_membership' }] : [])
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background text-white pb-32"
    >
      {/* Dynamic Background Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-secondary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[400px] h-[400px] bg-primary/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 px-6 pt-8 space-y-8 max-w-2xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-5">
            <button 
              onClick={onBack} 
              className="w-12 h-12 rounded-2xl bg-surface-container/50 backdrop-blur-md border border-outline-variant/10 flex items-center justify-center text-white hover:bg-surface-container-high transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-2xl">arrow_back</span>
            </button>
            <div>
              <h1 className="font-headline text-4xl font-black tracking-tighter uppercase italic leading-none">AJUSTES</h1>
              <p className="text-[10px] font-black text-secondary uppercase tracking-[0.4em] mt-1.5 opacity-80">Configuración Neural</p>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <nav className="flex gap-2 p-1.5 bg-surface-container/30 backdrop-blur-xl rounded-[28px] border border-white/5 relative">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`
                relative flex-1 flex items-center justify-center gap-2 py-4 rounded-[22px] transition-all duration-500
                ${activeTab === tab.id ? 'text-black' : 'text-outline hover:text-white'}
              `}
            >
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTabGlow"
                  className="absolute inset-0 bg-secondary rounded-[22px] shadow-[0_0_25px_rgba(204,255,0,0.4)]"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              <span className="material-symbols-outlined text-[20px] relative z-10">{tab.icon}</span>
              <span className="text-[10px] font-black uppercase tracking-widest relative z-10 hidden sm:block">
                {tab.label}
              </span>
            </button>
          ))}
        </nav>

        {/* Main Content Area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full"
          >
            {activeTab === 'perfil' && (
              <div className="space-y-8">
                {/* Avatar Section */}
                <div className="flex flex-col items-center bg-surface-container/40 backdrop-blur-md p-10 rounded-[40px] border border-white/5 shadow-2xl">
                  <div 
                    className="relative group cursor-pointer" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="absolute inset-[-4px] bg-secondary/20 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative w-36 h-36 rounded-full overflow-hidden border-[6px] border-background shadow-2xl">
                      <img 
                        src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${profile.displayName || 'U'}&background=CCFF00&color=121212&bold=true`} 
                        alt="Avatar" 
                        className={`w-full h-full object-cover transition-all duration-500 ${isUploading ? 'opacity-30 scale-90' : 'group-hover:scale-110'}`}
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <span className="material-symbols-outlined text-white text-4xl">photo_camera</span>
                      </div>
                      {isUploading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-10 h-10 border-[3px] border-secondary border-t-transparent rounded-full animate-spin" />
                        </div>
                      )}
                    </div>
                    <input 
                      type="file" 
                      accept="image/*" 
                      ref={fileInputRef}
                      onChange={handleAvatarUpload}
                      className="hidden"
                    />
                  </div>
                  <div className="mt-6 text-center">
                    <div className="inline-block px-4 py-1.5 bg-secondary/10 border border-secondary/20 rounded-full mb-2">
                      <p className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">{profile.role}</p>
                    </div>
                    <p className="text-outline-variant font-medium text-sm tracking-wide lowercase italic opacity-60">{profile.email}</p>
                  </div>
                </div>

                {/* Profile Controls */}
                <div className="grid gap-6">
                  <div className="bg-surface-container/30 backdrop-blur-md p-8 rounded-[32px] border border-white/5 space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-[0.3em] text-secondary ml-1">Identidad Pública</label>
                    <div className="relative group">
                      <input 
                        type="text" 
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Tu alias en Kinetic..."
                        className="w-full bg-background/50 border border-white/5 rounded-2xl py-5 px-6 font-headline font-bold text-2xl focus:ring-2 focus:ring-secondary/30 transition-all text-white placeholder:text-outline-variant/20 italic"
                      />
                    </div>
                  </div>

                  <div 
                    onClick={() => setSoundEnabled(!soundEnabled)}
                    className="group bg-surface-container/30 backdrop-blur-md p-6 rounded-[32px] border border-white/5 flex items-center justify-between cursor-pointer hover:bg-surface-container/50 transition-all active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${soundEnabled ? 'bg-secondary/10 text-secondary' : 'bg-white/5 text-outline'}`}>
                        <span className="material-symbols-outlined text-2xl">
                          {soundEnabled ? 'notifications_active' : 'notifications_off'}
                        </span>
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase tracking-widest text-white decoration-secondary/30 group-hover:underline">Efectos de Sonido</p>
                        <p className="text-[9px] font-bold text-outline uppercase tracking-tight mt-0.5">Alertas y temporizadores</p>
                      </div>
                    </div>
                    <div className={`w-14 h-7 rounded-full p-1 transition-all duration-300 ${soundEnabled ? 'bg-secondary' : 'bg-surface-container-high'}`}>
                      <div className={`w-5 h-5 rounded-full bg-background shadow-lg transition-all duration-300 ${soundEnabled ? 'translate-x-7' : 'translate-x-0'}`} />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'facturacion' && (
              <div className="space-y-6">
                <div className="bg-surface-container/40 backdrop-blur-md p-8 rounded-[40px] border border-white/5 shadow-2xl space-y-8">
                  <div className="space-y-2">
                    <h3 className="font-headline text-3xl font-black uppercase italic tracking-tighter text-white">DATOS FISCALES</h3>
                    <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest leading-relaxed max-w-[300px]">
                      Para recibir tus facturas electrónicas atomatizadas por Hacienda.
                    </p>
                  </div>

                  <form className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-outline-variant uppercase tracking-[0.2em] ml-2">Tipo de ID</label>
                        <select 
                          value={taxData.type}
                          onChange={(e) => setTaxData({ ...taxData, type: e.target.value as any })}
                          className="w-full bg-background/60 border border-white/5 rounded-2xl py-4 px-5 text-[11px] font-black text-white focus:ring-2 focus:ring-secondary/20 transition-all uppercase appearance-none cursor-pointer"
                        >
                          <option value="fisica">Cédula Física</option>
                          <option value="juridica">Cédula Jurídica</option>
                          <option value="dimex">DIMEX</option>
                          <option value="pasaporte">Pasaporte</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-outline-variant uppercase tracking-[0.2em] ml-2">Número de ID</label>
                        <input 
                          type="text"
                          value={taxData.id}
                          onChange={(e) => setTaxData({ ...taxData, id: e.target.value })}
                          placeholder="Ej: 1-1234-5678"
                          className="w-full bg-background/60 border border-white/5 rounded-2xl py-4 px-5 text-[11px] font-black text-white placeholder:text-outline-variant/10 focus:ring-2 focus:ring-secondary/20 transition-all uppercase italic"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-outline-variant uppercase tracking-[0.2em] ml-2">Nombre Legal / Razón Social</label>
                      <input 
                        type="text"
                        value={taxData.name}
                        onChange={(e) => setTaxData({ ...taxData, name: e.target.value })}
                        placeholder="Nombre registrado en Hacienda"
                        className="w-full bg-background/60 border border-white/5 rounded-2xl py-4 px-5 text-[11px] font-black text-white placeholder:text-outline-variant/10 focus:ring-2 focus:ring-secondary/20 transition-all uppercase italic"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-outline-variant uppercase tracking-[0.2em] ml-2">Email para Facturación</label>
                      <input 
                        type="email"
                        value={taxData.email}
                        onChange={(e) => setTaxData({ ...taxData, email: e.target.value })}
                        className="w-full bg-background/60 border border-white/5 rounded-2xl py-4 px-5 text-[11px] font-black text-white focus:ring-2 focus:ring-secondary/20 transition-all lowercase italic"
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-5">
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-outline-variant uppercase tracking-[0.2em] ml-2">Provincia</label>
                        <select 
                          value={taxData.address?.province || '1'}
                          onChange={(e) => setTaxData({ 
                            ...taxData, 
                            address: { ...(taxData.address || { canton: '', district: '' }), province: e.target.value } 
                          })}
                          className="w-full bg-background/60 border border-white/5 rounded-2xl py-4 px-5 text-[11px] font-black text-white focus:ring-2 focus:ring-secondary/20 transition-all uppercase appearance-none cursor-pointer"
                        >
                          {['San José', 'Alajuela', 'Cartago', 'Heredia', 'Guanacaste', 'Puntarenas', 'Limón'].map((p, i) => (
                            <option key={p} value={String(i+1)}>{p}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-black text-outline-variant uppercase tracking-[0.2em] ml-2">Cantón</label>
                        <input 
                          type="text"
                          placeholder="Escazú, etc..."
                          value={taxData.address?.canton || ''}
                          onChange={(e) => setTaxData({ 
                            ...taxData, 
                            address: { ...(taxData.address || { province: '1', district: '' }), canton: e.target.value } 
                          })}
                          className="w-full bg-background/60 border border-white/5 rounded-2xl py-4 px-5 text-[11px] font-black text-white placeholder:text-outline-variant/10 focus:ring-2 focus:ring-secondary/20 transition-all uppercase italic"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-outline-variant uppercase tracking-[0.2em] ml-2">Dirección Exacta</label>
                      <textarea 
                        rows={2}
                        placeholder="Barrio, número de casa, señas..."
                        value={taxData.address?.other || ''}
                        onChange={(e) => setTaxData({ 
                          ...taxData, 
                          address: { ...(taxData.address || { province: '1', canton: '', district: '' }), other: e.target.value } 
                        })}
                        className="w-full bg-background/60 border border-white/5 rounded-2xl py-4 px-5 text-[11px] font-black text-white placeholder:text-outline-variant/10 focus:ring-2 focus:ring-secondary/20 transition-all uppercase italic resize-none"
                      />
                    </div>
                  </form>
                </div>
              </div>
            )}

            {activeTab === 'suscripcion' && subscription && (
              <div className="space-y-8">
                {/* Active Membership Card */}
                <div className="bg-surface-container/40 backdrop-blur-md p-8 rounded-[40px] border border-white/5 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-[-20%] right-[-20%] w-[200px] h-[200px] bg-secondary/10 blur-[60px] rounded-full animate-pulse" />
                  
                  <div className="relative z-10 space-y-8">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-secondary/10 border border-secondary/20 rounded-full mb-3">
                          <div className="w-1.5 h-1.5 bg-secondary rounded-full animate-ping" />
                          <p className="text-[8px] font-black text-secondary uppercase tracking-[0.2em]">Suscripción Activa</p>
                        </div>
                        <h4 className="font-headline text-4xl font-black uppercase italic tracking-tighter text-white leading-none">
                          PLAN {subscription.planId === '1month' ? 'MENSUAL' : subscription.planId === '6months' ? 'SEMESTRAL' : 'ANUAL'}
                        </h4>
                      </div>
                      <div className="text-right">
                        <p className="font-headline text-5xl font-black text-secondary italic leading-none">{daysRemaining}</p>
                        <p className="text-[9px] font-black text-outline uppercase tracking-[0.3em] mt-1.5">Días Válidos</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-outline">
                        <span>Progreso del ciclo</span>
                        <span>{Math.round(progressPercentage)}%</span>
                      </div>
                      <div className="h-4 w-full bg-background/50 rounded-full overflow-hidden border border-white/5 p-0.5">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${progressPercentage}%` }}
                          className={`h-full rounded-full ${daysRemaining! <= 5 ? 'bg-error shadow-[0_0_15px_rgba(255,82,82,0.4)]' : 'kinetic-gradient shadow-[0_0_15px_rgba(204,255,0,0.3)]'}`}
                        />
                      </div>
                      <div className="flex justify-between">
                        <div className="flex gap-4">
                          <div>
                            <p className="text-[7px] font-black text-outline uppercase tracking-[0.2em]">Inició</p>
                            <p className="text-[10px] font-bold text-white uppercase">{new Date(subscription.startDate).toLocaleDateString()}</p>
                          </div>
                          <div className="w-[1px] h-full bg-white/5" />
                          <div>
                            <p className="text-[7px] font-black text-outline uppercase tracking-[0.2em]">Vence</p>
                            <p className="text-[10px] font-bold text-white uppercase">{new Date(subscription.endDate).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        onShowDialog({
                          type: 'info',
                          title: 'RENOVACIÓN',
                          message: `Tu plan vence el ${new Date(subscription.endDate).toLocaleDateString()}. Puedes renovar en el mostrador o contactarnos por WhatsApp.`,
                          confirmText: 'ENTENDIDO'
                        });
                      }}
                      className="w-full bg-white text-black py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-xl shadow-white/5"
                    >
                      <span className="material-symbols-outlined text-[18px]">refresh</span> Solicitar Renovación
                    </button>
                  </div>
                </div>

                {/* History Section */}
                <div className="space-y-5">
                  <div className="flex items-center justify-between px-2">
                    <h5 className="text-[11px] font-black text-outline-variant uppercase tracking-[0.3em]">Registro Histórico</h5>
                    <button 
                      onClick={() => setShowHistory(!showHistory)}
                      className="text-[9px] font-black text-secondary uppercase tracking-widest flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">{showHistory ? 'expand_less' : 'expand_more'}</span>
                      {showHistory ? 'Cerrar' : 'Ver Todos'}
                    </button>
                  </div>
                  
                  <AnimatePresence>
                    {showHistory && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3 overflow-hidden"
                      >
                        {(profile.subscriptionHistory || []).slice().reverse().map((sub, idx) => (
                          <div key={idx} className="bg-surface-container/20 border border-white/5 p-4 rounded-2xl flex justify-between items-center group hover:bg-surface-container/40 transition-colors">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-xl bg-background/50 flex items-center justify-center text-outline group-hover:text-secondary transition-colors">
                                <span className="material-symbols-outlined">description</span>
                              </div>
                              <div>
                                <p className="text-[10px] font-black text-white uppercase tracking-tight">Plan {sub.planId === '1month' ? 'Mensual' : sub.planId === '6months' ? 'Semestral' : 'Anual'}</p>
                                <p className="text-[8px] font-bold text-outline-variant uppercase mt-0.5 opacity-60">{new Date(sub.startDate).toLocaleDateString()} — {new Date(sub.endDate).toLocaleDateString()}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-[8px] font-black text-outline uppercase bg-background/50 px-3 py-1.5 rounded-full border border-white/5">#{profile.subscriptionHistory!.length - idx}</span>
                            </div>
                          </div>
                        ))}
                        {(!profile.subscriptionHistory || profile.subscriptionHistory.length === 0) && (
                          <div className="bg-surface-container/20 p-8 rounded-3xl text-center border border-dashed border-white/5">
                            <p className="text-[10px] font-black text-outline uppercase tracking-widest italic opacity-40">No hay registros aún</p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Global Save Button */}
        <div className="sticky bottom-8 z-50 px-2">
          <Button 
            onClick={handleSaveAll}
            isLoading={isSaving}
            className="w-full py-5 rounded-2xl font-headline font-black text-on-primary-container tracking-[0.4em] uppercase shadow-[0_20px_40px_rgba(204,255,0,0.15)] active:scale-[0.98] transform transition-all"
          >
            Sincronizar Cambios
          </Button>
        </div>
      </div>
    </motion.div>
  );
};
