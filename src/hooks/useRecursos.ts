import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEmpresa } from '@/contexts/EmpresaContext';
import {
  getRecursos,
  createRecurso,
  updateRecurso,
  deleteRecurso,
  CreateRecursoInput,
  UpdateRecursoInput,
} from '../services/appwrite-recursos';

const RECURSOS_QUERY_KEY = 'recursos';

export const useGetRecursos = (soloActivos: boolean = true) => {
  const { empresaActiva } = useEmpresa();
  
  return useQuery({
    queryKey: [RECURSOS_QUERY_KEY, empresaActiva?.$id, { soloActivos }],
    queryFn: () => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return getRecursos(empresaActiva.$id, soloActivos);
    },
    enabled: !!empresaActiva,
    staleTime: 1000 * 60 * 15,
  });
};

export const useCreateRecurso = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newRecurso: CreateRecursoInput) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return createRecurso(empresaActiva.$id, newRecurso);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECURSOS_QUERY_KEY, empresaActiva?.$id] });
    },
  });
};

export const useUpdateRecurso = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecursoInput }) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return updateRecurso(empresaActiva.$id, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECURSOS_QUERY_KEY, empresaActiva?.$id] });
    },
  });
};

export const useDeleteRecurso = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return deleteRecurso(empresaActiva.$id, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [RECURSOS_QUERY_KEY, empresaActiva?.$id] });
    },
  });
};
