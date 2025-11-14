import { useState, useEffect, useCallback } from 'react';
import {
  getPermisosByEmpleado,
  getAllPermisos,
  createPermiso,
  updatePermiso,
  deletePermiso,
  aplicarPermisosPorRol,
  verificarPermiso,
  getPermisosConEmpleados,
} from '../services/appwrite-permisos';
import type { Permiso, PermisoInput, RolEmpleado } from '../types/permiso.types';
import { useEmpresa } from '@/contexts/EmpresaContext';

export interface PermisosState {
  permisos: Permiso | null;
  todosPermisos: Permiso[];
  loading: boolean;
  error: string | null;
}

export function usePermisos(empleadoId?: string) {
  const { empresaActiva } = useEmpresa();
  const [state, setState] = useState<PermisosState>({
    permisos: null,
    todosPermisos: [],
    loading: false,
    error: null,
  });

  // Cargar permisos de un empleado específico
  const loadPermisos = useCallback(async (empId?: string) => {
    const targetId = empId || empleadoId;
    if (!targetId) return;
    if (!empresaActiva) {
      setState(prev => ({ ...prev, error: 'No hay empresa activa' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const perms = await getPermisosByEmpleado(empresaActiva.$id, targetId);
      setState(prev => ({
        ...prev,
        permisos: perms,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar permisos',
      }));
    }
  }, [empleadoId, empresaActiva]);

  // Cargar todos los permisos
  const loadTodosPermisos = useCallback(async () => {
    if (!empresaActiva) {
      setState(prev => ({ ...prev, error: 'No hay empresa activa' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const perms = await getAllPermisos(empresaActiva.$id);
      setState(prev => ({
        ...prev,
        todosPermisos: perms,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar permisos',
      }));
    }
  }, [empresaActiva]);

  // Cargar permisos con empleados
  const loadPermisosConEmpleados = useCallback(async () => {
    if (!empresaActiva) {
      setState(prev => ({ ...prev, error: 'No hay empresa activa' }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const perms = await getPermisosConEmpleados(empresaActiva.$id);
      setState(prev => ({
        ...prev,
        todosPermisos: perms,
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar permisos',
      }));
    }
  }, [empresaActiva]);

  // Crear permisos
  const createPerms = useCallback(async (permiso: PermisoInput) => {
    if (!empresaActiva) {
      const error = new Error('No hay empresa activa');
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const nuevos = await createPermiso(empresaActiva.$id, permiso);
      setState(prev => ({
        permisos: empleadoId === permiso.empleado_id ? nuevos : prev.permisos,
        todosPermisos: [...prev.todosPermisos, nuevos],
        loading: false,
        error: null,
      }));
      return nuevos;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al crear permisos',
      }));
      throw error;
    }
  }, [empleadoId, empresaActiva]);

  // Actualizar permisos
  const updatePerms = useCallback(async (id: string, permiso: Partial<PermisoInput>) => {
    if (!empresaActiva) {
      const error = new Error('No hay empresa activa');
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const actualizados = await updatePermiso(empresaActiva.$id, id, permiso);
      setState(prev => ({
        permisos: prev.permisos?.$id === id ? actualizados : prev.permisos,
        todosPermisos: prev.todosPermisos.map(p =>
          p.$id === id ? actualizados : p
        ),
        loading: false,
        error: null,
      }));
      return actualizados;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al actualizar permisos',
      }));
      throw error;
    }
  }, [empresaActiva]);

  // Eliminar permisos
  const deletePerms = useCallback(async (id: string) => {
    if (!empresaActiva) {
      const error = new Error('No hay empresa activa');
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await deletePermiso(empresaActiva.$id, id);
      setState(prev => ({
        permisos: prev.permisos?.$id === id ? null : prev.permisos,
        todosPermisos: prev.todosPermisos.filter(p => p.$id !== id),
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al eliminar permisos',
      }));
      throw error;
    }
  }, [empresaActiva]);

  // Aplicar permisos por rol
  const aplicarRol = useCallback(async (
    empId: string,
    rol: RolEmpleado
  ) => {
    if (!empresaActiva) {
      const error = new Error('No hay empresa activa');
      setState(prev => ({ ...prev, error: error.message }));
      throw error;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const perms = await aplicarPermisosPorRol(empresaActiva.$id, empId, rol);
      setState(prev => ({
        permisos: empleadoId === empId ? perms : prev.permisos,
        todosPermisos: prev.todosPermisos.some(p => p.empleado_id === empId)
          ? prev.todosPermisos.map(p => p.empleado_id === empId ? perms : p)
          : [...prev.todosPermisos, perms],
        loading: false,
        error: null,
      }));
      return perms;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al aplicar permisos por rol',
      }));
      throw error;
    }
  }, [empleadoId, empresaActiva]);

  // Verificar permiso específico
  const verificarPermisoEspecifico = useCallback(async (
    empId: string,
    permiso: keyof Omit<Permiso, '$id' | 'empleado_id' | 'rol' | '$createdAt' | '$updatedAt' | '$permissions' | '$databaseId' | '$collectionId' | '$sequence'>
  ): Promise<boolean> => {
    if (!empresaActiva) {
      console.error('No hay empresa activa');
      return false;
    }

    try {
      return await verificarPermiso(empresaActiva.$id, empId, permiso);
    } catch (error) {
      console.error('Error al verificar permiso:', error);
      return false;
    }
  }, [empresaActiva]);

  // Verificar si es Admin
  const esAdmin = useCallback((perms?: Permiso | null): boolean => {
    const p = perms || state.permisos;
    return p?.rol === 'Admin';
  }, [state.permisos]);

  // Verificar si puede ver datos clínicos
  const puedeVerDatosClinicos = useCallback((perms?: Permiso | null): boolean => {
    const p = perms || state.permisos;
    return p?.ver_datos_clinicos || false;
  }, [state.permisos]);

  // Verificar si puede editar datos clínicos
  const puedeEditarDatosClinicos = useCallback((perms?: Permiso | null): boolean => {
    const p = perms || state.permisos;
    return p?.editar_datos_clinicos || false;
  }, [state.permisos]);

  // Verificar si puede gestionar bonos
  const puedeGestionarBonos = useCallback((perms?: Permiso | null): boolean => {
    const p = perms || state.permisos;
    return p?.gestionar_bonos || false;
  }, [state.permisos]);

  // Verificar si puede gestionar agenda
  const puedeGestionarAgenda = useCallback((perms?: Permiso | null): boolean => {
    const p = perms || state.permisos;
    return p?.gestionar_agenda || false;
  }, [state.permisos]);

  // Verificar si tiene acceso a configuración
  const tieneAccesoConfiguracion = useCallback((perms?: Permiso | null): boolean => {
    const p = perms || state.permisos;
    return p?.acceso_configuracion || false;
  }, [state.permisos]);

  // Obtener resumen de permisos
  const getResumenPermisos = useCallback((perms?: Permiso | null) => {
    const p = perms || state.permisos;
    if (!p) return null;

    return {
      empleadoId: p.empleado_id,
      rol: p.rol,
      esAdmin: p.rol === 'Admin',
      verDatosClinicos: p.ver_datos_clinicos,
      editarDatosClinicos: p.editar_datos_clinicos,
      verBonos: p.ver_bonos,
      gestionarBonos: p.gestionar_bonos,
      verFacturas: p.ver_facturas,
      editarFacturas: p.editar_facturas,
      verAgenda: p.ver_agenda,
      gestionarAgenda: p.gestionar_agenda,
      verClientes: p.ver_clientes,
      editarClientes: p.editar_clientes,
      verArticulos: p.ver_articulos,
      editarArticulos: p.editar_articulos,
      accesoConfiguracion: p.acceso_configuracion,
      accesoReportes: p.acceso_reportes,
    };
  }, [state.permisos]);

  // Auto-cargar al montar o cambiar empleadoId
  useEffect(() => {
    if (empleadoId) {
      loadPermisos(empleadoId);
    }
  }, [empleadoId, loadPermisos]);

  return {
    permisos: state.permisos,
    todosPermisos: state.todosPermisos,
    loading: state.loading,
    error: state.error,
    loadPermisos,
    loadTodosPermisos,
    loadPermisosConEmpleados,
    createPermisos: createPerms,
    updatePermisos: updatePerms,
    deletePermisos: deletePerms,
    aplicarPermisosPorRol: aplicarRol,
    verificarPermiso: verificarPermisoEspecifico,
    esAdmin,
    puedeVerDatosClinicos,
    puedeEditarDatosClinicos,
    puedeGestionarBonos,
    puedeGestionarAgenda,
    tieneAccesoConfiguracion,
    getResumenPermisos,
  };
}
