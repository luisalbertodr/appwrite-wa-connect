import { useState } from 'react';
import { useEmpresa } from '@/contexts/EmpresaContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export const EmpresaSwitcher: React.FC = () => {
  const { empresaActiva, empresasDisponibles, cambiarEmpresa, isLoading } = useEmpresa();
  const [cambiando, setCambiando] = useState(false);

  const handleCambiarEmpresa = async (empresaId: string) => {
    if (empresaId === empresaActiva?.$id) return;

    try {
      setCambiando(true);
      await cambiarEmpresa(empresaId);
      // Recargar la página para que todos los datos se actualicen
      window.location.reload();
    } catch (error) {
      console.error('Error al cambiar empresa:', error);
      setCambiando(false);
    }
  };

  if (isLoading || !empresaActiva) {
    return null;
  }

  // Si solo hay una empresa, mostrar solo el nombre sin dropdown
  if (empresasDisponibles.length <= 1) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium truncate max-w-[200px]">
          {empresaActiva.nombre}
        </span>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="flex items-center gap-2 min-w-[200px] justify-between"
          disabled={cambiando}
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium truncate">
              {empresaActiva.nombre}
            </span>
          </div>
          {cambiando ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary flex-shrink-0"></div>
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[250px]">
        <DropdownMenuLabel>Cambiar Empresa</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {empresasDisponibles.map((empresa) => (
          <DropdownMenuItem
            key={empresa.$id}
            onClick={() => handleCambiarEmpresa(empresa.$id)}
            className={cn(
              'cursor-pointer',
              empresa.$id === empresaActiva.$id && 'bg-accent'
            )}
          >
            <div className="flex items-center justify-between w-full gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{empresa.nombre}</div>
                {empresa.nombre_legal && empresa.nombre_legal !== empresa.nombre && (
                  <div className="text-xs text-muted-foreground truncate">
                    {empresa.nombre_legal}
                  </div>
                )}
              </div>
              {empresa.$id === empresaActiva.$id && (
                <Check className="h-4 w-4 text-primary flex-shrink-0" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
