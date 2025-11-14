import { databases, DATABASE_ID, CONFIGURATION_COLLECTION_ID } from '@/lib/appwrite';
import { Configuracion, HorarioApertura } from '@/types';
import { Query, Models } from 'appwrite';

// Definimos el tipo de Input (basado en el setup)
export type UpdateConfigurationInput = Partial<{
  nombreClinica: string;
  direccion: string;
  cif2: string;
  emailContacto: string;
  telefonoContacto: string;
  serieFactura: string;
  seriePresupuesto: string;
  ultimoNumeroFactura: number;
  ultimoNumeroPresupuesto: number;
  tipoIvaPredeterminado: number;
  horarios: HorarioApertura[];
}>;

// Obtener la configuración de una empresa específica
export const getConfiguration = async (empresaId: string): Promise<Configuracion & Models.Document> => {
  try {
    // Buscar la configuración por empresa_id
    const response = await databases.listDocuments<Configuracion & Models.Document>(
        DATABASE_ID,
        CONFIGURATION_COLLECTION_ID,
        [
          Query.equal('empresa_id', empresaId),
          Query.limit(1)
        ]
    );
    
    if (response.documents.length > 0) {
        const doc = response.documents[0];
        // Deserializar horarios si existe como string
        if (doc.horarios && typeof doc.horarios === 'string') {
          try {
            doc.horarios = JSON.parse(doc.horarios as any) as HorarioApertura[];
          } catch {
            // Si falla el parse, dejar como array vacío
            doc.horarios = [];
          }
        }
        return doc;
    }
    
    // No lanzar error, simplemente retornar null o crear configuración por defecto
    // El componente deberá manejar la ausencia de configuración
    console.warn(`No se encontró configuración para la empresa ${empresaId}. Se creará una configuración por defecto.`);
    throw new Error(`No se encontró configuración para la empresa ${empresaId}`);
  } catch (error) {
     console.error('Error al obtener configuración:', error);
     throw error;
  }
};

// Actualizar la configuración
export const updateConfiguration = (empresaId: string, id: string, data: UpdateConfigurationInput) => {
  // Serializar horarios a JSON string si existe
  const dataToSend: any = { 
    ...data,
    empresa_id: empresaId
  };
  if (dataToSend.horarios) {
    dataToSend.horarios = JSON.stringify(dataToSend.horarios);
  }
  
  return databases.updateDocument<Configuracion & Models.Document>(
    DATABASE_ID,
    CONFIGURATION_COLLECTION_ID,
    id,
    dataToSend
  );
};
