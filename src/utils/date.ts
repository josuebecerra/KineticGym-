/**
 * Utilidades de fecha centralizadas para Kinetic Gym
 * Maneja la conversión de Timestamps de Firestore, strings ISO y fallbacks.
 */

export type KineticDateInput = any; // Can be string, Timestamp, or Date

/**
 * Formatea una fecha al estilo "Profesional": 03 de Abril, 2026
 * Opcionalmente puede recibir un formato corto si se requiere.
 */
export const formatKineticDate = (dateInput: KineticDateInput, options: { short?: boolean } = {}): string => {
  if (!dateInput) return 'Fecha desconocida';

  let date: Date;

  try {
    // 1. Manejar Timestamp de Firestore (tiene método toDate)
    if (typeof dateInput === 'object' && 'toDate' in dateInput) {
      date = (dateInput as any).toDate();
    } 
    // 2. Manejar objeto Date puro
    else if (dateInput instanceof Date) {
      date = dateInput;
    } 
    // 3. Manejar string
    else if (typeof dateInput === 'string') {
      const parsed = new Date(dateInput);
      if (isNaN(parsed.getTime())) {
        // Si no se puede parsear (ej. "3 abr"), devolvemos el string original como fallback seguro
        return dateInput;
      }
      date = parsed;
    } 
    else {
      return 'Fecha no válida';
    }

    // Formateo según la opción elegida (Opción B: Profesional)
    if (options.short) {
      return date.toLocaleDateString('es-ES', { 
        day: '2-digit', 
        month: 'short' 
      }).toUpperCase();
    }

    const day = date.toLocaleDateString('es-ES', { day: '2-digit' });
    const month = date.toLocaleDateString('es-ES', { month: 'long' });
    const year = date.getFullYear();

    // Capitalizar mes
    const capitalMonth = month.charAt(0).toUpperCase() + month.slice(1);

    return `${day} de ${capitalMonth}, ${year}`;
  } catch (error) {
    console.error("Error formateando fecha:", error);
    return typeof dateInput === 'string' ? dateInput : 'Error de fecha';
  }
};

/**
 * Parsea una fecha a ISO string para almacenamiento estándar en Firestore
 */
export const toKineticISO = (date: Date = new Date()): string => {
  return date.toISOString();
};
