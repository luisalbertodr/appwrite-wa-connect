import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ConfigurationFormData, configurationSchema } from '@/lib/validators'; // Importar esquema y tipo
import { Configuracion, LipooutUserInput, HorarioApertura, DiaSemana } from '@/types';
import { Models } from 'appwrite';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import LoadingSpinner from '../LoadingSpinner';

interface ConfigurationFormProps {
  configInicial?: (Configuracion & Models.Document) | null;
  onSubmit: (data: LipooutUserInput<Configuracion>) => Promise<void>;
  isSubmitting: boolean;
  isLoading: boolean;
}

// Horarios por defecto (L-V 08:00-21:00, S-D cerrado)
const horariosDefecto: HorarioApertura[] = [
  { dia: 'lunes', abierto: true, horaInicio: '08:00', horaFin: '21:00' },
  { dia: 'martes', abierto: true, horaInicio: '08:00', horaFin: '21:00' },
  { dia: 'miercoles', abierto: true, horaInicio: '08:00', horaFin: '21:00' },
  { dia: 'jueves', abierto: true, horaInicio: '08:00', horaFin: '21:00' },
  { dia: 'viernes', abierto: true, horaInicio: '08:00', horaFin: '21:00' },
  { dia: 'sabado', abierto: false, horaInicio: '08:00', horaFin: '21:00' },
  { dia: 'domingo', abierto: false, horaInicio: '08:00', horaFin: '21:00' },
];

// Valores por defecto (se llenarán con los datos cargados)
const defaultValues: ConfigurationFormData = {
  nombreClinica: '',
  direccion: '',
  cif: '',
  emailContacto: '',
  telefonoContacto: '',
  serieFactura: 'FRA',
  seriePresupuesto: 'PRE',
  tipoIvaPredeterminado: 21,
  horarios: horariosDefecto,
};

// Mapa de días en español
const diasSemana: { value: DiaSemana; label: string }[] = [
  { value: 'lunes', label: 'Lunes' },
  { value: 'martes', label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves', label: 'Jueves' },
  { value: 'viernes', label: 'Viernes' },
  { value: 'sabado', label: 'Sábado' },
  { value: 'domingo', label: 'Domingo' },
];

export const ConfigurationForm = ({ configInicial, onSubmit, isSubmitting, isLoading }: ConfigurationFormProps) => {

  const form = useForm<ConfigurationFormData>({
    resolver: zodResolver(configurationSchema),
    defaultValues: defaultValues,
  });

  // Rellenar el formulario cuando los datos iniciales carguen
  useEffect(() => {
    if (configInicial) {
      form.reset({
        nombreClinica: configInicial.nombreClinica || '',
        direccion: configInicial.direccion || '',
        cif: configInicial.cif || '',
        emailContacto: configInicial.emailContacto || '',
        telefonoContacto: configInicial.telefonoContacto || '',
        serieFactura: configInicial.serieFactura || 'FRA',
        seriePresupuesto: configInicial.seriePresupuesto || 'PRE',
        tipoIvaPredeterminado: configInicial.tipoIvaPredeterminado ?? 21,
        horarios: configInicial.horarios || horariosDefecto,
      });
    }
  }, [configInicial, form]);


  const handleSubmit = async (data: ConfigurationFormData) => {
    // Solo enviamos los datos del formulario, los contadores no se tocan aquí
    const finalData: LipooutUserInput<Configuracion> = {
        nombreClinica: data.nombreClinica,
        direccion: data.direccion || '',
        cif: data.cif,
        emailContacto: data.emailContacto || '',
        telefonoContacto: data.telefonoContacto || '',
        serieFactura: data.serieFactura,
        seriePresupuesto: data.seriePresupuesto,
        tipoIvaPredeterminado: data.tipoIvaPredeterminado,
        ultimoNumeroFactura: configInicial?.ultimoNumeroFactura ?? 0,
        ultimoNumeroPresupuesto: configInicial?.ultimoNumeroPresupuesto ?? 0,
        horarios: data.horarios,
    };
    await onSubmit(finalData);
  };

  if (isLoading) {
      return <div className="flex justify-center py-8"><LoadingSpinner /></div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 max-w-2xl mx-auto">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <FormField control={form.control} name="nombreClinica" render={({ field }) => ( <FormItem> <FormLabel>Nombre Clínica *</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
             <FormField control={form.control} name="cif" render={({ field }) => ( <FormItem> <FormLabel>CIF *</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
             <FormField control={form.control} name="direccion" render={({ field }) => ( <FormItem className="md:col-span-2"> <FormLabel>Dirección</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
             <FormField control={form.control} name="emailContacto" render={({ field }) => ( <FormItem> <FormLabel>Email Contacto</FormLabel> <FormControl><Input type="email" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
             <FormField control={form.control} name="telefonoContacto" render={({ field }) => ( <FormItem> <FormLabel>Teléfono Contacto</FormLabel> <FormControl><Input type="tel" {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
             <FormField control={form.control} name="serieFactura" render={({ field }) => ( <FormItem> <FormLabel>Prefijo Facturas *</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
             <FormField control={form.control} name="seriePresupuesto" render={({ field }) => ( <FormItem> <FormLabel>Prefijo Presupuestos *</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
              <FormField control={form.control} name="tipoIvaPredeterminado" render={({ field }) => ( <FormItem> <FormLabel>IVA Predeterminado (%) *</FormLabel> <FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)}/></FormControl> <FormMessage /> </FormItem> )}/>
         </div>

        {/* Sección de Horarios de Apertura */}
        <div className="border-t pt-6 mt-6">
          <h3 className="text-lg font-semibold mb-4">Horarios de Apertura</h3>
          <div className="space-y-3">
            {diasSemana.map((dia, index) => (
              <div key={dia.value} className="grid grid-cols-12 gap-3 items-center border-b pb-3">
                <div className="col-span-3 flex items-center space-x-2">
                  <FormField
                    control={form.control}
                    name={`horarios.${index}.abierto`}
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="!mt-0 font-medium cursor-pointer">
                          {dia.label}
                        </FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-4">
                  <FormField
                    control={form.control}
                    name={`horarios.${index}.horaInicio`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            disabled={!form.watch(`horarios.${index}.abierto`)}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="col-span-1 text-center">-</div>
                <div className="col-span-4">
                  <FormField
                    control={form.control}
                    name={`horarios.${index}.horaFin`}
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            disabled={!form.watch(`horarios.${index}.abierto`)}
                            className="w-full"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting || isLoading}>
            {isSubmitting ? 'Guardando...' : 'Guardar Configuración'}
          </Button>
        </div>
      </form>
    </Form>
  );
};
