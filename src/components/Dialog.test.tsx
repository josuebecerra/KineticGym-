import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Dialog } from './Dialog';

describe('Dialog Component', () => {
  const defaultProps = {
    isOpen: true,
    type: 'success' as const,
    title: 'TEST TITLE',
    message: 'Test message description',
    onClose: vi.fn(),
  };

  it('debe renderizar correctamente el título y el mensaje', () => {
    render(<Dialog {...defaultProps} />);
    
    expect(screen.getByText('TEST TITLE')).toBeInTheDocument();
    expect(screen.getByText('Test message description')).toBeInTheDocument();
  });

  it('no debe renderizar nada si isOpen es false', () => {
    const { container } = render(<Dialog {...defaultProps} isOpen={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('debe llamar a onConfirm cuando se hace clic en el botón principal', () => {
    const onConfirm = vi.fn();
    render(<Dialog {...defaultProps} onConfirm={onConfirm} confirmText="ACEPTAR" />);
    
    const button = screen.getByText('ACEPTAR');
    fireEvent.click(button);
    
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('debe mostrar un input si showInput es true', () => {
    render(<Dialog {...defaultProps} showInput={true} inputPlaceholder="Escribe algo" />);
    
    expect(screen.getByPlaceholderText('Escribe algo')).toBeInTheDocument();
  });

  it('debe enviar el valor del input al confirmar', () => {
    const onConfirm = vi.fn();
    render(<Dialog {...defaultProps} showInput={true} onConfirm={onConfirm} confirmText="ENVIAR" />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'MOTIVO DE PRUEBA' } });
    
    const button = screen.getByText('ENVIAR');
    fireEvent.click(button);
    
    expect(onConfirm).toHaveBeenCalledWith('MOTIVO DE PRUEBA');
  });
});
