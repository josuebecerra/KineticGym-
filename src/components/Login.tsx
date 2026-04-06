import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Capacitor } from '@capacitor/core';
import { auth, googleProvider } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  AuthError
} from 'firebase/auth';
import { Button } from './common/Button';

interface LoginProps {
  onLogin?: () => void; // Firebase se encarga del estado de sesión en App.tsx, esto es solo un callback opcional.
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Verificación segura para web
  const isNative = typeof window !== 'undefined' && Capacitor?.isNativePlatform?.();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, completa todos los campos.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (isRegistering) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      onLogin?.();
    } catch (err) {
      const authError = err as AuthError;
      switch (authError.code) {
        case 'auth/email-already-in-use':
          setError('El email ya está en uso. Por favor, inicia sesión.');
          break;
        case 'auth/invalid-credential':
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Email o contraseña incorrectos.');
          break;
        case 'auth/weak-password':
          setError('La contraseña debe tener al menos 6 caracteres.');
          break;
        default:
          setError('Ocurrió un error. Inténtalo de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await signInWithPopup(auth, googleProvider);
      onLogin?.();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/unauthorized-domain') {
        setError('⚠️ El acceso con Google requiere autorizar "localhost" en la Consola de Firebase: Ve a Authentication > Settings > Authorized domains y añade "localhost".');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Proceso cancelado. No se inició sesión.');
      } else {
        setError('No se pudo iniciar sesión con Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden"
      style={{
        paddingTop: 'env(safe-area-inset-top, 24px)',
        paddingBottom: 'env(safe-area-inset-bottom, 24px)'
      }}
    >
      {/* Background Decorative Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 blur-[120px] rounded-full" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md z-10 space-y-12"
      >
        {/* Logo */}
        <div className="text-center space-y-2">
          <h1 className="font-headline font-black italic text-primary-container tracking-tighter text-6xl">KINETIC</h1>
          <p className="text-on-surface-variant font-label text-sm uppercase tracking-[0.3em]">Precision Performance</p>
        </div>

        {/* Formulario de Email/Contraseña */}
        <form onSubmit={handleAuth} className="bg-surface-container-low p-6 rounded-3xl border border-outline-variant/20 shadow-2xl space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-primary-container ml-1">
                {isRegistering ? 'Tu Email' : 'Email de Acceso'}
              </label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="guerrero@kinetic.com"
                className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl py-4 px-5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-primary-container ml-1">Contraseña</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-container-high border border-outline-variant/30 rounded-xl py-4 px-5 text-on-surface placeholder:text-outline focus:ring-2 focus:ring-primary-container transition-all outline-none"
              />
            </div>
            {error && (
              <motion.p initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-error text-xs font-bold uppercase tracking-widest mt-2 px-1 bg-error/10 py-3 rounded-lg text-center border border-error/20">
                {error}
              </motion.p>
            )}
          </div>

          <Button 
            type="submit"
            isLoading={isLoading}
            loadingText="Autenticando..."
            className="w-full"
          >
            {!isLoading && (isRegistering ? 'Crear Perfil Kinetic' : 'Ingresar')}
          </Button>

          <div className="text-center pt-2">
            <button 
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
                setEmail('');
                setPassword('');
              }}
              className="text-on-surface-variant text-xs hover:text-primary-container transition-colors underline underline-offset-4"
            >
              {isRegistering ? '¿Ya tienes un perfil? Inicia sesión aquí' : '¿No tienes cuenta? Regístrate aquí'}
            </button>
          </div>
        </form>

        {/* Separador - Solo Web */}
        {!isNative && (
          <div className="flex items-center gap-4">
            <div className="h-[1px] flex-1 bg-outline-variant/20" />
            <span className="text-[10px] font-bold text-outline-variant uppercase tracking-widest">O accede rápidamente con</span>
            <div className="h-[1px] flex-1 bg-outline-variant/20" />
          </div>
        )}

        {/* Social Login: Google - Solo Web */}
        {!isNative && (
          <Button 
            type="button"
            onClick={handleGoogleSignIn}
            variant="surface"
            isLoading={isLoading}
            loadingText="Conectando con Google..."
            className="w-full relative overflow-hidden group py-4 flex items-center justify-center gap-4 hover:border-primary-container/50 transition-all"
          >
            {!isLoading && (
              <>
                <div className="absolute inset-0 bg-primary/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <img src="https://www.cdnlogo.com/logos/g/35/google-icon.svg" alt="Google" className="w-6 h-6 z-10" />
                <span className="font-label font-bold text-on-surface tracking-wider z-10">
                  Continuar con Google
                </span>
              </>
            )}
          </Button>
        )}
      </motion.div>
    </div>
  );
};
