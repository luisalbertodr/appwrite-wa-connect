import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, Clock, Package, Tag, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import type { BonoCliente } from '../../types/bono.types';

interface BonoCardProps {
  bono: BonoCliente;
  onEdit?: (bono: BonoCliente) => void;
  onDelete?: (bono: BonoCliente) => void;
  showActions?: boolean;
  compact?: boolean;
}

export function BonoCard({ 
  bono, 
  onEdit, 
  onDelete, 
  showActions = true,
  compact = false
}: BonoCardProps) {
  // Calcular porcentaje de uso
  const composicionComprada = JSON.parse(bono.composicion_comprada);
  const composicionRestante = JSON.parse(bono.composicion_restante);
  
  const totalServicios = composicionComprada.servicios?.length || 0;
  const totalProductos = composicionComprada.productos?.length || 0;
  
  const serviciosRestantes = composicionRestante.servicios?.length || 0;
  const productosRestantes = composicionRestante.productos?.length || 0;
  
  const serviciosUsados = totalServicios - serviciosRestantes;
  const productosUsados = totalProductos - productosRestantes;
  
  const totalItems = totalServicios + totalProductos;
  const itemsUsados = serviciosUsados + productosUsados;
  
  const porcentajeUso = totalItems > 0 ? (itemsUsados / totalItems) * 100 : 0;
  
  // Determinar estado del bono
  const ahora = new Date();
  const fechaVencimiento = bono.fecha_vencimiento ? new Date(bono.fecha_vencimiento) : null;
  const estaVencido = fechaVencimiento && fechaVencimiento < ahora;
  const estaPorVencer = fechaVencimiento && !estaVencido && 
    (fechaVencimiento.getTime() - ahora.getTime()) < 7 * 24 * 60 * 60 * 1000; // 7 días
  
  // Color del badge según estado
  const getEstadoBadge = () => {
    if (!bono.activo) {
      return <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" />Inactivo</Badge>;
    }
    if (estaVencido) {
      return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Vencido</Badge>;
    }
    if (estaPorVencer) {
      return <Badge variant="outline" className="gap-1 border-orange-500 text-orange-500"><AlertCircle className="h-3 w-3" />Por vencer</Badge>;
    }
    if (porcentajeUso >= 100) {
      return <Badge variant="secondary" className="gap-1"><CheckCircle2 className="h-3 w-3" />Agotado</Badge>;
    }
    return <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" />Activo</Badge>;
  };

  if (compact) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Tag className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <h4 className="font-semibold truncate">{bono.bono_nombre}</h4>
                {getEstadoBadge()}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Package className="h-3 w-3" />
                  {serviciosRestantes + productosRestantes} disponibles
                </span>
                {fechaVencimiento && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(fechaVencimiento, 'dd/MM/yyyy', { locale: es })}
                  </span>
                )}
              </div>
            </div>
            {showActions && (
              <div className="flex gap-2 ml-4">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(bono)}
                  >
                    Editar
                  </Button>
                )}
              </div>
            )}
          </div>
          <Progress value={porcentajeUso} className="mt-3" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="h-5 w-5 text-primary" />
              <CardTitle className="truncate">{bono.bono_nombre}</CardTitle>
            </div>
            <CardDescription>
              Comprado el {format(new Date(bono.fecha_compra), 'dd/MM/yyyy', { locale: es })}
            </CardDescription>
          </div>
          {getEstadoBadge()}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progreso de uso */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progreso de uso</span>
            <span className="font-medium">{Math.round(porcentajeUso)}%</span>
          </div>
          <Progress value={porcentajeUso} className="h-2" />
        </div>

        {/* Servicios */}
        {totalServicios > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4 text-primary" />
              <span>Servicios ({serviciosRestantes}/{totalServicios})</span>
            </div>
            <div className="pl-6 space-y-1 text-sm text-muted-foreground">
              {composicionRestante.servicios?.map((servicio: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span>{servicio.nombre}</span>
                  <span>x{servicio.cantidad}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Productos */}
        {totalProductos > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Package className="h-4 w-4 text-primary" />
              <span>Productos ({productosRestantes}/{totalProductos})</span>
            </div>
            <div className="pl-6 space-y-1 text-sm text-muted-foreground">
              {composicionRestante.productos?.map((producto: any, idx: number) => (
                <div key={idx} className="flex justify-between">
                  <span>{producto.nombre}</span>
                  <span>x{producto.cantidad}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Fecha de vencimiento */}
        {fechaVencimiento && (
          <div className="flex items-center gap-2 text-sm">
            <Clock className={`h-4 w-4 ${estaVencido ? 'text-destructive' : estaPorVencer ? 'text-orange-500' : 'text-muted-foreground'}`} />
            <span className={estaVencido ? 'text-destructive' : estaPorVencer ? 'text-orange-500' : 'text-muted-foreground'}>
              {estaVencido ? 'Venció el' : 'Vence el'} {format(fechaVencimiento, 'dd/MM/yyyy', { locale: es })}
            </span>
          </div>
        )}

        {/* Precio */}
        <div className="pt-3 border-t">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Precio pagado</span>
            <span className="text-lg font-bold text-primary">{bono.precio_pagado.toFixed(2)}€</span>
          </div>
        </div>

        {/* Notas */}
        {bono.notas && (
          <div className="text-sm text-muted-foreground border-t pt-3">
            <p className="italic">{bono.notas}</p>
          </div>
        )}

        {/* Acciones */}
        {showActions && (onEdit || onDelete) && (
          <div className="flex gap-2 pt-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(bono)}
                className="flex-1"
              >
                Editar
              </Button>
            )}
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(bono)}
                className="flex-1"
              >
                Eliminar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
