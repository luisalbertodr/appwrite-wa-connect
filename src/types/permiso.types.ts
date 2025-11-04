import { LipooutDocument } from './index';
import type { RolEmpleado } from './empleado.types';

// Re-exportar RolEmpleado para que esté disponible
export type { RolEmpleado };

// Tipo para LEER permisos desde Appwrite
export interface Permiso extends LipooutDocument {
  empleado_id: string;
  rol: RolEmpleado;
  
  // Permisos de datos clínicos
  ver_datos_clinicos: boolean;
  editar_datos_clinicos: boolean;
  
  // Permisos de bonos
  ver_bonos: boolean;
  gestionar_bonos: boolean;
  
  // Permisos de facturas
  ver_facturas: boolean;
  editar_facturas: boolean;
  
  // Permisos de agenda
  ver_agenda: boolean;
  gestionar_agenda: boolean;
  
  // Permisos de clientes
  ver_clientes: boolean;
  editar_clientes: boolean;
  
  // Permisos de artículos
  ver_articulos: boolean;
  editar_articulos: boolean;
  
  // Permisos de configuración y reportes
  acceso_configuracion: boolean;
  acceso_reportes: boolean;
}

// Tipo para CREAR/ACTUALIZAR permisos
export interface PermisoInput {
  empleado_id: string;
  rol: RolEmpleado;
  ver_datos_clinicos: boolean;
  editar_datos_clinicos: boolean;
  ver_bonos: boolean;
  gestionar_bonos: boolean;
  ver_facturas: boolean;
  editar_facturas: boolean;
  ver_agenda: boolean;
  gestionar_agenda: boolean;
  ver_clientes: boolean;
  editar_clientes: boolean;
  ver_articulos: boolean;
  editar_articulos: boolean;
  acceso_configuracion: boolean;
  acceso_reportes: boolean;
}

// Módulos del sistema que pueden tener permisos configurables
export type ModuloSistema = 
  | 'agenda'
  | 'clientes'
  | 'articulos'
  | 'facturacion'
  | 'empleados'
  | 'proveedores'
  | 'tpv'
  | 'marketing'
  | 'configuracion'
  | 'sesiones_clinicas' // Módulo de datos clínicos
  | 'bonos'
  | 'reportes';

// Niveles de acceso posibles
export type NivelAcceso = 'sin_acceso' | 'lectura' | 'escritura' | 'admin';

// Configuración de permisos por módulo
export interface PermisoModulo {
  modulo: ModuloSistema;
  nivel_acceso: NivelAcceso;
  
  // Permisos específicos del módulo (opcional, para casos especiales)
  puede_ver_datos_sensibles?: boolean; // Para sesiones clínicas
  puede_eliminar?: boolean;
  puede_exportar?: boolean;
  solo_propios_datos?: boolean; // Solo puede ver/editar sus propios registros
}

// Tipo auxiliar para trabajar con permisos parseados
export interface PermisoConDatos extends Omit<Permiso, 'permisos_modulos'> {
  permisos_modulos_data: PermisoModulo[];
}

// Configuración de permisos por defecto según rol (nueva estructura con campos booleanos)
export const PERMISOS_POR_ROL: Record<RolEmpleado, Omit<PermisoInput, 'empleado_id' | 'rol'>> = {
  Admin: {
    ver_datos_clinicos: true,
    editar_datos_clinicos: true,
    ver_bonos: true,
    gestionar_bonos: true,
    ver_facturas: true,
    editar_facturas: true,
    ver_agenda: true,
    gestionar_agenda: true,
    ver_clientes: true,
    editar_clientes: true,
    ver_articulos: true,
    editar_articulos: true,
    acceso_configuracion: true,
    acceso_reportes: true
  },
  Médico: {
    ver_datos_clinicos: true,
    editar_datos_clinicos: true,
    ver_bonos: true,
    gestionar_bonos: true,
    ver_facturas: true,
    editar_facturas: false,
    ver_agenda: true,
    gestionar_agenda: true,
    ver_clientes: true,
    editar_clientes: true,
    ver_articulos: true,
    editar_articulos: false,
    acceso_configuracion: false,
    acceso_reportes: true
  },
  Recepción: {
    ver_datos_clinicos: false,
    editar_datos_clinicos: false,
    ver_bonos: true,
    gestionar_bonos: true,
    ver_facturas: true,
    editar_facturas: true,
    ver_agenda: true,
    gestionar_agenda: true,
    ver_clientes: true,
    editar_clientes: true,
    ver_articulos: true,
    editar_articulos: false,
    acceso_configuracion: false,
    acceso_reportes: true
  },
  Lectura: {
    ver_datos_clinicos: false,
    editar_datos_clinicos: false,
    ver_bonos: true,
    gestionar_bonos: false,
    ver_facturas: true,
    editar_facturas: false,
    ver_agenda: true,
    gestionar_agenda: false,
    ver_clientes: true,
    editar_clientes: false,
    ver_articulos: true,
    editar_articulos: false,
    acceso_configuracion: false,
    acceso_reportes: true
  },
  Esteticista: {
    ver_datos_clinicos: true,
    editar_datos_clinicos: true,
    ver_bonos: true,
    gestionar_bonos: true,
    ver_facturas: true,
    editar_facturas: false,
    ver_agenda: true,
    gestionar_agenda: true,
    ver_clientes: true,
    editar_clientes: true,
    ver_articulos: true,
    editar_articulos: false,
    acceso_configuracion: false,
    acceso_reportes: true
  }
};
