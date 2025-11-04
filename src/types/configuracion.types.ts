import { LipooutDocument } from './index';

export interface HorarioLaboral {
  activo: boolean;
  horaInicio: string; // HH:mm
  horaFin: string;    // HH:mm
}

export interface Configuracion extends LipooutDocument {
  // Datos generales de la clínica
  nombre_clinica: string;
  cif: string;
  direccion: string;
  ciudad: string;
  codigo_postal: string;
  provincia: string;
  telefono: string;
  email: string;
  logo_url?: string;

  // Configuración de horarios
  horarios_lunes: HorarioLaboral;
  horarios_martes: HorarioLaboral;
  horarios_miercoles: HorarioLaboral;
  horarios_jueves: HorarioLaboral;
  horarios_viernes: HorarioLaboral;
  horarios_sabado: HorarioLaboral;
  horarios_domingo: HorarioLaboral;

  // Configuración de agenda
  duracion_slot_predeterminada: number; // minutos
  hora_inicio_agenda: string; // HH:mm
  hora_fin_agenda: string;    // HH:mm

  // Configuración de facturación
  tipo_iva_predeterminado: number; // ej: 21
  prefijo_facturas: string;        // ej: "FRA"
  prefijo_presupuestos: string;    // ej: "PRE"
  contador_facturas: number;
  contador_presupuestos: number;

  // Configuración WAHA/Marketing
  apiUrl?: string;
  apiKey?: string;
  session?: string;
  minDelayMs?: number;
  maxDelayMs?: number;
  batchSizeMin?: number;
  batchSizeMax?: number;
  batchDelayMsMin?: number;
  batchDelayMsMax?: number;
  adminPhoneNumbers?: string[];
  notificationInterval?: number;
  startTime?: string;
  endTime?: string;
}
