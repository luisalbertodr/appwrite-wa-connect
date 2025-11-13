import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Empresa, EmpresaInput } from '@/types'; // Asumo que Empresa existe en '@/types'
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import LoadingSpinner from '../LoadingSpinner';

// Asumo un esquema simple para la empresa
const empresaSchema = z.object({
  // FIX: Se añade .trim() para limpiar espacios iniciales/finales que pueden causar un Bad Request
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.').trim(),
  nombre_legal: z.string().min(2, 'La razón social es obligatoria.').trim(),
  cif2: z.string().min(5, 'El NIF/CIF es obligatorio.').trim(),
  telefono: z.string().optional(),
  email: z.string().email('Email no válido.').optional().or(z.literal('')),
  activa: z.boolean(),
});

type EmpresaFormData = z.infer<typeof empresaSchema>;

interface EmpresaFormProps {
  empresaInicial?: Empresa | null;
  onSubmit: (data: EmpresaInput) => Promise<void>;
  isSubmitting: boolean;
}

export const EmpresaForm = ({ empresaInicial, onSubmit, isSubmitting }: EmpresaFormProps) => {
  const defaultValues: EmpresaFormData = {
    nombre: empresaInicial?.nombre || '',
    nombre_legal: empresaInicial?.nombre_legal || '',
    cif2: empresaInicial?.cif2 || '',
    telefono: empresaInicial?.telefono || '',
    email: empresaInicial?.email || '',
    activa: empresaInicial?.activa ?? true,
  };

  const form = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues,
  });

  const handleSubmit = async (data: EmpresaFormData) => {
    // Excluimos campos de Models.Document antes de enviar
    const dataToSend: EmpresaInput = {
      nombre: data.nombre,
      nombre_legal: data.nombre_legal,
      cif2: data.cif2,
      // FIX 1: Asegurar que el campo opcional 'telefono' se omita (undefined) si está vacío ('')
      // El .trim() en Zod ya limpió cualquier espacio en blanco.
      telefono: data.telefono || undefined, 
      email: data.email || undefined,
      activa: data.activa,
    };
    await onSubmit(dataToSend);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 pt-4">
        <FormField control={form.control} name="nombre" render={({ field }) => ( <FormItem> <FormLabel>Nombre Comercial *</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="nombre_legal" render={({ field }) => ( <FormItem> <FormLabel>Razón Social *</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="cif2" render={({ field }) => ( <FormItem> <FormLabel>NIF/CIF *</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="email" render={({ field }) => ( <FormItem> <FormLabel>Email Contacto</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        <FormField control={form.control} name="telefono" render={({ field }) => ( <FormItem> <FormLabel>Teléfono</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
        
        <FormField control={form.control} name="activa" render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>Empresa Activa</FormLabel>
            </div>
          </FormItem>
        )}/>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? <LoadingSpinner /> : (empresaInicial ? 'Actualizar Empresa' : 'Crear Empresa')}
        </Button>
      </form>
    </Form>
  );
};
