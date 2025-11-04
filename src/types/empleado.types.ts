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
  // (Opcional) Campos para horarios
  // horario_lun?: string; // ej. "09:00-13:00,15:00-19:00"
  // horario_mar?: string;
  // ...
}
