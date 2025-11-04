import { useState } from 'react';
import { useGetClientes } from '@/hooks/useClientes';
import { Cliente } from '@/types';
import { Models } from 'appwrite';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableRow } from '@/components/ui/table';
import { PlusCircle, Search } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

const Clientes = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { data: clientes, isLoading, error } = useGetClientes(searchTerm);

  const renderContent = () => {
    if (isLoading) { 
        return <div className="flex justify-center py-8"><LoadingSpinner /></div>;
    }
    if (error) { 
        return <p className="text-center text-destructive py-8">Error al cargar clientes.</p>;
    }
    if (!clientes || clientes.length === 0) { 
        return <p className="text-center text-muted-foreground py-8">
            {searchTerm ? 'No se encontraron clientes.' : 'No hay clientes creados.'}
        </p>;
    }

    return (
      <Table>
        <TableBody>
          {clientes.map((cliente: Cliente & Models.Document) => (
            <TableRow key={cliente.$id}>
              <td>{cliente.nombre_completo}</td>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
         <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">Gestión de la base de datos de clientes.</p>
        </div>
        <Button>
          <PlusCircle className="w-4 h-4 mr-2" />
          Crear Cliente
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <div className="mt-4 relative">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input
                type="search"
                placeholder="Buscar por nombre, DNI, email..."
                className="pl-8 w-full md:w-1/3"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
        </CardHeader>
        <CardContent>
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
};

export default Clientes;
