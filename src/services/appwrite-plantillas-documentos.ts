import { databases, storage, DATABASE_ID, PLANTILLAS_DOCUMENTOS_COLLECTION_ID, DOCUMENTOS_FIRMADOS_BUCKET_ID } from '../lib/appwrite';
import { ID, Query } from 'appwrite';
import type { PlantillaDocumento, PlantillaDocumentoInput, TipoPlantilla } from '../types/plantilla-documento.types';

/**
 * Obtener todas las plantillas de documentos
 */
export async function getAllPlantillas(soloActivas: boolean = false): Promise<PlantillaDocumento[]> {
  try {
    const queries = [Query.limit(100)];
    
    if (soloActivas) {
      queries.push(Query.equal('activa', true));
    }

    const response = await databases.listDocuments(
      DATABASE_ID,
      PLANTILLAS_DOCUMENTOS_COLLECTION_ID,
      queries
    );

    return response.documents.map(doc => ({
      $id: doc.$id,
      nombre: doc.nombre,
      tipo: doc.tipo,
      descripcion: doc.descripcion,
      contenido: doc.contenido,
      campos: doc.campos || '[]',
      archivo_base_id: doc.archivo_base_id,
      activa: doc.activa,
      requiere_firma: doc.requiere_firma,
      version: doc.version,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
      $permissions: doc.$permissions,
      $databaseId: doc.$databaseId,
      $collectionId: doc.$collectionId,
      $sequence: doc.$sequence || 0
    }));
  } catch (error) {
    console.error('Error al obtener plantillas:', error);
    throw error;
  }
}

/**
 * Obtener una plantilla por ID
 */
export async function getPlantillaById(id: string): Promise<PlantillaDocumento> {
  try {
    const doc = await databases.getDocument(
      DATABASE_ID,
      PLANTILLAS_DOCUMENTOS_COLLECTION_ID,
      id
    );

    return {
      $id: doc.$id,
      nombre: doc.nombre,
      tipo: doc.tipo,
      descripcion: doc.descripcion,
      contenido: doc.contenido,
      campos: doc.campos || '[]',
      archivo_base_id: doc.archivo_base_id,
      activa: doc.activa,
      requiere_firma: doc.requiere_firma,
      version: doc.version,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
      $permissions: doc.$permissions,
      $databaseId: doc.$databaseId,
      $collectionId: doc.$collectionId,
      $sequence: doc.$sequence || 0
    };
  } catch (error) {
    console.error('Error al obtener plantilla:', error);
    throw error;
  }
}

/**
 * Obtener plantillas por tipo
 */
export async function getPlantillasByTipo(tipo: TipoPlantilla): Promise<PlantillaDocumento[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PLANTILLAS_DOCUMENTOS_COLLECTION_ID,
      [Query.equal('tipo', tipo), Query.equal('activa', true)]
    );

    return response.documents.map(doc => ({
      $id: doc.$id,
      nombre: doc.nombre,
      tipo: doc.tipo,
      descripcion: doc.descripcion,
      contenido: doc.contenido,
      campos: doc.campos || '[]',
      archivo_base_id: doc.archivo_base_id,
      activa: doc.activa,
      requiere_firma: doc.requiere_firma,
      version: doc.version,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
      $permissions: doc.$permissions,
      $databaseId: doc.$databaseId,
      $collectionId: doc.$collectionId,
      $sequence: doc.$sequence || 0
    }));
  } catch (error) {
    console.error('Error al obtener plantillas por tipo:', error);
    throw error;
  }
}

/**
 * Crear una nueva plantilla
 */
export async function createPlantilla(plantilla: PlantillaDocumentoInput): Promise<PlantillaDocumento> {
  try {
    const data = {
      nombre: plantilla.nombre,
      tipo: plantilla.tipo,
      descripcion: plantilla.descripcion || '',
      contenido: plantilla.contenido,
      campos: plantilla.campos || '[]',
      archivo_base_id: plantilla.archivo_base_id || null,
      activa: plantilla.activa !== undefined ? plantilla.activa : true,
      requiere_firma: plantilla.requiere_firma !== undefined ? plantilla.requiere_firma : true,
      version: plantilla.version || '1.0'
    };

    const response = await databases.createDocument(
      DATABASE_ID,
      PLANTILLAS_DOCUMENTOS_COLLECTION_ID,
      ID.unique(),
      data
    );

    return {
      $id: response.$id,
      nombre: response.nombre,
      tipo: response.tipo,
      descripcion: response.descripcion,
      contenido: response.contenido,
      campos: response.campos,
      archivo_base_id: response.archivo_base_id,
      activa: response.activa,
      requiere_firma: response.requiere_firma,
      version: response.version,
      $createdAt: response.$createdAt,
      $updatedAt: response.$updatedAt,
      $permissions: response.$permissions,
      $databaseId: response.$databaseId,
      $collectionId: response.$collectionId,
      $sequence: response.$sequence || 0
    };
  } catch (error) {
    console.error('Error al crear plantilla:', error);
    throw error;
  }
}

/**
 * Actualizar una plantilla
 */
export async function updatePlantilla(id: string, plantilla: Partial<PlantillaDocumentoInput>): Promise<PlantillaDocumento> {
  try {
    const data: any = {};
    
    if (plantilla.nombre !== undefined) data.nombre = plantilla.nombre;
    if (plantilla.tipo !== undefined) data.tipo = plantilla.tipo;
    if (plantilla.descripcion !== undefined) data.descripcion = plantilla.descripcion;
    if (plantilla.contenido !== undefined) data.contenido = plantilla.contenido;
    if (plantilla.campos !== undefined) data.campos = plantilla.campos;
    if (plantilla.archivo_base_id !== undefined) data.archivo_base_id = plantilla.archivo_base_id;
    if (plantilla.activa !== undefined) data.activa = plantilla.activa;
    if (plantilla.requiere_firma !== undefined) data.requiere_firma = plantilla.requiere_firma;
    if (plantilla.version !== undefined) data.version = plantilla.version;

    const response = await databases.updateDocument(
      DATABASE_ID,
      PLANTILLAS_DOCUMENTOS_COLLECTION_ID,
      id,
      data
    );

    return {
      $id: response.$id,
      nombre: response.nombre,
      tipo: response.tipo,
      descripcion: response.descripcion,
      contenido: response.contenido,
      campos: response.campos,
      archivo_base_id: response.archivo_base_id,
      activa: response.activa,
      requiere_firma: response.requiere_firma,
      version: response.version,
      $createdAt: response.$createdAt,
      $updatedAt: response.$updatedAt,
      $permissions: response.$permissions,
      $databaseId: response.$databaseId,
      $collectionId: response.$collectionId,
      $sequence: response.$sequence || 0
    };
  } catch (error) {
    console.error('Error al actualizar plantilla:', error);
    throw error;
  }
}

/**
 * Desactivar una plantilla (en lugar de eliminarla)
 */
export async function desactivarPlantilla(id: string): Promise<PlantillaDocumento> {
  try {
    return await updatePlantilla(id, { activa: false });
  } catch (error) {
    console.error('Error al desactivar plantilla:', error);
    throw error;
  }
}

/**
 * Eliminar una plantilla
 */
export async function deletePlantilla(id: string): Promise<void> {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      PLANTILLAS_DOCUMENTOS_COLLECTION_ID,
      id
    );
  } catch (error) {
    console.error('Error al eliminar plantilla:', error);
    throw error;
  }
}

/**
 * Rellenar plantilla con datos
 */
export function rellenarPlantilla(
  plantilla: PlantillaDocumento,
  datos: Record<string, any>
): string {
  try {
    let contenidoRellenado = plantilla.contenido;

    // Parsear campos de la plantilla
    const campos = JSON.parse(plantilla.campos);

    // Reemplazar cada campo en el contenido
    campos.forEach((campo: any) => {
      const valor = datos[campo.clave] || campo.valor_por_defecto || '';
      const regex = new RegExp(`{{${campo.clave}}}`, 'g');
      contenidoRellenado = contenidoRellenado.replace(regex, valor);
    });

    // Reemplazar cualquier otro placeholder con datos directos
    Object.keys(datos).forEach(clave => {
      const regex = new RegExp(`{{${clave}}}`, 'g');
      contenidoRellenado = contenidoRellenado.replace(regex, datos[clave] || '');
    });

    return contenidoRellenado;
  } catch (error) {
    console.error('Error al rellenar plantilla:', error);
    return plantilla.contenido;
  }
}

/**
 * Subir archivo base de plantilla (ej: PDF vacío para rellenar)
 */
export async function uploadArchivoBasePlantilla(
  file: File,
  plantillaId: string
): Promise<string> {
  try {
    const response = await storage.createFile(
      DOCUMENTOS_FIRMADOS_BUCKET_ID,
      ID.unique(),
      file
    );

    // Actualizar la plantilla con el ID del archivo
    await updatePlantilla(plantillaId, {
      archivo_base_id: response.$id
    });

    return response.$id;
  } catch (error) {
    console.error('Error al subir archivo base:', error);
    throw error;
  }
}

/**
 * Obtener URL del archivo base de una plantilla
 */
export function getArchivoBasePlantillaUrl(archivoId: string): string {
  try {
    const result = storage.getFileView(
      DOCUMENTOS_FIRMADOS_BUCKET_ID,
      archivoId
    );
    return result.toString();
  } catch (error) {
    console.error('Error al obtener URL del archivo base:', error);
    throw error;
  }
}

/**
 * Duplicar plantilla (crear nueva versión)
 */
export async function duplicarPlantilla(
  plantillaId: string,
  nuevoNombre?: string
): Promise<PlantillaDocumento> {
  try {
    const plantillaOriginal = await getPlantillaById(plantillaId);

    const nuevaPlantilla: PlantillaDocumentoInput = {
      nombre: nuevoNombre || `${plantillaOriginal.nombre} (Copia)`,
      tipo: plantillaOriginal.tipo,
      descripcion: plantillaOriginal.descripcion,
      contenido: plantillaOriginal.contenido,
      campos: plantillaOriginal.campos,
      archivo_base_id: plantillaOriginal.archivo_base_id,
      activa: false, // La copia empieza desactivada por seguridad
      requiere_firma: plantillaOriginal.requiere_firma,
      version: '1' // Nueva versión empieza en '1' como string
    };

    return await createPlantilla(nuevaPlantilla);
  } catch (error) {
    console.error('Error al duplicar plantilla:', error);
    throw error;
  }
}

/**
 * Obtener campos requeridos de una plantilla
 */
export function getCamposRequeridos(plantilla: PlantillaDocumento): any[] {
  try {
    const campos = JSON.parse(plantilla.campos);
    return campos.filter((campo: any) => campo.requerido);
  } catch (error) {
    console.error('Error al obtener campos requeridos:', error);
    return [];
  }
}

/**
 * Validar datos contra plantilla
 */
export function validarDatosPlantilla(
  plantilla: PlantillaDocumento,
  datos: Record<string, any>
): { valido: boolean; errores: string[] } {
  const errores: string[] = [];

  try {
    const campos = JSON.parse(plantilla.campos);

    // Validar campos requeridos
    campos.forEach((campo: any) => {
      if (campo.requerido && !datos[campo.clave]) {
        errores.push(`El campo "${campo.nombre}" es requerido`);
      }

      // Validar tipo de dato si está especificado
      if (datos[campo.clave]) {
        const valor = datos[campo.clave];
        
        switch (campo.tipo) {
          case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(valor)) {
              errores.push(`El campo "${campo.nombre}" debe ser un email válido`);
            }
            break;
          
          case 'numero':
            if (isNaN(Number(valor))) {
              errores.push(`El campo "${campo.nombre}" debe ser un número`);
            }
            break;
          
          case 'fecha':
            const fecha = new Date(valor);
            if (isNaN(fecha.getTime())) {
              errores.push(`El campo "${campo.nombre}" debe ser una fecha válida`);
            }
            break;
          
          case 'telefono':
            const telefonoRegex = /^[+]?[\d\s()-]{9,}$/;
            if (!telefonoRegex.test(valor)) {
              errores.push(`El campo "${campo.nombre}" debe ser un teléfono válido`);
            }
            break;
        }
      }
    });

    return {
      valido: errores.length === 0,
      errores
    };
  } catch (error) {
    console.error('Error al validar datos de plantilla:', error);
    return {
      valido: false,
      errores: ['Error al validar los datos']
    };
  }
}
