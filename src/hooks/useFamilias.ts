import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getFamilias, 
  createFamilia, 
  updateFamilia, 
  deleteFamilia,
  FamiliaInput 
} from '@/services/appwrite-articulos';
import { useToast } from '@/hooks/use-toast';
import { useEmpresa } from '@/contexts/EmpresaContext';

export const useFamilias = () => {
  const { empresaActiva } = useEmpresa();

  return useQuery({
    queryKey: ['familias', empresaActiva?.$id],
    queryFn: () => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return getFamilias(empresaActiva.$id);
    },
    enabled: !!empresaActiva
  });
};

export const useCreateFamilia = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { empresaActiva } = useEmpresa();

  return useMutation({
    mutationFn: (familiaInput: FamiliaInput) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return createFamilia(empresaActiva.$id, familiaInput);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familias', empresaActiva?.$id] });
      queryClient.invalidateQueries({ queryKey: ['articulos', empresaActiva?.$id] });
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
  const { empresaActiva } = useEmpresa();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FamiliaInput> }) => {
      if (!empresaActiva) throw new Error('No hay empresa activa');
      return updateFamilia(empresaActiva.$id, id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familias', empresaActiva?.$id] });
      queryClient.invalidateQueries({ queryKey: ['articulos', empresaActiva?.$id] });
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
  const { empresaActiva } = useEmpresa();

  return useMutation({
    mutationFn: (id: string) => deleteFamilia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familias', empresaActiva?.$id] });
      queryClient.invalidateQueries({ queryKey: ['articulos', empresaActiva?.$id] });
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
