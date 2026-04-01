import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { UserProfile } from '../types';
import { uploadAvatarPhoto, updateUserProfile } from '../services/db';

interface SettingsProps {
  profile: UserProfile;
  onBack: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ profile, onBack }) => {
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [soundEnabled, setSoundEnabled] = useState(profile.settings?.soundEnabled ?? true);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const url = await uploadAvatarPhoto(profile.uid, file);
      await updateUserProfile(profile.uid, { avatarUrl: url });
    } catch (err) {
      console.error("Error subiendo avatar:", err);
      alert("Hubo un error al subir la foto de perfil.");
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
      alert('Ajustes guardados correctamente.');
    } catch (err) {
      console.error("Error guardando ajustes:", err);
      alert("Error al guardar ajustes.");
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

        <button 
          onClick={handleSave}
          className="w-full kinetic-gradient py-5 rounded-2xl font-headline font-black text-on-primary-container tracking-[0.2em] uppercase shadow-2xl shadow-primary/20 active:scale-95 transition-transform"
        >
          Guardar Cambios
        </button>
      </section>
    </motion.div>
  );
};
