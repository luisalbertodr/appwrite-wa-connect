import { databases, DATABASE_ID, EMPLEADOS_COLLECTION_ID } from '@/lib/appwrite';
import { Empleado, LipooutUserInput } from '@/types'; // Import LipooutUserInput
import { ID, Query, Models } from 'appwrite'; // Import Models

// Usamos el helper LipooutUserInput y excluimos nombre_completo ya que se genera automáticamente
export type CreateEmpleadoInput = LipooutUserInput<Omit<Empleado, 'nombre_completo'>>;
export type UpdateEmpleadoInput = Partial<CreateEmpleadoInput>;

export const getEmpleados = async (empresaId: string, soloActivos: boolean = true): Promise<Empleado[]> => {
  try {
    const queries = [
      Query.equal('empresa_id', empresaId),
      Query.limit(100)
    ];
    if (soloActivos) {
      queries.push(Query.equal('activo', true));
    }
    const response = await databases.listDocuments<Empleado>(
      DATABASE_ID,
      EMPLEADOS_COLLECTION_ID,
      queries
    );
    return response.documents;
  } catch (error: any) {
    // Si hay un error 400, probablemente sea porque no hay empleados o el atributo no existe
    if (error.code === 400) {
      console.warn('Error al obtener empleados (posiblemente no hay empleados o el esquema no está completo):', error);
      return []; // Retornar array vacío en lugar de fallar
    }
    throw error;
  }
};

export const createEmpleado = (empresaId: string, empleado: CreateEmpleadoInput) => {
  // Generar nombre_completo antes de guardar
  const empleadoCompleto = {
    ...empleado,
    empresa_id: empresaId,
    nombre_completo: `${empleado.nombre} ${empleado.apellidos}`.trim(),
  };
  return databases.createDocument<Empleado & Models.Document>(
    DATABASE_ID,
    EMPLEADOS_COLLECTION_ID,
    ID.unique(),
    empleadoCompleto
  );
};

export const updateEmpleado = (empresaId: string, id: string, empleado: UpdateEmpleadoInput) => {
   const empleadoCompleto: any = { 
     ...empleado,
     empresa_id: empresaId
   };
   if (empleado.nombre !== undefined || empleado.apellidos !== undefined) {
       empleadoCompleto.nombre_completo = `${empleado.nombre || ''} ${empleado.apellidos || ''}`.trim();
   }

  return databases.updateDocument<Empleado & Models.Document>(
    DATABASE_ID,
    EMPLEADOS_COLLECTION_ID,
    id,
    empleadoCompleto
  );
};

export const deleteEmpleado = (id: string) => {
  return databases.deleteDocument(
    DATABASE_ID,
    EMPLEADOS_COLLECTION_ID,
    id
  );
};
