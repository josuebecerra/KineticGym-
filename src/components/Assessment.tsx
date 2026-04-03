import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AssessmentData } from '../types';
import { saveAssessment } from '../services/db';

interface AssessmentProps {
  uid: string;
  userName: string;
  onComplete: () => void;
  initialData?: AssessmentData;
  onClose?: () => void;
}

type Step = 'welcome' | 'goal' | 'history' | 'knowledge' | 'frequency' | 'biometrics' | 'conditions' | 'success';

export const Assessment: React.FC<AssessmentProps> = ({ uid, userName, onComplete, initialData, onClose }) => {
  const [step, setStep] = useState<Step>('welcome');
  const [data, setData] = useState<Partial<AssessmentData>>(initialData || {
    conditions: []
  });
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = !!initialData;

  const steps: Step[] = ['goal', 'history', 'knowledge', 'frequency', 'biometrics', 'conditions'];
  const currentStepIndex = steps.indexOf(step as any);
  
  const stepLabels = ['Objetivo', 'Historial', 'Nivel', 'Frecuencia', 'Datos', 'Salud'];

  const nextStep = () => {
    const allSteps: Step[] = ['welcome', 'goal', 'history', 'knowledge', 'frequency', 'biometrics', 'conditions', 'success'];
    const currentIndex = allSteps.indexOf(step);
    if (currentIndex < allSteps.length - 1) {
      setStep(allSteps[currentIndex + 1]);
    }
  };

  const prevStep = () => {
    const allSteps: Step[] = ['welcome', 'goal', 'history', 'knowledge', 'frequency', 'biometrics', 'conditions', 'success'];
    const currentIndex = allSteps.indexOf(step);
    if (currentIndex > 0) {
      setStep(allSteps[currentIndex - 1]);
    }
  };

  const handleComplete = async () => {
    setIsSaving(true);
    try {
      const finalData: AssessmentData = {
        ...data as any,
        completedAt: new Date().toISOString()
      };
      await saveAssessment(uid, finalData);
      setStep('success');
      setTimeout(onComplete, 2500);
    } catch (error) {
      console.error("Error saving assessment:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const renderWelcome = () => (
    <div className="flex flex-col items-center justify-center py-10 text-center px-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-20 h-20 kinetic-gradient rounded-[28px] flex items-center justify-center shadow-2xl mb-8"
      >
        <span className="material-symbols-outlined text-3xl text-on-primary-container font-black">waving_hand</span>
      </motion.div>
      <h1 className="font-headline text-4xl font-black italic uppercase tracking-tighter leading-none mb-4">
        {isEditing ? 'Actualiza tu ' : '¡Hola, '}<span className="text-secondary">{isEditing ? 'Ficha Inicial' : userName.split(' ')[0]}</span>{isEditing ? '' : '!'}
      </h1>
      <p className="text-on-surface-variant text-sm font-bold uppercase tracking-widest max-w-xs opacity-70 mb-12 leading-relaxed">
        {isEditing 
          ? '¿Tus metas han cambiado? Actualiza tu perfil para que sigamos optimizando tu entrenamiento.' 
          : 'Personalicemos tu experiencia en Kinetic. Responde unas breves preguntas.'}
      </p>
      <button 
        onClick={nextStep}
        className="w-full max-w-sm kinetic-gradient py-6 rounded-2xl font-headline font-black text-on-primary-container tracking-[0.2em] uppercase shadow-2xl active:scale-[0.98] transition-all"
      >
        {isEditing ? 'Revisar Datos' : 'Empezar Evaluación'}
      </button>
    </div>
  );

  const renderGoal = () => (
    <div className="space-y-8 py-4">
      <div className="text-center space-y-2">
        <h2 className="font-headline text-3xl font-black italic uppercase tracking-tight">Selecciona tu Objetivo</h2>
        <p className="text-[10px] font-black text-outline uppercase tracking-widest">Personaliza tu base de entrenamiento.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 max-w-md mx-auto">
        {[
          { id: 'weight_loss', label: 'Perder peso', icon: 'monitor_weight', desc: 'Quemar grasa y definición' },
          { id: 'fitness', label: 'Forma Física', icon: 'directions_run', desc: 'Salud y calidad de vida' },
          { id: 'muscle_gain', label: 'Ganar Masa', icon: 'fitness_center', desc: 'Fuerza e hipertrofia' }
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => { setData({...data, goal: opt.id as any}); nextStep(); }}
            className={`flex items-center gap-5 p-5 rounded-[28px] border-2 transition-all text-left ${
              data.goal === opt.id ? 'border-secondary bg-secondary/5' : 'border-outline-variant/10 bg-surface-container-high'
            }`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
              data.goal === opt.id ? 'bg-secondary text-on-secondary' : 'bg-surface-container-highest text-outline'
            }`}>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{opt.icon}</span>
            </div>
            <div>
              <h3 className="font-headline font-black text-lg uppercase italic leading-none mb-1">{opt.label}</h3>
              <p className="text-[9px] font-black text-on-surface-variant uppercase tracking-widest opacity-60">{opt.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-8 py-4">
      <div className="text-center space-y-2">
        <h2 className="font-headline text-3xl font-black italic uppercase tracking-tight">Actividad Reciente</h2>
        <p className="text-[10px] font-black text-outline uppercase tracking-widest">¿Cómo has entrenado en los últimos 4 meses?</p>
      </div>
      <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
        {[
          { id: 'none', label: 'No he entrenado' },
          { id: '1x', label: '1 vez por semana' },
          { id: '2-3x', label: '2 a 3 veces por semana' },
          { id: '4x_plus', label: '4 veces o más' }
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => { setData({...data, history4Months: opt.id as any}); nextStep(); }}
            className={`p-5 rounded-2xl border-2 text-center transition-all ${
              data.history4Months === opt.id ? 'border-secondary bg-secondary text-on-secondary font-black' : 'border-outline-variant/10 bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <span className="font-headline text-base uppercase italic tracking-tight">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderKnowledge = () => (
    <div className="space-y-8 py-4">
      <div className="text-center space-y-2">
        <h2 className="font-headline text-3xl font-black italic uppercase tracking-tight">Nivel de Experiencia</h2>
        <p className="text-[10px] font-black text-outline uppercase tracking-widest">Sé honesto para no sobrecargarte.</p>
      </div>
      <div className="grid grid-cols-1 gap-3 max-w-sm mx-auto">
        {[
          { id: 'first_time', label: 'Primerizo total' },
          { id: 'little', label: 'Poco conocimiento' },
          { id: 'good', label: 'Buen conocimiento' },
          { id: 'autonomous', label: 'Soy autónomo (Pro)' }
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => { setData({...data, knowledge: opt.id as any}); nextStep(); }}
            className={`p-5 rounded-2xl border-2 text-center transition-all ${
              data.knowledge === opt.id ? 'border-secondary bg-secondary text-on-secondary font-black' : 'border-outline-variant/10 bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <span className="font-headline text-base uppercase italic tracking-tight">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderFrequency = () => (
    <div className="space-y-8 py-4 text-center">
      <div className="space-y-2">
        <h2 className="font-headline text-3xl font-black italic uppercase tracking-tight leading-tight">Frecuencia Semanal</h2>
        <p className="text-[10px] font-black text-outline uppercase tracking-widest">¿Cuántos días planeas venir?</p>
      </div>
      <div className="grid grid-cols-1 gap-4 max-w-sm mx-auto">
        {[
          { id: '1x', label: '1 vez por semana' },
          { id: '2x', label: '2 veces por semana' },
          { id: '3x_plus', label: '3 o más veces' }
        ].map((opt) => (
          <button
            key={opt.id}
            onClick={() => { setData({...data, targetFrequency: opt.id as any}); nextStep(); }}
            className={`p-7 rounded-[32px] border-2 text-center transition-all ${
              data.targetFrequency === opt.id ? 'border-secondary bg-secondary/5 text-secondary' : 'border-outline-variant/10 bg-surface-container-high text-on-surface-variant'
            }`}
          >
            <span className="font-headline font-black text-xl uppercase italic tracking-tight">{opt.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const renderBiometrics = () => (
    <div className="space-y-8 py-4">
      <div className="text-center space-y-2">
        <h2 className="font-headline text-3xl font-black italic uppercase tracking-tight">Tus Datos Físicos</h2>
        <p className="text-[10px] font-black text-outline uppercase tracking-widest leading-none">Opcional, pero recomendado.</p>
      </div>
      
      <div className="space-y-4 max-w-sm mx-auto">
        <div className="bg-surface-container-high p-6 rounded-[28px] border border-outline-variant/10 transition-all focus-within:border-secondary">
          <label className="text-[8px] font-black text-outline uppercase tracking-[0.2em] block mb-2">Peso Actual (kg)</label>
          <input 
            type="number"
            placeholder="00,0"
            className="w-full bg-transparent border-none p-0 font-headline text-4xl font-black italic focus:ring-0 placeholder:text-outline-variant/30"
            value={data.weight || ''}
            onChange={(e) => setData({...data, weight: parseFloat(e.target.value)})}
          />
        </div>

        <div className="bg-surface-container-high p-6 rounded-[28px] border border-outline-variant/10 transition-all focus-within:border-secondary">
          <label className="text-[8px] font-black text-outline uppercase tracking-[0.2em] block mb-2">Altura (cm)</label>
          <input 
            type="number"
            placeholder="000"
            className="w-full bg-transparent border-none p-0 font-headline text-4xl font-black italic focus:ring-0 placeholder:text-outline-variant/30"
            value={data.height || ''}
            onChange={(e) => setData({...data, height: parseInt(e.target.value)})}
          />
        </div>
      </div>

      <button 
        onClick={nextStep}
        className="w-full max-w-sm mx-auto flex kinetic-gradient py-6 rounded-2xl font-headline font-black text-on-primary-container tracking-[0.2em] uppercase shadow-2xl active:scale-[0.98] transition-all items-center justify-center mt-8"
      >
        Siguiente
      </button>
    </div>
  );

  const renderConditions = () => {
    const conditionsList = ['LESIÓN', 'ENFERMEDAD', 'EMBARAZO', 'DISCAPACIDAD', 'OTRAS'];
    
    return (
      <div className="space-y-8 py-4">
        <div className="text-center space-y-2">
          <h2 className="font-headline text-3xl font-black italic uppercase tracking-tight">Condiciones Médicas</h2>
          <p className="text-[10px] font-black text-outline uppercase tracking-widest leading-none">Queremos que entrenes seguro.</p>
        </div>

        <div className="flex flex-wrap justify-center gap-3 max-w-md mx-auto">
          {conditionsList.map((c) => (
            <button
              key={c}
              onClick={() => {
                const current = data.conditions || [];
                if (current.includes(c)) {
                  setData({...data, conditions: current.filter(item => item !== c)});
                } else {
                  setData({...data, conditions: [...current.filter(item => item !== 'NO POSEO'), c]});
                }
              }}
              className={`px-5 py-3 rounded-xl font-headline font-black text-[9px] uppercase tracking-widest border-2 transition-all ${
                data.conditions?.includes(c) 
                  ? 'border-secondary bg-secondary/10 text-secondary' 
                  : 'border-outline-variant/20 bg-surface-container-high text-outline'
              }`}
            >
              {c}
            </button>
          ))}
          <button
            onClick={() => setData({...data, conditions: ['NO POSEO']})}
            className={`px-5 py-3 rounded-xl font-headline font-black text-[9px] uppercase tracking-widest border-2 transition-all ${
              data.conditions?.includes('NO POSEO') 
                ? 'border-primary-container bg-primary-container/10 text-primary-container' 
                : 'border-outline-variant/20 bg-surface-container-high text-outline'
            }`}
          >
            NO POSEO
          </button>
        </div>

        <button 
          onClick={handleComplete}
          disabled={isSaving}
          className="w-full max-w-sm mx-auto flex kinetic-gradient py-6 rounded-2xl font-headline font-black text-on-primary-container tracking-[0.2em] uppercase shadow-2xl active:scale-[0.98] transition-all items-center justify-center gap-4 mt-8"
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-on-primary-container border-t-transparent rounded-full animate-spin" />
          ) : 'Finalizar Evaluación'}
        </button>
      </div>
    );
  };

  const renderSuccess = () => (
    <div className="flex flex-col items-center justify-center py-10 text-center px-4">
      <motion.div 
        initial={{ scale: 0.5, rotate: -45, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        className="w-20 h-20 bg-secondary rounded-[28px] flex items-center justify-center shadow-2xl shadow-secondary/20 mb-8"
      >
        <span className="material-symbols-outlined text-3xl text-on-secondary font-black">celebration</span>
      </motion.div>
      <h1 className="font-headline text-4xl font-black italic uppercase tracking-tighter leading-none mb-4">
        {isEditing ? 'Perfil ' : '¡Perfil '}<span className="text-secondary">{isEditing ? 'Actualizado!' : 'Listo!'}</span>
      </h1>
      <p className="text-on-surface-variant text-sm font-bold uppercase tracking-widest max-w-xs opacity-70 leading-relaxed">
        {isEditing ? 'Tus cambios se han guardado con éxito.' : 'Ya tenemos lo necesario. Bienvenido oficialmente a Kinetic Gym.'}
      </p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center md:p-6 sm:p-0">
      <motion.div 
        layout
        className="w-full max-w-2xl bg-surface-container rounded-t-[40px] md:rounded-[40px] shadow-[0_0_80px_rgba(0,0,0,0.5)] border border-outline-variant/5 relative flex flex-col h-full md:h-auto md:max-h-[85vh] overflow-hidden"
      >
        {/* Navigation & Progress Header */}
        {step !== 'welcome' && step !== 'success' && (
          <div className="px-8 pt-8 pb-4 shrink-0 bg-surface-container">
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={prevStep}
                className="flex items-center gap-2 text-[10px] font-black uppercase text-outline hover:text-secondary transition-colors"
                id="back-btn"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Volver
              </button>
              
              {onClose && (
                <button 
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-outline hover:text-error transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              )}

              {!onClose && (
                <div className="text-[10px] font-black uppercase text-outline tracking-widest opacity-50">
                  Pregunta {currentStepIndex + 1} de {steps.length}
                </div>
              )}
            </div>

            {/* Stepper Circles */}
            <div className="flex items-center justify-between relative px-2">
              {/* Connector Line */}
              <div className="absolute top-4 left-0 right-0 h-[2px] bg-outline-variant/20 -z-0 mx-8" />
              <div 
                className="absolute top-4 left-0 h-[2px] bg-secondary -z-0 transition-all duration-500 mx-8" 
                style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
              />

              {steps.map((_, idx) => {
                const isActive = idx <= currentStepIndex;
                const isCurrent = idx === currentStepIndex;
                return (
                  <div key={idx} className="flex flex-col items-center gap-3 relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all duration-500 scale-90 ${
                      isCurrent ? 'bg-secondary text-on-secondary scale-110 shadow-lg shadow-secondary/20 ring-4 ring-secondary/20' : 
                      isActive ? 'bg-secondary text-on-secondary' : 'bg-surface-container-highest text-outline border border-outline-variant'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className={`text-[7px] font-black uppercase tracking-widest transition-opacity duration-300 ${
                      isCurrent ? 'opacity-100 text-secondary' : 'opacity-0'
                    }`}>
                      {stepLabels[idx]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-8 pb-10 custom-scrollbar mt-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 'welcome' && renderWelcome()}
              {step === 'goal' && renderGoal()}
              {step === 'history' && renderHistory()}
              {step === 'knowledge' && renderKnowledge()}
              {step === 'frequency' && renderFrequency()}
              {step === 'biometrics' && renderBiometrics()}
              {step === 'conditions' && renderConditions()}
              {step === 'success' && renderSuccess()}
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
