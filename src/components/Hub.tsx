import React from 'react';
import { motion } from 'motion/react';
import { Screen } from '../types';

interface HubProps {
  onNavigate: (screen: Screen) => void;
}

export const Hub: React.FC<HubProps> = ({ onNavigate }) => {
  const categories = [
    {
      id: 'ranking' as Screen,
      title: 'Ranking Global',
      subtitle: 'Compite con la comunidad',
      icon: 'trophy',
      color: 'text-secondary',
      bg: 'bg-secondary/10',
      description: 'Mira quién lidera el entrenamiento esta semana.'
    },
    {
      id: 'info' as Screen,
      title: 'Kinetic Hub',
      subtitle: 'Noticias y Horarios',
      icon: 'info',
      color: 'text-primary-container',
      bg: 'bg-primary-container/10',
      description: 'Mantente al tanto de lo que pasa en tu gimnasio.'
    },
    {
      id: 'ejercicios' as Screen,
      title: 'Biblioteca',
      subtitle: 'Base de datos de ejercicios',
      icon: 'library_books',
      color: 'text-outline',
      bg: 'bg-surface-container-highest',
      description: 'Aprende la técnica correcta de cada movimiento.'
    },
    {
      id: 'progreso' as Screen,
      title: 'Mi Progreso',
      subtitle: 'Fotos y medidas',
      icon: 'monitoring',
      color: 'text-secondary',
      bg: 'bg-secondary/10',
      description: 'Analiza tu evolución física y métricas.'
    }
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-6 pt-4 pb-24 space-y-8"
    >
      <section>
        <span className="font-label text-primary-container uppercase tracking-[0.3em] text-[10px] font-black">Explorar</span>
        <h1 className="font-headline text-4xl font-black tracking-tight mt-1 uppercase italic">CENTRO KINETIC</h1>
        <p className="text-on-surface-variant text-xs font-bold mt-2 uppercase tracking-wide opacity-70">Todo lo que necesitas fuera del entrenamiento.</p>
      </section>

      <div className="grid grid-cols-1 gap-4">
        {categories.map((cat, idx) => (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            onClick={() => onNavigate(cat.id)}
            className="group relative bg-surface-container rounded-[32px] overflow-hidden border border-outline-variant/10 p-6 flex items-center gap-6 text-left hover:bg-surface-container-low transition-all active:scale-[0.98]"
          >
            <div className={`relative z-10 w-16 h-16 rounded-[22px] ${cat.bg} flex items-center justify-center ${cat.color} shrink-0 group-hover:scale-110 transition-transform`}>
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>{cat.icon === 'trophy' ? 'leaderboard' : cat.icon}</span>
            </div>

            <div className="relative z-10 flex-1">
              <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 opacity-70 ${cat.color}`}>{cat.subtitle}</p>
              <h3 className="font-headline font-black text-2xl uppercase italic tracking-tight leading-none mb-2">{cat.title}</h3>
              <p className="text-[10px] font-bold text-on-surface-variant leading-relaxed uppercase tracking-wider opacity-60 line-clamp-1">{cat.description}</p>
            </div>

            <span className="material-symbols-outlined text-outline group-hover:text-primary-container transition-colors group-hover:translate-x-1 transition-transform">chevron_right</span>

            {/* Aesthetic Glow */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${cat.bg} -translate-y-1/2 translate-x-1/2 rounded-full blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />
          </motion.button>
        ))}
      </div>

      {/* Social Section */}
      <section className="pt-4">
        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 ml-4 text-on-surface-variant">Síguenos</h3>
        <div className="grid grid-cols-2 gap-4">
          <a 
            href="#" 
            className="bg-surface-container-high p-5 rounded-[28px] border border-outline-variant/10 flex flex-col items-center gap-2 active:scale-95 transition-transform group"
          >
            <span className="material-symbols-outlined text-secondary opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all text-3xl">share</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-outline">Instagram</span>
          </a>
          <a 
            href="#" 
            className="bg-surface-container-high p-5 rounded-[28px] border border-outline-variant/10 flex flex-col items-center gap-2 active:scale-95 transition-transform group"
          >
            <span className="material-symbols-outlined text-secondary opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all text-3xl">chat</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-outline">WhatsApp</span>
          </a>
        </div>
      </section>

      <div className="relative h-40 rounded-[40px] overflow-hidden mt-8 group flex items-center justify-center p-8 text-center">
        <img 
          src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?q=80&w=2670&auto=format&fit=crop" 
          className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-110 transition-transform duration-700" 
          alt="Gym energy" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="relative z-10">
          <p className="font-headline text-2xl font-black italic uppercase tracking-tighter text-on-surface leading-none">Más que un gimnasio.</p>
          <p className="text-[10px] font-bold text-secondary uppercase tracking-[0.2em] mt-2">Unete a la revolucion Kinetic</p>
        </div>
      </div>
    </motion.div>
  );
};
