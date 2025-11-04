import { useState } from 'react';
import { useGetClientes, useCreateCliente, useUpdateCliente, useDeleteCliente } from '@/hooks/useClientes';
import { Cliente, LipooutUserInput } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, MoreHorizontal, Edit, Trash2, Search } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ClienteForm } from '@/components/forms/ClienteForm';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

const Clientes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { data: clientes, isLoading } = useGetClientes(debouncedSearchTerm);
  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();
  const deleteCliente = useDeleteCliente();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | undefined>(undefined);

  const handleCreate = () => {
    setEditingCliente(undefined);
    setIsDialogOpen(true);
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setIsDialogOpen(true);
  };

  const handleDelete = async (clienteId: string) => {
    if (confirm('¿Estás seguro de eliminar este cliente?')) {
      try {
        await deleteCliente.mutateAsync(clienteId);
        toast({
          title: "Cliente eliminado",
          description: "El cliente ha sido eliminado correctamente.",
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "No se pudo eliminar el cliente.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSubmit = async (data: LipooutUserInput<Cliente>) => {
    try {
      if (editingCliente) {
        await updateCliente.mutateAsync({ $id: editingCliente.$id, data });
        toast({
          title: "Cliente actualizado",
          description: "Los datos del cliente han sido actualizados.",
        });
      } else {
        await createCliente.mutateAsync(data);
        toast({
          title: "Cliente creado",
          description: "El nuevo cliente ha sido creado correctamente.",
        });
      }
      setIsDialogOpen(false);
      setEditingCliente(undefined);
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo guardar el cliente.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gestiona tu base de clientes</p>
        </div>
        <Button onClick={handleCreate}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Nuevo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buscar Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, teléfono, DNI..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre Completo</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Facturación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clientes && clientes.length > 0 ? (
                clientes.map((cliente) => (
                  <TableRow key={cliente.$id}>
                    <TableCell className="font-medium">{cliente.codcli}</TableCell>
                    <TableCell>{cliente.nombre_completo || 'Sin nombre'}</TableCell>
                    <TableCell>{cliente.tel1cli || '-'}</TableCell>
                    <TableCell>{cliente.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{cliente.facturacion.toFixed(2)}€</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(cliente)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(cliente.$id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No se encontraron clientes. Crea el primero.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCliente ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription>
              {editingCliente
                ? 'Modifica los datos del cliente'
                : 'Completa el formulario para crear un nuevo cliente'}
            </DialogDescription>
          </DialogHeader>
          <ClienteForm
            cliente={editingCliente}
            onSubmit={handleSubmit}
            onCancel={() => {
              setIsDialogOpen(false);
              setEditingCliente(undefined);
            }}
            isLoading={createCliente.isPending || updateCliente.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Clientes;
