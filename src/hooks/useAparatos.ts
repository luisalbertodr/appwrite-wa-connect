import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAparatos,
  createAparato,
  updateAparato,
  deleteAparato,
  CreateAparatoInput,
  UpdateAparatoInput,
} from '../services/appwrite-aparatos';
import { useEmpresa } from '@/contexts/EmpresaContext';

const APARATOS_QUERY_KEY = 'aparatos';

export const useGetAparatos = (soloActivos: boolean = true) => {
  const { empresaActiva } = useEmpresa();
  
  return useQuery({
    queryKey: [APARATOS_QUERY_KEY, empresaActiva?.$id, { soloActivos }],
    queryFn: () => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return getAparatos(empresaActiva.$id, soloActivos);
    },
    enabled: !!empresaActiva,
    staleTime: 1000 * 60 * 15,
  });
};

export const useCreateAparato = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newAparato: CreateAparatoInput) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return createAparato(empresaActiva.$id, newAparato);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APARATOS_QUERY_KEY] });
    },
  });
};

export const useUpdateAparato = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAparatoInput }) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return updateAparato(empresaActiva.$id, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APARATOS_QUERY_KEY] });
    },
  });
};

export const useDeleteAparato = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return deleteAparato(empresaActiva.$id, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [APARATOS_QUERY_KEY] });
    },
  });
};
