import React, { useState } from 'react';
import { UserProfile } from '../types';

interface LeaderboardProps {
  users: UserProfile[];
  currentUserUid?: string;
  onBack: () => void;
}

type Metric = 'volume' | 'consistency';

export const Leaderboard: React.FC<LeaderboardProps> = ({ users, currentUserUid, onBack }) => {
  const [activeMetric, setActiveMetric] = useState<Metric>('volume');

  // Simple loading state
  if (!users) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <p className="text-secondary font-headline">Cargando...</p>
      </div>
    );
  }

  // Robust calculation
  let processedData: any[] = [];
  try {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    processedData = users.map(user => {
      if (!user) return null;
      
      const history = Array.isArray(user.history) ? user.history : [];
      const userEmail = typeof user.email === 'string' ? user.email : 'atleta@kinetic.app';
      const userName = typeof user.displayName === 'string' ? user.displayName : userEmail.split('@')[0];
      
      // Calculate Volume
      let totalVolume = 0;
      history.forEach(session => {
        if (!session || !Array.isArray(session.exercises)) return;
        session.exercises.forEach(ex => {
          if (!ex || !Array.isArray(ex.sets)) return;
          ex.sets.forEach(s => {
            if (s && s.completed) {
              const w = Number(s.weight) || 0;
              const r = Number(s.reps) || 0;
              totalVolume += (w * r);
            }
          });
        });
      });

      // Calculate Consistency
      let recentWorkouts = 0;
      history.forEach(session => {
        if (session && session.date) {
            // Attempt to parse date safely
            const d = new Date(session.date);
            if (!isNaN(d.getTime()) && d >= thirtyDaysAgo) {
                recentWorkouts++;
            }
        }
      });

      return {
        uid: user.uid || `anon-${Math.random()}`,
        name: userName || 'Atleta',
        avatar: user.avatarUrl || '',
        volume: totalVolume,
        consistency: recentWorkouts,
      };
    }).filter(u => u !== null) as any[];

    // Sort
    processedData.sort((a, b) => {
        if (activeMetric === 'volume') return b.volume - a.volume;
        return b.consistency - a.consistency;
    });
  } catch (err) {
    console.error('Error processing leaderboard:', err);
  }

  if (processedData.length === 0 && users.length > 0) {
      return (
        <div className="px-6 py-20 text-center">
            <h2 className="text-2xl font-black text-secondary">ERROR AL PROCESAR DATOS</h2>
            <p className="text-outline mt-2 italic">Hay un error en el formato de los datos de los usuarios.</p>
            <button onClick={onBack} className="mt-8 bg-secondary text-on-secondary px-8 py-3 rounded-full font-bold uppercase">Cerrar</button>
        </div>
      );
  }

  const top3 = processedData.slice(0, 3);
  const theRest = processedData.slice(3);

  return (
    <div className="px-6 pt-4 pb-24 min-h-screen">
      {/* Header */}
      <header className="mb-8 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-secondary shrink-0 transition-colors shadow-lg"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <span className="text-secondary font-headline font-bold uppercase tracking-[0.3em] text-[10px]">Competición Global</span>
          <h1 className="font-headline text-4xl font-black tracking-tight mt-1 uppercase italic leading-none">Ranking</h1>
        </div>
      </header>

      {/* Metric Switcher */}
      <div className="bg-surface-container-high p-1.5 rounded-2xl flex gap-1 mb-12 border border-outline-variant/10 shadow-lg">
        {[
          { id: 'volume' as Metric, label: 'Kilos Totales', icon: 'fitness_center' },
          { id: 'consistency' as Metric, label: 'Constancia', icon: 'calendar_month' }
        ].map((m) => (
          <button
            key={m.id}
            onClick={() => setActiveMetric(m.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-headline font-bold text-[10px] uppercase tracking-widest transition-all ${
              activeMetric === m.id 
                ? 'bg-secondary text-on-secondary shadow-lg shadow-secondary/20' 
                : 'text-on-surface-variant hover:bg-surface-container'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">{m.icon}</span>
            {m.label}
          </button>
        ))}
      </div>

      {/* Podium Simplified */}
      <div className="flex justify-center items-end gap-2 mb-16 px-2 min-h-[180px]">
        {/* 2nd Place */}
        {top3[1] && (
          <div className="flex flex-col items-center gap-2 flex-1 max-w-[100px]">
            <img src={top3[1].avatar || `https://ui-avatars.com/api/?name=${top3[1].name}&background=1A1A1A&color=adaaaa`} className="w-12 h-12 rounded-full border-2 border-outline-variant shadow-xl object-cover" alt="" />
            <div className="text-center">
              <p className="font-headline font-black text-[9px] uppercase truncate w-full">{top3[1].name}</p>
              <p className="text-[9px] font-bold text-secondary">{top3[1][activeMetric]}</p>
            </div>
            <div className="w-full h-12 bg-surface-container-high rounded-t-xl flex items-center justify-center font-bold text-outline">2</div>
          </div>
        )}

        {/* 1st Place */}
        {top3[0] && (
          <div className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
            <span className="text-xl">👑</span>
            <img src={top3[0].avatar || `https://ui-avatars.com/api/?name=${top3[0].name}&background=ff7441&color=ffffff`} className="w-16 h-16 rounded-full border-4 border-secondary shadow-2xl object-cover scale-110" alt="" />
            <div className="text-center">
              <p className="font-headline font-black text-xs uppercase italic tracking-tighter truncate w-full">{top3[0].name}</p>
              <p className="text-[10px] font-black text-secondary leading-none mt-1">{top3[0][activeMetric]}</p>
            </div>
            <div className="w-full h-20 bg-surface-container-highest rounded-t-2xl shadow-xl flex items-center justify-center font-black text-secondary text-xl italic">1</div>
          </div>
        )}

        {/* 3rd Place */}
        {top3[2] && (
          <div className="flex flex-col items-center gap-2 flex-1 max-w-[100px]">
            <img src={top3[2].avatar || `https://ui-avatars.com/api/?name=${top3[2].name}&background=1A1A1A&color=767575`} className="w-10 h-10 rounded-full border-2 border-outline/30 shadow-xl object-cover" alt="" />
            <div className="text-center">
              <p className="font-headline font-black text-[9px] uppercase truncate w-full">{top3[2].name}</p>
              <p className="text-[9px] font-bold text-secondary">{top3[2][activeMetric]}</p>
            </div>
            <div className="w-full h-8 bg-surface-container rounded-t-lg flex items-center justify-center font-bold text-outline-variant">3</div>
          </div>
        )}
      </div>

      {/* List Simplified */}
      <div className="space-y-3">
        {processedData.map((athlete, index) => (
          <div
            key={athlete.uid}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
              athlete.uid === currentUserUid 
                ? 'bg-secondary/10 border-secondary' 
                : 'bg-surface-container-low border-outline-variant/10'
            }`}
          >
            <div className="w-8 font-headline font-black text-lg italic text-secondary">
              #{index + 1}
            </div>
            <img src={athlete.avatar || `https://ui-avatars.com/api/?name=${athlete.name}&background=262626&color=ffffff`} className="w-10 h-10 rounded-full border border-outline-variant/20 object-cover" alt="" />
            <div className="flex-1 min-w-0">
              <p className="font-headline font-bold text-sm leading-none uppercase truncate">{athlete.name} {athlete.uid === currentUserUid && <span className="text-[9px] text-secondary ml-1 shrink-0">(TÚ)</span>}</p>
              <p className="text-[9px] font-bold text-outline uppercase tracking-widest mt-1">Lv.{Math.floor(athlete.volume / 1000) + 1}</p>
            </div>
            <div className="text-right">
              <p className="font-headline font-black text-sm text-on-surface-variant italic leading-none">{athlete.volume.toLocaleString()}</p>
              <p className="text-[9px] font-black text-outline uppercase tracking-widest mt-1">{athlete.consistency} SES</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
