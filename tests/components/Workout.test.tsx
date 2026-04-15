import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Workout } from '../../src/components/Workout';
import { WorkoutState, RestState } from '../../src/types';

describe('Workout Component', () => {
  const mockSetWorkoutState = vi.fn();
  const mockSetRestState = vi.fn();
  const mockOnFinish = vi.fn();
  const mockOnScreenChange = vi.fn();
  const mockOnShowDialog = vi.fn();

  const initialWorkoutState: WorkoutState = {
    isActive: false,
    selectedRoutine: null,
    activeExercises: [],
    elapsedSeconds: 0
  };

  const initialRestState: RestState = {
    isActive: false,
    timeLeft: 0,
    totalTime: 0
  };

  const defaultProps = {
    onFinish: mockOnFinish,
    sessions: [],
    workoutState: initialWorkoutState,
    setWorkoutState: mockSetWorkoutState,
    restState: initialRestState,
    setRestState: mockSetRestState,
    onScreenChange: mockOnScreenChange,
    onShowDialog: mockOnShowDialog,
    userRole: 'trainee',
    assignedRoutines: []
  };

  it('debe mostrar la pantalla de selección por defecto', () => {
    render(<Workout {...defaultProps} />);
    expect(screen.getByText('Sesión Libre')).toBeInTheDocument();
    expect(screen.getByText('Entrenar')).toBeInTheDocument();
  });

  it('debe iniciar una sesión libre al hacer clic en el botón', () => {
    render(<Workout {...defaultProps} />);
    const freeSessionButton = screen.getByText('Sesión Libre');
    fireEvent.click(freeSessionButton);
    
    expect(mockSetWorkoutState).toHaveBeenCalledWith(expect.objectContaining({
      isActive: true,
      selectedRoutine: null
    }));
  });

  it('debe mostrar la vista activa si workoutState.isActive es true', () => {
    const activeState = { ...initialWorkoutState, isActive: true };
    render(<Workout {...defaultProps} workoutState={activeState} />);
    
    expect(screen.getByText('SESIÓN LIBRE')).toBeInTheDocument();
    expect(screen.getByText('Detener Sesión')).toBeInTheDocument();
  });

  it('debe permitir finalizar el entrenamiento si hay series completadas', () => {
    const activeState = { 
      ...initialWorkoutState, 
      isActive: true,
      activeExercises: [
        {
          id: 'ex1',
          name: 'Press de Banca',
          muscle: 'Pecho',
          equipment: 'Barra',
          sets: [{ id: 's1', weight: 60, reps: 10, completed: true }]
        }
      ]
    };
    
    render(<Workout {...defaultProps} workoutState={activeState} />);
    
    const finishButton = screen.getByText('Finalizar y Guardar');
    fireEvent.click(finishButton);
    
    // Debería mostrar el diálogo de confirmación
    expect(mockOnShowDialog).toHaveBeenCalledWith(expect.objectContaining({
      title: '¿FINALIZAR SESIÓN?'
    }));
  });
});
