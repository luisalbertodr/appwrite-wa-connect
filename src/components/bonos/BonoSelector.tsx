import { useState, useEffect } from 'react';
import { Tag, CheckCircle2, X, AlertCircle, Info } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import type { BonoCliente } from '../../types/bono.types';
import type { Articulo } from '../../types/articulo.types';

interface BonoSelectorProps {
  open: boolean;
  onClose: () => void;
  articulo: Articulo;
  bonosDisponibles: BonoCliente[];
  onSeleccionar: (bonoId: string | null) => void;
  permitirSinBono?: boolean;
}

export function BonoSelector({
  open,
  onClose,
  articulo,
  bonosDisponibles,
  onSeleccionar,
  permitirSinBono = true,
}: BonoSelectorProps) {
  const [seleccionado, setSeleccionado] = useState<string | null>(null);

  // Calcular disponibilidad de cada bono para este artículo
  const bonosConDisponibilidad = bonosDisponibles.map(bono => {
    const composicionRestante = JSON.parse(bono.composicion_restante);
    const items = articulo.tipo === 'servicio' 
      ? composicionRestante.servicios || []
      : composicionRestante.productos || [];
    
    const itemDisponible = items.find((item: any) => 
      item.articulo_id === articulo.$id
    );

    return {
      bono,
      disponible: !!itemDisponible,
      cantidadDisponible: itemDisponible?.cantidad || 0,
      itemInfo: itemDisponible,
    };
  }).filter(b => b.disponible); // Solo mostrar bonos que tienen este artículo

  // Auto-seleccionar si solo hay un bono disponible
  useEffect(() => {
    if (bonosConDisponibilidad.length === 1 && !permitirSinBono) {
      setSeleccionado(bonosConDisponibilidad[0].bono.$id);
    }
  }, [bonosConDisponibilidad, permitirSinBono]);

  const handleConfirmar = () => {
    onSeleccionar(seleccionado);
    onClose();
  };

  const handleCancelar = () => {
    setSeleccionado(null);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-primary" />
            Seleccionar Bono para {articulo.nombre}
          </DialogTitle>
          <DialogDescription>
            El cliente tiene {bonosConDisponibilidad.length} bono(s) disponible(s) para este {articulo.tipo}.
            {permitirSinBono && ' Puedes elegir no usar ningún bono y cobrar el precio completo.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {bonosConDisponibilidad.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No hay bonos disponibles para este artículo. Se cobrará el precio completo.
              </AlertDescription>
            </Alert>
          ) : (
            <RadioGroup value={seleccionado || ''} onValueChange={setSeleccionado}>
              {bonosConDisponibilidad.map(({ bono, cantidadDisponible }) => {
                const ahora = new Date();
                const fechaVencimiento = bono.fecha_vencimiento ? new Date(bono.fecha_vencimiento) : null;
                const diasParaVencer = fechaVencimiento 
                  ? Math.ceil((fechaVencimiento.getTime() - ahora.getTime()) / (1000 * 60 * 60 * 24))
                  : null;
                const estaPorVencer = diasParaVencer !== null && diasParaVencer <= 7 && diasParaVencer > 0;

                return (
                  <div
                    key={bono.$id}
                    className={`relative flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                      seleccionado === bono.$id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSeleccionado(bono.$id)}
                  >
                    <RadioGroupItem
                      value={bono.$id}
                      id={`bono-${bono.$id}`}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <Label
                        htmlFor={`bono-${bono.$id}`}
                        className="font-medium cursor-pointer flex items-center gap-2"
                      >
                        {bono.bono_nombre}
                        <Badge variant="secondary" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          {cantidadDisponible} disponible{cantidadDisponible !== 1 ? 's' : ''}
                        </Badge>
                        {estaPorVencer && (
                          <Badge variant="outline" className="gap-1 border-orange-500 text-orange-500">
                            <AlertCircle className="h-3 w-3" />
                            Vence en {diasParaVencer} día{diasParaVencer !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Comprado el {new Date(bono.fecha_compra).toLocaleDateString('es-ES')}
                        {fechaVencimiento && (
                          <span>
                            {' • Vence el '}
                            {fechaVencimiento.toLocaleDateString('es-ES')}
                          </span>
                        )}
                      </p>
                      {bono.notas && (
                        <p className="text-sm text-muted-foreground italic mt-1">
                          {bono.notas}
                        </p>
                      )}
                    </div>
                    {seleccionado === bono.$id && (
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </RadioGroup>
          )}

          {permitirSinBono && bonosConDisponibilidad.length > 0 && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    O bien
                  </span>
                </div>
              </div>

              <div
                className={`relative flex items-start space-x-3 rounded-lg border p-4 cursor-pointer transition-colors ${
                  seleccionado === null
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
                onClick={() => setSeleccionado(null)}
              >
                <RadioGroup value={seleccionado === null ? 'sin-bono' : ''} onValueChange={() => setSeleccionado(null)}>
                  <RadioGroupItem
                    value="sin-bono"
                    id="sin-bono"
                    className="mt-1"
                  />
                </RadioGroup>
                <div className="flex-1">
                  <Label
                    htmlFor="sin-bono"
                    className="font-medium cursor-pointer flex items-center gap-2"
                  >
                    No usar bono
                    <Badge variant="outline">
                      Cobrar {articulo.precio.toFixed(2)}€
                    </Badge>
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Se cobrará el precio completo del artículo
                  </p>
                </div>
                {seleccionado === null && (
                  <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                )}
              </div>
            </>
          )}

          {!permitirSinBono && bonosConDisponibilidad.length === 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Este artículo requiere un bono activo y el cliente no tiene bonos disponibles.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="bg-muted/50 p-4 rounded-lg">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">
              <strong>Importante:</strong> Al usar un bono, no se cobrará este artículo y se descontará 
              automáticamente del bono seleccionado. Esta acción no se puede deshacer una vez guardada la cita.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancelar}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirmar}
            disabled={seleccionado === undefined || (!permitirSinBono && bonosConDisponibilidad.length === 0)}
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Confirmar{seleccionado ? ' con Bono' : ' sin Bono'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
