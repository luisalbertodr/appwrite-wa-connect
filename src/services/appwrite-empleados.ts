import { databases, DATABASE_ID, EMPLEADOS_COLLECTION_ID } from '@/lib/appwrite';
import { Empleado, LipooutUserInput } from '@/types';
import { ID, Query, Models } from 'appwrite';

export type CreateEmpleadoInput = LipooutUserInput<Empleado>;
export type UpdateEmpleadoInput = Partial<CreateEmpleadoInput>;

export const getEmpleados = async (soloActivos: boolean = true): Promise<Empleado[]> => {
  const queries = [Query.limit(100)];
  if (soloActivos) {
    queries.push(Query.equal('activo', true));
  }
  const response = await databases.listDocuments<Empleado>(
    DATABASE_ID,
    EMPLEADOS_COLLECTION_ID,
    queries
  );
  return response.documents;
};

export const createEmpleado = (empleado: CreateEmpleadoInput) => {
  const empleadoCompleto = {
    ...empleado,
    nombre_completo: `${empleado.nombre} ${empleado.apellidos}`.trim(),
  };
  return databases.createDocument<Empleado & Models.Document>(
    DATABASE_ID,
    EMPLEADOS_COLLECTION_ID,
    ID.unique(),
    empleadoCompleto
  );
};

export const updateEmpleado = (id: string, empleado: UpdateEmpleadoInput) => {
   const empleadoCompleto = { ...empleado };
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
  return databases.deleteDocument(DATABASE_ID, EMPLEADOS_COLLECTION_ID, id);
};
