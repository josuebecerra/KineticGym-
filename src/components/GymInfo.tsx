import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GymInfo as GymInfoType, GymSchedule, NewsItem, UserProfile, MembershipPlan } from '../types';
import { updateGymInfo } from '../services/db';
import { formatKineticDate, toKineticISO } from '../utils/date';
import { DialogConfig } from './Dialog';

interface GymInfoProps {
  info: GymInfoType;
  userProfile?: UserProfile | null;
  onBack: () => void;
  onShowDialog: (config: Omit<DialogConfig, 'isOpen'>) => void;
}

export const GymInfo: React.FC<GymInfoProps> = ({ info, userProfile, onBack, onShowDialog }) => {
  const isAdmin = userProfile?.role === 'admin';
  const [activeTab, setActiveTab] = useState<'info' | 'news' | 'plans'>('info');
  const [isEditingSchedule, setIsEditingSchedule] = useState(false);
  const [isAddingNews, setIsAddingNews] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState<MembershipPlan | null>(null);
  const [editedSchedules, setEditedSchedules] = useState<GymSchedule[]>([]);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  const displayPlans = info.membershipPlans && info.membershipPlans.length > 0 
    ? info.membershipPlans 
    : [
        { id: '1month', name: 'Mensual', price: '40', description: 'Acceso total por 30 días' },
        { id: '6months', name: 'Semestral', price: '200', description: '¡Ahorra 15%! Acceso por 180 días' },
        { id: '1year', name: 'Anual', price: '350', description: '¡Mejor Valor! Acceso ilimitado por 365 días' }
      ] as MembershipPlan[];

  const [newNews, setNewNews] = useState<Partial<NewsItem>>({
    title: '',
    content: '',
    type: 'info'
  });

  const handleOpenScheduleEditor = () => {
    const days = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    let newSchedules: GymSchedule[] = [];
    
    if (info.schedules.length < 7) {
      newSchedules = days.map(dayName => {
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
    try {
      await updateGymInfo({ schedules: editedSchedules });
      setIsEditingSchedule(false);
      onShowDialog({
        type: 'success',
        title: 'HORARIO ACTUALIZADO',
        message: 'Los cambios se han guardado correctamente.',
        confirmText: 'ENTENDIDO'
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNews.title || !newNews.content) return;

    const item: NewsItem = {
      id: crypto.randomUUID(),
      title: newNews.title,
      content: newNews.content,
      type: (newNews.type as any) || 'info',
      date: toKineticISO()
    };

    try {
      await updateGymInfo({ news: [item, ...info.news] });
      setNewNews({ title: '', content: '', type: 'info' });
      setIsAddingNews(false);
      onShowDialog({
        type: 'success',
        title: 'NOTICIA PUBLICADA',
        message: 'La noticia ya está visible.',
        confirmText: 'GENIAL'
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteNews = async (id: string) => {
    try {
      await updateGymInfo({ news: info.news.filter(n => n.id !== id) });
    } catch (error) {
      console.error(error);
    }
  };

  const handleUpdatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditingPlan) return;

    const updatedPlans = (info.membershipPlans || []).map(p => 
      p.id === isEditingPlan.id ? isEditingPlan : p
    );

    try {
      await updateGymInfo({ membershipPlans: updatedPlans });
      setIsEditingPlan(null);
      onShowDialog({
        type: 'success',
        title: 'PLAN ACTUALIZADO',
        message: `El ${isEditingPlan.name} ha sido actualizado con éxito.`,
        confirmText: 'OK'
      });
    } catch (err) {
      console.error(err);
    }
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
    <div className="px-6 pt-4 pb-24 min-h-screen">
      <header className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack} 
          className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-secondary shrink-0 transition-colors shadow-lg"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <span className="text-secondary font-headline font-bold uppercase tracking-[0.3em] text-[10px]">Portal del Socio</span>
          <h1 className="font-headline text-4xl font-black tracking-tight mt-1 uppercase italic leading-none text-white">KINETIC HUB</h1>
        </div>
      </header>

      {/* Internal Tabs */}
      <div className="flex bg-surface-container-high/50 p-1.5 rounded-[24px] gap-1 mb-10 overflow-x-auto no-scrollbar">
        {[
          { id: 'info', label: 'Horarios', icon: 'schedule' },
          { id: 'news', label: 'Noticias', icon: 'news' },
          { id: 'plans', label: 'Planes', icon: 'payments' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[100px] flex items-center justify-center gap-2 py-3 rounded-[18px] text-[9px] font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id 
                ? 'bg-secondary text-black shadow-lg' 
                : 'text-outline hover:text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'info' && (
            <section className="space-y-12">
              <div>
                <div className="flex justify-between items-end mb-6">
                  <h2 className="font-headline font-black text-xl uppercase italic tracking-tighter text-white">Horarios de Operación</h2>
                  {isAdmin && (
                    <button onClick={handleOpenScheduleEditor} className="text-[10px] font-black uppercase text-secondary hover:underline">
                      Gestionar Horarios
                    </button>
                  )}
                </div>
                <div className="bg-surface-container-low rounded-[32px] p-6 border border-outline-variant/10 shadow-sm relative overflow-hidden">
                  <div className="space-y-4 relative z-10">
                    {(info?.schedules || []).map((s, i) => (
                      <div key={i} className="flex justify-between items-center pb-3 border-b border-outline-variant/5 last:border-0 last:pb-0">
                        <span className="font-headline font-bold text-[10px] uppercase tracking-[0.2em] text-outline">{s.day}</span>
                        <div className="flex items-center gap-3">
                          <span className="font-headline font-black text-sm text-primary-container">{s.open}</span>
                          <div className="w-1 h-1 rounded-full bg-outline-variant/30" />
                          <span className="font-headline font-black text-sm text-primary-container">{s.close}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/5 -translate-y-1/2 translate-x-1/2 rounded-full blur-2xl" />
                </div>
              </div>

              {isAdmin && (
                <div className="pt-12 border-t border-outline-variant/10">
                  <h3 className="text-[10px] font-black tracking-[0.3em] uppercase text-outline mb-1">Configuración</h3>
                  <h4 className="font-headline text-2xl font-black uppercase text-white tracking-tight italic mb-6">Ajustes de Sesión</h4>
                  <div className="bg-surface-container-high rounded-[40px] p-8 border border-outline-variant/10 shadow-2xl space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-outline uppercase tracking-widest flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">timer</span> Duración (min)
                        </label>
                        <input 
                          type="number" 
                          defaultValue={info.sessionTimeoutMinutes || 30}
                          onBlur={async (e) => {
                            const val = parseInt(e.target.value);
                            if (val > 0) await updateGymInfo({ sessionTimeoutMinutes: val });
                          }}
                          className="w-full bg-surface-container-low rounded-2xl py-4 px-6 font-headline font-bold text-xl text-white shadow-inner"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-outline uppercase tracking-widest flex items-center gap-2">
                          <span className="material-symbols-outlined text-sm">notification_important</span> Aviso (min)
                        </label>
                        <input 
                          type="number" 
                          defaultValue={info.sessionWarningMinutes || 5}
                          onBlur={async (e) => {
                            const val = parseInt(e.target.value);
                            if (val > 0) await updateGymInfo({ sessionWarningMinutes: val });
                          }}
                          className="w-full bg-surface-container-low rounded-2xl py-4 px-6 font-headline font-bold text-xl text-white shadow-inner"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'news' && (
            <section>
              <div className="flex justify-between items-end mb-6">
                <h2 className="font-headline font-black text-xl uppercase italic tracking-tighter text-white">Últimas Noticias</h2>
                {isAdmin && (
                  <button 
                    onClick={() => setIsAddingNews(true)}
                    className="flex items-center gap-2 bg-secondary text-on-secondary px-4 py-2 rounded-full font-headline font-black text-[10px] uppercase tracking-widest active:scale-[0.98] transition-transform shadow-lg shadow-secondary/20"
                  >
                    <span className="material-symbols-outlined text-[14px]">add</span> Publicar
                  </button>
                )}
              </div>
              <div className="space-y-6">
                {(info?.news || []).map((item) => (
                  <article key={item.id} className="relative bg-surface-container rounded-[32px] overflow-hidden border border-outline-variant/10 group transition-all">
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <span className={`px-3 py-1 rounded-full font-headline font-black text-[8px] uppercase tracking-widest ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                        <div className="flex gap-4">
                          <span className="text-[9px] font-bold text-outline uppercase">{formatKineticDate(item.date)}</span>
                          {isAdmin && (
                            <button onClick={() => setItemToDelete(item.id)} className="text-outline hover:text-error transition-all hover:scale-110">
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                          )}
                        </div>
                      </div>
                      <h3 className="font-headline font-black text-2xl text-white uppercase mb-2 leading-tight tracking-tight">{item.title}</h3>
                      <p className="text-sm text-on-surface-variant leading-relaxed font-body">{item.content}</p>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}

          {activeTab === 'plans' && (
            <section className="space-y-8">
              <div className="px-2">
                <h2 className="font-headline font-black text-xl uppercase italic tracking-tighter mb-2 text-white">Membresías Kinetic</h2>
                <p className="text-[10px] font-bold text-outline-variant uppercase tracking-widest leading-relaxed">
                  Elige tu plan. Precios gestionados por administración.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {displayPlans.map((plan) => (
                  <div key={plan.id} className="bg-surface-container-low rounded-[32px] p-6 border border-outline-variant/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 relative overflow-hidden group hover:border-secondary/20 shadow-sm transition-all">
                    <div className="flex gap-5 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-surface-container-highest flex items-center justify-center text-secondary">
                        <span className="material-symbols-outlined text-2xl font-black">
                          {plan.id === '1month' ? 'calendar_month' : plan.id === '6months' ? 'verified' : 'workspace_premium'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-headline text-2xl font-black uppercase italic leading-none text-white mb-2">{plan.name}</h3>
                        <p className="text-[10px] font-bold text-outline uppercase tracking-widest">{plan.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:items-end gap-3 w-full sm:w-auto relative z-10">
                      <span className="font-headline text-3xl font-black text-secondary italic tracking-tighter">${plan.price}</span>
                      {isAdmin && (
                        <button onClick={() => setIsEditingPlan(plan)} className="text-[9px] font-black uppercase text-outline hover:text-white flex items-center gap-2 px-3 py-1.5 bg-surface-container-high rounded-full border border-outline-variant/10 transition-all">
                          <span className="material-symbols-outlined text-sm">edit</span> Editar
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Modals */}
      <AnimatePresence>
        {isEditingSchedule && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditingSchedule(false)} className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-lg bg-surface-container-highest rounded-[40px] p-8 max-h-[90vh] overflow-y-auto">
              <h2 className="font-headline font-black text-3xl uppercase italic mb-6 text-white text-center">Editar Horarios</h2>
              <form onSubmit={handleUpdateSchedule} className="space-y-4">
                {editedSchedules.map((s, idx) => (
                  <div key={s.day} className="flex items-center gap-4 bg-surface-container-low p-4 rounded-2xl">
                    <span className="w-24 font-headline font-bold text-[10px] uppercase text-outline">{s.day}</span>
                    <input type="text" value={s.open} onChange={e => { const n = [...editedSchedules]; n[idx].open = e.target.value; setEditedSchedules(n); }} className="w-full bg-background rounded-xl px-3 py-2 text-center font-bold text-xs" />
                    <span className="text-[10px] font-black opacity-30">AL</span>
                    <input type="text" value={s.close} onChange={e => { const n = [...editedSchedules]; n[idx].close = e.target.value; setEditedSchedules(n); }} className="w-full bg-background rounded-xl px-3 py-2 text-center font-bold text-xs" />
                  </div>
                ))}
                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setIsEditingSchedule(false)} className="flex-1 py-4 font-headline font-black text-[10px] uppercase text-outline bg-surface-container rounded-2xl">Cancelar</button>
                  <button type="submit" className="flex-1 py-4 font-headline font-black text-[10px] uppercase text-black bg-secondary rounded-2xl">Guardar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isAddingNews && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6 text-on-surface">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddingNews(false)} className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-surface-container-highest rounded-[40px] p-8 shadow-2xl">
              <h2 className="font-headline font-black text-3xl uppercase italic mb-6 text-white text-center">Nueva Noticia</h2>
              <form onSubmit={handleAddNews} className="space-y-6">
                <div>
                  <label className="text-[10px] font-black uppercase text-outline block mb-2">Título</label>
                  <input type="text" value={newNews.title} onChange={e => setNewNews({...newNews, title: e.target.value})} className="w-full bg-surface-container-low rounded-2xl px-4 py-3 text-white font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-outline block mb-2">Categoría</label>
                  <div className="flex gap-2">
                    {['info', 'promo', 'alert', 'event'].map(type => (
                      <button key={type} type="button" onClick={() => setNewNews({...newNews, type: type as any})} className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase ${newNews.type === type ? getTypeColor(type) : 'bg-surface-container-low text-outline'}`}>{type}</button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-outline block mb-2">Contenido</label>
                  <textarea value={newNews.content} onChange={e => setNewNews({...newNews, content: e.target.value})} rows={4} className="w-full bg-surface-container-low rounded-2xl px-4 py-3 text-white text-sm" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsAddingNews(false)} className="flex-1 py-4 font-headline font-black text-[10px] uppercase text-outline bg-surface-container rounded-2xl">Cerrar</button>
                  <button type="submit" className="flex-1 py-4 font-headline font-black text-[10px] uppercase text-black bg-secondary rounded-2xl">Publicar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isEditingPlan && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEditingPlan(null)} className="absolute inset-0 bg-background/90 backdrop-blur-sm" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-md bg-surface-container-highest rounded-[40px] p-8">
              <h2 className="font-headline font-black text-3xl uppercase italic mb-6 text-white text-center">Gestionar Precio</h2>
              <form onSubmit={handleUpdatePlan} className="space-y-6 text-white">
                <div>
                  <label className="text-[10px] font-black uppercase text-outline mb-2 block">Nombre</label>
                  <input type="text" value={isEditingPlan.name} onChange={e => setIsEditingPlan({...isEditingPlan, name: e.target.value})} className="w-full bg-surface-container-low rounded-2xl px-4 py-3 font-bold" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-outline mb-2 block">Precio ($)</label>
                  <input type="text" value={isEditingPlan.price} onChange={e => setIsEditingPlan({...isEditingPlan, price: e.target.value})} className="w-full bg-surface-container-low rounded-2xl px-4 py-3 font-black text-2xl text-secondary" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-outline mb-2 block">Descripción</label>
                  <textarea value={isEditingPlan.description} onChange={e => setIsEditingPlan({...isEditingPlan, description: e.target.value})} rows={3} className="w-full bg-surface-container-low rounded-2xl px-4 py-3 text-sm" />
                </div>
                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsEditingPlan(null)} className="flex-1 py-4 font-headline font-black text-[10px] uppercase text-outline bg-surface-container rounded-2xl">Cerrar</button>
                  <button type="submit" className="flex-1 py-4 font-headline font-black text-[10px] uppercase text-black bg-secondary rounded-2xl">Guardar</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {itemToDelete && (
          <div className="fixed inset-0 z-[600] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setItemToDelete(null)} className="absolute inset-0 bg-background/95 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="relative w-full max-w-sm bg-surface-container-high p-8 rounded-[40px] text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-4xl">delete_forever</span>
              </div>
              <h3 className="font-headline text-2xl font-black uppercase italic text-white">¿Eliminar Noticia?</h3>
              <div className="flex gap-3">
                <button onClick={() => setItemToDelete(null)} className="flex-1 py-4 rounded-xl bg-surface-container text-[10px] font-black uppercase text-outline">Volver</button>
                <button onClick={() => { handleDeleteNews(itemToDelete); setItemToDelete(null); }} className="flex-1 py-4 rounded-xl bg-error text-[10px] font-black uppercase text-white">Eliminar</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
