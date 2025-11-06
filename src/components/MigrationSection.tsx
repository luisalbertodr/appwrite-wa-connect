import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, Database, CheckCircle, AlertCircle, Calendar, Zap } from 'lucide-react';
import { migrateSearchUnified } from '@/scripts/migrate-search-unified';
import { migrateCitasClienteNombre } from '@/scripts/migrate-citas-cliente-nombre';
import { functions } from '@/lib/appwrite';

export const MigrationSection = () => {
  // Estados para migración de clientes (search_unified)
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{ updated: number; errors: number } | null>(null);
  
  // Estados para migración de citas (cliente_nombre)
  const [isRunningCitas, setIsRunningCitas] = useState(false);
  const [progressCitas, setProgressCitas] = useState(0);
  const [logsCitas, setLogsCitas] = useState<string[]>([]);
  const [completedCitas, setCompletedCitas] = useState(false);
  const [errorCitas, setErrorCitas] = useState<string | null>(null);
  const [statsCitas, setStatsCitas] = useState<{ updated: number; errors: number } | null>(null);

  // Estados para migración backend unificada
  const [isRunningBackend, setIsRunningBackend] = useState(false);
  const [backendMigrationType, setBackendMigrationType] = useState<string>('');
  const [backendLogs, setBackendLogs] = useState<string[]>([]);
  const [backendResult, setBackendResult] = useState<any>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  const handleRunMigration = async () => {
    setIsRunning(true);
    setProgress(0);
    setLogs([]);
    setCompleted(false);
    setError(null);
    setStats(null);

    try {
      // Interceptar console.log para mostrar logs en la UI
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        originalLog(...args);
        setLogs(prev => [...prev, args.join(' ')]);
      };

      const result = await migrateSearchUnified((current, total) => {
        // Actualizar progreso
        const percentage = Math.round((current / total) * 100);
        setProgress(percentage);
      });
      
      // Restaurar console.log
      console.log = originalLog;
      
      setCompleted(true);
      setProgress(100);
      setStats({ updated: result.totalUpdated, errors: result.totalErrors });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsRunning(false);
    }
  };

  // 🆕 Handler para migración de citas
  const handleRunCitasMigration = async () => {
    setIsRunningCitas(true);
    setProgressCitas(0);
    setLogsCitas([]);
    setCompletedCitas(false);
    setErrorCitas(null);
    setStatsCitas(null);

    try {
      // Interceptar console.log para mostrar logs en la UI
      const originalLog = console.log;
      console.log = (...args: any[]) => {
        originalLog(...args);
        setLogsCitas(prev => [...prev, args.join(' ')]);
      };

      const result = await migrateCitasClienteNombre((current, total) => {
        // Actualizar progreso
        const percentage = Math.round((current / total) * 100);
        setProgressCitas(percentage);
      });
      
      // Restaurar console.log
      console.log = originalLog;
      
      setCompletedCitas(true);
      setProgressCitas(100);
      setStatsCitas({ updated: result.totalUpdated, errors: result.totalErrors });
    } catch (err) {
      setErrorCitas((err as Error).message);
    } finally {
      setIsRunningCitas(false);
    }
  };

  // 🚀 Handler para migración backend unificada
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
    {/* 🚀 Sección de Migraciones Backend */}
    <Card className="mb-6 border-primary/20 bg-primary/5">
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
                        - Búsqueda unificada: {backendResult.results.searchUnified.totalUpdated} clientes
                      </div>
                    )}
                    {backendResult.results?.clienteNombre && (
                      <div className="text-xs opacity-80">
                        - Cliente en citas: {backendResult.results.clienteNombre.totalUpdated} citas
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

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          Migración de Búsqueda Unificada
        </CardTitle>
        <CardDescription>
          Poblar el campo <code className="text-xs bg-muted px-1 py-0.5 rounded">search_unified</code> en todos los clientes existentes para mejorar la búsqueda.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!completed && !error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Asegúrate de haber ejecutado el script PowerShell{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">update_clients_search_unified.ps1</code>{' '}
              antes de ejecutar esta migración.
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleRunMigration} 
          disabled={isRunning || completed}
          className="w-full"
        >
          {isRunning ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migrando... {progress}%
            </>
          ) : completed ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Migración Completada
            </>
          ) : (
            <>
              <Database className="mr-2 h-4 w-4" />
              Iniciar Migración
            </>
          )}
        </Button>

        {isRunning && (
          <div className="space-y-2">
            <Progress value={progress} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">{progress}% completado</p>
          </div>
        )}

        {logs.length > 0 && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Logs de Migración:</h4>
            <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
              {logs.map((log, i) => (
                <div key={i} className="text-muted-foreground">{log}</div>
              ))}
            </div>
          </div>
        )}

        {completed && stats && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>¡Migración completada!</strong>
              <div className="mt-1 text-sm">
                • Clientes actualizados: {stats.updated}
                {stats.errors > 0 && <div className="text-yellow-700 dark:text-yellow-400">• Errores: {stats.errors}</div>}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {error}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>

    {/* 🆕 Card para migración de cliente_nombre en citas */}
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Migración de Nombre de Cliente en Citas
        </CardTitle>
        <CardDescription>
          Poblar el campo <code className="text-xs bg-muted px-1 py-0.5 rounded">cliente_nombre</code> en todas las citas existentes para mejorar el rendimiento.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!completedCitas && !errorCitas && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Asegúrate de haber ejecutado el script PowerShell{' '}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">update_citas_add_cliente_nombre.ps1</code>{' '}
              antes de ejecutar esta migración.
            </AlertDescription>
          </Alert>
        )}

        <Button 
          onClick={handleRunCitasMigration} 
          disabled={isRunningCitas || completedCitas}
          className="w-full"
        >
          {isRunningCitas ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Migrando Citas... {progressCitas}%
            </>
          ) : completedCitas ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Migración de Citas Completada
            </>
          ) : (
            <>
              <Calendar className="mr-2 h-4 w-4" />
              Iniciar Migración de Citas
            </>
          )}
        </Button>

        {isRunningCitas && (
          <div className="space-y-2">
            <Progress value={progressCitas} className="w-full" />
            <p className="text-sm text-center text-muted-foreground">{progressCitas}% completado</p>
          </div>
        )}

        {logsCitas.length > 0 && (
          <div className="mt-4 p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-semibold mb-2">Logs de Migración:</h4>
            <div className="space-y-1 max-h-64 overflow-y-auto font-mono text-xs">
              {logsCitas.map((log, i) => (
                <div key={i} className="text-muted-foreground">{log}</div>
              ))}
            </div>
          </div>
        )}

        {completedCitas && statsCitas && (
          <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              <strong>¡Migración de citas completada!</strong>
              <div className="mt-1 text-sm">
                • Citas actualizadas: {statsCitas.updated}
                {statsCitas.errors > 0 && <div className="text-yellow-700 dark:text-yellow-400">• Errores: {statsCitas.errors}</div>}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {errorCitas && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Error:</strong> {errorCitas}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
    </>
  );
};
