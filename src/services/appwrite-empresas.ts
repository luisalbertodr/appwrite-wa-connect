import { databases, DATABASE_ID, EMPRESAS_COLLECTION_ID } from '@/lib/appwrite';
import { Empresa, EmpresaInput } from '@/types';
import { ID, Query, Models } from 'appwrite';

// Tipo de entrada sin metadata de Appwrite para creación/actualización
export type CreateEmpresaInput = EmpresaInput;
export type UpdateEmpresaInput = Partial<EmpresaInput>;

// --- Funciones de Servicio ---

// OBTENER todas las empresas (solo accesible por administradores globales a nivel de Appwrite)
export const getEmpresas = async (): Promise<(Empresa & Models.Document)[]> => {
  const response = await databases.listDocuments<Empresa & Models.Document>(
    DATABASE_ID,
    EMPRESAS_COLLECTION_ID,
    [
      Query.limit(100),
      Query.orderAsc('nombre')
    ]
  );
  return response.documents;
};

// CREAR una nueva empresa
export const createEmpresa = (newEmpresa: CreateEmpresaInput) => {
  // NOTA: La creación de la configuración inicial (configuracion_id) debería 
  // ocurrir después de esta llamada, idealmente en una Appwrite Function.
  // Aquí solo creamos el registro de la empresa.
  return databases.createDocument<Empresa & Models.Document>(
    DATABASE_ID,
    EMPRESAS_COLLECTION_ID,
    ID.unique(),
    // Inyectamos un valor placeholder para configuracion_id
    { ...newEmpresa, configuracion_id: 'TEMP_' + ID.unique() } 
  );
};

// ACTUALIZAR una empresa
export const updateEmpresa = ({ id, data }: { id: string, data: UpdateEmpresaInput }) => {
  return databases.updateDocument<Empresa & Models.Document>(
    DATABASE_ID,
    EMPRESAS_COLLECTION_ID,
    id,
    data
  );
};

// ELIMINAR una empresa
export const deleteEmpresa = (id: string) => {
  // NOTA: La lógica para eliminar recursos asociados (clientes, citas, etc.) 
  // debería ser manejada por una Appwrite Function disparada por este evento.
  return databases.deleteDocument(
    DATABASE_ID,
    EMPRESAS_COLLECTION_ID,
    id
  );
};
