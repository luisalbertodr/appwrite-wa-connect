import { databases, DATABASE_ID } from '@/lib/appwrite';
import { ID, Query } from 'appwrite';
import type { RegistroAuditoria, RegistroAuditoriaInput, FiltrosAuditoria, EstadisticasAuditoria, AccionAuditoria, EntidadAuditoria } from '@/types/auditoria.types';

// Collection ID para auditoría
export const AUDITORIA_COLLECTION_ID = 'auditoria';

/**
 * Crear un registro de auditoría
 */
export async function crearRegistroAuditoria(empresaId: string, registro: RegistroAuditoriaInput): Promise<RegistroAuditoria> {
  try {
    const response = await databases.createDocument(
      DATABASE_ID,
      AUDITORIA_COLLECTION_ID,
      ID.unique(),
      {
        ...registro,
        empresa_id: empresaId
      }
    );

    return response as unknown as RegistroAuditoria;
  } catch (error) {
    console.error('Error al crear registro de auditoría:', error);
    throw error;
  }
}

/**
 * Obtener registros de auditoría con filtros
 */
export async function getRegistrosAuditoria(
  empresaId: string,
  filtros?: FiltrosAuditoria,
  limite: number = 100,
  offset: number = 0
): Promise<RegistroAuditoria[]> {
  try {
    const queries: string[] = [
      Query.equal('empresa_id', empresaId),
      Query.limit(limite),
      Query.offset(offset),
      Query.orderDesc('fecha_accion')
    ];

    if (filtros?.entidad_tipo) {
      queries.push(Query.equal('entidad_tipo', filtros.entidad_tipo));
    }

    if (filtros?.entidad_id) {
      queries.push(Query.equal('entidad_id', filtros.entidad_id));
    }

    if (filtros?.accion) {
      queries.push(Query.equal('accion', filtros.accion));
    }

    if (filtros?.usuario_id) {
      queries.push(Query.equal('usuario_id', filtros.usuario_id));
    }

    if (filtros?.modulo) {
      queries.push(Query.equal('modulo', filtros.modulo));
    }

    if (filtros?.fecha_desde) {
      queries.push(Query.greaterThanEqual('fecha_accion', filtros.fecha_desde));
    }

    if (filtros?.fecha_hasta) {
      queries.push(Query.lessThanEqual('fecha_accion', filtros.fecha_hasta));
    }

    if (filtros?.busqueda) {
      queries.push(Query.search('descripcion', filtros.busqueda));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      AUDITORIA_COLLECTION_ID,
      queries
    );

    return response.documents as unknown as RegistroAuditoria[];
  } catch (error) {
    console.error('Error al obtener registros de auditoría:', error);
    throw error;
  }
}

/**
 * Obtener historial de una entidad específica
 */
export async function getHistorialEntidad(
  empresaId: string,
  entidadTipo: EntidadAuditoria,
  entidadId: string,
  limite: number = 50
): Promise<RegistroAuditoria[]> {
  return getRegistrosAuditoria(
    empresaId,
    { entidad_tipo: entidadTipo, entidad_id: entidadId },
    limite
  );
}

/**
 * Obtener actividad de un usuario
 */
export async function getActividadUsuario(
  empresaId: string,
  usuarioId: string,
  fechaDesde?: string,
  fechaHasta?: string,
  limite: number = 100
): Promise<RegistroAuditoria[]> {
  return getRegistrosAuditoria(
    empresaId,
    { usuario_id: usuarioId, fecha_desde: fechaDesde, fecha_hasta: fechaHasta },
    limite
  );
}

/**
 * Obtener estadísticas de auditoría
 */
export async function getEstadisticasAuditoria(
  empresaId: string,
  fechaDesde?: string,
  fechaHasta?: string
): Promise<EstadisticasAuditoria> {
  try {
    const registros = await getRegistrosAuditoria(
      empresaId,
      { fecha_desde: fechaDesde, fecha_hasta: fechaHasta },
      1000 // Límite para estadísticas
    );

    // Calcular estadísticas
    const accionesPorTipo: Record<AccionAuditoria, number> = {} as any;
    const accionesPorEntidad: Record<EntidadAuditoria, number> = {} as any;
    const usuariosMap = new Map<string, { nombre: string; total: number }>();

    registros.forEach(registro => {
      // Contar por tipo de acción
      accionesPorTipo[registro.accion] = (accionesPorTipo[registro.accion] || 0) + 1;

      // Contar por tipo de entidad
      accionesPorEntidad[registro.entidad_tipo] = (accionesPorEntidad[registro.entidad_tipo] || 0) + 1;

      // Contar por usuario
      const usuario = usuariosMap.get(registro.usuario_id);
      if (usuario) {
        usuario.total++;
      } else {
        usuariosMap.set(registro.usuario_id, {
          nombre: registro.usuario_nombre,
          total: 1
        });
      }
    });

    // Convertir mapa de usuarios a array y ordenar
    const accionesPorUsuario = Array.from(usuariosMap.entries())
      .map(([usuario_id, data]) => ({
        usuario_id,
        usuario_nombre: data.nombre,
        total: data.total
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 10); // Top 10 usuarios más activos

    return {
      total_acciones: registros.length,
      acciones_por_tipo: accionesPorTipo,
      acciones_por_entidad: accionesPorEntidad,
      acciones_por_usuario: accionesPorUsuario,
      acciones_recientes: registros.slice(0, 10)
    };
  } catch (error) {
    console.error('Error al obtener estadísticas de auditoría:', error);
    throw error;
  }
}

/**
 * Helper: Auditar creación de entidad
 */
export async function auditarCreacion(
  empresaId: string,
  entidadTipo: EntidadAuditoria,
  entidadId: string,
  datosNuevos: any,
  usuarioId: string,
  usuarioNombre: string,
  usuarioEmail: string,
  modulo: string,
  descripcion?: string
): Promise<void> {
  const registro: RegistroAuditoriaInput = {
    entidad_tipo: entidadTipo,
    entidad_id: entidadId,
    accion: 'crear',
    usuario_id: usuarioId,
    usuario_nombre: usuarioNombre,
    usuario_email: usuarioEmail,
    descripcion: descripcion || `Creó ${entidadTipo} ${entidadId}`,
    datos_nuevos: JSON.stringify(datosNuevos),
    fecha_accion: new Date().toISOString(),
    modulo,
    ip_address: await getClientIP(),
    user_agent: navigator.userAgent
  };

  await crearRegistroAuditoria(empresaId, registro);
}

/**
 * Helper: Auditar actualización de entidad
 */
export async function auditarActualizacion(
  empresaId: string,
  entidadTipo: EntidadAuditoria,
  entidadId: string,
  datosAnteriores: any,
  datosNuevos: any,
  usuarioId: string,
  usuarioNombre: string,
  usuarioEmail: string,
  modulo: string,
  descripcion?: string
): Promise<void> {
  const registro: RegistroAuditoriaInput = {
    entidad_tipo: entidadTipo,
    entidad_id: entidadId,
    accion: 'actualizar',
    usuario_id: usuarioId,
    usuario_nombre: usuarioNombre,
    usuario_email: usuarioEmail,
    descripcion: descripcion || `Actualizó ${entidadTipo} ${entidadId}`,
    datos_anteriores: JSON.stringify(datosAnteriores),
    datos_nuevos: JSON.stringify(datosNuevos),
    fecha_accion: new Date().toISOString(),
    modulo,
    ip_address: await getClientIP(),
    user_agent: navigator.userAgent
  };

  await crearRegistroAuditoria(empresaId, registro);
}

/**
 * Helper: Auditar eliminación de entidad
 */
export async function auditarEliminacion(
  empresaId: string,
  entidadTipo: EntidadAuditoria,
  entidadId: string,
  datosAnteriores: any,
  usuarioId: string,
  usuarioNombre: string,
  usuarioEmail: string,
  modulo: string,
  descripcion?: string
): Promise<void> {
  const registro: RegistroAuditoriaInput = {
    entidad_tipo: entidadTipo,
    entidad_id: entidadId,
    accion: 'eliminar',
    usuario_id: usuarioId,
    usuario_nombre: usuarioNombre,
    usuario_email: usuarioEmail,
    descripcion: descripcion || `Eliminó ${entidadTipo} ${entidadId}`,
    datos_anteriores: JSON.stringify(datosAnteriores),
    fecha_accion: new Date().toISOString(),
    modulo,
    ip_address: await getClientIP(),
    user_agent: navigator.userAgent
  };

  await crearRegistroAuditoria(empresaId, registro);
}

/**
 * Helper: Obtener IP del cliente (mejor práctica sería hacerlo desde el backend)
 */
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.warn('No se pudo obtener la IP del cliente:', error);
    return 'unknown';
  }
}
