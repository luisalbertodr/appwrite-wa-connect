import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  crearRegistroAuditoria,
  getRegistrosAuditoria,
  getHistorialEntidad,
  getActividadUsuario,
  getEstadisticasAuditoria,
  auditarCreacion,
  auditarActualizacion,
  auditarEliminacion
} from '@/services/appwrite-auditoria';
import type { 
  RegistroAuditoriaInput, 
  FiltrosAuditoria, 
  EntidadAuditoria 
} from '@/types/auditoria.types';
import { useToast } from './use-toast';

const AUDITORIA_QUERY_KEY = 'auditoria';

/**
 * Hook para obtener registros de auditoría con filtros
 */
export const useGetAuditoria = (filtros?: FiltrosAuditoria, limite: number = 100) => {
  return useQuery({
    queryKey: [AUDITORIA_QUERY_KEY, 'list', filtros, limite],
    queryFn: () => getRegistrosAuditoria(filtros, limite),
    staleTime: 1000 * 30, // 30 segundos
  });
};

/**
 * Hook para obtener historial de una entidad
 */
export const useGetHistorialEntidad = (
  entidadTipo: EntidadAuditoria,
  entidadId: string,
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: [AUDITORIA_QUERY_KEY, 'historial', entidadTipo, entidadId],
    queryFn: () => getHistorialEntidad(entidadTipo, entidadId),
    enabled: enabled && !!entidadId,
    staleTime: 1000 * 60, // 1 minuto
  });
};

/**
 * Hook para obtener actividad de un usuario
 */
export const useGetActividadUsuario = (
  usuarioId: string,
  fechaDesde?: string,
  fechaHasta?: string
) => {
  return useQuery({
    queryKey: [AUDITORIA_QUERY_KEY, 'usuario', usuarioId, fechaDesde, fechaHasta],
    queryFn: () => getActividadUsuario(usuarioId, fechaDesde, fechaHasta),
    enabled: !!usuarioId,
    staleTime: 1000 * 60, // 1 minuto
  });
};

/**
 * Hook para obtener estadísticas de auditoría
 */
export const useGetEstadisticasAuditoria = (fechaDesde?: string, fechaHasta?: string) => {
  return useQuery({
    queryKey: [AUDITORIA_QUERY_KEY, 'estadisticas', fechaDesde, fechaHasta],
    queryFn: () => getEstadisticasAuditoria(fechaDesde, fechaHasta),
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

/**
 * Hook para crear registro de auditoría
 */
export const useCrearAuditoria = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (registro: RegistroAuditoriaInput) => crearRegistroAuditoria(registro),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AUDITORIA_QUERY_KEY] });
    },
    onError: (error: any) => {
      toast({
        title: 'Error al crear registro de auditoría',
        description: error.message || 'Error desconocido',
        variant: 'destructive',
      });
    },
  });
};

/**
 * Hook helper para auditar creación
 */
export const useAuditarCreacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entidadTipo,
      entidadId,
      datosNuevos,
      usuarioId,
      usuarioNombre,
      usuarioEmail,
      modulo,
      descripcion
    }: {
      entidadTipo: EntidadAuditoria;
      entidadId: string;
      datosNuevos: any;
      usuarioId: string;
      usuarioNombre: string;
      usuarioEmail: string;
      modulo: string;
      descripcion?: string;
    }) => {
      return auditarCreacion(
        entidadTipo,
        entidadId,
        datosNuevos,
        usuarioId,
        usuarioNombre,
        usuarioEmail,
        modulo,
        descripcion
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AUDITORIA_QUERY_KEY] });
    },
  });
};

/**
 * Hook helper para auditar actualización
 */
export const useAuditarActualizacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entidadTipo,
      entidadId,
      datosAnteriores,
      datosNuevos,
      usuarioId,
      usuarioNombre,
      usuarioEmail,
      modulo,
      descripcion
    }: {
      entidadTipo: EntidadAuditoria;
      entidadId: string;
      datosAnteriores: any;
      datosNuevos: any;
      usuarioId: string;
      usuarioNombre: string;
      usuarioEmail: string;
      modulo: string;
      descripcion?: string;
    }) => {
      return auditarActualizacion(
        entidadTipo,
        entidadId,
        datosAnteriores,
        datosNuevos,
        usuarioId,
        usuarioNombre,
        usuarioEmail,
        modulo,
        descripcion
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AUDITORIA_QUERY_KEY] });
    },
  });
};

/**
 * Hook helper para auditar eliminación
 */
export const useAuditarEliminacion = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      entidadTipo,
      entidadId,
      datosAnteriores,
      usuarioId,
      usuarioNombre,
      usuarioEmail,
      modulo,
      descripcion
    }: {
      entidadTipo: EntidadAuditoria;
      entidadId: string;
      datosAnteriores: any;
      usuarioId: string;
      usuarioNombre: string;
      usuarioEmail: string;
      modulo: string;
      descripcion?: string;
    }) => {
      return auditarEliminacion(
        entidadTipo,
        entidadId,
        datosAnteriores,
        usuarioId,
        usuarioNombre,
        usuarioEmail,
        modulo,
        descripcion
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AUDITORIA_QUERY_KEY] });
    },
  });
};
