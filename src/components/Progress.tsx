import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ProgressLog, UserProfile } from '../types';
import { uploadProgressPhoto } from '../services/db';
import { User } from 'firebase/auth';
import { formatKineticDate, toKineticISO } from '../utils/date';
import { DialogConfig } from './Dialog';

interface ProgressProps {
  user: User;
  userProfile: UserProfile;
  logs: ProgressLog[];
  onAdd: (log: ProgressLog) => void;
  onEditAssessment: () => void;
  onBack: () => void;
  onShowDialog: (config: Omit<DialogConfig, 'isOpen'>) => void;
}

export const Progress: React.FC<ProgressProps> = ({ user, userProfile, logs, onAdd, onEditAssessment, onBack, onShowDialog }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [newLog, setNewLog] = useState({
    weight: 0,
    waist: 0,
    chest: 0,
    hips: 0,
    arms: 0,
    legs: 0,
    calves: 0,
    bodyFat: 0,
    photos: [] as { file: File, preview: string }[]
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const latestLog = logs[0];
  const previousLog = logs[1];
  
  const weightDiff = latestLog && previousLog ? latestLog.weight - previousLog.weight : 0;
  const totalWeightDiff = latestLog && userProfile.assessment?.weight ? latestLog.weight - userProfile.assessment.weight : 0;

  // Improved SVG Line Chart with Curves
  const chartWidth = 400;
  const chartHeight = 200;
  const paddingX = 40;
  const paddingY = 30;
  
  const minWeight = Math.min(...sortedLogs.map(l => l.weight)) - 1;
  const maxWeight = Math.max(...sortedLogs.map(l => l.weight)) + 1;
  const weightRange = maxWeight - minWeight;

  const getCoords = (log: ProgressLog, i: number) => {
    const x = paddingX + (i * (chartWidth - 2 * paddingX) / (sortedLogs.length - 1 || 1));
    const y = chartHeight - paddingY - ((log.weight - minWeight) * (chartHeight - 2 * paddingY) / weightRange);
    return { x, y };
  };

  const coords = sortedLogs.map((log, i) => getCoords(log, i));

  // Bezier Curve Path calculation (simple)
  const linePath = coords.length > 1 
    ? coords.reduce((acc, point, i, a) => {
        if (i === 0) return `M ${point.x},${point.y}`;
        const prev = a[i - 1];
        const cp1x = prev.x + (point.x - prev.x) / 2;
        return `${acc} C ${cp1x},${prev.y} ${cp1x},${point.y} ${point.x},${point.y}`;
      }, "")
    : coords.length === 1 ? `M ${coords[0].x-10},${coords[0].y} L ${coords[0].x+10},${coords[0].y}` : "";

  const areaPath = coords.length > 1 
    ? `${linePath} L ${coords[coords.length - 1].x},${chartHeight} L ${coords[0].x},${chartHeight} Z`
    : "";

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const preview = URL.createObjectURL(file);
        setNewLog(prev => ({ 
          ...prev, 
          photos: [...prev.photos, { file, preview }] 
        }));
      });
    }
  };

  const handleSubmit = async () => {
    if (newLog.weight <= 0) return;
    
    setIsUploading(true);
    try {
      const photoUrls: string[] = [];
      for (const photo of newLog.photos) {
        const url = await uploadProgressPhoto(user.uid, photo.file);
        photoUrls.push(url);
      }
      
      const log: ProgressLog = {
        id: crypto.randomUUID(),
        date: toKineticISO(),
        weight: newLog.weight,
        measurements: {
          waist: newLog.waist,
          chest: newLog.chest,
          hips: newLog.hips,
          arms: newLog.arms || undefined,
          legs: newLog.legs || undefined,
          calves: newLog.calves || undefined,
          bodyFat: newLog.bodyFat || undefined
        },
        photos: photoUrls
      };
      
      onAdd(log);
      setIsAdding(false);
      setNewLog({ weight: 0, waist: 0, chest: 0, hips: 0, arms: 0, legs: 0, calves: 0, bodyFat: 0, photos: [] });
    } catch (error) {
      console.error("Error al subir fotos:", error);
      onShowDialog({
        type: 'error',
        title: 'ERROR DE CARGA',
        message: 'No pudimos subir las fotos del progreso. Por favor, inténtalo de nuevo.',
        confirmText: 'REINTENTAR'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="px-6 pt-4 pb-24 space-y-8"
    >
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <button 
            onClick={onBack} 
            className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-secondary shrink-0 transition-colors"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <div className="min-w-0">
            <h1 className="font-headline text-3xl font-black tracking-tight uppercase italic leading-none truncate">PROGRESO</h1>
            <p className="text-[10px] font-black text-secondary uppercase tracking-[0.2em] mt-1 truncate">Evolución Corporal</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-12 h-12 rounded-2xl kinetic-gradient flex items-center justify-center shadow-lg shadow-primary/20 active:scale-[0.98] transition-all shrink-0 ml-auto"
        >
          <span className="material-symbols-outlined text-on-primary-container font-black">add</span>
        </button>
      </header>

      {/* Ficha Inicial Section */}
      {userProfile.assessment && (
        <section className="bg-surface-container-high rounded-[40px] p-8 border border-outline-variant/10 shadow-2xl relative overflow-hidden group">
          <div className="absolute -top-6 -right-6 w-32 h-32 bg-secondary/5 rounded-full blur-3xl group-hover:bg-secondary/10 transition-colors" />
          
          <div className="flex justify-between items-start mb-6">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-outline">Ficha de Inicio</h3>
              <p className="font-headline text-3xl font-black italic uppercase tracking-tight">Estado <span className="text-secondary">Base</span></p>
            </div>
            <button 
              onClick={onEditAssessment}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-highest text-[10px] font-black uppercase tracking-widest text-secondary border border-secondary/20 hover:bg-secondary hover:text-on-secondary transition-all"
            >
              <span className="material-symbols-outlined text-sm">edit_note</span>
              Editar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center gap-4 bg-background/40 p-4 rounded-2xl border border-outline-variant/5">
                <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
                  <span className="material-symbols-outlined font-black">
                    {userProfile.assessment.goal === 'weight_loss' ? 'monitor_weight' : 
                     userProfile.assessment.goal === 'muscle_gain' ? 'fitness_center' : 'directions_run'}
                  </span>
                </div>
                <div>
                  <p className="text-[8px] font-black uppercase text-outline tracking-widest">Objetivo Principal</p>
                  <p className="font-headline font-black uppercase italic text-lg leading-none mt-1">
                    {userProfile.assessment.goal === 'weight_loss' ? 'Perder Peso' : 
                     userProfile.assessment.goal === 'muscle_gain' ? 'Ganar Masa' : 'Forma Física'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-background/40 p-3 rounded-2xl border border-outline-variant/5">
                  <p className="text-[7px] font-black uppercase text-outline tracking-widest leading-none">Nivel</p>
                  <p className="font-headline font-black uppercase italic text-xs mt-1.5 truncate">
                    {userProfile.assessment.knowledge === 'first_time' ? 'Novato' : 
                     userProfile.assessment.knowledge === 'little' ? 'Principiante' : 
                     userProfile.assessment.knowledge === 'good' ? 'Intermedio' : 'Autónomo'}
                  </p>
                </div>
                <div className="bg-background/40 p-3 rounded-2xl border border-outline-variant/5">
                  <p className="text-[7px] font-black uppercase text-outline tracking-widest leading-none">Meta Semanal</p>
                  <p className="font-headline font-black uppercase italic text-xs mt-1.5">
                    {userProfile.assessment.targetFrequency}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-background/40 p-4 rounded-2xl border border-outline-variant/5 h-full flex flex-col justify-between">
                <div>
                  <p className="text-[8px] font-black uppercase text-outline tracking-widest mb-3">Condiciones de Salud</p>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.assessment.conditions.map(c => (
                      <span key={c} className="px-3 py-1 rounded-full bg-surface-container-highest text-[8px] font-black uppercase tracking-tight text-on-surface-variant border border-outline-variant/10">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex justify-between items-end mt-4 pt-4 border-t border-outline-variant/5">
                  <div className="text-center">
                    <p className="text-[7px] font-black uppercase text-outline leading-none">Peso Inicial</p>
                    <p className="font-headline font-black text-xl italic">{userProfile.assessment.weight || '--'}<span className="text-[8px] ml-1">kg</span></p>
                  </div>
                  <div className="text-center">
                    <p className="text-[7px] font-black uppercase text-outline leading-none">Altura</p>
                    <p className="font-headline font-black text-xl italic">{userProfile.assessment.height || '--'}<span className="text-[8px] ml-1">cm</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-surface-container-high rounded-[32px] p-6 border border-outline-variant/5 shadow-xl">
          <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-2">Peso Actual</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-4xl font-black italic">{latestLog?.weight || '--'}</span>
            <span className="text-xs font-bold text-on-surface-variant">KG</span>
          </div>
          <div className={`flex flex-col gap-1 mt-2`}>
            <p className={`text-[10px] font-bold ${weightDiff <= 0 ? 'text-secondary' : 'text-error'}`}>
              {weightDiff >= 0 ? '+' : ''}{weightDiff.toFixed(1)} kg s/ anterior
            </p>
            {totalWeightDiff !== 0 && (
              <p className={`text-[10px] font-black uppercase tracking-widest ${totalWeightDiff <= 0 ? 'text-secondary' : 'text-error'}`}>
                {totalWeightDiff >= 0 ? '+' : ''}{totalWeightDiff.toFixed(1)} kg total
              </p>
            )}
          </div>
        </div>
        <div className="bg-surface-container-high rounded-[32px] p-6 border border-outline-variant/5 shadow-xl">
          <p className="text-[10px] font-black text-outline uppercase tracking-[0.2em] mb-2">Cintura</p>
          <div className="flex items-baseline gap-2">
            <span className="font-headline text-4xl font-black italic">{latestLog?.measurements.waist || '--'}</span>
            <span className="text-xs font-bold text-on-surface-variant">CM</span>
          </div>
          <p className="text-[10px] font-bold text-outline mt-2 tracking-widest uppercase italic">Tendencia baja</p>
        </div>
      </div>

      {/* Chart Section */}
      <section className="bg-surface-container-high rounded-[40px] p-8 border border-outline-variant/5 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <span className="material-symbols-outlined text-9xl">show_chart</span>
        </div>
        <div className="flex justify-between items-center mb-8">
          <h3 className="text-[10px] font-black tracking-[0.3em] uppercase">Evolución de Peso</h3>
          <div className="flex gap-2">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-secondary" />
              <span className="text-[8px] font-bold uppercase text-outline">Peso</span>
            </div>
          </div>
        </div>
        
        <div className="h-[200px] w-full relative">
          <svg width="100%" height="100%" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none" className="overflow-visible">
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#CCFF00" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#CCFF00" stopOpacity="0" />
              </linearGradient>
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Grid lines */}
            {[0, 1, 2, 3].map(i => (
              <line 
                key={i}
                x1={paddingX} 
                y1={paddingY + i * (chartHeight - 2 * paddingY) / 3} 
                x2={chartWidth - paddingX} 
                y2={paddingY + i * (chartHeight - 2 * paddingY) / 3} 
                stroke="currentColor" 
                strokeOpacity="0.05" 
                strokeDasharray="4 4"
              />
            ))}
            
            {/* Area */}
            <path d={areaPath} fill="url(#chartGradient)" />
            
            {/* The Line */}
            <path
              d={linePath}
              fill="none"
              stroke="#CCFF00"
              strokeWidth="4"
              strokeLinecap="round"
              filter="url(#glow)"
              className="drop-shadow-[0_0_12px_rgba(204,255,0,0.3)]"
            />

            {/* Dots and Labels */}
            {coords.map((point, i) => (
              <g key={i} className="group/point">
                <circle 
                  cx={point.x} cy={point.y} r="6" 
                  fill="#121212" 
                  stroke="#CCFF00" 
                  strokeWidth="3"
                />
                <text 
                  x={point.x} y={point.y - 15} 
                  textAnchor="middle" 
                  className="fill-secondary text-[10px] font-black italic opacity-0 group-hover/point:opacity-100 transition-opacity"
                >
                  {sortedLogs[i].weight}
                </text>
              </g>
            ))}
          </svg>
        </div>

        <div className="flex justify-between mt-6 px-4">
          {sortedLogs.map(log => (
            <div key={log.id} className="flex flex-col items-center gap-1">
              <span className="text-[8px] font-black text-outline uppercase tracking-widest">
                {formatKineticDate(log.date, { short: true }).split(' ')[0]}
              </span>
              <span className="text-[8px] font-bold text-on-surface-variant uppercase">
                {formatKineticDate(log.date, { short: true }).split(' ')[1]}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Measurements Details */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black tracking-[0.3em] uppercase ml-2 text-on-surface-variant">Medidas Recientes</h3>
        <div className="bg-surface-container-low rounded-3xl p-6 border border-outline-variant/10 grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1 py-2 border-b border-outline-variant/10">
            <span className="text-[9px] font-bold uppercase tracking-widest text-outline italic">Pecho</span>
            <span className="font-headline font-black text-xl">{latestLog?.measurements.chest || '--'} cm</span>
          </div>
          <div className="flex flex-col gap-1 py-2 border-b border-outline-variant/10">
            <span className="text-[9px] font-bold uppercase tracking-widest text-outline italic">Cadera</span>
            <span className="font-headline font-black text-xl">{latestLog?.measurements.hips || '--'} cm</span>
          </div>
          <div className="flex flex-col gap-1 py-2 border-b border-outline-variant/10">
            <span className="text-[9px] font-bold uppercase tracking-widest text-outline italic">Cintura</span>
            <span className="font-headline font-black text-xl">{latestLog?.measurements.waist || '--'} cm</span>
          </div>
          <div className="flex flex-col gap-1 py-2 border-b border-outline-variant/10">
            <span className="text-[9px] font-bold uppercase tracking-widest text-secondary italic">% Grasa</span>
            <span className="font-headline font-black text-xl text-secondary">{latestLog?.measurements.bodyFat || '--'} %</span>
          </div>
          <div className="flex flex-col gap-1 py-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-outline italic">Brazos</span>
            <span className="font-headline font-black text-xl">{latestLog?.measurements.arms || '--'} cm</span>
          </div>
          <div className="flex flex-col gap-1 py-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-outline italic">Piernas</span>
            <span className="font-headline font-black text-xl">{latestLog?.measurements.legs || '--'} cm</span>
          </div>
          <div className="flex flex-col gap-1 py-2 col-span-2 items-center text-center">
            <span className="text-[9px] font-bold uppercase tracking-widest text-outline italic">Pantorrillas</span>
            <span className="font-headline font-black text-xl">{latestLog?.measurements.calves || '--'} cm</span>
          </div>
        </div>
      </section>

      {/* Photos Grid */}
      <section className="space-y-4">
        <h3 className="text-[10px] font-black tracking-[0.3em] uppercase ml-2 text-on-surface-variant">Gelería de Progreso</h3>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
          {logs.flatMap(l => l.photos).map((photo, i) => (
            <div key={i} className="aspect-square rounded-2xl overflow-hidden border border-outline-variant/10 shadow-md group relative hover:scale-105 transition-transform duration-300">
              <img src={photo} alt={`Progreso ${i}`} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
            </div>
          ))}
          <button 
            onClick={() => setIsAdding(true)}
            className="aspect-square rounded-2xl bg-surface-container-high border-2 border-dashed border-outline-variant/20 flex flex-col items-center justify-center gap-1.5 text-outline hover:text-secondary hover:border-secondary/40 transition-all active:scale-[0.98] group"
          >
            <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">add_a_photo</span>
            <span className="text-[7px] font-black uppercase tracking-widest text-center px-1">Nueva Foto</span>
          </button>
        </div>
      </section>

      {/* Add Log Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-50 flex items-end justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAdding(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-lg bg-surface-container-high rounded-t-[40px] shadow-2xl p-8 max-h-[90vh] overflow-y-auto"
            >
              <div className="w-12 h-1.5 bg-outline-variant/20 rounded-full mx-auto mb-8" />
              <h2 className="font-headline text-3xl font-black tracking-tight mb-8">NUEVA ENTRADA</h2>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-1">Peso (kg)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    className="w-full bg-surface-container-low border-none rounded-2xl py-5 px-6 font-headline font-black text-2xl focus:ring-2 focus:ring-secondary transition-all"
                    onChange={(e) => setNewLog({ ...newLog, weight: parseFloat(e.target.value) })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-widest text-secondary ml-1">% Grasa Corporal</label>
                    <input 
                      type="number" 
                      className="w-full bg-surface-container-low border border-secondary/20 rounded-xl py-3 px-4 text-center font-bold text-secondary focus:ring-1 focus:ring-secondary"
                      onChange={(e) => setNewLog({ ...newLog, bodyFat: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-widest text-outline ml-1">Cintura (cm)</label>
                    <input 
                      type="number" 
                      className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-center font-bold"
                      onChange={(e) => setNewLog({ ...newLog, waist: parseFloat(e.target.value) })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-widest text-outline ml-1">Pecho (cm)</label>
                    <input 
                      type="number" 
                      className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-center font-bold"
                      onChange={(e) => setNewLog({ ...newLog, chest: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-widest text-outline ml-1">Cadera (cm)</label>
                    <input 
                      type="number" 
                      className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-center font-bold"
                      onChange={(e) => setNewLog({ ...newLog, hips: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-widest text-outline ml-1">Brazos (cm)</label>
                    <input 
                      type="number" 
                      className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-center font-bold"
                      onChange={(e) => setNewLog({ ...newLog, arms: parseFloat(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase tracking-widest text-outline ml-1">Piernas (cm)</label>
                    <input 
                      type="number" 
                      className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-center font-bold"
                      onChange={(e) => setNewLog({ ...newLog, legs: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2 col-span-2">
                    <label className="text-[8px] font-black uppercase tracking-widest text-outline ml-1">Pantorrillas (cm)</label>
                    <input 
                      type="number" 
                      className="w-full bg-surface-container-low border-none rounded-xl py-3 px-4 text-center font-bold"
                      onChange={(e) => setNewLog({ ...newLog, calves: parseFloat(e.target.value) })}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-outline ml-1">Fotos de Hoy</label>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {newLog.photos.map((photo, i) => (
                      <img key={i} src={photo.preview} className="w-20 h-20 object-cover rounded-xl" />
                    ))}
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-20 h-20 rounded-xl bg-surface-container-low border-2 border-dashed border-outline-variant/20 flex items-center justify-center text-outline"
                    >
                      <span className="material-symbols-outlined">add_a_photo</span>
                    </button>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={handlePhotoUpload}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleSubmit}
                  disabled={isUploading}
                  className="w-full kinetic-gradient py-6 rounded-2xl font-headline font-black text-on-primary-container tracking-[0.2em] uppercase shadow-2xl shadow-primary/20 active:scale-[0.98] transition-transform text-lg mt-8 disabled:opacity-50 disabled:active:scale-100"
                >
                  {isUploading ? 'Subiendo Fotografía...' : 'Guardar Progreso'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
