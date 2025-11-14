import { useState } from 'react';
import { useEmpresa } from '@/contexts/EmpresaContext';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Building2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmpresaSelectorProps {
  open: boolean;
  onClose?: () => void;
}

export const EmpresaSelector: React.FC<EmpresaSelectorProps> = ({ open, onClose }) => {
  const { empresasDisponibles, cambiarEmpresa, isLoading } = useEmpresa();
  const [seleccionando, setSeleccionando] = useState(false);
  const [empresaSeleccionadaId, setEmpresaSeleccionadaId] = useState<string | null>(null);

  const handleSeleccionarEmpresa = async (empresaId: string) => {
    try {
      setSeleccionando(true);
      setEmpresaSeleccionadaId(empresaId);
      await cambiarEmpresa(empresaId);
      onClose?.();
    } catch (error) {
      console.error('Error al seleccionar empresa:', error);
      setSeleccionando(false);
      setEmpresaSeleccionadaId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Seleccionar Empresa
          </DialogTitle>
          <DialogDescription>
            Selecciona la empresa con la que deseas trabajar
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-sm text-muted-foreground">Cargando empresas...</p>
            </div>
          </div>
        ) : empresasDisponibles.length === 0 ? (
          <div className="py-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">
              No tienes empresas asignadas. Contacta con el administrador.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {empresasDisponibles.map((empresa) => (
              <button
                key={empresa.$id}
                onClick={() => handleSeleccionarEmpresa(empresa.$id)}
                disabled={seleccionando}
                className={cn(
                  'w-full p-4 text-left rounded-lg border-2 transition-all',
                  'hover:border-primary hover:bg-accent',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  empresaSeleccionadaId === empresa.$id && 'border-primary bg-accent'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <h3 className="font-semibold truncate">{empresa.nombre}</h3>
                    </div>
                    {empresa.nombre_legal && (
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {empresa.nombre_legal}
                      </p>
                    )}
                    {empresa.cif2 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        CIF: {empresa.cif2}
                      </p>
                    )}
                  </div>
                  {empresaSeleccionadaId === empresa.$id && seleccionando && (
                    <div className="flex-shrink-0">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {empresasDisponibles.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            <span>
              Podrás cambiar de empresa en cualquier momento desde el menú superior
            </span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
