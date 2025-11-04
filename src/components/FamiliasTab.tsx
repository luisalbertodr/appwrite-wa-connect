import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Pencil, Trash2, Plus } from 'lucide-react';
import { Familia } from '@/types';
import { Models } from 'appwrite';
import { useFamilias, useCreateFamilia, useUpdateFamilia, useDeleteFamilia } from '@/hooks/useFamilias';
import { FamiliaForm } from '@/components/forms/FamiliaForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const FamiliasTab = () => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [familiaSeleccionada, setFamiliaSeleccionada] = useState<(Familia & Models.Document) | null>(null);
  const [familiaAEliminar, setFamiliaAEliminar] = useState<string | null>(null);

  const { data: familias, isLoading } = useFamilias();
  const createMutation = useCreateFamilia();
  const updateMutation = useUpdateFamilia();
  const deleteMutation = useDeleteFamilia();

  const handleCreate = () => {
    setFamiliaSeleccionada(null);
    setIsSheetOpen(true);
  };

  const handleEdit = (familia: Familia & Models.Document) => {
    setFamiliaSeleccionada(familia);
    setIsSheetOpen(true);
  };

  const handleDelete = (id: string) => {
    setFamiliaAEliminar(id);
  };

  const confirmarEliminacion = async () => {
    if (familiaAEliminar) {
      await deleteMutation.mutateAsync(familiaAEliminar);
      setFamiliaAEliminar(null);
    }
  };

  const handleSubmit = async (data: any) => {
    if (familiaSeleccionada) {
      await updateMutation.mutateAsync({
        id: familiaSeleccionada.$id,
        data
      });
    } else {
      await createMutation.mutateAsync(data);
    }
    setIsSheetOpen(false);
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isLoading) {
    return <div className="p-4 text-center">Cargando familias...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Familias de Artículos</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona las categorías de productos y servicios
          </p>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Familia
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-[600px]">
            <SheetHeader>
              <SheetTitle>
                {familiaSeleccionada ? 'Editar Familia' : 'Nueva Familia'}
              </SheetTitle>
            </SheetHeader>
            <div className="mt-4">
              <FamiliaForm
                familiaInicial={familiaSeleccionada}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
              />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Color</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead className="w-[100px] text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {familias && familias.length > 0 ? (
              familias.map((familia) => (
                <TableRow key={familia.$id}>
                  <TableCell>
                    <div
                      className="w-8 h-8 rounded border"
                      style={{ backgroundColor: familia.color }}
                      title={familia.color}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{familia.nombre}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {familia.descripcion || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(familia)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(familia.$id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground">
                  No hay familias creadas. Crea una para empezar.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!familiaAEliminar} onOpenChange={() => setFamiliaAEliminar(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminará la familia permanentemente.
              Asegúrate de que no hay artículos asociados a esta familia.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmarEliminacion}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
