import { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar as CalendarIcon, Plus, Trash2, Filter, Users, Clock, CheckCircle2 } from 'lucide-react';
import { useGetCitasPorSemana, useCreateCita, useUpdateCita, useDeleteCita } from '@/hooks/useAgenda';
import { useGetEmpleados } from '@/hooks/useEmpleados';
import { useGetClientes } from '@/hooks/useClientes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import LoadingSpinner from '@/components/LoadingSpinner';
import { CitaForm } from '@/components/forms/CitaForm';
import { Cita, CitaInput } from '@/types';
import { Models } from 'appwrite';
import { toast } from 'sonner';

const locales = {
  es: es,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: Cita & Models.Document;
}

const Agenda = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [view, setView] = useState<View>('week');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCita, setSelectedCita] = useState<(Cita & Models.Document) | null>(null);
  const [defaultFechaHora, setDefaultFechaHora] = useState<Date | undefined>();
  const [filtroEmpleado, setFiltroEmpleado] = useState<string>('todos');
  const [filtroEstado, setFiltroEstado] = useState<string>('todos');

  const { data: citas, isLoading: loadingCitas } = useGetCitasPorSemana(selectedDate);
  const { data: empleados } = useGetEmpleados(true);
  const { data: clientes } = useGetClientes('');
  const createMutation = useCreateCita();
  const updateMutation = useUpdateCita();
  const deleteMutation = useDeleteCita();

  const events: CalendarEvent[] = useMemo(() => {
    if (!citas) return [];

    let citasFiltradas = citas;

    // Filtrar por empleado
    if (filtroEmpleado !== 'todos') {
      citasFiltradas = citasFiltradas.filter((cita) => cita.empleado_id === filtroEmpleado);
    }

    // Filtrar por estado
    if (filtroEstado !== 'todos') {
      citasFiltradas = citasFiltradas.filter((cita) => cita.estado === filtroEstado);
    }

    return citasFiltradas.map((cita) => {
      const cliente = clientes?.find((c) => c.$id === cita.cliente_id);
      const empleado = empleados?.find((e) => e.$id === cita.empleado_id);
      
      const start = new Date(cita.fecha_hora);
      const end = new Date(start.getTime() + cita.duracion * 60000);

      return {
        id: cita.$id,
        title: `${cliente?.nombre_completo || 'Cliente'} - ${empleado?.nombre_completo || 'Empleado'}`,
        start,
        end,
        resource: cita,
      };
    });
  }, [citas, clientes, empleados, filtroEmpleado, filtroEstado]);

  const citasHoy = useMemo(() => {
    if (!citas) return [];
    const hoy = format(new Date(), 'yyyy-MM-dd');
    return citas.filter((cita) => {
      const citaFecha = format(new Date(cita.fecha_hora), 'yyyy-MM-dd');
      return citaFecha === hoy;
    });
  }, [citas]);

  const estadisticas = useMemo(() => {
    return {
      total: citasHoy.length,
      confirmadas: citasHoy.filter((c) => c.estado === 'confirmada').length,
      realizadas: citasHoy.filter((c) => c.estado === 'realizada').length,
      pendientes: citasHoy.filter((c) => c.estado === 'agendada').length,
    };
  }, [citasHoy]);

  const eventStyleGetter = (event: CalendarEvent) => {
    const empleado = empleados?.find((e) => e.$id === event.resource.empleado_id);
    const backgroundColor = empleado?.color || '#3b82f6';
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        color: 'white',
        border: '0px',
        display: 'block',
      },
    };
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    setDefaultFechaHora(start);
    setSelectedCita(null);
    setIsDialogOpen(true);
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedCita(event.resource);
    setDefaultFechaHora(undefined);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (data: CitaInput) => {
    try {
      if (selectedCita) {
        await updateMutation.mutateAsync({ id: selectedCita.$id, data });
        toast.success('Cita actualizada correctamente');
      } else {
        await createMutation.mutateAsync(data);
        toast.success('Cita creada correctamente');
      }
      setIsDialogOpen(false);
      setSelectedCita(null);
    } catch (error) {
      toast.error('Error al guardar la cita');
      console.error(error);
    }
  };

  const handleDelete = async () => {
    if (!selectedCita) return;
    
    try {
      await deleteMutation.mutateAsync(selectedCita.$id);
      toast.success('Cita eliminada correctamente');
      setIsDeleteDialogOpen(false);
      setSelectedCita(null);
    } catch (error) {
      toast.error('Error al eliminar la cita');
      console.error(error);
    }
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedCita(null);
    setDefaultFechaHora(undefined);
  };

  const handleOpenDeleteDialog = () => {
    setIsDialogOpen(false);
    setIsDeleteDialogOpen(true);
  };

  if (loadingCitas) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-8 w-8" />
            Agenda
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las citas y horarios del equipo
          </p>
        </div>
        <Button onClick={() => {
          setDefaultFechaHora(new Date());
          setSelectedCita(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Citas Hoy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Total programadas
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Pendientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.pendientes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Por confirmar
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              Confirmadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.confirmadas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Listas para atender
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Realizadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estadisticas.realizadas}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Completadas hoy
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <CardTitle>Calendario de Citas</CardTitle>
                  <CardDescription>
                    {view === 'week' && 'Vista semanal'}
                    {view === 'day' && 'Vista diaria'}
                    {view === 'month' && 'Vista mensual'}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <Select value={filtroEmpleado} onValueChange={setFiltroEmpleado}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Empleado" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todos">Todos</SelectItem>
                        {empleados?.map((empleado) => (
                          <SelectItem key={empleado.$id} value={empleado.$id}>
                            {empleado.nombre_completo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Select value={filtroEstado} onValueChange={setFiltroEstado}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder="Estado" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="todos">Todos</SelectItem>
                      <SelectItem value="agendada">Agendada</SelectItem>
                      <SelectItem value="confirmada">Confirmada</SelectItem>
                      <SelectItem value="realizada">Realizada</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                      <SelectItem value="no_asistio">No Asistió</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ height: '700px' }}>
                <Calendar
              localizer={localizer}
              events={events}
              startAccessor="start"
              endAccessor="end"
              view={view}
              onView={setView}
              date={selectedDate}
              onNavigate={setSelectedDate}
              selectable
              onSelectSlot={handleSelectSlot}
              onSelectEvent={handleSelectEvent}
              eventPropGetter={eventStyleGetter}
              messages={{
                next: 'Siguiente',
                previous: 'Anterior',
                today: 'Hoy',
                month: 'Mes',
                week: 'Semana',
                day: 'Día',
                agenda: 'Agenda',
                date: 'Fecha',
                time: 'Hora',
                event: 'Evento',
                noEventsInRange: 'No hay citas en este rango',
                showMore: (total) => `+ Ver más (${total})`,
              }}
              formats={{
                timeGutterFormat: (date) => format(date, 'HH:mm', { locale: es }),
                eventTimeRangeFormat: ({ start, end }) =>
                  `${format(start, 'HH:mm', { locale: es })} - ${format(end, 'HH:mm', { locale: es })}`,
                agendaTimeRangeFormat: ({ start, end }) =>
                  `${format(start, 'HH:mm', { locale: es })} - ${format(end, 'HH:mm', { locale: es })}`,
                dayHeaderFormat: (date) => format(date, 'EEEE d MMMM', { locale: es }),
                dayRangeHeaderFormat: ({ start, end }) =>
                  `${format(start, 'd MMM', { locale: es })} - ${format(end, 'd MMM yyyy', { locale: es })}`,
              }}
              min={new Date(2024, 0, 1, 8, 0)}
              max={new Date(2024, 0, 1, 22, 0)}
              step={15}
              timeslots={4}
            />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Citas de Hoy
              </CardTitle>
              <CardDescription>
                {format(new Date(), 'EEEE, d MMMM', { locale: es })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[700px] pr-4">
                {citasHoy.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    No hay citas para hoy
                  </div>
                ) : (
                  <div className="space-y-3">
                    {citasHoy
                      .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime())
                      .map((cita) => {
                        const cliente = clientes?.find((c) => c.$id === cita.cliente_id);
                        const empleado = empleados?.find((e) => e.$id === cita.empleado_id);
                        const estadoColors = {
                          agendada: 'bg-blue-500/10 text-blue-700 border-blue-200',
                          confirmada: 'bg-green-500/10 text-green-700 border-green-200',
                          realizada: 'bg-purple-500/10 text-purple-700 border-purple-200',
                          cancelada: 'bg-red-500/10 text-red-700 border-red-200',
                          no_asistio: 'bg-orange-500/10 text-orange-700 border-orange-200',
                        };
                        
                        return (
                          <div
                            key={cita.$id}
                            className="p-3 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                            onClick={() => {
                              setSelectedCita(cita);
                              setDefaultFechaHora(undefined);
                              setIsDialogOpen(true);
                            }}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {cliente?.nombre_completo || 'Cliente'}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {empleado?.nombre_completo || 'Empleado'}
                                </p>
                              </div>
                              <Badge variant="outline" className={`text-xs ${estadoColors[cita.estado]}`}>
                                {cita.estado === 'agendada' && 'Agendada'}
                                {cita.estado === 'confirmada' && 'Confirmada'}
                                {cita.estado === 'realizada' && 'Realizada'}
                                {cita.estado === 'cancelada' && 'Cancelada'}
                                {cita.estado === 'no_asistio' && 'No Asistió'}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(new Date(cita.fecha_hora), 'HH:mm')} - {cita.duracion} min
                            </div>
                            {cita.precio_total > 0 && (
                              <p className="text-xs font-medium mt-1">
                                {cita.precio_total.toFixed(2)} €
                              </p>
                            )}
                          </div>
                        );
                      })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedCita ? 'Editar Cita' : 'Nueva Cita'}
            </DialogTitle>
            <DialogDescription>
              {selectedCita 
                ? 'Modifica los datos de la cita existente'
                : 'Completa los datos para agendar una nueva cita'
              }
            </DialogDescription>
          </DialogHeader>
          <CitaForm
            cita={selectedCita ? {
              fecha_hora: selectedCita.fecha_hora,
              duracion: selectedCita.duracion,
              cliente_id: selectedCita.cliente_id,
              empleado_id: selectedCita.empleado_id,
              articulos: selectedCita.articulos,
              estado: selectedCita.estado,
              comentarios: selectedCita.comentarios,
              datos_clinicos: selectedCita.datos_clinicos,
              precio_total: selectedCita.precio_total,
            } : undefined}
            defaultFechaHora={defaultFechaHora}
            onSubmit={handleSubmit}
            onCancel={handleCloseDialog}
            isLoading={createMutation.isPending || updateMutation.isPending}
          />
          {selectedCita && (
            <div className="flex justify-start pt-2 border-t">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleOpenDeleteDialog}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar Cita
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. La cita será eliminada permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Agenda;
