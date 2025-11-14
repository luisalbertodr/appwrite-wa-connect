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
import { useEmpresa } from '@/contexts/EmpresaContext';

const AUDITORIA_QUERY_KEY = 'auditoria';

/**
 * Hook para obtener registros de auditoría con filtros
 */
export const useGetAuditoria = (filtros?: FiltrosAuditoria, limite: number = 100) => {
  const { empresaActiva } = useEmpresa();
  
  return useQuery({
    queryKey: [AUDITORIA_QUERY_KEY, empresaActiva?.$id, 'list', filtros, limite],
    queryFn: () => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return getRegistrosAuditoria(empresaActiva.$id, filtros, limite);
    },
    enabled: !!empresaActiva,
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
  const { empresaActiva } = useEmpresa();
  
  return useQuery({
    queryKey: [AUDITORIA_QUERY_KEY, empresaActiva?.$id, 'historial', entidadTipo, entidadId],
    queryFn: () => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return getHistorialEntidad(empresaActiva.$id, entidadTipo, entidadId);
    },
    enabled: enabled && !!entidadId && !!empresaActiva,
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
  const { empresaActiva } = useEmpresa();
  
  return useQuery({
    queryKey: [AUDITORIA_QUERY_KEY, empresaActiva?.$id, 'usuario', usuarioId, fechaDesde, fechaHasta],
    queryFn: () => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return getActividadUsuario(empresaActiva.$id, usuarioId, fechaDesde, fechaHasta);
    },
    enabled: !!usuarioId && !!empresaActiva,
    staleTime: 1000 * 60, // 1 minuto
  });
};

/**
 * Hook para obtener estadísticas de auditoría
 */
export const useGetEstadisticasAuditoria = (fechaDesde?: string, fechaHasta?: string) => {
  const { empresaActiva } = useEmpresa();
  
  return useQuery({
    queryKey: [AUDITORIA_QUERY_KEY, empresaActiva?.$id, 'estadisticas', fechaDesde, fechaHasta],
    queryFn: () => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return getEstadisticasAuditoria(empresaActiva.$id, fechaDesde, fechaHasta);
    },
    enabled: !!empresaActiva,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

/**
 * Hook para crear registro de auditoría
 */
export const useCrearAuditoria = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { empresaActiva } = useEmpresa();

  return useMutation({
    mutationFn: (registro: RegistroAuditoriaInput) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return crearRegistroAuditoria(empresaActiva.$id, registro);
    },
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
  const { empresaActiva } = useEmpresa();

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
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return auditarCreacion(
        empresaActiva.$id,
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
  const { empresaActiva } = useEmpresa();

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
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return auditarActualizacion(
        empresaActiva.$id,
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
  const { empresaActiva } = useEmpresa();

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
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return auditarEliminacion(
        empresaActiva.$id,
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
