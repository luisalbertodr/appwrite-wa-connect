import { useState } from 'react';
import { Plus, Filter, Search, AlertCircle } from 'lucide-react';
import { BonoCard } from './BonoCard';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import type { BonoCliente } from '../../types/bono.types';

interface BonosClienteListProps {
  bonos: BonoCliente[];
  loading?: boolean;
  onEdit?: (bono: BonoCliente) => void;
  onDelete?: (bono: BonoCliente) => void;
  onCreate?: () => void;
  showActions?: boolean;
  compact?: boolean;
}

type FiltroEstado = 'todos' | 'activos' | 'vencidos' | 'agotados';

export function BonosClienteList({
  bonos,
  loading = false,
  onEdit,
  onDelete,
  onCreate,
  showActions = true,
  compact = false,
}: BonosClienteListProps) {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todos');

  // Filtrar bonos
  const bonosFiltrados = bonos.filter(bono => {
    // Filtro por búsqueda
    const coincideBusqueda = busqueda === '' || 
      bono.bono_nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      (bono.notas?.toLowerCase().includes(busqueda.toLowerCase()) || false);

    if (!coincideBusqueda) return false;

    // Filtro por estado
    if (filtroEstado === 'todos') return true;

    const ahora = new Date();
    const fechaVencimiento = bono.fecha_vencimiento ? new Date(bono.fecha_vencimiento) : null;
    const estaVencido = fechaVencimiento && fechaVencimiento < ahora;
    const composicionRestante = JSON.parse(bono.composicion_restante);
    const itemsRestantes = (composicionRestante.servicios?.length || 0) + (composicionRestante.productos?.length || 0);

    switch (filtroEstado) {
      case 'activos':
        return bono.activo && !estaVencido && itemsRestantes > 0;
      case 'vencidos':
        return estaVencido;
      case 'agotados':
        return itemsRestantes === 0;
      default:
        return true;
    }
  });

  // Ordenar por fecha de compra (más recientes primero)
  const bonosOrdenados = [...bonosFiltrados].sort((a, b) => {
    return new Date(b.fecha_compra).getTime() - new Date(a.fecha_compra).getTime();
  });

  // Estadísticas
  const estadisticas = {
    total: bonos.length,
    activos: bonos.filter(b => {
      const ahora = new Date();
      const fechaVencimiento = b.fecha_vencimiento ? new Date(b.fecha_vencimiento) : null;
      const estaVencido = fechaVencimiento && fechaVencimiento < ahora;
      const composicionRestante = JSON.parse(b.composicion_restante);
      const itemsRestantes = (composicionRestante.servicios?.length || 0) + (composicionRestante.productos?.length || 0);
      return b.activo && !estaVencido && itemsRestantes > 0;
    }).length,
    vencidos: bonos.filter(b => {
      const fechaVencimiento = b.fecha_vencimiento ? new Date(b.fecha_vencimiento) : null;
      return fechaVencimiento && fechaVencimiento < new Date();
    }).length,
    agotados: bonos.filter(b => {
      const composicionRestante = JSON.parse(b.composicion_restante);
      const itemsRestantes = (composicionRestante.servicios?.length || 0) + (composicionRestante.productos?.length || 0);
      return itemsRestantes === 0;
    }).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando bonos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Cabecera con estadísticas y botón crear */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 text-sm">
          <div>
            <span className="font-semibold">{estadisticas.total}</span>
            <span className="text-muted-foreground ml-1">total</span>
          </div>
          <div>
            <span className="font-semibold text-green-600">{estadisticas.activos}</span>
            <span className="text-muted-foreground ml-1">activos</span>
          </div>
          {estadisticas.vencidos > 0 && (
            <div>
              <span className="font-semibold text-orange-600">{estadisticas.vencidos}</span>
              <span className="text-muted-foreground ml-1">vencidos</span>
            </div>
          )}
          {estadisticas.agotados > 0 && (
            <div>
              <span className="font-semibold text-muted-foreground">{estadisticas.agotados}</span>
              <span className="text-muted-foreground ml-1">agotados</span>
            </div>
          )}
        </div>
        {onCreate && (
          <Button onClick={onCreate} size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo Bono
          </Button>
        )}
      </div>

      {/* Filtros */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o notas..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filtroEstado} onValueChange={(v) => setFiltroEstado(v as FiltroEstado)}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filtrar por estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activos">Activos</SelectItem>
            <SelectItem value="vencidos">Vencidos</SelectItem>
            <SelectItem value="agotados">Agotados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lista de bonos */}
      {bonosOrdenados.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {bonos.length === 0
              ? 'Este cliente no tiene bonos registrados.'
              : 'No se encontraron bonos con los filtros aplicados.'}
          </AlertDescription>
        </Alert>
      ) : (
        <div className={compact ? 'space-y-2' : 'grid gap-4 md:grid-cols-2 lg:grid-cols-3'}>
          {bonosOrdenados.map((bono) => (
            <BonoCard
              key={bono.$id}
              bono={bono}
              onEdit={onEdit}
              onDelete={onDelete}
              showActions={showActions}
              compact={compact}
            />
          ))}
        </div>
      )}
    </div>
  );
}
