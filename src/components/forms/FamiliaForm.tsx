import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FamiliaInput } from '@/services/appwrite-articulos';
import { Familia } from '@/types';
import { Models } from 'appwrite';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';

interface FamiliaFormProps {
  familiaInicial?: (Familia & Models.Document) | null;
  onSubmit: (data: FamiliaInput) => Promise<void>;
  isSubmitting: boolean;
}

const familiaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  descripcion: z.string().optional(),
  color: z.string().min(1, 'El color es obligatorio'),
  icono: z.string().optional(),
});

type FamiliaFormData = z.infer<typeof familiaSchema>;

const defaultValues: FamiliaFormData = {
  nombre: '',
  descripcion: '',
  color: '#3b82f6',
  icono: '',
};

export const FamiliaForm = ({ familiaInicial, onSubmit, isSubmitting }: FamiliaFormProps) => {
  const getInitialFormValues = (): FamiliaFormData => {
    if (!familiaInicial) return defaultValues;
    return {
      nombre: familiaInicial.nombre || '',
      descripcion: familiaInicial.descripcion || '',
      color: familiaInicial.color || '#3b82f6',
      icono: familiaInicial.icono || '',
    };
  };

  const form = useForm<FamiliaFormData>({
    resolver: zodResolver(familiaSchema),
    defaultValues: getInitialFormValues(),
  });

  const handleSubmit = async (data: FamiliaFormData) => {
    const finalData: FamiliaInput = {
      nombre: data.nombre,
      color: data.color,
      descripcion: data.descripcion || undefined,
      icono: data.icono || undefined,
    };
    await onSubmit(finalData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <ScrollArea className="h-[60vh] p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 py-2">

            <FormField 
              control={form.control} 
              name="nombre" 
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Nombre *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: Tratamientos Faciales" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField 
              control={form.control} 
              name="color" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color *</FormLabel>
                  <FormControl>
                    <Input type="color" {...field} value={field.value ?? '#3b82f6'} />
                  </FormControl>
                  <FormDescription>
                    Color primario para identificar la familia en TPV y Agenda
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField 
              control={form.control} 
              name="icono" 
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icono</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} placeholder="Ej: IconName" />
                  </FormControl>
                  <FormDescription>
                    Nombre del icono (opcional)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField 
              control={form.control} 
              name="descripcion" 
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ''} rows={3} placeholder="Descripción de la familia" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          </div>
        </ScrollArea>
        <div className="flex justify-end p-4 border-t">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Guardando...' : (familiaInicial ? 'Actualizar Familia' : 'Crear Familia')}
          </Button>
        </div>
      </form>
    </Form>
  );
};
