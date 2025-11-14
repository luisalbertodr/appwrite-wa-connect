import { databases, DATABASE_ID, PROVEEDORES_COLLECTION_ID } from '@/lib/appwrite';
import { Proveedor, LipooutUserInput } from '@/types';
import { ID, Query, Models } from 'appwrite';

export type CreateProveedorInput = LipooutUserInput<Proveedor>;
export type UpdateProveedorInput = Partial<CreateProveedorInput>;

export const getProveedores = async (empresaId: string, soloActivos: boolean = true): Promise<(Proveedor & Models.Document)[]> => {
  const queries = [
    Query.equal('empresa_id', empresaId),
    Query.limit(100)
  ];
  if (soloActivos) {
    queries.push(Query.equal('activo', true));
  }
  const response = await databases.listDocuments<Proveedor & Models.Document>(
    DATABASE_ID,
    PROVEEDORES_COLLECTION_ID,
    queries
  );
  return response.documents;
};

export const createProveedor = (empresaId: string, proveedorInput: CreateProveedorInput) => {
  const proveedorToSave: any = { 
    ...proveedorInput,
    empresa_id: empresaId
  };
  
  // Limpiar campos undefined
  Object.keys(proveedorToSave).forEach(key => {
    if (proveedorToSave[key] === undefined) {
      delete proveedorToSave[key];
    }
  });

  return databases.createDocument<Proveedor & Models.Document>(
    DATABASE_ID,
    PROVEEDORES_COLLECTION_ID,
    ID.unique(),
    proveedorToSave
  );
};

export const updateProveedor = (empresaId: string, id: string, proveedorInput: UpdateProveedorInput) => {
  const proveedorToUpdate: any = { 
    ...proveedorInput,
    empresa_id: empresaId
  };
  
  // Limpiar campos undefined
  Object.keys(proveedorToUpdate).forEach(key => {
    if (proveedorToUpdate[key] === undefined) {
      delete proveedorToUpdate[key];
    }
  });

  return databases.updateDocument<Proveedor & Models.Document>(
    DATABASE_ID,
    PROVEEDORES_COLLECTION_ID,
    id,
    proveedorToUpdate
  );
};

export const deleteProveedor = (id: string) => {
  return databases.deleteDocument(
    DATABASE_ID,
    PROVEEDORES_COLLECTION_ID,
    id
  );
};
