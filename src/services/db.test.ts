import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { approveMembership, cancelMembership } from './db';
import * as firestore from 'firebase/firestore';

// Mocking the entire firestore module
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  doc: vi.fn(),
  getDoc: vi.fn(),
  updateDoc: vi.fn(),
  arrayUnion: vi.fn(),
  collection: vi.fn(),
}));

// Mocking our firebase lib
vi.mock('../lib/firebase', () => ({
  db: {},
  auth: {},
  storage: {},
  functions: {},
}));

vi.mock('../services/db', async () => {
  const actual = await vi.importActual('../services/db') as any;
  return {
    ...actual,
  };
});

describe('Database Services', () => {
  const fixedDate = new Date('2026-01-01T00:00:00Z');

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(fixedDate);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('approveMembership debe calcular correctamente la fecha de fin (1 mes)', async () => {
    const mockUser = {
      exists: () => true,
      data: () => ({
        subscription: null
      })
    };
    
    vi.mocked(firestore.getDoc).mockResolvedValue(mockUser as any);
    
    vi.mocked(firestore.doc).mockReturnValue({} as any);
    
    await approveMembership('user123', '1month');
    
    expect(firestore.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        subscription: expect.objectContaining({
          planId: '1month',
          status: 'active'
        })
      })
    );
    
    const callArgs = vi.mocked(firestore.updateDoc).mock.calls[0][1] as any;
    const startDate = new Date(callArgs.subscription.startDate);
    const endDate = new Date(callArgs.subscription.endDate);
    
    // Verificar que hay aprox 1 mes de diferencia
    const diffMonths = (endDate.getFullYear() - startDate.getFullYear()) * 12 + (endDate.getMonth() - startDate.getMonth());
    expect(diffMonths).toBe(1);
  });

  it('approveMembership debe extender una membresía activa', async () => {
    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 1);
    
    const mockUser = {
      exists: () => true,
      data: () => ({
        subscription: {
          status: 'active',
          endDate: futureDate.toISOString(),
          planId: '1month'
        }
      })
    };
    
    vi.mocked(firestore.getDoc).mockResolvedValue(mockUser as any);
    
    await approveMembership('user123', '1month');
    
    const callArgs = vi.mocked(firestore.updateDoc).mock.calls[0][1] as any;
    expect(callArgs.subscription.startDate).toBe(futureDate.toISOString());
  });

  it('cancelMembership debe cambiar el estado a canceled y guardar el motivo', async () => {
    const mockUser = {
      exists: () => true,
      data: () => ({
        subscription: {
          status: 'active',
          startDate: '2026-01-01T00:00:00.000Z',
          endDate: '2026-02-01T00:00:00.000Z',
          planId: '1month'
        },
        subscriptionHistory: []
      })
    };
    
    vi.mocked(firestore.getDoc).mockResolvedValue(mockUser as any);
    
    vi.mocked(firestore.doc).mockReturnValue({} as any);
    
    await cancelMembership('user123', 'Impago');
    
    expect(firestore.updateDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        subscription: expect.objectContaining({
          status: 'canceled',
          cancelReason: 'Impago'
        })
      })
    );
  });
});
