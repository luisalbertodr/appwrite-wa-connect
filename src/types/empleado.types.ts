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
  
  // --- CAMPOS MULTIEMPRESA ---
  empresas_autorizadas?: string; // JSON string de EmpresaID[] (Ahora opcional para evitar error de required en Appwrite si viene vacío)
  empresa_activa_id?: string; // ID de la empresa seleccionada actualmente (contexto)
  // -------------------------

  // (Opcional) Campos para horarios
  // horario_lun?: string; // ej. "09:00-13:00,15:00-19:00"
  // horario_mar?: string;
  // ...
}

// Tipo de entrada para la creación/actualización de empleados
// Este tipo debe ser exportado para ser usado en EmpleadoForm
export type EmpleadoInput = Omit<Empleado, keyof LipooutDocument | 'nombre_completo'>;