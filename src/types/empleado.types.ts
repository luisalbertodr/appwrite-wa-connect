import { LipooutDocument } from './index';

export type RolEmpleado = 'Admin' | 'Médico' | 'Recepción' | 'Lectura' | 'Esteticista';

export interface Empleado extends LipooutDocument {
  nombre: string;
  apellidos: string;
  nombre_completo: string; // Generado automáticamente
  email: string; // Usado para login?
  telefono?: string;
  rol: RolEmpleado;
  activo: boolean;
  color?: string; // Color hex para identificar visualmente al empleado en la agenda
  notificaciones_habilitadas: boolean; // Si el empleado recibe notificaciones
}
