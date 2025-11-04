import { LipooutDocument } from './index';
import type { RolEmpleado } from './empleado.types';

export type { RolEmpleado };

export interface Permiso extends LipooutDocument {
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
  | 'sesiones_clinicas'
  | 'bonos'
  | 'reportes';

export type NivelAcceso = 'sin_acceso' | 'lectura' | 'escritura' | 'admin';

export interface PermisoModulo {
  modulo: ModuloSistema;
  nivel_acceso: NivelAcceso;

  puede_ver_datos_sensibles?: boolean;
  puede_eliminar?: boolean;
  puede_exportar?: boolean;
  solo_propios_datos?: boolean;
}

export interface PermisoConDatos extends Omit<Permiso, 'permisos_modulos'> {
  permisos_modulos_data: PermisoModulo[];
}

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
