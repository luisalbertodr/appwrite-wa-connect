import { databases, DATABASE_ID, NOTIFICACIONES_COLLECTION_ID } from '@/lib/appwrite';
import { Notificacion, TipoNotificacion, PrioridadNotificacion, FiltroNotificaciones, LipooutUserInput } from '@/types';
import { ID, Query, Models } from 'appwrite';

// Tipos Input
export type CreateNotificacionInput = LipooutUserInput<Notificacion>;
export type UpdateNotificacionInput = Partial<CreateNotificacionInput>;

// --- Funciones de Servicio ---

// OBTENER notificaciones por empleado (con filtros opcionales)
export const getNotificacionesByEmpleado = async (
  empresaId: string,
  empleadoId: string,
  filtros?: FiltroNotificaciones
): Promise<(Notificacion & Models.Document)[]> => {
  const queries = [
    Query.equal('empresa_id', empresaId),
    Query.orderDesc('fecha_creacion'),
    Query.limit(100)
  ];

  if (filtros?.solo_activas) {
    queries.push(Query.equal('activa', true));
  }

  if (filtros?.tipo) {
    queries.push(Query.equal('tipo', filtros.tipo));
  }

  if (filtros?.prioridad) {
    queries.push(Query.equal('prioridad', filtros.prioridad));
  }

  if (filtros?.desde_fecha) {
    queries.push(Query.greaterThanEqual('fecha_creacion', filtros.desde_fecha));
  }

  if (filtros?.hasta_fecha) {
    queries.push(Query.lessThanEqual('fecha_creacion', filtros.hasta_fecha));
  }

  const response = await databases.listDocuments<Notificacion & Models.Document>(
    DATABASE_ID,
    NOTIFICACIONES_COLLECTION_ID,
    queries
  );

  // Filtrar por empleado en el cliente (ya que destinatarios es un JSON string)
  let documents = response.documents.filter(notif => {
    try {
      const destinatarios = JSON.parse(notif.destinatarios);
      return Array.isArray(destinatarios) && destinatarios.includes(empleadoId);
    } catch {
      return false; // Si hay error parseando, excluir esta notificación
    }
  });

  // Filtrar no leídas si es necesario
  if (filtros?.solo_no_leidas) {
    documents = documents.filter(notif => {
      try {
        const leidaPor = JSON.parse(notif.leida_por);
        return !leidaPor.some((l: any) => l.empleado_id === empleadoId);
      } catch {
        return true; // Si hay error parseando, asumimos que no está leída
      }
    });
  }

  return documents;
};

// OBTENER notificaciones no leídas por empleado
export const getNotificacionesNoLeidas = async (empresaId: string, empleadoId: string): Promise<(Notificacion & Models.Document)[]> => {
  return getNotificacionesByEmpleado(empresaId, empleadoId, {
    solo_no_leidas: true,
    solo_activas: true
  });
};

// CONTAR notificaciones no leídas
export const contarNotificacionesNoLeidas = async (empresaId: string, empleadoId: string): Promise<number> => {
  const notificaciones = await getNotificacionesNoLeidas(empresaId, empleadoId);
  return notificaciones.length;
};

// OBTENER todas las notificaciones (admin)
export const getAllNotificaciones = async (empresaId: string, filtros?: FiltroNotificaciones): Promise<(Notificacion & Models.Document)[]> => {
  const queries = [
    Query.equal('empresa_id', empresaId),
    Query.orderDesc('fecha_creacion'),
    Query.limit(500)
  ];

  if (filtros?.solo_activas) {
    queries.push(Query.equal('activa', true));
  }

  if (filtros?.tipo) {
    queries.push(Query.equal('tipo', filtros.tipo));
  }

  if (filtros?.prioridad) {
    queries.push(Query.equal('prioridad', filtros.prioridad));
  }

  if (filtros?.desde_fecha) {
    queries.push(Query.greaterThanEqual('fecha_creacion', filtros.desde_fecha));
  }

  if (filtros?.hasta_fecha) {
    queries.push(Query.lessThanEqual('fecha_creacion', filtros.hasta_fecha));
  }

  const response = await databases.listDocuments<Notificacion & Models.Document>(
    DATABASE_ID,
    NOTIFICACIONES_COLLECTION_ID,
    queries
  );

  return response.documents;
};

// CREAR notificación
export const createNotificacion = (empresaId: string, newNotificacion: CreateNotificacionInput) => {
  return databases.createDocument<Notificacion & Models.Document>(
    DATABASE_ID,
    NOTIFICACIONES_COLLECTION_ID,
    ID.unique(),
    newNotificacion
  );
};

// MARCAR notificación como leída
export const marcarComoLeida = async (
  empresaId: string,
  notificacionId: string,
  empleadoId: string
): Promise<Notificacion & Models.Document> => {
  // Obtener notificación actual
  const notificacion = await databases.getDocument<Notificacion & Models.Document>(
    DATABASE_ID,
    NOTIFICACIONES_COLLECTION_ID,
    notificacionId
  );

  // Parsear leida_por con fallback y try/catch
  let leidaPor: any[] = [];
  try {
    leidaPor = JSON.parse(notificacion.leida_por || '[]');
  } catch (error) {
    console.error('Error parseando leida_por:', error);
    leidaPor = [];
  }
  
  // Verificar si ya está leída por este empleado
  if (leidaPor.some((l: any) => l.empleado_id === empleadoId)) {
    return notificacion; // Ya está leída
  }

  // Agregar registro de lectura
  leidaPor.push({
    empleado_id: empleadoId,
    fecha_lectura: new Date().toISOString()
  });

  // Actualizar notificación
  return databases.updateDocument<Notificacion & Models.Document>(
    DATABASE_ID,
    NOTIFICACIONES_COLLECTION_ID,
    notificacionId,
    {
      leida_por: JSON.stringify(leidaPor)
    }
  );
};

// MARCAR todas las notificaciones como leídas para un empleado
export const marcarTodasComoLeidas = async (empresaId: string, empleadoId: string): Promise<number> => {
  const notificaciones = await getNotificacionesNoLeidas(empresaId, empleadoId);
  
  let contador = 0;
  for (const notificacion of notificaciones) {
    await marcarComoLeida(empresaId, notificacion.$id, empleadoId);
    contador++;
  }
  
  return contador;
};

// DESACTIVAR notificación
export const desactivarNotificacion = (empresaId: string, notificacionId: string) => {
  return databases.updateDocument<Notificacion & Models.Document>(
    DATABASE_ID,
    NOTIFICACIONES_COLLECTION_ID,
    notificacionId,
    { activa: false }
  );
};

// ELIMINAR notificación
export const deleteNotificacion = (empresaId: string, notificacionId: string) => {
  return databases.deleteDocument(
    DATABASE_ID,
    NOTIFICACIONES_COLLECTION_ID,
    notificacionId
  );
};

// LIMPIAR notificaciones antiguas (ejemplo: más de 30 días)
export const limpiarNotificacionesAntiguas = async (empresaId: string, diasAntiguedad: number = 30): Promise<number> => {
  const fechaLimite = new Date();
  fechaLimite.setDate(fechaLimite.getDate() - diasAntiguedad);
  
  const response = await databases.listDocuments<Notificacion & Models.Document>(
    DATABASE_ID,
    NOTIFICACIONES_COLLECTION_ID,
    [
      Query.equal('empresa_id', empresaId),
      Query.lessThan('fecha_creacion', fechaLimite.toISOString()),
      Query.limit(500)
    ]
  );

  let contador = 0;
  for (const notificacion of response.documents) {
    await deleteNotificacion(empresaId, notificacion.$id);
    contador++;
  }
  
  return contador;
};

// --- Funciones Helper para Crear Notificaciones Específicas ---

// CREAR notificación de bono por vencer
export const crearNotificacionBonoPorVencer = (
  empresaId: string,
  clienteId: string,
  clienteNombre: string,
  bonoId: string,
  bonoNombre: string,
  diasRestantes: number,
  destinatarios: string[]
) => {
  return createNotificacion(empresaId, {
    empresa_id: empresaId,
    tipo: 'bono_por_vencer',
    titulo: 'Bono por vencer',
    mensaje: `El bono "${bonoNombre}" de ${clienteNombre} vence en ${diasRestantes} días`,
    prioridad: diasRestantes <= 3 ? 'alta' : 'media',
    destinatarios: JSON.stringify(destinatarios),
    referencia_tipo: 'bono',
    referencia_id: bonoId,
    leida_por: JSON.stringify([]),
    fecha_creacion: new Date().toISOString(),
    accionable: true,
    url_accion: `/clientes/${clienteId}`,
    activa: true
  });
};

// CREAR notificación de cita hoy
export const crearNotificacionCitaHoy = (
  empresaId: string,
  citaId: string,
  clienteNombre: string,
  hora: string,
  destinatarios: string[]
) => {
  return createNotificacion(empresaId, {
    empresa_id: empresaId,
    tipo: 'cita_hoy',
    titulo: 'Cita hoy',
    mensaje: `Cita con ${clienteNombre} a las ${hora}`,
    prioridad: 'alta',
    destinatarios: JSON.stringify(destinatarios),
    referencia_tipo: 'cita',
    referencia_id: citaId,
    leida_por: JSON.stringify([]),
    fecha_creacion: new Date().toISOString(),
    accionable: true,
    url_accion: `/agenda?cita=${citaId}`,
    activa: true
  });
};

// CREAR notificación de nueva sesión clínica
export const crearNotificacionNuevaSesion = (
  empresaId: string,
  sesionId: string,
  clienteNombre: string,
  empleadoNombre: string,
  destinatarios: string[]
) => {
  return createNotificacion(empresaId, {
    empresa_id: empresaId,
    tipo: 'nueva_sesion_clinica',
    titulo: 'Nueva sesión clínica registrada',
    mensaje: `${empleadoNombre} ha registrado una nueva sesión para ${clienteNombre}`,
    prioridad: 'baja',
    destinatarios: JSON.stringify(destinatarios),
    referencia_tipo: 'sesion',
    referencia_id: sesionId,
    leida_por: JSON.stringify([]),
    fecha_creacion: new Date().toISOString(),
    accionable: false,
    activa: true
  });
};

// CREAR notificación genérica
export const crearNotificacionGenerica = (
  empresaId: string,
  tipo: TipoNotificacion,
  titulo: string,
  mensaje: string,
  destinatarios: string[],
  prioridad: PrioridadNotificacion = 'media',
  referenciaTipo?: 'bono' | 'cita' | 'cliente' | 'articulo' | 'sesion',
  referenciaId?: string,
  urlAccion?: string
) => {
  return createNotificacion(empresaId, {
    empresa_id: empresaId,
    tipo,
    titulo,
    mensaje,
    prioridad,
    destinatarios: JSON.stringify(destinatarios),
    referencia_tipo: referenciaTipo,
    referencia_id: referenciaId,
    leida_por: JSON.stringify([]),
    fecha_creacion: new Date().toISOString(),
    accionable: !!urlAccion,
    url_accion: urlAccion,
    activa: true
  });
};
