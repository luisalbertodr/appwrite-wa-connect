import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEmpresa } from '@/contexts/EmpresaContext';
import {
  getProveedores,
  createProveedor,
  updateProveedor,
  deleteProveedor,
  CreateProveedorInput,
  UpdateProveedorInput,
} from '../services/appwrite-proveedores';

const PROVEEDORES_QUERY_KEY = 'proveedores';

export const useGetProveedores = (soloActivos: boolean = true) => {
  const { empresaActiva } = useEmpresa();
  
  return useQuery({
    queryKey: [PROVEEDORES_QUERY_KEY, empresaActiva?.$id, { soloActivos }],
    queryFn: () => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return getProveedores(empresaActiva.$id, soloActivos);
    },
    enabled: !!empresaActiva,
    staleTime: 1000 * 60 * 15,
  });
};

export const useCreateProveedor = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (newProveedor: CreateProveedorInput) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return createProveedor(empresaActiva.$id, newProveedor);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROVEEDORES_QUERY_KEY, empresaActiva?.$id] });
    },
  });
};

export const useUpdateProveedor = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProveedorInput }) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return updateProveedor(empresaActiva.$id, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROVEEDORES_QUERY_KEY, empresaActiva?.$id] });
    },
  });
};

export const useDeleteProveedor = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return deleteProveedor(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PROVEEDORES_QUERY_KEY, empresaActiva?.$id] });
    },
  });
};
