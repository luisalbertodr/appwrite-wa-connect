import { useState, useEffect, useCallback } from 'react';
import {
  getNotificacionesByEmpleado,
  getNotificacionesNoLeidas,
  contarNotificacionesNoLeidas,
  createNotificacion,
  marcarComoLeida,
  marcarTodasComoLeidas,
  desactivarNotificacion,
  deleteNotificacion,
  limpiarNotificacionesAntiguas,
} from '../services/appwrite-notificaciones';
import type { Notificacion, FiltroNotificaciones } from '../types/notificacion.types';
import { Models } from 'appwrite';
import { databases, DATABASE_ID, NOTIFICACIONES_COLLECTION_ID } from '../lib/appwrite';
import { useEmpresa } from '@/contexts/EmpresaContext';

export interface NotificacionesState {
  notificaciones: (Notificacion & Models.Document)[];
  noLeidas: (Notificacion & Models.Document)[];
  loading: boolean;
  error: string | null;
}

export function useNotificaciones(empleadoId?: string) {
  const { empresaActiva } = useEmpresa();
  
  const [state, setState] = useState<NotificacionesState>({
    notificaciones: [],
    noLeidas: [],
    loading: false,
    error: null,
  });

  // Cargar notificaciones del empleado
  const loadNotificaciones = useCallback(async (empId?: string, filtros?: FiltroNotificaciones) => {
    if (!empresaActiva) return;
    const targetId = empId || empleadoId;
    if (!targetId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const notifs = await getNotificacionesByEmpleado(empresaActiva.$id, targetId, filtros);
      const noLeidas = await getNotificacionesNoLeidas(empresaActiva.$id, targetId);
      setState({
        notificaciones: notifs,
        noLeidas,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar notificaciones',
      }));
    }
  }, [empresaActiva, empleadoId]);

  // Cargar notificaciones por tipo
  const loadNotificacionesPorTipo = useCallback(async (
    tipo: Notificacion['tipo'],
    empId?: string
  ) => {
    if (!empresaActiva) return;
    const targetId = empId || empleadoId;
    if (!targetId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const notifs = await getNotificacionesByEmpleado(empresaActiva.$id, targetId, { tipo });
      const noLeidas = await getNotificacionesNoLeidas(empresaActiva.$id, targetId);
      setState({
        notificaciones: notifs,
        noLeidas,
        loading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al cargar notificaciones',
      }));
    }
  }, [empresaActiva, empleadoId]);

  // Crear notificación
  const createNotif = useCallback(async (
    notificacion: Omit<Notificacion, '$id' | '$createdAt' | '$updatedAt' | '$collectionId' | '$databaseId' | '$permissions'>
  ) => {
    if (!empresaActiva) throw new Error('No hay empresa activa');
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const nuevaNotif = await createNotificacion(empresaActiva.$id, notificacion);
      setState(prev => ({
        notificaciones: [nuevaNotif, ...prev.notificaciones],
        noLeidas: [nuevaNotif, ...prev.noLeidas], // Las nuevas notificaciones siempre son no leídas
        loading: false,
        error: null,
      }));
      return nuevaNotif;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al crear notificación',
      }));
      throw error;
    }
  }, [empresaActiva]);

  // Actualizar notificación
  const updateNotif = useCallback(async (
    id: string,
    notificacion: Partial<Notificacion>
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const actualizada = await databases.updateDocument<Notificacion & Models.Document>(
        DATABASE_ID,
        NOTIFICACIONES_COLLECTION_ID,
        id,
        notificacion
      );
      setState(prev => ({
        notificaciones: prev.notificaciones.map(n =>
          n.$id === id ? actualizada : n
        ),
        noLeidas: prev.noLeidas.map(n =>
          n.$id === id ? actualizada : n
        ),
        loading: false,
        error: null,
      }));
      return actualizada;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al actualizar notificación',
      }));
      throw error;
    }
  }, []);

  // Marcar como leída
  const marcarLeida = useCallback(async (id: string, empId?: string) => {
    if (!empresaActiva) return;
    const targetId = empId || empleadoId;
    if (!targetId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const actualizada = await marcarComoLeida(empresaActiva.$id, id, targetId);
      setState(prev => ({
        notificaciones: prev.notificaciones.map(n =>
          n.$id === id ? actualizada : n
        ),
        noLeidas: prev.noLeidas.filter(n => n.$id !== id),
        loading: false,
        error: null,
      }));
      return actualizada;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al marcar como leída',
      }));
      throw error;
    }
  }, [empresaActiva, empleadoId]);

  // Marcar todas como leídas
  const marcarTodasLeidas = useCallback(async (empId?: string) => {
    if (!empresaActiva) return;
    const targetId = empId || empleadoId;
    if (!targetId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const count = await marcarTodasComoLeidas(empresaActiva.$id, targetId);
      setState(prev => ({
        notificaciones: prev.notificaciones,
        noLeidas: [],
        loading: false,
        error: null,
      }));
      return count;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al marcar todas como leídas',
      }));
      throw error;
    }
  }, [empresaActiva, empleadoId]);

  // Desactivar notificación
  const desactivar = useCallback(async (id: string) => {
    if (!empresaActiva) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await desactivarNotificacion(empresaActiva.$id, id);
      setState(prev => ({
        notificaciones: prev.notificaciones.map(n =>
          n.$id === id ? { ...n, activa: false } : n
        ),
        noLeidas: prev.noLeidas.filter(n => n.$id !== id),
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al desactivar notificación',
      }));
      throw error;
    }
  }, [empresaActiva]);

  // Eliminar notificación
  const deleteNotif = useCallback(async (id: string) => {
    if (!empresaActiva) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await deleteNotificacion(empresaActiva.$id, id);
      setState(prev => ({
        notificaciones: prev.notificaciones.filter(n => n.$id !== id),
        noLeidas: prev.noLeidas.filter(n => n.$id !== id),
        loading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al eliminar notificación',
      }));
      throw error;
    }
  }, [empresaActiva]);

  // Eliminar notificaciones antiguas
  const eliminarAntiguas = useCallback(async (diasAntiguedad: number = 30) => {
    if (!empresaActiva) return;
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const count = await limpiarNotificacionesAntiguas(empresaActiva.$id, diasAntiguedad);
      // Recargar notificaciones después de eliminar
      if (empleadoId) {
        await loadNotificaciones(empleadoId);
      }
      return count;
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error al eliminar notificaciones antiguas',
      }));
      throw error;
    }
  }, [empresaActiva, empleadoId, loadNotificaciones]);

  // Contar no leídas
  const contarNoLeidas = useCallback(async (empId?: string) => {
    if (!empresaActiva) return 0;
    const targetId = empId || empleadoId;
    if (!targetId) return 0;

    try {
      return await contarNotificacionesNoLeidas(empresaActiva.$id, targetId);
    } catch (error) {
      console.error('Error al contar notificaciones:', error);
      return 0;
    }
  }, [empresaActiva, empleadoId]);

  // Obtener estadísticas
  const getEstadisticas = useCallback(async (empId?: string) => {
    if (!empresaActiva) return null;
    const targetId = empId || empleadoId;
    if (!targetId) return null;

    try {
      const todas = await getNotificacionesByEmpleado(empresaActiva.$id, targetId);
      const noLeidas = await getNotificacionesNoLeidas(empresaActiva.$id, targetId);
      
      const porTipo = todas.reduce((acc, notif) => {
        acc[notif.tipo] = (acc[notif.tipo] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const porPrioridad = todas.reduce((acc, notif) => {
        acc[notif.prioridad] = (acc[notif.prioridad] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        total: todas.length,
        noLeidas: noLeidas.length,
        porTipo,
        porPrioridad,
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return null;
    }
  }, [empresaActiva, empleadoId]);

  // Auto-cargar al montar o cambiar empleadoId o empresa
  useEffect(() => {
    if (empleadoId && empresaActiva) {
      loadNotificaciones(empleadoId);
    }
  }, [empleadoId, empresaActiva, loadNotificaciones]);

  return {
    notificaciones: state.notificaciones,
    noLeidas: state.noLeidas,
    loading: state.loading,
    error: state.error,
    loadNotificaciones,
    loadNotificacionesPorTipo,
    createNotificacion: createNotif,
    updateNotificacion: updateNotif,
    marcarLeida,
    marcarTodasLeidas,
    desactivarNotificacion: desactivar,
    eliminarNotificacion: deleteNotif,
    eliminarNotificacionesAntiguas: eliminarAntiguas,
    contarNoLeidas,
    getEstadisticas,
  };
}
