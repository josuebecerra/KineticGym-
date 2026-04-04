import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './common/Button';

export type DialogType = 'confirm' | 'success' | 'error' | 'info';

export interface DialogConfig {
  isOpen: boolean;
  type: DialogType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface DialogProps extends DialogConfig {
  onClose: () => void;
}

export const Dialog: React.FC<DialogProps> = ({ 
  isOpen, 
  type, 
  title, 
  message, 
  confirmText, 
  cancelText, 
  onConfirm, 
  onCancel,
  onClose 
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'confirm': return 'warning';
      case 'error': return 'error';
      case 'success': return 'check_circle';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'confirm': return 'text-error bg-error/10';
      case 'error': return 'text-error bg-error/10';
      case 'success': return 'text-secondary bg-secondary/10';
      case 'info': return 'text-primary-container bg-primary-container/10';
      default: return 'text-outline bg-outline/10';
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case 'confirm': return 'error';
      case 'error': return 'error';
      case 'success': return 'secondary';
      case 'info': return 'primary';
      default: return 'surface';
    }
  };

  const handleConfirm = () => {
    onConfirm?.();
    onClose();
  };

  const handleCancel = () => {
    onCancel?.();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleCancel}
          className="absolute inset-0 bg-background/90 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 350 }}
          className="relative w-full max-w-sm bg-surface-container p-8 rounded-[40px] border border-outline-variant/10 shadow-2xl flex flex-col items-center text-center gap-8"
        >
          {/* Icon */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-transform hover:scale-110 duration-500 ${getIconColor()}`}>
            <span className="material-symbols-outlined text-4xl leading-none">
              {getIcon()}
            </span>
          </div>
          
          <div className="space-y-3">
            <h3 className="font-headline text-3xl font-black uppercase italic leading-tight text-white tracking-tight">
              {title}
            </h3>
            <p className="text-on-surface-variant text-sm font-medium leading-relaxed max-w-[280px]">
              {message}
            </p>
          </div>

          <div className="flex gap-4 w-full mt-2">
            {(type === 'confirm' || cancelText) && (
              <Button 
                variant="surface"
                onClick={handleCancel}
                className="flex-1 py-5 text-[10px] tracking-[0.2em]"
              >
                {cancelText || 'Regresar'}
              </Button>
            )}
            <Button 
              variant={getButtonVariant()}
              onClick={handleConfirm}
              className="flex-1 py-5 text-[10px] tracking-[0.3em]"
            >
              {confirmText || (type === 'confirm' ? 'Confirmar' : 'Aceptar')}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
