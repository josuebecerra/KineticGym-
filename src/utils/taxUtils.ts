import { GymTaxConfig } from '../types';

/**
 * Generates a standard Costa Rican Electronic Invoice "Consecutivo" (20 digits)
 * Format: Casa Matriz (3) + Punto Venta (5) + Tipo Doc (2) + Secuencial (10)
 */
export const generateConsecutivo = (
  lastNumber: number, 
  docType: '01' | '02' | '03' = '01',
  casaMatriz: string = '001',
  puntoVenta: string = '00001'
): string => {
  const next = (lastNumber + 1).toString().padStart(10, '0');
  return `${casaMatriz}${puntoVenta}${docType}${next}`;
};

/**
 * Generates a standard Costa Rican Electronic Invoice "Clave" (50 digits)
 * Format: Pais (3) + Dia (2) + Mes (2) + Año (2) + Id (12) + Consecutivo (20) + Situacion (1) + Seg (8)
 */
export const generateClave = (
  config: GymTaxConfig, 
  consecutivo: string
): string => {
  const now = new Date();
  const pais = "506";
  const dia = now.getDate().toString().padStart(2, '0');
  const mes = (now.getMonth() + 1).toString().padStart(2, '0');
  const anio = now.getFullYear().toString().slice(-2);
  
  // Clean ID of dashes and pad to 12
  const idLimpia = config.id.replace(/-/g, '').padStart(12, '0');
  
  const situacion = "1"; // 1 = Normal
  
  // Security code: 8 random digits
  const seguridad = Math.floor(10000000 + Math.random() * 90000000).toString();
  
  return `${pais}${dia}${mes}${anio}${idLimpia}${consecutivo}${situacion}${seguridad}`;
};

/**
 * Calculates tax and totals
 * Default IVA in CR for gym services is 13%
 */
export const calculateInvoiceTotals = (amount: number, taxRate: number = 0.13) => {
  // Amount is usually the total the user pays in these simpler GYM apps, 
  // but standard invoicing usually treats 'price' as subtotal.
  // We will assume 'amount' is the TOTAL and calculate backwards or vice-versa.
  // For consistency with Kinetic pricing, we assume current price is TOTAL.
  
  const subtotal = amount / (1 + taxRate);
  const tax = amount - subtotal;
  
  return {
    subtotal: Number(subtotal.toFixed(2)),
    tax: Number(tax.toFixed(2)),
    total: Number(amount.toFixed(2))
  };
};

/**
 * Helper to get province name from code
 */
export const getProvinceName = (code: string): string => {
  const provinces: Record<string, string> = {
    '1': 'San José',
    '2': 'Alajuela',
    '3': 'Cartago',
    '4': 'Heredia',
    '5': 'Guanacaste',
    '6': 'Puntarenas',
    '7': 'Limón'
  };
  return provinces[code] || 'Desconocida';
};
