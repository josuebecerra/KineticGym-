import { describe, it, expect } from 'vitest';
import { formatKineticDate } from '../../../src/utils/date';

describe('formatKineticDate', () => {
  it('debe formatear una fecha correctamente al estilo profesional', () => {
    const date = new Date(2026, 3, 10); // 10 de abril (mes 3 es abril en JS)
    const formatted = formatKineticDate(date);
    expect(formatted).toBe('10 de Abril, 2026');
  });

  it('debe formatear correctamente en modo corto', () => {
    const date = new Date(2026, 3, 10);
    const formatted = formatKineticDate(date, { short: true });
    expect(formatted).toBe('10 ABR');
  });

  it('debe manejar entradas nulas o indefinidas', () => {
    expect(formatKineticDate(null)).toBe('Fecha desconocida');
    expect(formatKineticDate(undefined)).toBe('Fecha desconocida');
  });

  it('debe manejar strings ISO correctamente', () => {
    const isoString = '2026-04-10T12:00:00Z';
    const formatted = formatKineticDate(isoString);
    // Nota: El resultado puede variar ligeramente por zona horaria en el test, 
    // pero verificamos que al menos devuelva una fecha válida.
    expect(formatted).toContain('Abril, 2026');
  });
});
