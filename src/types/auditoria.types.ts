import { LipooutDocument } from './index';

// Tipos de acciones auditables
export type AccionAuditoria = 
  | 'crear'
  | 'actualizar'
  | 'eliminar'
  | 'ver'
  | 'exportar'
  | 'login'
  | 'logout'
  | 'cambio_permisos';

// Tipos de entidades auditables
export type EntidadAuditoria = 
  | 'cliente'
  | 'empleado'
  | 'cita'
  | 'factura'
  | 'articulo'
  | 'sesion_clinica'
  | 'plantilla_documento'
  | 'bono_cliente'
  | 'configuracion'
  | 'usuario'
  | 'permiso';

// Registro de auditoría (LEER desde Appwrite)
export interface RegistroAuditoria extends LipooutDocument {
  // Identificadores
  entidad_tipo: EntidadAuditoria;
  entidad_id: string; // ID del registro afectado
  accion: AccionAuditoria;
  
  // Usuario que realizó la acción
  usuario_id: string; // empleado_id o user_id
  usuario_nombre: string; // Nombre completo para búsqueda rápida
  usuario_email: string;
  
  // Detalles de la acción
  descripcion: string; // ej: "Creó cliente Juan Pérez"
  datos_anteriores?: string; // JSON con el estado anterior (para actualizaciones/eliminaciones)
  datos_nuevos?: string; // JSON con el estado nuevo (para creaciones/actualizaciones)
  
  // Metadatos técnicos
  ip_address?: string;
  user_agent?: string;
  
  // Fecha y hora
  fecha_accion: string; // ISO 8601 timestamp
  
  // Contexto adicional
  modulo: string; // ej: "agenda", "facturacion", "clientes"
  notas?: string; // Notas adicionales opcionales
}

// Tipo para CREAR registros de auditoría
export interface RegistroAuditoriaInput {
  entidad_tipo: EntidadAuditoria;
  entidad_id: string;
  accion: AccionAuditoria;
  usuario_id: string;
  usuario_nombre: string;
  usuario_email: string;
  descripcion: string;
  datos_anteriores?: string;
  datos_nuevos?: string;
  ip_address?: string;
  user_agent?: string;
  fecha_accion: string;
  modulo: string;
  notas?: string;
}

// Tipo para filtros de búsqueda
export interface FiltrosAuditoria {
  entidad_tipo?: EntidadAuditoria;
  entidad_id?: string;
  accion?: AccionAuditoria;
  usuario_id?: string;
  modulo?: string;
  fecha_desde?: string; // ISO 8601
  fecha_hasta?: string; // ISO 8601
  busqueda?: string; // Búsqueda en descripción
}

// Estadísticas de auditoría
export interface EstadisticasAuditoria {
  total_acciones: number;
  acciones_por_tipo: Record<AccionAuditoria, number>;
  acciones_por_entidad: Record<EntidadAuditoria, number>;
  acciones_por_usuario: Array<{
    usuario_id: string;
    usuario_nombre: string;
    total: number;
  }>;
  acciones_recientes: RegistroAuditoria[];
}
