import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getArticulos,
  getArticulosByTipo,
  createArticulo,
  updateArticulo,
  deleteArticulo,
  CreateArticuloInput,
  UpdateArticuloInput,
} from '../services/appwrite-articulos';

const ARTICULOS_QUERY_KEY = 'articulos';

export const useGetArticulos = (soloActivos: boolean = true) => {
  return useQuery({
    queryKey: [ARTICULOS_QUERY_KEY, { soloActivos }],
    queryFn: () => getArticulos(soloActivos),
    staleTime: 1000 * 60 * 15,
  });
};

export const useGetArticulosByTipo = (tipo: string) => {
  return useQuery({
    queryKey: [ARTICULOS_QUERY_KEY, 'tipo', tipo],
    queryFn: () => getArticulosByTipo(tipo),
    staleTime: 1000 * 60 * 15,
  });
};

export const useCreateArticulo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (newArticulo: CreateArticuloInput) => createArticulo(newArticulo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ARTICULOS_QUERY_KEY] });
    },
  });
};

export const useUpdateArticulo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateArticuloInput }) =>
      updateArticulo(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ARTICULOS_QUERY_KEY] });
    },
  });
};

export const useDeleteArticulo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteArticulo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ARTICULOS_QUERY_KEY] });
    },
  });
};
