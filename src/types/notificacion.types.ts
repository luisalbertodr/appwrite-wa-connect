import { LipooutDocument } from './index';

// Tipos de notificaciones disponibles
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

// Prioridad de la notificación
export type PrioridadNotificacion = 'alta' | 'media' | 'baja';

// Tipo para LEER notificaciones desde Appwrite
export interface Notificacion extends LipooutDocument {
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  prioridad: PrioridadNotificacion;
  
  // Destinatarios (JSON array de empleado_ids)
  destinatarios: string; // JSON de string[] (empleado_ids)
  
  // Referencia a entidad relacionada (opcional)
  referencia_tipo?: 'bono' | 'cita' | 'cliente' | 'articulo' | 'sesion';
  referencia_id?: string; // ID de la entidad relacionada
  
  // Control de lectura por destinatario (JSON)
  leida_por: string; // JSON de { empleado_id: string, fecha_lectura: string }[]
  
  // Metadatos
  fecha_creacion: string; // ISO 8601
  fecha_vencimiento?: string; // ISO 8601 - después de esta fecha se puede auto-eliminar
  accionable: boolean; // Si requiere acción del usuario
  url_accion?: string; // URL de navegación si es accionable (ej: "/clientes/123")
  
  activa: boolean; // Si está activa o fue descartada/resuelta
}

// Tipo para CREAR notificaciones
export interface NotificacionInput {
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  prioridad: PrioridadNotificacion;
  
  destinatarios: string; // JSON de string[]
  
  referencia_tipo?: 'bono' | 'cita' | 'cliente' | 'articulo' | 'sesion';
  referencia_id?: string;
  
  leida_por: string; // Inicialmente "[]"
  
  fecha_creacion: string;
  fecha_vencimiento?: string;
  accionable: boolean;
  url_accion?: string;
  
  activa: boolean;
}

// Tipo auxiliar para trabajar con notificaciones parseadas
export interface NotificacionConDatos extends Omit<Notificacion, 'destinatarios' | 'leida_por'> {
  destinatarios_data: string[];
  leida_por_data: { empleado_id: string; fecha_lectura: string }[];
}

// Tipo para filtros de notificaciones
export interface FiltroNotificaciones {
  empleado_id?: string; // Filtrar por destinatario
  tipo?: TipoNotificacion;
  prioridad?: PrioridadNotificacion;
  solo_no_leidas?: boolean;
  solo_activas?: boolean;
  desde_fecha?: string;
  hasta_fecha?: string;
}
