import { databases, DATABASE_ID, APARATOS_COLLECTION_ID } from '@/lib/appwrite';
import { Aparato, LipooutUserInput } from '@/types';
import { ID, Query, Models } from 'appwrite';

export type CreateAparatoInput = LipooutUserInput<Aparato>;
export type UpdateAparatoInput = Partial<CreateAparatoInput>;

export const getAparatos = async (empresaId: string, soloActivos: boolean = true): Promise<(Aparato & Models.Document)[]> => {
  const queries = [
    Query.equal('empresa_id', empresaId),
    Query.limit(100)
  ];
  if (soloActivos) {
    queries.push(Query.equal('activo', true));
  }
  const response = await databases.listDocuments<Aparato & Models.Document>(
    DATABASE_ID,
    APARATOS_COLLECTION_ID,
    queries
  );
  return response.documents;
};

export const createAparato = (empresaId: string, aparatoInput: CreateAparatoInput) => {
  const aparatoToSave: any = { 
    ...aparatoInput,
    empresa_id: empresaId
  };
  
  // Limpiar campos undefined
  Object.keys(aparatoToSave).forEach(key => {
    if (aparatoToSave[key] === undefined) {
      delete aparatoToSave[key];
    }
  });

  return databases.createDocument<Aparato & Models.Document>(
    DATABASE_ID,
    APARATOS_COLLECTION_ID,
    ID.unique(),
    aparatoToSave
  );
};

export const updateAparato = (empresaId: string, id: string, aparatoInput: UpdateAparatoInput) => {
  const aparatoToUpdate: any = { 
    ...aparatoInput,
    empresa_id: empresaId
  };
  
  // Limpiar campos undefined
  Object.keys(aparatoToUpdate).forEach(key => {
    if (aparatoToUpdate[key] === undefined) {
      delete aparatoToUpdate[key];
    }
  });

  return databases.updateDocument<Aparato & Models.Document>(
    DATABASE_ID,
    APARATOS_COLLECTION_ID,
    id,
    aparatoToUpdate
  );
};

export const deleteAparato = (empresaId: string, id: string) => {
  return databases.deleteDocument(
    DATABASE_ID,
    APARATOS_COLLECTION_ID,
    id
  );
};
