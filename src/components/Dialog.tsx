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
  showInput?: boolean;
  inputPlaceholder?: string;
  onConfirm?: (inputValue?: string) => void;
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
  showInput,
  inputPlaceholder,
  onConfirm, 
  onCancel,
  onClose 
}) => {
  const [inputValue, setInputValue] = React.useState('');

  React.useEffect(() => {
    if (isOpen) setInputValue('');
  }, [isOpen]);

  const handleConfirm = () => {
    if (onConfirm) onConfirm(showInput ? inputValue : undefined);
    onClose();
  };

  const handleCancel = () => {
    if (onCancel) onCancel();
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'confirm': return 'help';
      case 'success': return 'check_circle';
      case 'error': return 'error';
      default: return 'info';
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success': return 'bg-primary-container/20 text-primary-container';
      case 'error': return 'bg-error/10 text-error';
      case 'confirm': return 'bg-secondary/20 text-secondary';
      default: return 'bg-surface-container-highest text-outline';
    }
  };

  const getButtonVariant = () => {
    switch (type) {
      case 'error': return 'error';
      case 'confirm': return 'secondary';
      case 'success': return 'secondary';
      default: return 'primary';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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

            {showInput && (
              <div className="w-full relative group">
                <div className="absolute inset-0 bg-secondary/5 rounded-2xl blur-lg group-focus-within:bg-secondary/10 transition-all" />
                <input 
                  type="text"
                  autoFocus
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={inputPlaceholder || "Escribe el motivo..."}
                  className="relative w-full bg-surface-container-high border border-outline-variant/20 rounded-2xl px-5 py-4 text-sm font-bold text-white placeholder:text-outline-variant/40 focus:outline-none focus:border-secondary/40 focus:ring-1 focus:ring-secondary/20 transition-all uppercase tracking-widest"
                />
              </div>
            )}

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
      )}
    </AnimatePresence>
  );
};
