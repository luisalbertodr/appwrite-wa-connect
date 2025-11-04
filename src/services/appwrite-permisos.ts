import { databases, DATABASE_ID, PERMISOS_COLLECTION_ID } from '../lib/appwrite';
import { ID, Query } from 'appwrite';
import type { Permiso, PermisoInput, RolEmpleado } from '../types/permiso.types';
import { PERMISOS_POR_ROL } from '../types/permiso.types';

/**
 * Obtener permisos de un empleado por su ID
 */
export async function getPermisosByEmpleado(empleadoId: string): Promise<Permiso | null> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PERMISOS_COLLECTION_ID,
      [Query.equal('empleado_id', empleadoId), Query.limit(1)]
    );

    if (response.documents.length === 0) {
      return null;
    }

    const doc = response.documents[0];
    return {
      $id: doc.$id,
      empleado_id: doc.empleado_id,
      rol: doc.rol,
      ver_datos_clinicos: doc.ver_datos_clinicos || false,
      editar_datos_clinicos: doc.editar_datos_clinicos || false,
      ver_bonos: doc.ver_bonos || false,
      gestionar_bonos: doc.gestionar_bonos || false,
      ver_facturas: doc.ver_facturas || false,
      editar_facturas: doc.editar_facturas || false,
      ver_agenda: doc.ver_agenda || false,
      gestionar_agenda: doc.gestionar_agenda || false,
      ver_clientes: doc.ver_clientes || false,
      editar_clientes: doc.editar_clientes || false,
      ver_articulos: doc.ver_articulos || false,
      editar_articulos: doc.editar_articulos || false,
      acceso_configuracion: doc.acceso_configuracion || false,
      acceso_reportes: doc.acceso_reportes || false,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
      $permissions: doc.$permissions,
      $databaseId: doc.$databaseId,
      $collectionId: doc.$collectionId,
      $sequence: doc.$sequence || 0
    };
  } catch (error) {
    console.error('Error al obtener permisos:', error);
    throw error;
  }
}

/**
 * Obtener todos los permisos
 */
export async function getAllPermisos(): Promise<Permiso[]> {
  try {
    const response = await databases.listDocuments(
      DATABASE_ID,
      PERMISOS_COLLECTION_ID,
      [Query.limit(100)]
    );

    return response.documents.map(doc => ({
      $id: doc.$id,
      empleado_id: doc.empleado_id,
      rol: doc.rol,
      ver_datos_clinicos: doc.ver_datos_clinicos || false,
      editar_datos_clinicos: doc.editar_datos_clinicos || false,
      ver_bonos: doc.ver_bonos || false,
      gestionar_bonos: doc.gestionar_bonos || false,
      ver_facturas: doc.ver_facturas || false,
      editar_facturas: doc.editar_facturas || false,
      ver_agenda: doc.ver_agenda || false,
      gestionar_agenda: doc.gestionar_agenda || false,
      ver_clientes: doc.ver_clientes || false,
      editar_clientes: doc.editar_clientes || false,
      ver_articulos: doc.ver_articulos || false,
      editar_articulos: doc.editar_articulos || false,
      acceso_configuracion: doc.acceso_configuracion || false,
      acceso_reportes: doc.acceso_reportes || false,
      $createdAt: doc.$createdAt,
      $updatedAt: doc.$updatedAt,
      $permissions: doc.$permissions,
      $databaseId: doc.$databaseId,
      $collectionId: doc.$collectionId,
      $sequence: doc.$sequence || 0
    }));
  } catch (error) {
    console.error('Error al obtener todos los permisos:', error);
    throw error;
  }
}

/**
 * Crear permisos para un empleado
 */
export async function createPermiso(permiso: PermisoInput): Promise<Permiso> {
  try {
    const data = {
      empleado_id: permiso.empleado_id,
      rol: permiso.rol,
      ver_datos_clinicos: permiso.ver_datos_clinicos || false,
      editar_datos_clinicos: permiso.editar_datos_clinicos || false,
      ver_bonos: permiso.ver_bonos || false,
      gestionar_bonos: permiso.gestionar_bonos || false,
      ver_facturas: permiso.ver_facturas || false,
      editar_facturas: permiso.editar_facturas || false,
      ver_agenda: permiso.ver_agenda || false,
      gestionar_agenda: permiso.gestionar_agenda || false,
      ver_clientes: permiso.ver_clientes || false,
      editar_clientes: permiso.editar_clientes || false,
      ver_articulos: permiso.ver_articulos || false,
      editar_articulos: permiso.editar_articulos || false,
      acceso_configuracion: permiso.acceso_configuracion || false,
      acceso_reportes: permiso.acceso_reportes || false
    };

    const response = await databases.createDocument(
      DATABASE_ID,
      PERMISOS_COLLECTION_ID,
      ID.unique(),
      data
    );

    return {
      $id: response.$id,
      empleado_id: response.empleado_id,
      rol: response.rol,
      ver_datos_clinicos: response.ver_datos_clinicos,
      editar_datos_clinicos: response.editar_datos_clinicos,
      ver_bonos: response.ver_bonos,
      gestionar_bonos: response.gestionar_bonos,
      ver_facturas: response.ver_facturas,
      editar_facturas: response.editar_facturas,
      ver_agenda: response.ver_agenda,
      gestionar_agenda: response.gestionar_agenda,
      ver_clientes: response.ver_clientes,
      editar_clientes: response.editar_clientes,
      ver_articulos: response.ver_articulos,
      editar_articulos: response.editar_articulos,
      acceso_configuracion: response.acceso_configuracion,
      acceso_reportes: response.acceso_reportes,
      $createdAt: response.$createdAt,
      $updatedAt: response.$updatedAt,
      $permissions: response.$permissions,
      $databaseId: response.$databaseId,
      $collectionId: response.$collectionId,
      $sequence: response.$sequence || 0
    };
  } catch (error) {
    console.error('Error al crear permisos:', error);
    throw error;
  }
}

/**
 * Actualizar permisos de un empleado
 */
export async function updatePermiso(id: string, permiso: Partial<PermisoInput>): Promise<Permiso> {
  try {
    const data: any = {};
    
    if (permiso.rol !== undefined) data.rol = permiso.rol;
    if (permiso.ver_datos_clinicos !== undefined) data.ver_datos_clinicos = permiso.ver_datos_clinicos;
    if (permiso.editar_datos_clinicos !== undefined) data.editar_datos_clinicos = permiso.editar_datos_clinicos;
    if (permiso.ver_bonos !== undefined) data.ver_bonos = permiso.ver_bonos;
    if (permiso.gestionar_bonos !== undefined) data.gestionar_bonos = permiso.gestionar_bonos;
    if (permiso.ver_facturas !== undefined) data.ver_facturas = permiso.ver_facturas;
    if (permiso.editar_facturas !== undefined) data.editar_facturas = permiso.editar_facturas;
    if (permiso.ver_agenda !== undefined) data.ver_agenda = permiso.ver_agenda;
    if (permiso.gestionar_agenda !== undefined) data.gestionar_agenda = permiso.gestionar_agenda;
    if (permiso.ver_clientes !== undefined) data.ver_clientes = permiso.ver_clientes;
    if (permiso.editar_clientes !== undefined) data.editar_clientes = permiso.editar_clientes;
    if (permiso.ver_articulos !== undefined) data.ver_articulos = permiso.ver_articulos;
    if (permiso.editar_articulos !== undefined) data.editar_articulos = permiso.editar_articulos;
    if (permiso.acceso_configuracion !== undefined) data.acceso_configuracion = permiso.acceso_configuracion;
    if (permiso.acceso_reportes !== undefined) data.acceso_reportes = permiso.acceso_reportes;

    const response = await databases.updateDocument(
      DATABASE_ID,
      PERMISOS_COLLECTION_ID,
      id,
      data
    );

    return {
      $id: response.$id,
      empleado_id: response.empleado_id,
      rol: response.rol,
      ver_datos_clinicos: response.ver_datos_clinicos,
      editar_datos_clinicos: response.editar_datos_clinicos,
      ver_bonos: response.ver_bonos,
      gestionar_bonos: response.gestionar_bonos,
      ver_facturas: response.ver_facturas,
      editar_facturas: response.editar_facturas,
      ver_agenda: response.ver_agenda,
      gestionar_agenda: response.gestionar_agenda,
      ver_clientes: response.ver_clientes,
      editar_clientes: response.editar_clientes,
      ver_articulos: response.ver_articulos,
      editar_articulos: response.editar_articulos,
      acceso_configuracion: response.acceso_configuracion,
      acceso_reportes: response.acceso_reportes,
      $createdAt: response.$createdAt,
      $updatedAt: response.$updatedAt,
      $permissions: response.$permissions,
      $databaseId: response.$databaseId,
      $collectionId: response.$collectionId,
      $sequence: response.$sequence || 0
    };
  } catch (error) {
    console.error('Error al actualizar permisos:', error);
    throw error;
  }
}

/**
 * Eliminar permisos de un empleado
 */
export async function deletePermiso(id: string): Promise<void> {
  try {
    await databases.deleteDocument(
      DATABASE_ID,
      PERMISOS_COLLECTION_ID,
      id
    );
  } catch (error) {
    console.error('Error al eliminar permisos:', error);
    throw error;
  }
}

/**
 * Aplicar permisos por rol predefinido
 */
export async function aplicarPermisosPorRol(
  empleadoId: string,
  rol: RolEmpleado
): Promise<Permiso> {
  try {
    const permisosPredefinidos = PERMISOS_POR_ROL[rol];
    
    const permisoData: PermisoInput = {
      empleado_id: empleadoId,
      rol: rol,
      ...permisosPredefinidos
    };
    
    // Verificar si ya existen permisos para este empleado
    const permisosExistentes = await getPermisosByEmpleado(empleadoId);
    
    if (permisosExistentes) {
      // Actualizar permisos existentes
      return await updatePermiso(permisosExistentes.$id, permisoData);
    } else {
      // Crear nuevos permisos
      return await createPermiso(permisoData);
    }
  } catch (error) {
    console.error('Error al aplicar permisos por rol:', error);
    throw error;
  }
}

/**
 * Verificar si un empleado tiene un permiso específico
 */
export async function verificarPermiso(
  empleadoId: string,
  permiso: keyof Omit<Permiso, '$id' | 'empleado_id' | 'rol' | '$createdAt' | '$updatedAt' | '$permissions' | '$databaseId' | '$collectionId' | '$sequence'>
): Promise<boolean> {
  try {
    const permisos = await getPermisosByEmpleado(empleadoId);
    
    if (!permisos) {
      return false;
    }

    // Admin tiene acceso a todo
    if (permisos.rol === 'Admin') {
      return true;
    }

    return permisos[permiso] === true;
  } catch (error) {
    console.error('Error al verificar permiso:', error);
    return false;
  }
}

/**
 * Obtener permisos con información del empleado
 */
export async function getPermisosConEmpleados(): Promise<Permiso[]> {
  try {
    const permisos = await getAllPermisos();
    return permisos;
  } catch (error) {
    console.error('Error al obtener permisos con empleados:', error);
    throw error;
  }
}
