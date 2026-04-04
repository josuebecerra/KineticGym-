import React, { useState } from 'react';
import { motion } from 'motion/react';
import { UserProfile, MembershipPlan } from '../types';
import { requestMembership } from '../services/db';
import { Button } from './common/Button';

interface MembershipGateProps {
  userProfile: UserProfile;
  onLogout: () => void;
  onBack?: () => void;
  plans?: MembershipPlan[];
}

export const MembershipGate: React.FC<MembershipGateProps> = ({ userProfile, onLogout, onBack, plans }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'1month' | '6months' | '1year' | null>(null);

  const handleRequest = async () => {
    if (!selectedPlan) return;
    setIsSubmitting(true);
    try {
      await requestMembership(userProfile.uid, selectedPlan);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isPending = userProfile.membershipRequest?.status === 'pending';
  const isRejected = userProfile.membershipRequest?.status === 'rejected';

  // Fallback plans if not provided
  const displayPlans = plans && plans.length > 0 ? plans : [
    { id: '1month', name: 'Mensual', price: '40', description: 'Acceso total por 30 días' },
    { id: '6months', name: 'Semestral', price: '200', description: '¡Ahorra 15%! Acceso por 180 días' },
    { id: '1year', name: 'Anual', price: '350', description: '¡Mejor Valor! Acceso ilimitado por 365 días' }
  ];

  const getPlanDetails = (id: string) => displayPlans.find(p => p.id === id) || displayPlans[0];

  const contactText = isPending 
    ? "Hola, ya solicité mi plan. Adjunto el comprobante de pago para la activación."
    : "Hola, me gustaría obtener información sobre las membresías Kinetic.";
  
  const whatsappUrl = `https://wa.me/506?text=${encodeURIComponent(contactText)}`;

  return (
    <div className="fixed inset-0 z-[5000] bg-background flex flex-col overflow-y-auto custom-scrollbar">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-secondary/20 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col px-6 pt-12 pb-10 max-w-2xl mx-auto w-full">
        {/* Header */}
        <header className="mb-12 text-center relative">
          {(onBack || onLogout) && (
            <Button 
              variant="surface"
              onClick={() => onLogout()}
              className="absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center text-outline-variant hover:text-white"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </Button>
          )}

          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-block px-4 py-1.5 bg-secondary/10 border border-secondary/20 rounded-full mb-6"
          >
            <span className="text-[10px] font-black text-secondary tracking-[0.4em] uppercase">Membresía Requerida</span>
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="font-headline text-5xl font-black text-white italic leading-none tracking-tighter uppercase mb-4"
          >
            MEMBRESÍAS <br /> <span className="text-secondary">KINETIC</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-[11px] font-bold text-outline-variant uppercase tracking-[0.2em] leading-relaxed px-4"
          >
            Tu acceso a Kinetic ha vencido. Elige un plan para seguir entrenando al máximo nivel.
          </motion.p>
        </header>

        {isPending ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface-container-low border border-secondary/30 rounded-[48px] p-10 text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-secondary/5 animate-pulse" />
            <div className="relative z-10">
              <div className="w-24 h-24 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-secondary/20">
                <span className="material-symbols-outlined text-5xl text-secondary animate-bounce">hourglass_empty</span>
              </div>
              <h2 className="font-headline text-3xl font-black text-white uppercase italic leading-tight mb-4 tracking-tight">SOLICITUD EN CURSO</h2>
              <p className="text-[10px] font-bold text-outline uppercase tracking-widest leading-loose mb-8">
                Has solicitado el plan <span className="text-secondary">{(getPlanDetails(userProfile.membershipRequest!.planId)).name}</span>. <br />
                Un administrador activará tu cuenta en breve tras confirmar el pago.
              </p>

              <div className="flex flex-col gap-4">
                <div className="px-6 py-4 bg-surface-container-high rounded-2xl flex items-center justify-between border border-outline-variant/10">
                  <span className="text-[9px] font-black text-outline uppercase tracking-widest">Enviado el:</span>
                  <span className="text-[9px] font-black text-on-surface uppercase tracking-widest">
                    {new Date(userProfile.membershipRequest!.requestDate).toLocaleDateString()}
                  </span>
                </div>

                {/* WhatsApp Action for pending */}
                <a 
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center justify-center gap-3 bg-secondary text-black p-5 rounded-2xl font-headline font-black text-sm uppercase italic tracking-wider hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-secondary/20"
                >
                  <span className="material-symbols-outlined">chat</span>
                  Enviar comprobante WhatsApp
                </a>

                <Button 
                  onClick={() => onLogout()}
                  variant="outline"
                  className="w-full text-[11px] font-black text-outline-variant hover:text-error mt-4"
                >
                  Regresar al Login (Cerrar Sesión)
                </Button>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {displayPlans.map((plan, idx) => {
              const isSelected = selectedPlan === plan.id;
              
              return (
                <motion.button
                  key={plan.id}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * idx }}
                  onClick={() => setSelectedPlan(plan.id as any)}
                  className={`w-full p-6 rounded-[32px] border-2 transition-all text-left flex items-center justify-between group ${
                    isSelected 
                      ? 'bg-secondary/10 border-secondary shadow-lg shadow-secondary/5' 
                      : 'bg-surface-container-low border-outline-variant/10 hover:bg-surface-container-high hover:border-outline-variant/30'
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isSelected ? 'bg-secondary text-black' : 'bg-surface-container-highest text-outline'}`}>
                      <span className="material-symbols-outlined font-black">
                        {plan.id === '1month' ? 'calendar_month' : plan.id === '6months' ? 'verified' : 'workspace_premium'}
                      </span>
                    </div>
                    <div>
                      <h3 className={`font-headline text-xl font-black uppercase italic leading-none mb-1 transition-colors ${isSelected ? 'text-white' : 'text-outline-variant'}`}>
                        {plan.name}
                      </h3>
                      <p className="text-[9px] font-bold text-outline uppercase tracking-widest">{plan.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-headline text-xl font-black italic leading-none transition-colors ${isSelected ? 'text-secondary' : 'text-white'}`}>
                      ${plan.price}
                    </p>
                    {isSelected && <span className="text-[7px] font-black text-secondary tracking-[0.2em] uppercase">Seleccionado</span>}
                  </div>
                </motion.button>
              );
            })}

            <div className="mt-12 flex flex-col gap-4">
              <Button
                onClick={handleRequest}
                disabled={!selectedPlan}
                isLoading={isSubmitting}
                loadingText="Procesando Solicitud..."
                className="w-full py-5 text-xl"
              >
                {!isSubmitting && (
                  <>
                    <span className="material-symbols-outlined font-black">send</span>
                    Solicitar Activación
                  </>
                )}
              </Button>
              
              {isRejected && (
                <div className="text-center space-y-4 py-2">
                  <p className="text-error text-[9px] font-black uppercase tracking-widest bg-error/10 py-3 rounded-2xl border border-error/20">
                    Tu solicitud previa fue rechazada. Contacta a la administración.
                  </p>
                  <a 
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 text-secondary text-[10px] font-black uppercase tracking-widest active:scale-95 transition-transform"
                  >
                    <span className="material-symbols-outlined text-sm">chat</span>
                    Soporte WhatsApp
                  </a>
                </div>
              )}

              <Button 
                onClick={() => onLogout()}
                variant="outline"
                className="w-full text-[11px] font-black text-outline hover:text-error tracking-[0.3em] mt-4"
              >
                Volver al Login (Cerrar Sesión)
              </Button>
            </div>
          </div>
        )}

        <footer className="mt-auto pt-10 text-center">
          <p className="text-[8px] font-black text-outline-variant uppercase tracking-[0.5em] opacity-40">Kinetic Strength Systems &copy; 2026</p>
        </footer>
      </div>
    </div>
  );
};
