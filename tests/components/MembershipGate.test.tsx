import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MembershipGate } from '../../src/components/MembershipGate';
import { UserProfile } from '../../src/types';

// Mocking the db service
vi.mock('../../src/services/db', () => ({
  requestMembership: vi.fn(),
}));

describe('MembershipGate Component', () => {
  const mockUser: UserProfile = {
    uid: 'user123',
    email: 'client@example.com',
    displayName: 'Client Name',
    role: 'trainee',
    avatarUrl: '',
    settings: { soundEnabled: true },
    history: [],
    progress: [],
    assignedRoutines: []
  };

  const defaultProps = {
    userProfile: mockUser,
    onLogout: vi.fn(),
  };

  it('debe mostrar el mensaje de bienvenida y los planes disponibles', () => {
    render(<MembershipGate {...defaultProps} />);
    
    expect(screen.getByText(/MEMBRESÍAS/i)).toBeInTheDocument();
    expect(screen.getByText(/Membresía Requerida/i)).toBeInTheDocument();
    expect(screen.getByText(/Mensual/i)).toBeInTheDocument();
  });

  it('debe mostrar el estado de "SOLICITUD EN CURSO" si el usuario tiene una solicitud pendiente', () => {
    const pendingUser = {
      ...mockUser,
      membershipRequest: {
        planId: '1month',
        requestDate: new Date().toISOString(),
        status: 'pending'
      }
    };
    
    render(<MembershipGate {...defaultProps} userProfile={pendingUser as any} />);
    
    expect(screen.getByText('SOLICITUD EN CURSO')).toBeInTheDocument();
    expect(screen.getByText(/Has solicitado el plan/i)).toBeInTheDocument();
  });

  it('debe permitir seleccionar un plan y habilitar el botón de solicitud', () => {
    render(<MembershipGate {...defaultProps} />);
    
    const requestButton = screen.getByText('Solicitar Activación');
    expect(requestButton.closest('button')).toBeDisabled();
    
    const monthlyPlan = screen.getByText('Mensual');
    fireEvent.click(monthlyPlan);
    
    expect(requestButton.closest('button')).not.toBeDisabled();
  });

  it('debe llamar a onLogout al hacer clic en el botón de salida', () => {
    render(<MembershipGate {...defaultProps} />);
    
    const logoutButtons = screen.getAllByText(/Cerrar Sesión/i);
    fireEvent.click(logoutButtons[0]);
    
    expect(defaultProps.onLogout).toHaveBeenCalled();
  });
});
