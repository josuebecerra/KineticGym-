import React from 'react';
import { motion } from 'motion/react';
import { Screen } from '../types';
import { cn } from '../lib/utils';
import { auth } from '../lib/firebase';
import { signOut, User } from 'firebase/auth';

interface LayoutProps {
  children: React.ReactNode;
  activeScreen: Screen;
  onScreenChange: (screen: Screen) => void;
  user?: User;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeScreen, onScreenChange, user }) => {
  const navItems: { id: Screen; label: string; icon: string }[] = [
    { id: 'inicio', label: 'Inicio', icon: 'dashboard' },
    { id: 'entrenar', label: 'Entrenar', icon: 'fitness_center' },
    { id: 'historial', label: 'Historial', icon: 'history' },
    { id: 'descanso', label: 'Descanso', icon: 'timer' },
    { id: 'ejercicios', label: 'Ejercicios', icon: 'library_books' },
  ];

  const handleSignOut = () => {
    signOut(auth).catch((error) => console.error('Error cerrando sesión:', error));
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
                      <motion.div 
                        layoutId="desktop-active-indicator"
                        className="absolute -bottom-2 left-0 right-0 h-0.5 bg-secondary"
                      />
                    )}
                  </span>
                </button>
              ))}
            </nav>
          </div>

          {/* User Controls */}
          <div className="flex items-center gap-6">
            {user && (
              <span className="text-[11px] font-bold text-outline-variant uppercase tracking-widest hidden lg:block">
                {user.email}
              </span>
            )}
            <button 
              onClick={handleSignOut}
              className="active:scale-95 transition-transform text-outline hover:text-error flex items-center justify-center gap-2 group"
              title="Cerrar sesión"
            >
              <span className="material-symbols-outlined text-2xl group-hover:block transition-all">logout</span>
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
                "flex flex-col items-center justify-center transition-all duration-200 active:scale-90",
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
