import { useState, useMemo } from 'react';
import { Calendar, dateFnsLocalizer, View } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { useGetCitasPorSemana } from '@/hooks/useAgenda';
import { useGetEmpleados } from '@/hooks/useEmpleados';
import { useGetClientes } from '@/hooks/useClientes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Cita } from '@/types';
import { Models } from 'appwrite';

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

  const { data: citas, isLoading: loadingCitas } = useGetCitasPorSemana(selectedDate);
  const { data: empleados } = useGetEmpleados(true);
  const { data: clientes } = useGetClientes('');

  const events: CalendarEvent[] = useMemo(() => {
    if (!citas) return [];

    return citas.map((cita) => {
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
  }, [citas, clientes, empleados]);

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
    console.log('Nueva cita en:', start);
    // TODO: Abrir modal para crear cita
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    console.log('Editar cita:', event.resource);
    // TODO: Abrir modal para editar cita
  };

  if (loadingCitas) {
    return <LoadingSpinner />;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CalendarIcon className="h-8 w-8" />
            Agenda
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestiona las citas y horarios del equipo
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Cita
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calendario de Citas</CardTitle>
          <CardDescription>
            {view === 'week' && 'Vista semanal'}
            {view === 'day' && 'Vista diaria'}
            {view === 'month' && 'Vista mensual'}
          </CardDescription>
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
  );
};

export default Agenda;
