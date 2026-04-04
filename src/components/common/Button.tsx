import React, { useState, useCallback, useRef } from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'onClick'> {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'error' | 'surface';
  isLoading?: boolean;
  loadingText?: string;
  debounceMs?: number;
}

export const Button: React.FC<ButtonProps> = ({
  onClick,
  variant = 'primary',
  isLoading: manualLoading,
  loadingText,
  debounceMs = 500,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const lastClickRef = useRef<number>(0);
  const isLoading = manualLoading || internalLoading;

  const handleClick = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    const now = Date.now();
    if (isLoading || disabled) return;
    
    // Prevent double clicking by checking time elapsed
    if (now - lastClickRef.current < debounceMs) {
      console.warn('Click bloqueado por debounce');
      return;
    }
    
    lastClickRef.current = now;

    if (onClick) {
      const result = onClick(e);
      if (result instanceof Promise) {
        setInternalLoading(true);
        try {
          await result;
        } finally {
          setInternalLoading(false);
        }
      }
    }
  }, [onClick, isLoading, disabled, debounceMs]);

  const variants = {
    primary: 'kinetic-gradient text-on-primary-container shadow-lg shadow-primary-container/10',
    secondary: 'bg-secondary text-black shadow-lg shadow-secondary/10',
    surface: 'bg-surface-container-high text-on-surface border border-outline-variant/10',
    outline: 'bg-transparent border border-outline-variant/30 text-outline hover:border-outline-variant/60',
    ghost: 'bg-transparent text-outline hover:bg-surface-container-low',
    error: 'bg-error/10 text-error border border-error/20 hover:bg-error/20'
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={handleClick}
      disabled={isLoading || disabled}
      className={`
        relative overflow-hidden flex items-center justify-center gap-3 py-4 px-6 rounded-2xl 
        font-headline font-black uppercase italic tracking-wider transition-all
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="w-5 h-5 border-2 border-current/20 border-t-current rounded-full animate-spin" />
          {loadingText && <span className="text-[10px] uppercase tracking-widest">{loadingText}</span>}
        </>
      ) : (
        children
      )}
    </motion.button>
  );
};
