import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getArticulos, 
  getFamilias, 
  createArticulo, 
  updateArticulo, 
  deleteArticulo,
  createFamilia, // <-- NUEVO
  updateFamilia, // <-- NUEVO
  deleteFamilia, // <-- NUEVO
  CreateArticuloInput,
  UpdateArticuloInput,
  FamiliaInput // <-- NUEVO
} from '@/services/appwrite-articulos';
import { useEmpresa } from '@/contexts/EmpresaContext';

const ARTICULOS_QUERY_KEY = 'articulos';
const FAMILIAS_QUERY_KEY = 'familias';

// --- Hooks de Familias ---

export const useGetFamilias = () => {
  const { empresaActiva } = useEmpresa();
  
  return useQuery({
    queryKey: [FAMILIAS_QUERY_KEY, empresaActiva?.$id],
    queryFn: () => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return getFamilias(empresaActiva.$id);
    },
    enabled: !!empresaActiva,
    staleTime: 1000 * 60 * 15, // 15 minutos de caché para familias
  });
};

// (NUEVO)
export const useCreateFamilia = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newFamilia: FamiliaInput) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return createFamilia(empresaActiva.$id, newFamilia);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FAMILIAS_QUERY_KEY] });
    },
  });
};

// (NUEVO)
export const useUpdateFamilia = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FamiliaInput> }) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return updateFamilia(empresaActiva.$id, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FAMILIAS_QUERY_KEY] });
    },
  });
};

// (NUEVO)
export const useDeleteFamilia = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return deleteFamilia(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [FAMILIAS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [ARTICULOS_QUERY_KEY] }); // Artículos pueden afectarse
    },
  });
};


// --- Hooks de Artículos ---

export const useGetArticulos = (familiaId?: string) => {
  const { empresaActiva } = useEmpresa();
  
  return useQuery({
    queryKey: [ARTICULOS_QUERY_KEY, empresaActiva?.$id, { familiaId }],
    queryFn: () => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return getArticulos(empresaActiva.$id, familiaId);
    },
    enabled: !!empresaActiva,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
};

export const useCreateArticulo = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newArticulo: CreateArticuloInput) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return createArticulo(empresaActiva.$id, newArticulo);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ARTICULOS_QUERY_KEY] });
    },
  });
};

export const useUpdateArticulo = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateArticuloInput }) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return updateArticulo(empresaActiva.$id, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ARTICULOS_QUERY_KEY] });
    },
  });
};

export const useDeleteArticulo = () => {
  const { empresaActiva } = useEmpresa();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return deleteArticulo(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ARTICULOS_QUERY_KEY] });
    },
  });
};

// --- Hook Consolidado ---
// Hook principal que agrupa todas las funcionalidades de artículos
export const useArticulos = (familiaId?: string) => {
  const { data: articulos, isLoading, error } = useGetArticulos(familiaId);
  const { mutateAsync: createAsync } = useCreateArticulo();
  const { mutateAsync: updateAsync } = useUpdateArticulo();
  const { mutateAsync: deleteAsync } = useDeleteArticulo();

  return {
    articulos: articulos || [],
    isLoading,
    error,
    createArticulo: createAsync,
    updateArticulo: updateAsync,
    deleteArticulo: deleteAsync,
  };
};
