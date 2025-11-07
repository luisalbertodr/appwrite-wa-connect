import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Se elimina la importación de Progress ya que no se usa para migraciones backend
import { Loader2, Database, CheckCircle, AlertCircle, Calendar, Zap } from 'lucide-react';
// Se eliminan las importaciones de los scripts de migración local
import { functions } from '@/lib/appwrite';
import { MigrationLogsViewer } from './MigrationLogsViewer';

export const MigrationSection = () => {
  // Se eliminan los estados de las migraciones de clientes (search_unified) y citas (cliente_nombre) locales
  
  // Estados para migración backend unificada
  const [isRunningBackend, setIsRunningBackend] = useState(false);
  const [backendMigrationType, setBackendMigrationType] = useState<string>('');
  const [backendLogs, setBackendLogs] = useState<string[]>([]);
  const [backendResult, setBackendResult] = useState<any>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  // 🚀 Handler para migración backend unificada (ÚNICA FUNCIÓN MANTENIDA)
  const handleRunBackendMigration = async (type: 'search_unified' | 'cliente_nombre' | 'all') => {
    setIsRunningBackend(true);
    setBackendMigrationType(type);
    setBackendLogs([]);
    setBackendResult(null);
    setBackendError(null);

    const addLog = (msg: string) => setBackendLogs(prev => [...prev, msg]);

    try {
      addLog(`🚀 Iniciando migración backend: ${type}`);
      
      const response = await functions.createExecution(
        'MigrationFunction',
        JSON.stringify({ type }),
        false
      );
      
      addLog('📦 Respuesta recibida del servidor');
      
      const result = JSON.parse(response.responseBody);
      
      if (result.ok) {
        // Verificar si la migración está en progreso (202) o completada
        if (result.status === 'running') {
          addLog('⏳ Migración iniciada en background');
          addLog(`📝 ID de migración: ${result.migrationId}`);
          addLog('💡 Consulta la tabla migration_logs para ver el progreso en tiempo real');
          setBackendResult({ 
            ...result,
            isAsync: true,
            summary: { totalUpdated: 0, totalErrors: 0, totalRecords: 0 }
          });
        } else {
          addLog('✅ Migración completada exitosamente!');
          addLog(`📊 Resumen: ${JSON.stringify(result.summary, null, 2)}`);
          setBackendResult(result);
        }
      } else {
        throw new Error(result.error || 'Error desconocido');
      }
    } catch (err) {
      const errorMsg = (err as Error).message;
      addLog(`❌ Error: ${errorMsg}`);
      setBackendError(errorMsg);
    } finally {
      setIsRunningBackend(false);
    }
  };

  return (
    <>
    {/* 📊 Visor de Logs de Migraciones */}
    <MigrationLogsViewer />
    
    {/* 🚀 Sección de Migraciones Backend */}
    <Card className="mt-6 mb-6 border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          🚀 Migraciones Backend (Sin límites PNA)
        </CardTitle>
        <CardDescription>
          Ejecuta las migraciones en el servidor Appwrite para evitar límites del navegador. Ideal para grandes volúmenes de datos.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={() => handleRunBackendMigration('search_unified')}
            disabled={isRunningBackend}
            variant="outline"
            size="sm"
          >
            {isRunningBackend && backendMigrationType === 'search_unified' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Database className="mr-2 h-4 w-4" />
            )}
            Búsqueda Unificada
          </Button>
          
          <Button 
            onClick={() => handleRunBackendMigration('cliente_nombre')}
            disabled={isRunningBackend}
            variant="outline"
            size="sm"
          >
            {isRunningBackend && backendMigrationType === 'cliente_nombre' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Calendar className="mr-2 h-4 w-4" />
            )}
            Cliente en Citas
          </Button>
          
          <Button 
            onClick={() => handleRunBackendMigration('all')}
            disabled={isRunningBackend}
            variant="default"
            size="sm"
          >
            {isRunningBackend && backendMigrationType === 'all' ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            Ejecutar Ambas
          </Button>
        </div>
        
        {backendLogs.length > 0 && (
          <div className="bg-muted p-4 rounded-lg max-h-64 overflow-y-auto">
            <h4 className="text-sm font-semibold mb-2">Logs del Servidor:</h4>
            <div className="space-y-1 font-mono text-xs">
              {backendLogs.map((log, i) => (
                <div key={i} className="text-muted-foreground">{log}</div>
              ))}
            </div>
          </div>
        )}
        
        {backendResult && (
          <Alert className={backendResult.isAsync ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800" : "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"}>
            {backendResult.isAsync ? (
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            )}
            <AlertDescription className={backendResult.isAsync ? "text-blue-800 dark:text-blue-200" : "text-green-800 dark:text-green-200"}>
              {backendResult.isAsync ? (
                <>
                  <strong>⏳ Migración en Progreso</strong>
                  <div className="mt-1 text-sm">
                    • ID: <code className="text-xs bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">{backendResult.migrationId}</code>
                    <br />
                    • La migración se está ejecutando en background
                    <br />
                    • Consulta la tabla <code className="text-xs bg-blue-100 dark:bg-blue-900 px-1 py-0.5 rounded">migration_logs</code> para ver el estado
                  </div>
                </>
              ) : (
                <>
                  <strong>¡Migración Backend Completada!</strong>
                  <div className="mt-1 text-sm">
                    • Total actualizados: {backendResult.summary?.totalUpdated || 0}
                    • Errores: {backendResult.summary?.totalErrors || 0}
                    {backendResult.results?.searchUnified && (
                      <div className="mt-1 text-xs opacity-80">
                        - Búsqueda unificada: {backendResult.results.searchUnified?.totalUpdated || 0} clientes
                      </div>
                    )}
                    {backendResult.results?.clienteNombre && (
                      <div className="text-xs opacity-80">
                        - Cliente en citas: {backendResult.results.clienteNombre?.totalUpdated || 0} citas
                      </div>
                    )}
                  </div>
                </>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {backendError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error Backend:</strong> {backendError}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
    </>
  );
};