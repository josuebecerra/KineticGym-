import React from 'react';
import { Screen, UserProfile } from '../types';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  userProfile?: UserProfile | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeScreen, onScreenChange, userProfile, onLogout }) => {
  const navItems: { id: Screen; label: string; icon: string }[] = [
    { id: 'inicio', label: 'Incio', icon: 'dashboard' },
    { id: 'entrenar', label: 'Fuerza', icon: 'fitness_center' },
    { id: 'historial', label: 'Bitácora', icon: 'history' },
    { id: 'descanso', label: 'Cronos', icon: 'timer' },
    { id: 'explorar', label: 'Centro', icon: 'widgets' },
  ];

  const handleSignOut = () => {
    onLogout();
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Header & Desktop Nav */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-outline-variant/10">
        <div className="flex justify-between items-center px-6 py-4 max-w-5xl mx-auto w-full">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <span className="font-headline font-black italic text-primary-container tracking-tighter text-2xl">KINETIC</span>
            
            {/* Nav - Desktop Only */}
            <nav className="hidden md:flex items-center gap-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onScreenChange(item.id)}
                  className={cn(
                    "flex flex-col items-center justify-center transition-all duration-200 group",
                    activeScreen === item.id ? "text-secondary" : "text-outline hover:text-primary-container"
                  )}
                >
                  <span className="font-body text-[11px] font-bold uppercase tracking-[0.2em] mt-1 relative">
                    {item.label}
                    {activeScreen === item.id && (
                      <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-secondary" />
                    )}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-4">
            {userProfile && (
              <>
                {userProfile.role === 'trainee' && userProfile.subscription && (
                  <div className="hidden sm:flex items-center gap-2 group px-3 py-1.5 bg-surface-container-high rounded-full border border-outline-variant/10">
                    <div className={cn(
                      "w-2 h-2 rounded-full animate-pulse",
                      new Date(userProfile.subscription.endDate) > new Date() ? "bg-primary-container shadow-[0_0_8px_rgba(202,253,0,0.6)]" : "bg-error shadow-[0_0_8px_rgba(255,82,82,0.6)]"
                    )} />
                    <span className="text-[9px] font-black uppercase tracking-widest text-outline group-hover:text-white transition-colors">
                      {new Date(userProfile.subscription.endDate) > new Date() ? "Suscripción Activa" : "Vencida"}
                    </span>
                  </div>
                )}
                {['admin', 'trainer'].includes(userProfile.role) && (
                  <button 
                    onClick={() => onScreenChange('entrenador')}
                    className={cn(
                      "active:scale-[0.98] transition-transform flex items-center justify-center group w-10 h-10 rounded-full border border-outline-variant/10",
                      activeScreen === 'entrenador' ? "bg-secondary text-background" : "bg-surface-container-high text-secondary hover:bg-surface-container-highest"
                    )}
                    title="Panel Entrenador"
                  >
                    <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">shield_person</span>
                  </button>
                )}
                <button
                  onClick={() => onScreenChange('ajustes')}
                  className="active:scale-[0.98] transition-transform flex items-center gap-3 hover:opacity-80 group ml-2"
                >
                  <span className="text-[10px] font-black tracking-widest uppercase hidden lg:block text-outline-variant group-hover:text-primary-container transition-colors">
                    {userProfile.displayName || (userProfile.email ? userProfile.email.split('@')[0] : 'G')}
                  </span>
                  <img 
                    src={userProfile.avatarUrl || `https://ui-avatars.com/api/?name=${userProfile.displayName || (userProfile.email ? userProfile.email.split('@')[0] : 'G')}&background=CCFF00&color=121212&bold=true`} 
                    alt="Perfil" 
                    className="w-10 h-10 rounded-full border-2 border-surface-container group-hover:border-secondary transition-colors object-cover shadow-lg"
                  />
                </button>
              </>
            )}
            <button 
              onClick={handleSignOut}
              className="active:scale-[0.98] transition-transform text-outline hover:text-error flex items-center justify-center w-10 h-10 ml-2 group"
              title="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto pb-32 md:pb-12">
        {children}
      </main>

      {/* Bottom Nav - Mobile Only */}
      <nav className="md:hidden fixed bottom-0 w-full z-50 rounded-t-[32px] glass-nav border-t border-outline-variant/15 shadow-[0px_-20px_40px_rgba(0,0,0,0.4)]">
        <div className="flex justify-around items-center h-20 pb-safe px-4 max-w-5xl mx-auto">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onScreenChange(item.id)}
              className={cn(
                "flex flex-col items-center justify-center transition-all duration-200 active:scale-[0.98]",
                activeScreen === item.id ? "text-secondary scale-110" : "text-outline hover:text-primary-container"
              )}
            >
              <span 
                className="material-symbols-outlined"
                style={{ fontVariationSettings: `'FILL' ${activeScreen === item.id ? 1 : 0}` }}
              >
                {item.icon}
              </span>
              <span className="font-body text-[10px] font-medium uppercase tracking-widest mt-1">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};
