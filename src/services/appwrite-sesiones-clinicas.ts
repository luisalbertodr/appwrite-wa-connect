import { databases, storage, DATABASE_ID, SESIONES_CLINICAS_COLLECTION_ID, DOCUMENTOS_FIRMADOS_BUCKET_ID, FOTOS_SESIONES_BUCKET_ID } from '@/lib/appwrite';
import { SesionClinica, SesionClinicaInput } from '@/types';
import { ID, Query, Models } from 'appwrite';

// Tipos Input
export type UpdateSesionClinicaInput = Partial<SesionClinicaInput>;

// --- Funciones de Servicio ---

// OBTENER sesiones por cliente
export const getSesionesByCliente = async (empresaId: string, clienteId: string): Promise<(SesionClinica & Models.Document)[]> => {
  const response = await databases.listDocuments<SesionClinica & Models.Document>(
    DATABASE_ID,
    SESIONES_CLINICAS_COLLECTION_ID,
    [
      Query.equal('empresa_id', empresaId),
      Query.equal('cliente_id', clienteId),
      Query.orderDesc('fecha_sesion'),
      Query.limit(100)
    ]
  );
  return response.documents;
};

// OBTENER sesiones por empleado
export const getSesionesByEmpleado = async (empresaId: string, empleadoId: string): Promise<(SesionClinica & Models.Document)[]> => {
  const response = await databases.listDocuments<SesionClinica & Models.Document>(
    DATABASE_ID,
    SESIONES_CLINICAS_COLLECTION_ID,
    [
      Query.equal('empresa_id', empresaId),
      Query.equal('empleado_id', empleadoId),
      Query.orderDesc('fecha_sesion'),
      Query.limit(100)
    ]
  );
  return response.documents;
};

// OBTENER sesión por cita
export const getSesionByCita = async (empresaId: string, citaId: string): Promise<(SesionClinica & Models.Document) | null> => {
  const response = await databases.listDocuments<SesionClinica & Models.Document>(
    DATABASE_ID,
    SESIONES_CLINICAS_COLLECTION_ID,
    [
      Query.equal('empresa_id', empresaId),
      Query.equal('cita_id', citaId),
      Query.limit(1)
    ]
  );
  return response.documents[0] || null;
};

// OBTENER sesiones visibles para cliente (para portal de cliente futuro)
export const getSesionesVisiblesCliente = async (empresaId: string, clienteId: string): Promise<(SesionClinica & Models.Document)[]> => {
  const response = await databases.listDocuments<SesionClinica & Models.Document>(
    DATABASE_ID,
    SESIONES_CLINICAS_COLLECTION_ID,
    [
      Query.equal('empresa_id', empresaId),
      Query.equal('cliente_id', clienteId),
      Query.equal('visible_para_cliente', true),
      Query.orderDesc('fecha_sesion'),
      Query.limit(100)
    ]
  );
  return response.documents;
};

// CREAR sesión clínica
export const createSesionClinica = (empresaId: string, newSesion: SesionClinicaInput) => {
  return databases.createDocument<SesionClinica & Models.Document>(
    DATABASE_ID,
    SESIONES_CLINICAS_COLLECTION_ID,
    ID.unique(),
    {
      empresa_id: empresaId,
      ...newSesion
    }
  );
};

// ACTUALIZAR sesión clínica
export const updateSesionClinica = async (empresaId: string, { $id, data }: { $id: string, data: UpdateSesionClinicaInput }) => {
  // Verificar que la sesión pertenece a la empresa
  const sesion = await databases.getDocument(
    DATABASE_ID,
    SESIONES_CLINICAS_COLLECTION_ID,
    $id
  );
  
  if (sesion.empresa_id !== empresaId) {
    throw new Error('Sesión no pertenece a la empresa');
  }

  return databases.updateDocument<SesionClinica & Models.Document>(
    DATABASE_ID,
    SESIONES_CLINICAS_COLLECTION_ID,
    $id,
    data
  );
};

// ELIMINAR sesión clínica
export const deleteSesionClinica = async (empresaId: string, sesionId: string) => {
  // Verificar que la sesión pertenece a la empresa
  const sesion = await databases.getDocument(
    DATABASE_ID,
    SESIONES_CLINICAS_COLLECTION_ID,
    sesionId
  );
  
  if (sesion.empresa_id !== empresaId) {
    throw new Error('Sesión no pertenece a la empresa');
  }

  return databases.deleteDocument(
    DATABASE_ID,
    SESIONES_CLINICAS_COLLECTION_ID,
    sesionId
  );
};

// --- Funciones de Storage para Documentos Firmados ---

// SUBIR documento firmado
export const uploadDocumentoFirmado = async (
  file: File,
  sesionId: string
): Promise<Models.File> => {
  const fileId = `${sesionId}_${ID.unique()}`;
  return storage.createFile(
    DOCUMENTOS_FIRMADOS_BUCKET_ID,
    fileId,
    file
  );
};

// OBTENER URL de documento firmado
export const getDocumentoFirmadoUrl = (fileId: string): string => {
  return storage.getFileView(
    DOCUMENTOS_FIRMADOS_BUCKET_ID,
    fileId
  ).toString();
};

// ELIMINAR documento firmado
export const deleteDocumentoFirmado = (fileId: string) => {
  return storage.deleteFile(
    DOCUMENTOS_FIRMADOS_BUCKET_ID,
    fileId
  );
};

// --- Funciones de Storage para Fotos de Sesiones ---

// SUBIR foto de sesión
export const uploadFotoSesion = async (
  file: File,
  sesionId: string
): Promise<Models.File> => {
  const fileId = `${sesionId}_${ID.unique()}`;
  return storage.createFile(
    FOTOS_SESIONES_BUCKET_ID,
    fileId,
    file
  );
};

// OBTENER URL de foto de sesión
export const getFotoSesionUrl = (fileId: string): string => {
  return storage.getFileView(
    FOTOS_SESIONES_BUCKET_ID,
    fileId
  ).toString();
};

// ELIMINAR foto de sesión
export const deleteFotoSesion = (fileId: string) => {
  return storage.deleteFile(
    FOTOS_SESIONES_BUCKET_ID,
    fileId
  );
};

// --- Funciones de Análisis ---

// OBTENER estadísticas de sesiones de un cliente
export const getEstadisticasSesiones = async (empresaId: string, clienteId: string) => {
  const sesiones = await getSesionesByCliente(empresaId, clienteId);
  
  const totalSesiones = sesiones.length;
  const sesionesConDocumentos = sesiones.filter(s => {
    try {
      const docs = JSON.parse(s.documentos_ids);
      return docs.length > 0;
    } catch {
      return false;
    }
  }).length;
  
  const sesionesConFotos = sesiones.filter(s => {
    try {
      const fotos = JSON.parse(s.fotos_ids);
      return fotos.length > 0;
    } catch {
      return false;
    }
  }).length;

  const totalArticulosAplicados = sesiones.reduce((sum, s) => {
    try {
      const articulos = JSON.parse(s.articulos_aplicados);
      return sum + articulos.length;
    } catch {
      return sum;
    }
  }, 0);

  const serviciosAplicados = sesiones.reduce((sum, s) => {
    try {
      const articulos = JSON.parse(s.articulos_aplicados);
      return sum + articulos.filter((a: any) => a.articulo_tipo === 'servicio').length;
    } catch {
      return sum;
    }
  }, 0);

  const productosVendidos = sesiones.reduce((sum, s) => {
    try {
      const articulos = JSON.parse(s.articulos_aplicados);
      return sum + articulos.filter((a: any) => a.articulo_tipo === 'producto').length;
    } catch {
      return sum;
    }
  }, 0);

  return {
    totalSesiones,
    sesionesConDocumentos,
    sesionesConFotos,
    totalArticulosAplicados,
    serviciosAplicados,
    productosVendidos,
    ultimaSesion: sesiones[0]?.fecha_sesion || null
  };
};

// BUSCAR sesiones por rango de fechas
export const getSesionesByRangoFechas = async (
  empresaId: string,
  fechaInicio: string,
  fechaFin: string,
  empleadoId?: string
): Promise<(SesionClinica & Models.Document)[]> => {
  const queries = [
    Query.equal('empresa_id', empresaId),
    Query.greaterThanEqual('fecha_sesion', fechaInicio),
    Query.lessThanEqual('fecha_sesion', fechaFin),
    Query.orderDesc('fecha_sesion'),
    Query.limit(500)
  ];

  if (empleadoId) {
    queries.push(Query.equal('empleado_id', empleadoId));
  }

  const response = await databases.listDocuments<SesionClinica & Models.Document>(
    DATABASE_ID,
    SESIONES_CLINICAS_COLLECTION_ID,
    queries
  );
  return response.documents;
};
