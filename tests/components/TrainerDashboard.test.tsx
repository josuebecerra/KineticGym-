import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TrainerDashboard } from '../../src/components/TrainerDashboard';
import * as dbService from '../../src/services/db';
import { UserProfile } from '../../src/types';

// Mocking the db service
vi.mock('../../src/services/db', () => ({
  getAllUsers: vi.fn(),
  assignRoutineToUser: vi.fn(),
  updateUserSubscription: vi.fn(),
  requestElectronicInvoice: vi.fn(),
  listenToGymTaxConfig: vi.fn(() => vi.fn()),
}));

describe('TrainerDashboard Component', () => {
  const mockUsers: UserProfile[] = [
    {
      uid: 'trainee1',
      displayName: 'Trainee One',
      email: 't1@example.com',
      role: 'trainee',
      avatarUrl: '',
      settings: { soundEnabled: true },
      history: [],
      progress: [],
      assignedRoutines: []
    },
    {
      uid: 'trainee2',
      displayName: 'Special User',
      email: 't2@example.com',
      role: 'trainee',
      avatarUrl: '',
      settings: { soundEnabled: true },
      history: [],
      progress: [],
      assignedRoutines: []
    }
  ];

  const defaultProps = {
    onBack: vi.fn(),
    currentRole: 'admin',
    currentUserUid: 'admin1',
    onShowDialog: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(dbService.getAllUsers).mockResolvedValue(mockUsers);
  });

  it('debe cargar y mostrar la lista de alumnos', async () => {
    render(<TrainerDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Trainee One')).toBeInTheDocument();
      expect(screen.getByText('Special User')).toBeInTheDocument();
    });
  });

  it('debe filtrar la lista de alumnos según la búsqueda', async () => {
    render(<TrainerDashboard {...defaultProps} />);
    
    await waitFor(() => expect(screen.getByText('Trainee One')).toBeInTheDocument());
    
    const searchInput = screen.getByPlaceholderText(/Buscar\.\.\./i);
    fireEvent.change(searchInput, { target: { value: 'Special' } });
    
    expect(screen.getByText('Special User')).toBeInTheDocument();
    expect(screen.queryByText('Trainee One')).not.toBeInTheDocument();
  });

  it('debe cambiar de pestaña al hacer clic en los tabs superiores', async () => {
    render(<TrainerDashboard {...defaultProps} />);
    
    await waitFor(() => expect(screen.getByText('CLIENTES')).toBeInTheDocument());
    
    const coachesTab = screen.getByText('COACHES');
    fireEvent.click(coachesTab);
    
    // Al ser admin, debería mostrar el subtítulo de staff
    expect(screen.getByText(/Directorio de Staff/i)).toBeInTheDocument();
  });

  it('debe seleccionar un alumno y mostrar sus detalles al hacer clic', async () => {
    render(<TrainerDashboard {...defaultProps} />);
    
    await waitFor(() => {
      const traineeItem = screen.getByText('Trainee One');
      fireEvent.click(traineeItem);
    });
    
    expect(screen.getByText(/Gestión Especializada/i)).toBeInTheDocument();
    expect(screen.getByText(/Nivel de Acceso/i)).toBeInTheDocument();
  });
});
