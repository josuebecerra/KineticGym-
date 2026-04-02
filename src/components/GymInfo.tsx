import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GymInfo as GymInfoType, GymSchedule, NewsItem, UserProfile } from '../types';
import { updateGymInfo } from '../services/db';

interface GymInfoProps {
  info: GymInfoType;
  userProfile?: UserProfile | null;
  onBack: () => void;
}

export const GymInfo: React.FC<GymInfoProps> = ({ info, userProfile, onBack }) => {
  const isAdmin = userProfile?.role === 'admin';
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [isAddingNews, setIsAddingNews] = useState(false);
  const [editedSchedules, setEditedSchedules] = useState<GymSchedule[]>([]);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Modal State for News
  const [newNews, setNewNews] = useState<Partial<NewsItem>>({
    title: '',
    content: '',
    type: 'info'
  });

  const handleOpenScheduleEditor = () => {
    // If we have less than 7 days (e.g. old block style), convert to individual days for editing
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    let newSchedules: GymSchedule[] = [];
    
    if (info.schedules.length < 7) {
      newSchedules = days.map(dayName => {
        // Try to find if this day was part of a block
        const block = info.schedules.find(s => s.day.includes(dayName) || (dayName !== 'Sábado' && dayName !== 'Domingo' && s.day.includes('Lunes - Viernes')));
        return {
          day: dayName,
          open: block?.open || '05:00',
          close: block?.close || '22:00'
        };
      });
    } else {
      newSchedules = [...info.schedules];
    }
    
    setEditedSchedules(newSchedules);
    setIsEditingSchedule(true);
  };

  const handleUpdateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateGymInfo({
      schedules: editedSchedules
    });
    setIsEditingSchedule(false);
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNews.title || !newNews.content) return;

    const item: NewsItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: newNews.title,
      content: newNews.content,
      type: newNews.type as any,
      date: new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
    };

    await updateGymInfo({
      news: [item, ...info.news]
    });
    
    setNewNews({ title: '', content: '', type: 'info' });
    setIsAddingNews(false);
  };

  const handleDeleteNews = async (id: string) => {
    await updateGymInfo({
      news: info.news.filter(n => n.id !== id)
    });
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'alert': return 'bg-error text-on-error';
      case 'promo': return 'bg-primary-container text-on-primary-container';
      case 'event': return 'bg-secondary text-on-secondary';
      default: return 'bg-surface-container-highest text-on-surface';
    }
  };

  return (
    <div 
      className="px-6 pt-4 pb-24 min-h-screen"
    >
      {/* Header */}
      <header className="flex items-center gap-4 mb-10">
        <button 
          onClick={onBack} 
          className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-secondary shrink-0 transition-colors shadow-lg"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <span className="text-secondary font-headline font-bold uppercase tracking-[0.3em] text-[10px]">Portal del Socio</span>
          <h1 className="font-headline text-4xl font-black tracking-tight mt-1 uppercase italic leading-none">KINETIC HUB</h1>
        </div>
      </header>

      {/* Schedules Section */}
      <section className="mb-12">
        <div className="flex justify-between items-end mb-6">
          <h2 className="font-headline font-black text-xl uppercase italic tracking-tighter">Horarios de Operación</h2>
          {isAdmin && (
            <button 
              onClick={handleOpenScheduleEditor}
              className="text-[10px] font-black uppercase text-secondary hover:underline"
            >
              Gestionar Horarios
            </button>
          )}
        </div>
        <div className="bg-surface-container-low rounded-[32px] p-6 border border-outline-variant/10 shadow-sm relative overflow-hidden">
          <div className="space-y-4 relative z-10">
            {(info?.schedules || []).map((s, i) => (
              <div 
                key={i} 
                className="flex justify-between items-center pb-3 border-b border-outline-variant/5 last:border-0 last:pb-0"
              >
                <span className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-outline">{s.day}</span>
                <div className="flex items-center gap-3">
                  <span className="font-headline font-black text-sm text-primary-container">{s.open}</span>
                  <div className="w-1 h-1 rounded-full bg-outline-variant/30" />
                  <span className="font-headline font-black text-sm text-primary-container">{s.close}</span>
                </div>
              </div>
            ))}
          </div>
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/5 -translate-y-1/2 translate-x-1/2 rounded-full blur-2xl" />
        </div>
      </section>

      {/* News Feed */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="font-headline font-black text-xl uppercase italic tracking-tighter">Últimas Noticias</h2>
          {isAdmin && (
            <button 
              onClick={() => setIsAddingNews(true)}
              className="flex items-center gap-2 bg-secondary text-on-secondary px-4 py-2 rounded-full font-headline font-black text-[10px] uppercase tracking-widest active:scale-[0.98] transition-transform shadow-lg shadow-secondary/20"
            >
              <span className="material-symbols-outlined text-[14px]">add</span>
              Publicar
            </button>
          )}
        </div>

        <div className="space-y-6">
          {(info?.news || []).map((item) => (
            <article 
              key={item.id}
              className="relative bg-surface-container rounded-[32px] overflow-hidden border border-outline-variant/10 group active:scale-[0.98] transition-transform"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full font-headline font-black text-[8px] uppercase tracking-widest ${getTypeColor(item.type)}`}>
                    {item.type}
                  </span>
                  <div className="flex gap-4">
                    <span className="text-[9px] font-bold text-outline uppercase">{item.date}</span>
                    {isAdmin && (
                      <button 
                        onClick={() => setItemToDelete(item.id)}
                        className="w-10 h-10 rounded-full flex items-center justify-center text-outline hover:text-error hover:bg-error/5 transition-all active:scale-90"
                      >
                        <span className="material-symbols-outlined text-lg">delete</span>
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="font-headline font-black text-2xl text-on-surface uppercase mb-2 group-hover:text-primary-container transition-colors tracking-tight">
                  {item.title}
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed font-body">
                  {item.content}
                </p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/5 -translate-y-1/2 translate-x-1/2 rounded-full blur-2xl group-hover:bg-secondary/10 transition-colors" />
            </article>
          ))}
        </div>
      </section>

      {/* Editing Schedules Modal */}
      {isEditingSchedule && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div 
            onClick={() => setIsEditingSchedule(false)}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <div 
            className="relative w-full max-w-lg bg-surface-container-highest rounded-[40px] p-8 shadow-2xl border border-outline-variant/20 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="font-headline font-black text-3xl uppercase italic mb-6">Gestionar Horarios</h2>
            <form onSubmit={handleUpdateSchedule} className="space-y-4">
              {editedSchedules.map((s, idx) => (
                <div key={s.day} className="flex items-center gap-4 bg-surface-container-low p-4 rounded-2xl border border-outline-variant/5">
                  <span className="w-24 font-headline font-bold text-[10px] uppercase tracking-widest text-outline">{s.day}</span>
                  <div className="flex-1 flex gap-2">
                    <input 
                      type="text" 
                      value={s.open}
                      onChange={(e) => {
                        const newScheds = [...editedSchedules];
                        newScheds[idx].open = e.target.value;
                        setEditedSchedules(newScheds);
                      }}
                      className="w-full bg-background rounded-xl px-3 py-2 border border-outline-variant/10 text-on-surface focus:border-secondary outline-none transition-colors font-headline font-bold text-xs text-center" 
                      placeholder="05:00"
                    />
                    <span className="flex items-center text-[10px] font-black text-outline-variant">A</span>
                    <input 
                      type="text" 
                      value={s.close}
                      onChange={(e) => {
                        const newScheds = [...editedSchedules];
                        newScheds[idx].close = e.target.value;
                        setEditedSchedules(newScheds);
                      }}
                      className="w-full bg-background rounded-xl px-3 py-2 border border-outline-variant/10 text-on-surface focus:border-secondary outline-none transition-colors font-headline font-bold text-xs text-center" 
                      placeholder="22:00"
                    />
                  </div>
                </div>
              ))}
              
              <div className="flex gap-4 pt-4 sticky bottom-0 bg-surface-container-highest mt-4">
                <button 
                  type="button" 
                  onClick={() => setIsEditingSchedule(false)}
                  className="flex-1 py-4 font-headline font-black text-[10px] uppercase tracking-widest text-outline bg-surface-container rounded-2xl hover:bg-surface-container-high"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 font-headline font-black text-[10px] uppercase tracking-widest text-on-secondary bg-secondary rounded-2xl shadow-lg shadow-secondary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all font-bold"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adding News Modal */}
      {isAddingNews && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div 
            onClick={() => setIsAddingNews(false)}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <div 
            className="relative w-full max-w-md bg-surface-container-highest rounded-[40px] p-8 shadow-2xl border border-outline-variant/20"
          >
              <h2 className="font-headline font-black text-3xl uppercase italic mb-6">Nueva Noticia</h2>
              <form onSubmit={handleAddNews} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline block mb-2">Título</label>
                  <input 
                    type="text" 
                    value={newNews.title}
                    onChange={(e) => setNewNews({...newNews, title: e.target.value})}
                    className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10 text-on-surface focus:border-secondary outline-none transition-colors font-headline font-bold text-sm" 
                    placeholder="Ej. Nuevo horario nocturno"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline block mb-2">Categoría</label>
                  <div className="flex gap-2">
                    {['info', 'promo', 'alert', 'event'].map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setNewNews({...newNews, type: type as any})}
                        className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${newNews.type === type ? getTypeColor(type) : 'bg-surface-container-low text-outline'}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-outline block mb-2">Contenido</label>
                  <textarea 
                    value={newNews.content}
                    onChange={(e) => setNewNews({...newNews, content: e.target.value})}
                    rows={4}
                    className="w-full bg-surface-container-low rounded-2xl px-4 py-3 border border-outline-variant/10 text-on-surface focus:border-secondary outline-none transition-colors font-body text-sm" 
                    placeholder="Escribe el mensaje para la comunidad..."
                  />
                </div>
                <div className="flex gap-4 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setIsAddingNews(false)}
                    className="flex-1 py-4 font-headline font-black text-[10px] uppercase tracking-widest text-outline bg-surface-container rounded-2xl hover:bg-surface-container-high"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-4 font-headline font-black text-[10px] uppercase tracking-widest text-on-secondary bg-secondary rounded-2xl shadow-lg shadow-secondary/20 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                  >
                    Publicar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {itemToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setItemToDelete(null)}
              className="absolute inset-0 bg-background/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-surface-container-high p-8 rounded-[40px] border border-outline-variant/10 shadow-2xl flex flex-col items-center text-center gap-6"
            >
              <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center">
                <span className="material-symbols-outlined text-4xl">delete_forever</span>
              </div>
              
              <div>
                <h3 className="font-headline text-2xl font-black uppercase italic leading-tight mb-2">
                  ¿ELIMINAR NOTICIA?
                </h3>
                <p className="text-on-surface-variant text-xs font-bold leading-relaxed px-4">
                  Esta acción eliminará permanentemente esta publicación. No se puede deshacer.
                </p>
              </div>

              <div className="w-full flex gap-3">
                <button 
                  onClick={() => setItemToDelete(null)}
                  className="flex-1 py-4 rounded-xl bg-surface-container-high border border-outline-variant/20 font-headline font-black text-[10px] uppercase tracking-widest text-outline hover:text-on-surface transition-colors"
                >
                  Regresar
                </button>
                <button 
                  onClick={() => {
                    handleDeleteNews(itemToDelete);
                    setItemToDelete(null);
                  }}
                  className="flex-1 py-4 rounded-xl bg-error font-headline font-black text-[10px] uppercase tracking-widest text-white shadow-xl shadow-error/20 active:scale-[0.98] transition-transform"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
