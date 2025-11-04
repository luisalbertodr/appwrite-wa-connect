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

export interface NotificacionesState {
  notificaciones: (Notificacion & Models.Document)[];
  noLeidas: (Notificacion & Models.Document)[];
  loading: boolean;
  error: string | null;
}

export function useNotificaciones(empleadoId?: string) {
  const [state, setState] = useState<NotificacionesState>({
    notificaciones: [],
    noLeidas: [],
    loading: false,
    error: null,
  });

  // Cargar notificaciones del empleado
  const loadNotificaciones = useCallback(async (empId?: string, filtros?: FiltroNotificaciones) => {
    const targetId = empId || empleadoId;
    if (!targetId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const notifs = await getNotificacionesByEmpleado(targetId, filtros);
      const noLeidas = await getNotificacionesNoLeidas(targetId);
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
  }, [empleadoId]);

  // Cargar notificaciones por tipo
  const loadNotificacionesPorTipo = useCallback(async (
    tipo: Notificacion['tipo'],
    empId?: string
  ) => {
    const targetId = empId || empleadoId;
    if (!targetId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const notifs = await getNotificacionesByEmpleado(targetId, { tipo });
      const noLeidas = await getNotificacionesNoLeidas(targetId);
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
  }, [empleadoId]);

  // Crear notificación
  const createNotif = useCallback(async (
    notificacion: Omit<Notificacion, '$id' | '$createdAt' | '$updatedAt' | '$collectionId' | '$databaseId' | '$permissions'>
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const nuevaNotif = await createNotificacion(notificacion);
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
  }, []);

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
    const targetId = empId || empleadoId;
    if (!targetId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const actualizada = await marcarComoLeida(id, targetId);
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
  }, [empleadoId]);

  // Marcar todas como leídas
  const marcarTodasLeidas = useCallback(async (empId?: string) => {
    const targetId = empId || empleadoId;
    if (!targetId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const count = await marcarTodasComoLeidas(targetId);
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
  }, [empleadoId]);

  // Desactivar notificación
  const desactivar = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await desactivarNotificacion(id);
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
  }, []);

  // Eliminar notificación
  const deleteNotif = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      await deleteNotificacion(id);
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
  }, []);

  // Eliminar notificaciones antiguas
  const eliminarAntiguas = useCallback(async (diasAntiguedad: number = 30) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const count = await limpiarNotificacionesAntiguas(diasAntiguedad);
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
  }, [empleadoId, loadNotificaciones]);

  // Contar no leídas
  const contarNoLeidas = useCallback(async (empId?: string) => {
    const targetId = empId || empleadoId;
    if (!targetId) return 0;

    try {
      return await contarNotificacionesNoLeidas(targetId);
    } catch (error) {
      console.error('Error al contar notificaciones:', error);
      return 0;
    }
  }, [empleadoId]);

  // Obtener estadísticas
  const getEstadisticas = useCallback(async (empId?: string) => {
    const targetId = empId || empleadoId;
    if (!targetId) return null;

    try {
      const todas = await getNotificacionesByEmpleado(targetId);
      const noLeidas = await getNotificacionesNoLeidas(targetId);
      
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
  }, [empleadoId]);

  // Auto-cargar al montar o cambiar empleadoId
  useEffect(() => {
    if (empleadoId) {
      loadNotificaciones(empleadoId);
    }
  }, [empleadoId, loadNotificaciones]);

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
