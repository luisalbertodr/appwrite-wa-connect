import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getFamilias, 
  createFamilia, 
  updateFamilia, 
  deleteFamilia,
  FamiliaInput 
} from '@/services/appwrite-articulos';
import { Familia } from '@/types';
import { Models } from 'appwrite';
import { useToast } from '@/hooks/use-toast';

export const useFamilias = () => {
  return useQuery({
    queryKey: ['familias'],
    queryFn: getFamilias
  });
};

export const useCreateFamilia = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (familiaInput: FamiliaInput) => createFamilia(familiaInput),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familias'] });
      queryClient.invalidateQueries({ queryKey: ['articulos'] });
      toast({
        title: 'Familia creada',
        description: 'La familia se ha creado correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al crear familia',
        description: error.message || 'Ha ocurrido un error.',
      });
    }
  });
};

export const useUpdateFamilia = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FamiliaInput> }) => 
      updateFamilia(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familias'] });
      queryClient.invalidateQueries({ queryKey: ['articulos'] });
      toast({
        title: 'Familia actualizada',
        description: 'La familia se ha actualizado correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al actualizar familia',
        description: error.message || 'Ha ocurrido un error.',
      });
    }
  });
};

export const useDeleteFamilia = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (id: string) => deleteFamilia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familias'] });
      queryClient.invalidateQueries({ queryKey: ['articulos'] });
      toast({
        title: 'Familia eliminada',
        description: 'La familia se ha eliminado correctamente.',
      });
    },
    onError: (error: any) => {
      toast({
        variant: 'destructive',
        title: 'Error al eliminar familia',
        description: error.message || 'Ha ocurrido un error. Verifica que no haya artículos asociados.',
      });
    }
  });
};
