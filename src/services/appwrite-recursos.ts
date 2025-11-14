import { databases, DATABASE_ID, RECURSOS_COLLECTION_ID } from '@/lib/appwrite';
import { Recurso, LipooutUserInput } from '@/types';
import { ID, Query, Models } from 'appwrite';

export type CreateRecursoInput = LipooutUserInput<Recurso>;
export type UpdateRecursoInput = Partial<CreateRecursoInput>;

export const getRecursos = async (empresaId: string, soloActivos: boolean = true): Promise<(Recurso & Models.Document)[]> => {
  const queries = [
    Query.equal('empresa_id', empresaId),
    Query.limit(100)
  ];
  if (soloActivos) {
    queries.push(Query.equal('activo', true));
  }
  const response = await databases.listDocuments<Recurso & Models.Document>(
    DATABASE_ID,
    RECURSOS_COLLECTION_ID,
    queries
  );
  return response.documents;
};

export const createRecurso = (empresaId: string, recursoInput: CreateRecursoInput) => {
  const recursoToSave: any = {
    empresa_id: empresaId,
    ...recursoInput
  };
  
  // Limpiar campos undefined
  Object.keys(recursoToSave).forEach(key => {
    if (recursoToSave[key] === undefined) {
      delete recursoToSave[key];
    }
  });

  return databases.createDocument<Recurso & Models.Document>(
    DATABASE_ID,
    RECURSOS_COLLECTION_ID,
    ID.unique(),
    recursoToSave
  );
};

export const updateRecurso = async (empresaId: string, id: string, recursoInput: UpdateRecursoInput) => {
  // Verificar que el recurso pertenece a la empresa
  const recurso = await databases.getDocument(
    DATABASE_ID,
    RECURSOS_COLLECTION_ID,
    id
  );
  
  if (recurso.empresa_id !== empresaId) {
    throw new Error('Recurso no pertenece a la empresa');
  }

  const recursoToUpdate: any = { ...recursoInput };
  
  // Limpiar campos undefined
  Object.keys(recursoToUpdate).forEach(key => {
    if (recursoToUpdate[key] === undefined) {
      delete recursoToUpdate[key];
    }
  });

  return databases.updateDocument<Recurso & Models.Document>(
    DATABASE_ID,
    RECURSOS_COLLECTION_ID,
    id,
    recursoToUpdate
  );
};

export const deleteRecurso = async (empresaId: string, id: string) => {
  // Verificar que el recurso pertenece a la empresa
  const recurso = await databases.getDocument(
    DATABASE_ID,
    RECURSOS_COLLECTION_ID,
    id
  );
  
  if (recurso.empresa_id !== empresaId) {
    throw new Error('Recurso no pertenece a la empresa');
  }

  return databases.deleteDocument(
    DATABASE_ID,
    RECURSOS_COLLECTION_ID,
    id
  );
};
