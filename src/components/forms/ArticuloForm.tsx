import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArticuloFormData, articuloSchema } from '@/lib/validators';
import { Articulo, ArticuloInput, Familia, LipooutUserInput, ComposicionBono } from '@/types';
import { Models } from 'appwrite';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetFamilias, useGetArticulos } from '@/hooks/useArticulos'; // Se añade useGetArticulos
import { useState, useEffect, useMemo } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Trash2, PackageSearch } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';


interface ArticuloFormProps {
  articuloInicial?: (Articulo & Models.Document) | null;
  onSubmit: (data: LipooutUserInput<ArticuloInput>) => Promise<void>;
  isSubmitting: boolean;
}

const defaultValues: ArticuloFormData = {
  nombre: '',
  descripcion: '',
  precio: 0,
  tipo: 'servicio',
  familia_id: '',
  duracion: null,
  stock: 0,
  sesiones_bono: 0,
  color: null, // Color secundario - obligatorio para servicios
  activo: true,
};

export const ArticuloForm = ({ articuloInicial, onSubmit, isSubmitting }: ArticuloFormProps) => {
  const { data: familias, isLoading: loadingFamilias } = useGetFamilias();
  
  // --- ESTADO LOCAL PARA COMPOSICIÓN DEL BONO ---
  const [composicion, setComposicion] = useState<ComposicionBono[]>([]);
  const [articuloSearch, setArticuloSearch] = useState('');
  const [articuloPopoverOpen, setArticuloPopoverOpen] = useState(false);

  // Carga de artículos disponibles para la composición
  const { data: articulosDisponibles, isLoading: loadingArticulos } = useGetArticulos();
  
  const articulosFiltradosParaBono = useMemo(() => {
    // Filtramos para evitar recursión (un bono no puede incluirse a sí mismo)
    return articulosDisponibles?.filter(a => a.$id !== articuloInicial?.$id) || [];
  }, [articulosDisponibles, articuloInicial]);
  
  // Cargar la composición inicial si el artículo es un bono y existe
  useEffect(() => {
      if (articuloInicial?.tipo === 'bono' && articuloInicial?.composicion_bono) {
          try {
              const parsed = JSON.parse(articuloInicial.composicion_bono);
              if (Array.isArray(parsed) && parsed.length > 0) {
                  setComposicion(parsed);
              } else {
                  setComposicion([]);
              }
          } catch (e) {
              console.error('Error parsing composicion_bono:', e);
              setComposicion([]);
          }
      } else {
          setComposicion([]);
      }
  }, [articuloInicial]);
  
  // ------------------------------------------------------------------
  // Handlers para la composición
  // ------------------------------------------------------------------
  const agregarArticuloAComposicion = (articulo: Articulo) => {
      // Evitar que el artículo maestro 'bono' se agregue a sí mismo o que se repita
      if (composicion.some(c => c.articulo_id === articulo.$id)) {
          setArticuloPopoverOpen(false);
          return;
      }

      const nuevoItem: ComposicionBono = {
          articulo_id: articulo.$id,
          articulo_nombre: articulo.nombre,
          articulo_tipo: articulo.tipo,
          cantidad: 1, // Cantidad inicial por defecto
          cantidad_restante: 1, // Se usará para inicializar BonoCliente
          precio_unitario: articulo.precio,
      };

      setComposicion(prev => [...prev, nuevoItem]);
      setArticuloSearch('');
      setArticuloPopoverOpen(false);
  };

  const actualizarCantidad = (index: number, nuevaCantidad: number) => {
      const cantidad = Math.max(1, nuevaCantidad); // Asegura al menos 1
      setComposicion(prev => prev.map((item, i) => 
          i === index ? { 
              ...item, 
              cantidad: cantidad, 
              cantidad_restante: cantidad // Actualiza por coherencia
          } : item
      ));
  };

  const eliminarArticuloComposicion = (index: number) => {
      setComposicion(prev => prev.filter((_, i) => i !== index));
  };
  // ------------------------------------------------------------------
  
  const getInitialFormValues = (): ArticuloFormData => {
    if (!articuloInicial) return defaultValues;
    return {
      nombre: articuloInicial.nombre || '',
      descripcion: articuloInicial.descripcion || '',
      precio: articuloInicial.precio || 0,
      tipo: articuloInicial.tipo || 'servicio',
      familia_id: articuloInicial.familia_id || articuloInicial.familia?.$id || '',
      duracion: articuloInicial.duracion || null,
      stock: articuloInicial.stock || 0,
      sesiones_bono: articuloInicial.sesiones_bono || 0,
      color: articuloInicial.color || null, // Color secundario para servicios
      activo: articuloInicial.activo ?? true,
    };
  };

  const form = useForm<ArticuloFormData>({
    resolver: zodResolver(articuloSchema),
    defaultValues: getInitialFormValues(),
  });

  const tipoSeleccionado = form.watch('tipo');

  const handleSubmit = async (data: ArticuloFormData) => {
    console.log('📝 ArticuloForm - Datos del formulario:', data);
    
    // Convertir a ArticuloInput (tipo base para Appwrite)
    const finalData: LipooutUserInput<ArticuloInput> = {
        ...data,
        // Asegurar que los campos opcionales sean undefined si no aplican o están vacíos
        descripcion: data.descripcion || undefined,
        duracion: (data.tipo === 'servicio' || data.tipo === 'bono') ? (data.duracion ?? undefined) : undefined,
        stock: data.tipo === 'producto' ? (data.stock ?? undefined) : undefined,
        color: data.tipo === 'servicio' ? (data.color ?? undefined) : undefined, 
        
        // LÓGICA DE BONO: COMPOSICIÓN Y SESIONES TOTALES
        sesiones_bono: undefined, // Se calculará si es 'bono'
        composicion_bono: undefined, // Se serializará si es 'bono'
    };
    
    if (data.tipo === 'bono') {
        if (composicion.length === 0) {
            // Se debe usar un toast para notificar al usuario en el UI real
            console.error('El bono debe tener composición');
            alert('Error: Un bono debe tener al menos un servicio o producto en su composición.');
            return; 
        }

        finalData.composicion_bono = JSON.stringify(composicion);
        
        // Recalcular el total de usos/sesiones del bono
        const totalSesiones = composicion.reduce((sum, item) => sum + item.cantidad, 0);
        finalData.sesiones_bono = totalSesiones; 
        
    } else {
        // Limpiar campos de bono si no es un bono
        finalData.sesiones_bono = undefined;
        finalData.composicion_bono = undefined;
    }

    console.log('✅ ArticuloForm - Datos finales a enviar:', finalData);
    await onSubmit(finalData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <ScrollArea className="h-[60vh] p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 px-4 py-2">

            <FormField control={form.control} name="nombre" render={({ field }) => ( <FormItem className="md:col-span-2"> <FormLabel>Nombre *</FormLabel> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )}/>
            <FormField control={form.control} name="descripcion" render={({ field }) => ( <FormItem className="md:col-span-2"> <FormLabel>Descripción</FormLabel> <FormControl><Textarea {...field} value={field.value ?? ''} rows={3} /></FormControl> <FormMessage /> </FormItem> )}/>
            
            <FormField control={form.control} name="precio" render={({ field }) => ( <FormItem> <FormLabel>Precio (€) *</FormLabel> <FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl> <FormMessage /> </FormItem> )}/>
            
            <FormField control={form.control} name="tipo" render={({ field }) => (
                <FormItem>
                <FormLabel>Tipo *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                    <SelectItem value="servicio">Servicio</SelectItem>
                    <SelectItem value="producto">Producto</SelectItem>
                    <SelectItem value="bono">Bono</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}/>

            <FormField control={form.control} name="familia_id" render={({ field }) => (
                <FormItem>
                <FormLabel>Familia *</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder={loadingFamilias ? "Cargando..." : "Seleccionar familia..."} />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                    {loadingFamilias ? (
                        <SelectItem value="loading" disabled>Cargando...</SelectItem>
                    ) : (
                        familias?.map((familia: Familia) => (
                            <SelectItem key={familia.$id} value={familia.$id}>{familia.nombre}</SelectItem>
                        ))
                    )}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}/>

            {/* Campo Duración - solo para servicios y bonos */}
            {(tipoSeleccionado === 'servicio' || tipoSeleccionado === 'bono') && (
                <FormField control={form.control} name="duracion" render={({ field }) => ( 
                    <FormItem> 
                        <FormLabel>Duración (minutos)</FormLabel> 
                        <FormControl>
                            <Input 
                                type="number" 
                                step="1" 
                                placeholder="Ej: 60"
                                {...field} 
                                value={field.value ?? ''} 
                                onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value) || 0)} 
                            />
                        </FormControl>
                        <FormDescription>
                            Duración del servicio/bono en minutos (máx. 500)
                        </FormDescription>
                        <FormMessage /> 
                    </FormItem> 
                )}/>
            )}

            {/* Campo Color Secundario - obligatorio solo para servicios */}
            {tipoSeleccionado === 'servicio' && (
                <FormField control={form.control} name="color" render={({ field }) => (
                    <FormItem>
                        <FormLabel>Color Secundario *</FormLabel>
                        <FormControl>
                            <Input 
                                type="color" 
                                {...field} 
                                value={field.value ?? '#10b981'} 
                                onChange={e => field.onChange(e.target.value || null)}
                            />
                        </FormControl>
                        <FormDescription>
                            Color secundario para distinguir el servicio en la agenda (el color primario viene de la familia)
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                )}/>
            )}

            {/* Campos condicionales */}
            {tipoSeleccionado === 'producto' && (
                <FormField control={form.control} name="stock" render={({ field }) => ( <FormItem> <FormLabel>Stock (Uds)</FormLabel> <FormControl><Input type="number" step="1" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value) || 0)} /></FormControl> <FormMessage /> </FormItem> )}/>
            )}
             
            {tipoSeleccionado === 'bono' && (
                <>
                {/* Campo Nº Sesiones (Total Usos) - Ahora calculado y deshabilitado */}
                <FormField control={form.control} name="sesiones_bono" render={() => ( 
                    <FormItem> 
                        <FormLabel>Nº Sesiones (Total Usos)</FormLabel> 
                        <FormControl>
                            {/* Se deshabilita para que el valor sea determinado por la composición */}
                            <Input 
                                type="number" 
                                step="1" 
                                disabled 
                                value={composicion.reduce((sum, item) => sum + item.cantidad, 0)} 
                                // Se usa el onChange para evitar warnings, aunque esté deshabilitado
                                onChange={() => {}} 
                            /> 
                        </FormControl>
                        <FormDescription>Calculado automáticamente a partir de la composición.</FormDescription>
                        <FormMessage /> 
                    </FormItem> 
                )}/>
                
                {/* --- SECCIÓN AÑADIDA: COMPOSICIÓN DEL BONO --- */}
                <div className="md:col-span-2 space-y-4 border rounded-lg p-4 bg-yellow-50/50">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <PackageSearch className="h-5 w-5 text-yellow-600" />
                        Composición del Bono
                    </h3>
                    
                    <p className="text-sm text-muted-foreground">
                        Define los servicios y/o productos que incluye este bono y su cantidad.
                        <br/>Total de Usos: **{composicion.reduce((sum, item) => sum + item.cantidad, 0)}**
                    </p>

                    {/* --- Buscador para Añadir Artículos --- */}
                    <div className="flex gap-2">
                        <Popover open={articuloPopoverOpen} onOpenChange={setArticuloPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button 
                                    variant="outline" 
                                    role="combobox" 
                                    className="flex-1 justify-between font-normal"
                                    type="button"
                                >
                                    <span className="truncate">Buscar artículo para añadir al bono...</span>
                                    <PackageSearch className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[--radix-popover-trigger-width] max-h-[40vh] p-0" align="start">
                                <Command shouldFilter={false}>
                                    <CommandInput 
                                        placeholder="Buscar servicio o producto..." 
                                        value={articuloSearch} 
                                        onValueChange={setArticuloSearch}
                                        disabled={loadingArticulos}
                                    />
                                    <CommandList>
                                        {loadingArticulos && <CommandItem disabled><LoadingSpinner/></CommandItem>}
                                        <CommandEmpty>No encontrado.</CommandEmpty>
                                        <CommandGroup>
                                            {articulosFiltradosParaBono.filter(a => 
                                                (a.nombre.toLowerCase().includes(articuloSearch.toLowerCase())) &&
                                                // Se permite incluir otros bonos, pero el filtro de arriba ya quita el propio. 
                                                // Si quieres prohibir bonos anidados, añade: && a.tipo !== 'bono'
                                                a.tipo !== 'bono' // Por defecto, evitamos anidación para simplificar
                                            )?.map((articulo) => (
                                                <CommandItem 
                                                    key={articulo.$id} 
                                                    value={articulo.nombre} 
                                                    onSelect={() => agregarArticuloAComposicion(articulo)}
                                                >
                                                    <div className="flex items-center justify-between w-full">
                                                        <span>{articulo.nombre}</span>
                                                        <span className="text-xs text-muted-foreground ml-2">
                                                            {articulo.tipo} ({articulo.precio.toFixed(2)}€)
                                                        </span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* --- Lista de Artículos en la Composición --- */}
                    {composicion.length > 0 && (
                        <ScrollArea className="h-auto max-h-[300px] border rounded-md p-3 bg-white">
                            <div className="space-y-2">
                                {composicion.map((item, index) => (
                                    <div key={item.articulo_id} className="flex items-center gap-3 border-b pb-2 last:border-b-0 last:pb-0">
                                        
                                        <div className="flex-1">
                                            <p className="font-medium text-sm">{item.articulo_nombre}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {item.articulo_tipo} - Ref. {item.precio_unitario.toFixed(2)}€
                                            </p>
                                        </div>
                                        
                                        <div className="w-20 flex flex-col">
                                            <FormLabel className="text-xs block mb-1">Cantidad</FormLabel>
                                            <Input
                                                type="number"
                                                min="1"
                                                step="1"
                                                value={item.cantidad}
                                                onChange={(e) => actualizarCantidad(index, parseInt(e.target.value) || 1)}
                                                className="h-8 text-sm text-center"
                                            />
                                        </div>
                                        
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => eliminarArticuloComposicion(index)}
                                            className="text-destructive hover:bg-destructive/10"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    )}
                </div>
                </>
            )}

            <FormField
                control={form.control}
                name="activo"
                render={({ field }) => ( 
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 md:col-span-2">
                    <FormControl>
                      <Checkbox 
                         checked={field.value} 
                         onCheckedChange={field.onChange} 
                         name={field.name}
                         onBlur={field.onBlur}
                         ref={field.ref}
                      /> 
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Artículo Activo</FormLabel>
                       <FormDescription>
                           Los artículos inactivos no aparecerán en el TPV o Agenda.
                       </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

          </div>
        </ScrollArea>
        <div className="flex justify-end p-4 border-t">
          <Button type="submit" disabled={isSubmitting || loadingFamilias}>
            {isSubmitting ? 'Guardando...' : (articuloInicial ? 'Actualizar Artículo' : 'Crear Artículo')}
          </Button>
        </div>
      </form>
    </Form>
  );
};
