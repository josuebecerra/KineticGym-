import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { uploadAvatarPhoto, updateUserProfile } from '../services/db';
import { DialogConfig } from './Dialog';
import { TaxSettings } from './TaxSettings';

interface SettingsProps {
  profile: UserProfile;
  onBack: () => void;
  onShowDialog: (config: Omit<DialogConfig, 'isOpen'>) => void;
}

export const Settings: React.FC<SettingsProps> = ({ profile, onBack, onShowDialog }) => {
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [soundEnabled, setSoundEnabled] = useState(profile.settings?.soundEnabled ?? true);
  const [isUploading, setIsUploading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showTaxSettings, setShowTaxSettings] = useState(false);
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
    } catch (err) {
      console.error("Error subiendo avatar:", err);
      onShowDialog({
        type: 'error',
        title: 'ERROR DE CARGA',
        message: 'No pudimos subir tu foto en este momento. Revisa tu conexión a internet.',
        confirmText: 'REINTENTAR'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateUserProfile(profile.uid, {
        displayName,
        settings: { soundEnabled }
      });
      onShowDialog({
        type: 'success',
        title: 'PERFIL ACTUALIZADO',
        message: 'Tus ajustes han sido guardados con éxito. ¡Todo listo!',
        confirmText: 'GENIAL'
      });
    } catch (err) {
      console.error("Error guardando ajustes:", err);
      onShowDialog({
        type: 'error',
        title: 'FALLO AL GUARDAR',
        message: 'Hubo un problema de sincronización. Inténtalo de nuevo en unos segundos.',
        confirmText: 'CERRAR'
      });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-6 pt-4 space-y-8 pb-32"
    >
      <header className="flex items-center gap-4">
        <button onClick={onBack} className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h1 className="font-headline text-3xl font-black tracking-tight uppercase italic leading-none">AJUSTES</h1>
          <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mt-1">Tu Identidad</p>
        </div>
      </header>

      <section className="bg-surface-container-high rounded-[40px] p-8 space-y-8 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col items-center">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <img 
              src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${profile.displayName || 'U'}&background=CCFF00&color=121212&bold=true`} 
              alt="Avatar" 
              className={`w-32 h-32 rounded-full object-cover border-4 border-surface-container-high shadow-xl transition-all ${isUploading ? 'opacity-50' : 'group-hover:opacity-80'}`}
            />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="material-symbols-outlined text-white text-3xl mix-blend-difference">photo_camera</span>
            </div>
            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
            <input 
              type="file" 
              accept="image/*" 
              ref={fileInputRef}
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>
          <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mt-4">{profile.role}</p>
          <p className="text-secondary font-bold text-sm tracking-widest">{profile.email}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-1">Nombre Público</label>
            <input 
              type="text" 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full bg-surface-container-low border-none rounded-2xl py-4 px-6 font-headline font-bold text-xl focus:ring-2 focus:ring-secondary transition-all text-white"
            />
          </div>

          <div className="flex items-center justify-between bg-surface-container-low p-4 rounded-2xl cursor-pointer" onClick={() => setSoundEnabled(!soundEnabled)}>
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-secondary">{soundEnabled ? 'volume_up' : 'volume_off'}</span>
              <span className="font-bold text-sm uppercase tracking-widest">Efectos de Sonido</span>
            </div>
            <div className={`w-12 h-6 rounded-full transition-colors relative ${soundEnabled ? 'bg-secondary' : 'bg-surface-container-high'}`}>
              <div className={`absolute top-1 bottom-1 w-4 rounded-full bg-background transition-all ${soundEnabled ? 'left-7' : 'left-1'}`} />
            </div>
          </div>
        </div>

        {/* Membership Details (Relocated from Home) */}
        {profile.role === 'trainee' && subscription && (
          <div className="mt-8 pt-8 border-t border-outline-variant/10 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black text-secondary uppercase tracking-[0.3em]">Estado de Membresía</h3>
              <button 
                onClick={() => setShowHistory(!showHistory)}
                className="text-[8px] font-black text-outline hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[14px]">{showHistory ? 'visibility_off' : 'history'}</span>
                {showHistory ? 'Ocultar Historial' : 'Ver Historial'}
              </button>
            </div>

            <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/5 shadow-inner">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h4 className="font-headline text-2xl font-black uppercase italic tracking-tight text-white mb-1">
                    Plan {subscription.planId === '1month' ? 'Mensual' : subscription.planId === '6months' ? 'Semestral' : 'Anual'}
                  </h4>
                  <div className="flex gap-4">
                    <div>
                      <p className="text-[7px] font-black text-outline uppercase tracking-widest">Desde</p>
                      <p className="text-[9px] font-bold text-on-surface uppercase">{new Date(subscription.startDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-[7px] font-black text-outline uppercase tracking-widest">Hasta</p>
                      <p className="text-[9px] font-bold text-on-surface uppercase">{new Date(subscription.endDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-headline text-3xl font-black text-primary-container italic leading-none">{daysRemaining}</p>
                  <p className="text-[8px] font-black text-outline uppercase tracking-widest mt-1">Días Libres</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden border border-outline-variant/10">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    className={`h-full ${daysRemaining! <= 5 ? 'bg-error' : 'kinetic-gradient shadow-lg shadow-primary/20'}`}
                  />
                </div>
              </div>

              <div className="pt-6">
                <button 
                  onClick={() => {
                    const msg = `¡Hola! Para renovar tu plan ${subscription.planId === '1month' ? 'mensual' : subscription.planId === '6months' ? 'semestral' : 'anual'}, acércate al mostrador de Kinetic o contacta a la administración directamente.`;
                    onShowDialog({
                      type: 'info',
                      title: 'SOLICITAR RENOVACIÓN',
                      message: msg,
                      confirmText: 'ENTENDIDO'
                    });
                  }}
                  className="w-full kinetic-gradient text-on-primary-container py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">refresh</span> Renovar Membresía
                </button>
              </div>
            </div>

            {/* History List (Toggleable) */}
            {showHistory && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-3">
                <p className="text-[9px] font-black text-outline uppercase tracking-[0.2em] ml-1">Registro de Pagos</p>
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                  {(profile.subscriptionHistory || []).slice().reverse().map((sub, idx) => (
                    <div key={idx} className="bg-surface-container-low border border-outline-variant/10 p-3 rounded-xl flex justify-between items-center opacity-60 hover:opacity-100 transition-opacity">
                      <div>
                        <p className="text-[8px] font-black text-on-surface uppercase tracking-tight">Plan {sub.planId === '1month' ? 'Mensual' : sub.planId === '6months' ? 'Semestral' : 'Anual'}</p>
                        <p className="text-[7px] font-bold text-outline uppercase mt-0.5">{new Date(sub.startDate).toLocaleDateString()} - {new Date(sub.endDate).toLocaleDateString()}</p>
                      </div>
                      <span className="text-[7px] font-black text-outline-variant uppercase bg-surface-container-high px-2 py-1 rounded-full">Historial #{profile.subscriptionHistory!.length - idx}</span>
                    </div>
                  ))}
                  {(!profile.subscriptionHistory || profile.subscriptionHistory.length === 0) && (
                    <p className="text-[8px] font-black text-outline uppercase tracking-widest text-center py-4 italic">No hay registros previos</p>
                  )}
                </div>
              </motion.div>
            )}
          </div>
        )}
        <button 
          onClick={handleSave}
          className="w-full kinetic-gradient py-5 rounded-2xl font-headline font-black text-on-primary-container tracking-[0.2em] uppercase shadow-2xl shadow-primary/20 active:scale-[0.98] transition-transform"
        >
          Guardar Cambios
        </button>
      </section>
    </motion.div>
  );
};
