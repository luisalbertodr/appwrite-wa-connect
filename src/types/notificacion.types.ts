import { LipooutDocument } from './index';

export type TipoNotificacion =
  | 'bono_por_vencer'
  | 'bono_vencido'
  | 'cita_hoy'
  | 'cita_manana'
  | 'cliente_sin_actividad'
  | 'stock_bajo'
  | 'nueva_sesion_clinica'
  | 'documento_pendiente'
  | 'otro';

export type PrioridadNotificacion = 'alta' | 'media' | 'baja';

export interface Notificacion extends LipooutDocument {
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  prioridad: PrioridadNotificacion;

  destinatarios: string; // JSON de string[]

  referencia_tipo?: 'bono' | 'cita' | 'cliente' | 'articulo' | 'sesion';
  referencia_id?: string;

  leida_por: string; // JSON de { empleado_id: string, fecha_lectura: string }[]

  fecha_creacion: string;
  fecha_vencimiento?: string;
  accionable: boolean;
  url_accion?: string;

  activa: boolean;
}

export interface NotificacionInput {
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  prioridad: PrioridadNotificacion;

  destinatarios: string;

  referencia_tipo?: 'bono' | 'cita' | 'cliente' | 'articulo' | 'sesion';
  referencia_id?: string;

  leida_por: string;

  fecha_creacion: string;
  fecha_vencimiento?: string;
  accionable: boolean;
  url_accion?: string;

  activa: boolean;
}

export interface NotificacionConDatos extends Omit<Notificacion, 'destinatarios' | 'leida_por'> {
  destinatarios_data: string[];
  leida_por_data: { empleado_id: string; fecha_lectura: string }[];
}

export interface FiltroNotificaciones {
  empleado_id?: string;
  tipo?: TipoNotificacion;
  prioridad?: PrioridadNotificacion;
  solo_no_leidas?: boolean;
  solo_activas?: boolean;
  desde_fecha?: string;
  hasta_fecha?: string;
}
